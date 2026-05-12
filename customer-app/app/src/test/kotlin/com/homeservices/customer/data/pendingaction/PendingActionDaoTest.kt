package com.homeservices.customer.data.pendingaction

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.homeservices.customer.data.pendingaction.db.PendingActionDao
import com.homeservices.customer.data.pendingaction.db.PendingActionEntity
import com.homeservices.customer.data.pendingaction.db.PendingActionsDatabase
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Robolectric-based Room DAO tests for [PendingActionDao].
 *
 * Tests cover:
 *   - upsertAll idempotency
 *   - observeActive — only ACTIVE rows, priority ordering
 *   - markMissingAsResolved — tombstones rows absent from server snapshot
 *   - findById
 *   - markResolved
 *   - purgeExpired — removes ACTIVE rows past TTL
 *   - purgeTombstones — removes RESOLVED rows older than 30 days
 *   - clearAll — no rows remain
 *
 * Per docs/patterns/hilt-module-android-test-scope.md:
 *   Robolectric tests use ApplicationProvider directly — no @HiltAndroidTest.
 */
@RunWith(RobolectricTestRunner::class)
@OptIn(ExperimentalCoroutinesApi::class)
public class PendingActionDaoTest {
    private lateinit var db: PendingActionsDatabase
    private lateinit var dao: PendingActionDao

