package com.homeservices.technician.data.pendingaction

import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.pendingaction.db.PendingActionDao
import com.homeservices.technician.data.pendingaction.db.PendingActionEntity
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class PendingActionStorePhotoTest {
    private lateinit var dao: PendingActionDao
    private lateinit var store: PendingActionStore

    @BeforeEach
    public fun setUp() {
        dao = mockk(relaxed = true)
        store = PendingActionStore(dao)
    }

    private fun photoEntity(bookingId: String) =
        PendingActionEntity(
            id = "PHOTO_UPLOAD_PENDING:technician:t1:booking:$bookingId",
            userId = "t1",
            role = "technician",
            type = PendingActionType.PHOTO_UPLOAD_PENDING.name,
            entityType = "booking",
            entityId = bookingId,
            routeUri = "homeservices://action/PHOTO_UPLOAD_PENDING?bookingId=$bookingId",
            priority = PendingActionPriority.NORMAL.name,
            status = PendingActionStatus.ACTIVE.name,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_000L,
            updatedAt = 1_000L,
            expiresAt = null,
            resolvedAt = null,
            lastFetchedAt = 1_000L,
        )

    @Test
    public fun `pendingPhotoUploadForBooking returns mapped domain action when active row exists`(): Unit =
        runTest {
            coEvery { dao.findActivePhotoUploadForBooking("bk-1") } returns photoEntity("bk-1")

            val action = store.pendingPhotoUploadForBooking("bk-1")

            assertThat(action).isNotNull()
            assertThat(action!!.entityId).isEqualTo("bk-1")
            assertThat(action.type).isEqualTo(PendingActionType.PHOTO_UPLOAD_PENDING)
            assertThat(action.status).isEqualTo(PendingActionStatus.ACTIVE)
        }

    @Test
    public fun `pendingPhotoUploadForBooking returns null when no active row exists`(): Unit =
        runTest {
            coEvery { dao.findActivePhotoUploadForBooking(any()) } returns null

            assertThat(store.pendingPhotoUploadForBooking("bk-missing")).isNull()
        }

    @Test
    public fun `clearPhotoUploadPending delegates to DAO with bookingId and now`(): Unit =
        runTest {
            store.clearPhotoUploadPending(bookingId = "bk-1", now = 9_000L)

            coVerify(exactly = 1) {
                dao.clearActivePhotoUploadForBooking(bookingId = "bk-1", now = 9_000L)
            }
        }
}
