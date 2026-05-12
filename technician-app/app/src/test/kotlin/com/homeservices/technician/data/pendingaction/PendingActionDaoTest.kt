package com.homeservices.technician.data.pendingaction

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.data.pendingaction.db.PendingActionDao
import com.homeservices.technician.data.pendingaction.db.PendingActionEntity
import com.homeservices.technician.data.pendingaction.db.PendingActionsDatabase
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
 * Robolectric-based Room DAO tests for [PendingActionDao] — technician-app.
 *
 * Mirror of the customer-app PendingActionDaoTest. Both apps share the same schema
 * and DAO contract so the test coverage is identical.
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
        db =
            Room.inMemoryDatabaseBuilder(ctx, PendingActionsDatabase::class.java)
                .allowMainThreadQueries()
                .build()
        dao = db.pendingActionDao()
    }

    @After
    public fun tearDown() {
        db.close()
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    // detekt: test fixture factory, parameters intentional
    @Suppress("LongParameterList")
    private fun entity(
        id: String = "action-1",
        userId: String = "tech-1",
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
            val all = dao.observeActive("tech-1").first()
            assertThat(all).hasSize(2)
        }

    @Test
    public fun `upsertAll replaces existing row with same id`(): Unit =
        runTest {
            dao.upsertAll(listOf(entity(id = "a", version = 1L, priority = "HIGH")))
            dao.upsertAll(listOf(entity(id = "a", version = 2L, priority = "LOW")))
            val all = dao.observeActive("tech-1").first()
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
            val active = dao.observeActive("tech-1").first()
            assertThat(active).hasSize(1)
            assertThat(active.first().id).isEqualTo("active-1")
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
            val ordered = dao.observeActive("tech-1").first()
            assertThat(ordered.map { it.id }).containsExactly(
                "high-old",
                "high-new",
                "normal-mid",
                "low-old",
            )
        }

    // ── markMissingAsResolved ─────────────────────────────────────────────────

    @Test
    public fun `markMissingAsResolved tombstones absent rows`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "keep-1"),
                    entity(id = "missing-1"),
                ),
            )
            dao.markMissingAsResolved(userId = "tech-1", keep = setOf("keep-1"), now = 5_000L)
            val active = dao.observeActive("tech-1").first()
            assertThat(active.map { it.id }).containsExactly("keep-1")

            val missing = dao.findById("missing-1")
            assertThat(missing!!.status).isEqualTo("RESOLVED")
            assertThat(missing.resolvedAt).isEqualTo(5_000L)
        }

    // ── purgeExpired ──────────────────────────────────────────────────────────

    @Test
    public fun `purgeExpired removes ACTIVE rows whose TTL has passed`(): Unit =
        runTest {
            dao.upsertAll(
                listOf(
                    entity(id = "expired-ttl", expiresAt = 500L),
                    entity(id = "not-expired", expiresAt = 99_999L),
                ),
            )
            dao.purgeExpired(now = 1_000L)
            val active = dao.observeActive("tech-1").first()
            assertThat(active.map { it.id }).containsExactly("not-expired")
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
                    entity(id = "old-tombstone", status = "RESOLVED", resolvedAt = cutoff - 1_000L),
                    entity(id = "fresh-tombstone", status = "RESOLVED", resolvedAt = cutoff + 1_000L),
                ),
            )
            dao.purgeTombstones(cutoff)
            assertThat(dao.findById("old-tombstone")).isNull()
            assertThat(dao.findById("fresh-tombstone")).isNotNull
        }

    // ── clearAll ──────────────────────────────────────────────────────────────

    @Test
    public fun `clearAll removes every row`(): Unit =
        runTest {
            dao.upsertAll(listOf(entity(id = "row-1"), entity(id = "row-2", status = "RESOLVED", resolvedAt = 100L)))
            dao.clearAll()
            assertThat(dao.observeActive("tech-1").first()).isEmpty()
            assertThat(dao.findById("row-1")).isNull()
            assertThat(dao.findById("row-2")).isNull()
        }
}
