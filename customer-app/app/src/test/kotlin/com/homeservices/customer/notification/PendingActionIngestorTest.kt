package com.homeservices.customer.notification

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.data.pendingaction.PendingActionStore
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

/**
 * JVM unit tests for [PendingActionIngestor].
 *
 * Strategy: manual construction with MockK fakes per
 * docs/patterns/hilt-module-android-test-scope.md (Type 1: JVM Unit Tests).
 *
 * Covers the full stale-event ruleset from E11 spec §2.10:
 *   1. RESOLVED tombstone drop — incoming action matching a RESOLVED row is dropped
 *   2. Version stale drop — incoming version <= existing version is dropped
 *   3. 7-day age drop — events older than 7 days (configurable) are dropped
 *   4. Duplicate drop — same actionId already in store (same version) is dropped
 *   5. Fresh upsert — new action with no existing row is persisted
 *   6. Version upgrade upsert — incoming version > existing version is persisted
 */
public class PendingActionIngestorTest {
    private lateinit var store: PendingActionStore
    private lateinit var clock: Clock
    private lateinit var ingestor: PendingActionIngestor

    private val fixedNow: Instant = Instant.parse("2026-05-01T12:00:00Z")

    @Before
    public fun setUp() {
        store = mockk(relaxed = true)
        clock = Clock.fixed(fixedNow, ZoneId.of("UTC"))
        ingestor = PendingActionIngestor(store = store, clock = clock)
    }

    // ── 1. RESOLVED tombstone drop ────────────────────────────────────────────

    @Test
    public fun `ingest drops action whose existing row is RESOLVED`(): Unit =
        runTest {
            val action = buildAction(id = "PA:RATING_PROMPT_CUSTOMER:customer:u1:booking:bk1", version = 2L)
            val existing = action.copy(status = PendingActionStatus.RESOLVED, resolvedAt = fixedNow.toEpochMilli() - 100)
            coEvery { store.findById(action.id) } returns existing

            ingestor.ingest(action)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    // ── 2. Version stale drop ─────────────────────────────────────────────────

    @Test
    public fun `ingest drops action when incoming version is less than existing version`(): Unit =
        runTest {
            val existing = buildAction(id = "PA:COMPLAINT_UPDATE:customer:u1:complaint:c1", version = 5L)
            val staleIncoming = existing.copy(version = 3L)
            coEvery { store.findById(existing.id) } returns existing

            ingestor.ingest(staleIncoming)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    @Test
    public fun `ingest drops action when incoming version equals existing version`(): Unit =
        runTest {
            val existing = buildAction(id = "PA:COMPLAINT_UPDATE:customer:u1:complaint:c1", version = 5L)
            val sameVersion = existing.copy(status = PendingActionStatus.ACTIVE)
            coEvery { store.findById(existing.id) } returns existing

            ingestor.ingest(sameVersion)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    // ── 3. 7-day age drop ─────────────────────────────────────────────────────

    @Test
    public fun `ingest drops action older than 7 days`(): Unit =
        runTest {
            val sevenDaysAgoMs = fixedNow.toEpochMilli() - (8L * 24 * 60 * 60 * 1000)
            val staleAction =
                buildAction(
                    id = "PA:RATING_PROMPT_CUSTOMER:customer:u1:booking:bk2",
                    version = 1L,
                    createdAt = sevenDaysAgoMs,
                    updatedAt = sevenDaysAgoMs,
                )
            coEvery { store.findById(staleAction.id) } returns null

            ingestor.ingest(staleAction)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    @Test
    public fun `ingest accepts action exactly at 7-day boundary`(): Unit =
        runTest {
            val exactlySevenDaysAgoMs = fixedNow.toEpochMilli() - (7L * 24 * 60 * 60 * 1000)
            val boundaryAction =
                buildAction(
                    id = "PA:COMPLAINT_UPDATE:customer:u1:complaint:c2",
                    version = 1L,
                    createdAt = exactlySevenDaysAgoMs,
                    updatedAt = exactlySevenDaysAgoMs,
                )
            coEvery { store.findById(boundaryAction.id) } returns null

            ingestor.ingest(boundaryAction)

            coVerify(exactly = 1) { store.upsert(any()) }
        }

    // ── 4. Fresh upsert ───────────────────────────────────────────────────────

    @Test
    public fun `ingest persists fresh action with no existing row`(): Unit =
        runTest {
            val action = buildAction(id = "PA:NEW_BOOKING:customer:u1:booking:bk3", version = 1L)
            coEvery { store.findById(action.id) } returns null

            ingestor.ingest(action)

            val slot = slot<PendingAction>()
            coVerify(exactly = 1) { store.upsert(capture(slot)) }
            assertThat(slot.captured.id).isEqualTo(action.id)
        }

    // ── 5. Version upgrade upsert ─────────────────────────────────────────────

    @Test
    public fun `ingest persists action when incoming version is greater than existing`(): Unit =
        runTest {
            val existing = buildAction(id = "PA:COMPLAINT_UPDATE:customer:u1:complaint:c3", version = 2L)
            val newerIncoming = existing.copy(version = 3L, sourceStatus = "OPEN")
            coEvery { store.findById(existing.id) } returns existing

            ingestor.ingest(newerIncoming)

            val slot = slot<PendingAction>()
            coVerify(exactly = 1) { store.upsert(capture(slot)) }
            assertThat(slot.captured.version).isEqualTo(3L)
        }

    // ── 6. Reconcile: marks missing as resolved + purges expired/tombstones ───

    @Test
    public fun `reconcile calls markMissingAsResolved with correct keepIds`(): Unit =
        runTest {
            val actions =
                listOf(
                    buildAction(id = "PA:COMPLAINT_UPDATE:customer:u1:complaint:c4", version = 1L),
                    buildAction(id = "PA:RATING_PROMPT_CUSTOMER:customer:u1:booking:bk4", version = 1L),
                )

            ingestor.reconcile(userId = "u1", serverSnapshot = actions)

            coVerify(exactly = 1) {
                store.upsertAll(actions)
            }
            coVerify(exactly = 1) {
                store.markMissingAsResolved(
                    userId = "u1",
                    keepIds =
                        setOf(
                            "PA:COMPLAINT_UPDATE:customer:u1:complaint:c4",
                            "PA:RATING_PROMPT_CUSTOMER:customer:u1:booking:bk4",
                        ),
                    now = fixedNow.toEpochMilli(),
                )
            }
        }

    @Test
    public fun `reconcile calls purgeExpired and purgeTombstones`(): Unit =
        runTest {
            ingestor.reconcile(userId = "u1", serverSnapshot = emptyList())

            coVerify(exactly = 1) { store.purgeExpired(fixedNow.toEpochMilli()) }
            coVerify(exactly = 1) { store.purgeTombstones(fixedNow.toEpochMilli() - THIRTY_DAYS_MS) }
        }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun buildAction(
        id: String,
        version: Long,
        createdAt: Long = fixedNow.toEpochMilli() - 1000,
        updatedAt: Long = fixedNow.toEpochMilli() - 1000,
    ): PendingAction =
        PendingAction(
            id = id,
            userId = "u1",
            role = "customer",
            type = PendingActionType.COMPLAINT_UPDATE,
            entityType = "complaint",
            entityId = "c1",
            routeUri = "homeservices://action/COMPLAINT_UPDATE?entityId=c1",
            priority = PendingActionPriority.NORMAL,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = null,
            resolvedAt = null,
        )

    private companion object {
        const val THIRTY_DAYS_MS: Long = 30L * 24 * 60 * 60 * 1000
    }
}
