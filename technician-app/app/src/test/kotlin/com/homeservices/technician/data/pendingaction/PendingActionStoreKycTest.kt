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

/**
 * TDD — [PendingActionStore] onboarding helpers (E11-S05c WS-A).
 *
 * Mirrors [PendingActionStorePhotoTest] but targets the PHOTO_UPLOAD_RETRY type and
 * the per-technician helpers introduced for the KYC retry banner.
 */
public class PendingActionStoreKycTest {
    private lateinit var dao: PendingActionDao
    private lateinit var store: PendingActionStore

    @BeforeEach
    public fun setUp() {
        dao = mockk(relaxed = true)
        store = PendingActionStore(dao)
    }

    private fun retryEntity(techId: String) =
        PendingActionEntity(
            id = "PHOTO_UPLOAD_RETRY:technician:$techId:kyc:$techId",
            userId = techId,
            role = "technician",
            type = PendingActionType.PHOTO_UPLOAD_RETRY.name,
            entityType = "kyc",
            entityId = techId,
            routeUri = "homeservices://kyc",
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

    @Test
    public fun `pendingPhotoRetryForTech returns mapped domain action when active row exists`(): Unit =
        runTest {
            coEvery { dao.findActivePhotoRetryForTech("tech-1") } returns retryEntity("tech-1")

            val action = store.pendingPhotoRetryForTech("tech-1")

            assertThat(action).isNotNull()
            assertThat(action!!.entityId).isEqualTo("tech-1")
            assertThat(action.type).isEqualTo(PendingActionType.PHOTO_UPLOAD_RETRY)
            assertThat(action.status).isEqualTo(PendingActionStatus.ACTIVE)
        }

    @Test
    public fun `pendingPhotoRetryForTech returns null when no active row exists`(): Unit =
        runTest {
            coEvery { dao.findActivePhotoRetryForTech(any()) } returns null

            assertThat(store.pendingPhotoRetryForTech("tech-missing")).isNull()
        }

    @Test
    public fun `clearPhotoRetry delegates to DAO with techId and now`(): Unit =
        runTest {
            store.clearPhotoRetry(techId = "tech-1", now = 9_000L)

            coVerify(exactly = 1) {
                dao.clearActivePhotoRetryForTech(techId = "tech-1", now = 9_000L)
            }
        }

    @Test
    public fun `clearKycSubmitPending delegates to DAO with techId and now`(): Unit =
        runTest {
            store.clearKycSubmitPending(techId = "tech-1", now = 9_500L)

            coVerify(exactly = 1) {
                dao.clearActiveKycSubmitPendingForTech(techId = "tech-1", now = 9_500L)
            }
        }

    @Test
    public fun `clearKycResume delegates to DAO with techId and now`(): Unit =
        runTest {
            store.clearKycResume(techId = "tech-1", now = 10_000L)

            coVerify(exactly = 1) {
                dao.clearActiveKycResumeForTech(techId = "tech-1", now = 10_000L)
            }
        }
}
