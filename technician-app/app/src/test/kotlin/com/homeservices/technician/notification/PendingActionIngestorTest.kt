package com.homeservices.technician.notification

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.pendingaction.PendingActionStore
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
 * JVM unit tests for [PendingActionIngestor] — technician-app.
 *
 * Mirrors the customer-app ingestor test to verify the same stale-event
 * ruleset is applied consistently in both apps.
 *
 * Manual construction with MockK fakes per
 * docs/patterns/hilt-module-android-test-scope.md (Type 1: JVM Unit Tests).
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
            val action = buildAction(id = "PA:JOB_OFFER:technician:t1:booking:bk1", version = 2L)
            val existing = action.copy(status = PendingActionStatus.RESOLVED, resolvedAt = fixedNow.toEpochMilli() - 100)
            coEvery { store.findById(action.id) } returns existing

            ingestor.ingest(action)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    // ── 2. Version stale drop ─────────────────────────────────────────────────

    @Test
    public fun `ingest drops action when incoming version is less than existing`(): Unit =
        runTest {
            val existing = buildAction(id = "PA:JOB_OFFER:technician:t1:booking:bk2", version = 5L)
            val staleIncoming = existing.copy(version = 3L)
            coEvery { store.findById(existing.id) } returns existing

            ingestor.ingest(staleIncoming)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    // ── 3. 7-day age drop ─────────────────────────────────────────────────────

    @Test
    public fun `ingest drops action older than 7 days`(): Unit =
        runTest {
            val eightDaysAgoMs = fixedNow.toEpochMilli() - (8L * 24 * 60 * 60 * 1000)
            val staleAction =
                buildAction(
                    id = "PA:EARNINGS_UPDATE:technician:t1:earnings:e1",
                    version = 1L,
                    createdAt = eightDaysAgoMs,
                    updatedAt = eightDaysAgoMs,
                )
            coEvery { store.findById(staleAction.id) } returns null

            ingestor.ingest(staleAction)

            coVerify(exactly = 0) { store.upsert(any()) }
        }

    // ── 4. Fresh upsert ───────────────────────────────────────────────────────

    @Test
    public fun `ingest persists fresh action with no existing row`(): Unit =
        runTest {
            val action = buildAction(id = "PA:JOB_OFFER:technician:t1:booking:bk3", version = 1L)
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
            val existing = buildAction(id = "PA:JOB_OFFER:technician:t1:booking:bk4", version = 2L)
            val newerIncoming = existing.copy(version = 4L, sourceStatus = "ASSIGNED")
            coEvery { store.findById(existing.id) } returns existing

            ingestor.ingest(newerIncoming)

            val slot = slot<PendingAction>()
            coVerify(exactly = 1) { store.upsert(capture(slot)) }
            assertThat(slot.captured.version).isEqualTo(4L)
        }

    // ── 6. Reconcile ─────────────────────────────────────────────────────────

    @Test
    public fun `reconcile upserts all server actions and marks missing as resolved`(): Unit =
        runTest {
            val actions =
                listOf(
                    buildAction(id = "PA:JOB_OFFER:technician:t1:booking:bk5", version = 1L),
                )

            ingestor.reconcile(userId = "t1", serverSnapshot = actions)

            coVerify(exactly = 1) { store.upsertAll(actions) }
            coVerify(exactly = 1) {
                store.markMissingAsResolved(
                    userId = "t1",
                    keepIds = setOf("PA:JOB_OFFER:technician:t1:booking:bk5"),
                    now = fixedNow.toEpochMilli(),
                )
            }
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
            userId = "t1",
            role = "technician",
            type = PendingActionType.JOB_OFFER,
            entityType = "booking",
            entityId = "bk1",
            routeUri = "homeservices://action/JOB_OFFER?entityId=bk1",
            priority = PendingActionPriority.HIGH,
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
