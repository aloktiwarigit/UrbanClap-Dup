package com.homeservices.technician.data.pendingaction

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.pendingaction.db.PendingActionDao
import com.homeservices.technician.data.pendingaction.db.PendingActionEntity
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class PendingActionStoreTest {
    private lateinit var dao: PendingActionDao
    private lateinit var store: PendingActionStore

    @BeforeEach
    public fun setUp() {
        dao = mockk(relaxed = true)
        store = PendingActionStore(dao)
    }

    private fun anEntity(id: String = "pa-1") =
        PendingActionEntity(
            id = id,
            userId = "t1",
            role = "technician",
            type = PendingActionType.JOB_OFFER.name,
            entityType = "booking",
            entityId = "bk-1",
            routeUri = "homeservices://action/JOB_OFFER?entityId=bk-1",
            priority = PendingActionPriority.HIGH.name,
            status = PendingActionStatus.ACTIVE.name,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_000L,
            updatedAt = 1_000L,
            expiresAt = null,
            resolvedAt = null,
            lastFetchedAt = 1_000L,
        )

    private fun anAction(id: String = "pa-1") =
        PendingAction(
            id = id,
            userId = "t1",
            role = "technician",
            type = PendingActionType.JOB_OFFER,
            entityType = "booking",
            entityId = "bk-1",
            routeUri = "homeservices://action/JOB_OFFER?entityId=bk-1",
            priority = PendingActionPriority.HIGH,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_000L,
            updatedAt = 1_000L,
            expiresAt = null,
            resolvedAt = null,
        )

    @Test
    public fun `observeActive maps entities to domain PendingActions`(): Unit =
        runTest {
            every { dao.observeActive("t1") } returns flowOf(listOf(anEntity()))

            val actions = store.observeActive("t1").first()

            assertThat(actions).hasSize(1)
            assertThat(actions[0].id).isEqualTo("pa-1")
            assertThat(actions[0].type).isEqualTo(PendingActionType.JOB_OFFER)
        }

    @Test
    public fun `findById returns mapped domain action`(): Unit =
        runTest {
            coEvery { dao.findById("pa-1") } returns anEntity()

            val action = store.findById("pa-1")

            assertThat(action).isNotNull()
            assertThat(action!!.id).isEqualTo("pa-1")
            assertThat(action.priority).isEqualTo(PendingActionPriority.HIGH)
        }

    @Test
    public fun `findById returns null when entity is absent`(): Unit =
        runTest {
            coEvery { dao.findById(any()) } returns null

            assertThat(store.findById("missing")).isNull()
        }

    @Test
    public fun `upsertAll converts actions to entities and delegates to dao`(): Unit =
        runTest {
            val action = anAction()

            store.upsertAll(listOf(action))

            coVerify(exactly = 1) { dao.upsertAll(any()) }
        }

    @Test
    public fun `upsert delegates single action via upsertAll`(): Unit =
        runTest {
            store.upsert(anAction())

            coVerify(exactly = 1) { dao.upsertAll(any()) }
        }

    @Test
    public fun `markResolved delegates to dao`(): Unit =
        runTest {
            store.markResolved("pa-1", 9_000L)

            coVerify(exactly = 1) { dao.markResolved(id = "pa-1", now = 9_000L) }
        }

    @Test
    public fun `purgeExpired delegates to dao`(): Unit =
        runTest {
            store.purgeExpired(5_000L)

            coVerify(exactly = 1) { dao.purgeExpired(5_000L) }
        }

    @Test
    public fun `clearAll delegates to dao`(): Unit =
        runTest {
            store.clearAll()

            coVerify(exactly = 1) { dao.clearAll() }
        }
}