    @Before
    public fun setUp() {
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(ctx, PendingActionsDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = db.pendingActionDao()
    }

    @After
    public fun tearDown() {
        db.close()
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun entity(
        id: String = "action-1",
        userId: String = "user-1",
        type: String = "JOB_OFFER",
        priority: String = "HIGH",
        status: String = "ACTIVE",
        expiresAt: Long? = null,
        createdAt: Long = 1_000L,
        resolvedAt: Long? = null,
        version: Long = 1L,
    ) = PendingActionEntity(
        id = id,
        userId = userId,
        role = "technician",
        type = type,
        entityType = "job_offer",
        entityId = "entity-$id",
        routeUri = "homeservices://action/$type?entityId=entity-$id",
        priority = priority,
        status = status,
        sourceStatus = null,
        version = version,
        createdAt = createdAt,
        updatedAt = createdAt,
        expiresAt = expiresAt,
        resolvedAt = resolvedAt,
        lastFetchedAt = createdAt,
    )

    // ── upsertAll ─────────────────────────────────────────────────────────────

    @Test
    public fun `upsertAll inserts new rows`(): Unit =
        runTest {
            dao.upsertAll(listOf(entity(id = "a"), entity(id = "b")))
            val all = dao.observeActive("user-1").first()
            assertThat(all).hasSize(2)
        }

    @Test
    public fun `upsertAll replaces existing row with same id`(): Unit =
        runTest {
            dao.upsertAll(listOf(entity(id = "a", version = 1L, priority = "HIGH")))
            dao.upsertAll(listOf(entity(id = "a", version = 2L, priority = "LOW")))
            val all = dao.observeActive("user-1").first()
            assertThat(all).hasSize(1)
            assertThat(all.first().priority).isEqualTo("LOW")
            assertThat(all.first().version).isEqualTo(2L)
        }

    // ── observeActive ─────────────────────────────────────────────────────────

    @Test
    public fun `observeActive returns only ACTIVE rows for user`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "active-1", status = "ACTIVE"),
                    entity(id = "resolved-1", status = "RESOLVED", resolvedAt = 2_000L),
                    entity(id = "expired-1", status = "EXPIRED"),
                ),
            )
            val active = dao.observeActive("user-1").first()
            assertThat(active).hasSize(1)
            assertThat(active.first().id).isEqualTo("active-1")
        }

    @Test
    public fun `observeActive excludes rows for different userId`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "u1-action", userId = "user-1"),
                    entity(id = "u2-action", userId = "user-2"),
                ),
            )
            val forUser1 = dao.observeActive("user-1").first()
            assertThat(forUser1).hasSize(1)
            assertThat(forUser1.first().userId).isEqualTo("user-1")
        }

    @Test
    public fun `observeActive orders by priority DESC then createdAt ASC`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "low-old", priority = "LOW", createdAt = 100L),
                    entity(id = "high-new", priority = "HIGH", createdAt = 500L),
                    entity(id = "normal-mid", priority = "NORMAL", createdAt = 300L),
                    entity(id = "high-old", priority = "HIGH", createdAt = 200L),
                ),
            )
            val ordered = dao.observeActive("user-1").first()
            // HIGH items first, ordered by createdAt ASC within same priority
            assertThat(ordered.map { it.id }).containsExactly(
                "high-old", // HIGH, createdAt 200
                "high-new", // HIGH, createdAt 500
                "normal-mid", // NORMAL, createdAt 300
                "low-old", // LOW, createdAt 100
            )
        }

    // ── markMissingAsResolved ─────────────────────────────────────────────────

    @Test
    public fun `markMissingAsResolved tombstones rows absent from server snapshot`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "keep-1"),
                    entity(id = "keep-2"),
                    entity(id = "missing-1"),
                    entity(id = "missing-2"),
                ),
            )
            val now = 5_000L
            dao.markMissingAsResolved(
                userId = "user-1",
                keep = setOf("keep-1", "keep-2"),
                now = now,
            )
            val active = dao.observeActive("user-1").first()
            assertThat(active.map { it.id }).containsExactlyInAnyOrder("keep-1", "keep-2")

            // Tombstones should now have status RESOLVED and resolvedAt set
            val missing1 = dao.findById("missing-1")
            assertThat(missing1).isNotNull
            assertThat(missing1!!.status).isEqualTo("RESOLVED")
            assertThat(missing1.resolvedAt).isEqualTo(now)
        }

    @Test
    public fun `markMissingAsResolved does not touch already RESOLVED rows`(): Unit =
        runTest {
            val originalResolvedAt = 1_000L
            dao.upsertAll(
                listOf(
                    entity(id = "tombstone", status = "RESOLVED", resolvedAt = originalResolvedAt),
                ),
            )
            dao.markMissingAsResolved(userId = "user-1", keep = emptySet(), now = 9_999L)
            val tombstone = dao.findById("tombstone")
            // Already RESOLVED — should not be re-touched by the UPDATE query (status = 'ACTIVE' filter)
            assertThat(tombstone!!.resolvedAt).isEqualTo(originalResolvedAt)
        }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    public fun `findById returns row when it exists`(): Unit =
        runTest {
            dao.upsertAll(listOf(entity(id = "find-me")))
            val found = dao.findById("find-me")
            assertThat(found).isNotNull
            assertThat(found!!.id).isEqualTo("find-me")
        }

    @Test
    public fun `findById returns null for missing id`(): Unit =
        runTest {
            val found = dao.findById("no-such-id")
            assertThat(found).isNull()
        }

    // ── markResolved ──────────────────────────────────────────────────────────

    @Test
    public fun `markResolved sets status to RESOLVED and sets resolvedAt`(): Unit =
        runTest {
            dao.upsertAll(listOf(entity(id = "resolve-me")))
            val now = 7_777L
            dao.markResolved("resolve-me", now)
            val resolved = dao.findById("resolve-me")
            assertThat(resolved!!.status).isEqualTo("RESOLVED")
            assertThat(resolved.resolvedAt).isEqualTo(now)
        }

    // ── purgeExpired ──────────────────────────────────────────────────────────

    @Test
    public fun `purgeExpired removes ACTIVE rows whose TTL has passed`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "expired-ttl", expiresAt = 500L),
                    entity(id = "not-expired", expiresAt = 99_999L),
                    entity(id = "no-expiry", expiresAt = null),
                ),
            )
            val now = 1_000L
            dao.purgeExpired(now)
            val active = dao.observeActive("user-1").first()
            assertThat(active.map { it.id }).containsExactlyInAnyOrder("not-expired", "no-expiry")
        }

    @Test
    public fun `purgeExpired does not delete RESOLVED rows with expiresAt in the past`(): Unit =
        runTest {
            // RESOLVED tombstones are protected — purgeTombstones handles them, not purgeExpired
            dao.upsertAll(
                listOf(
                    entity(id = "resolved-with-expiry", status = "RESOLVED", expiresAt = 100L, resolvedAt = 200L),
                ),
            )
            dao.purgeExpired(now = 1_000L)
            val row = dao.findById("resolved-with-expiry")
            assertThat(row).isNotNull
        }

    // ── purgeTombstones ───────────────────────────────────────────────────────

    @Test
    public fun `purgeTombstones deletes RESOLVED rows older than cutoff`(): Unit =
        runTest {
            val thirtyDaysMs = 30L * 24 * 60 * 60 * 1_000
            val now = 100_000_000L
            val cutoff = now - thirtyDaysMs
            dao.upsertAll(
                listOf(
                    entity(
                        id = "old-tombstone",
                        status = "RESOLVED",
                        resolvedAt = cutoff - 1_000L, // older than cutoff
                    ),
                    entity(
                        id = "fresh-tombstone",
                        status = "RESOLVED",
                        resolvedAt = cutoff + 1_000L, // younger than cutoff
                    ),
                    entity(
                        id = "active-row",
                        status = "ACTIVE",
                        resolvedAt = null,
                    ),
                ),
            )
            dao.purgeTombstones(cutoff)

            assertThat(dao.findById("old-tombstone")).isNull()
            assertThat(dao.findById("fresh-tombstone")).isNotNull
            assertThat(dao.findById("active-row")).isNotNull
        }

    @Test
    public fun `purgeTombstones does not delete RESOLVED rows with null resolvedAt`(): Unit =
        runTest {
            // Edge case: RESOLVED row with no resolvedAt timestamp should not be deleted
            dao.upsertAll(
                listOf(
                    entity(id = "no-resolved-at", status = "RESOLVED", resolvedAt = null),
                ),
            )
            dao.purgeTombstones(cutoff = 99_999_999L)
            assertThat(dao.findById("no-resolved-at")).isNotNull
        }

    // ── clearAll ──────────────────────────────────────────────────────────────

    @Test
    public fun `clearAll removes every row`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "row-1"),
                    entity(id = "row-2", status = "RESOLVED", resolvedAt = 100L),
                    entity(id = "row-3", status = "EXPIRED"),
                ),
            )
            dao.clearAll()
            val active = dao.observeActive("user-1").first()
            assertThat(active).isEmpty()
            assertThat(dao.findById("row-1")).isNull()
            assertThat(dao.findById("row-2")).isNull()
            assertThat(dao.findById("row-3")).isNull()
        }
}
