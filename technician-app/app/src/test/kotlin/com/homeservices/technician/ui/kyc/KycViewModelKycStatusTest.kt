package com.homeservices.technician.ui.kyc

import android.net.Uri
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.kyc.DigiLockerCallbackBus
import com.homeservices.technician.data.kyc.KycStatusEvent
import com.homeservices.technician.data.kyc.KycStatusEventBus
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.auth.model.AuthProvider
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.kyc.KycOrchestrator
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * TDD — [KycViewModel] event-bus + retry behaviour (E11-S05c WS-C).
 *
 * Covers:
 *   - KYC_VERIFIED FCM event drives the ViewModel into `Complete`.
 *   - KYC_REJECTED FCM event drives the ViewModel into `Error` (rejection reason
 *     surfaced verbatim; fallback message used when reason is null).
 *   - `photoUploadRetryPending` reflects the active PHOTO_UPLOAD_RETRY row in
 *     [PendingActionStore].
 *   - `retryPhotoUpload()` re-invokes the orchestrator with the URI captured by the
 *     most recent `submitPan` call.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class KycViewModelKycStatusTest {
    private lateinit var orchestrator: KycOrchestrator
    private lateinit var callbackBus: DigiLockerCallbackBus
    private lateinit var kycStatusEventBus: KycStatusEventBus
    private lateinit var pendingActionStore: PendingActionStore
    private lateinit var sessionManager: SessionManager
    private lateinit var pendingActionsFlow: MutableStateFlow<List<PendingAction>>
    private val testDispatcher = UnconfinedTestDispatcher()
    private val techId = "tech-42"

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        orchestrator = mockk(relaxed = true)
        callbackBus = DigiLockerCallbackBus()
        kycStatusEventBus = KycStatusEventBus()
        pendingActionStore = mockk(relaxed = true)
        sessionManager = mockk(relaxed = true)

        every { sessionManager.authState } returns
            MutableStateFlow(
                AuthState.Authenticated(
                    uid = techId,
                    phoneLastFour = "1234",
                    email = null,
                    displayName = null,
                    authProvider = AuthProvider.Phone,
                ),
            )

        pendingActionsFlow = MutableStateFlow(emptyList())
        every { pendingActionStore.observeActive(techId) } returns pendingActionsFlow
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun viewModel(): KycViewModel =
        KycViewModel(
            orchestrator = orchestrator,
            callbackBus = callbackBus,
            kycStatusEventBus = kycStatusEventBus,
            pendingActionStore = pendingActionStore,
            sessionManager = sessionManager,
        )

    // ── KYC_VERIFIED / KYC_REJECTED ────────────────────────────────────────────

    @Test
    public fun `KYC_VERIFIED event drives uiState to Complete`(): Unit =
        runTest {
            val vm = viewModel()

            kycStatusEventBus.post(KycStatusEvent(technicianId = techId, verified = true))

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.Complete::class.java)
        }

    @Test
    public fun `KYC_REJECTED event surfaces rejection reason verbatim`(): Unit =
        runTest {
            val vm = viewModel()

            kycStatusEventBus.post(
                KycStatusEvent(
                    technicianId = techId,
                    verified = false,
                    rejectionReason = "PAN photo unreadable.",
                ),
            )

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(KycUiState.Error::class.java)
            assertThat((state as KycUiState.Error).message).isEqualTo("PAN photo unreadable.")
        }

    @Test
    public fun `KYC_REJECTED with null reason falls back to default message`(): Unit =
        runTest {
            val vm = viewModel()

            kycStatusEventBus.post(
                KycStatusEvent(technicianId = techId, verified = false, rejectionReason = null),
            )

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(KycUiState.Error::class.java)
            assertThat((state as KycUiState.Error).message).isNotBlank()
        }

    // ── photoUploadRetryPending observation ────────────────────────────────────

    @Test
    public fun `photoUploadRetryPending starts false when no rows are active`(): Unit =
        runTest {
            val vm = viewModel()

            assertThat(vm.photoUploadRetryPending.value).isFalse()
        }

    @Test
    public fun `photoUploadRetryPending flips to true when store emits a PHOTO_UPLOAD_RETRY row`(): Unit =
        runTest {
            val vm = viewModel()

            pendingActionsFlow.value =
                listOf(
                    PendingAction(
                        id = "PHOTO_UPLOAD_RETRY:technician:$techId:kyc:$techId",
                        userId = techId,
                        role = "technician",
                        type = PendingActionType.PHOTO_UPLOAD_RETRY,
                        entityType = "kyc",
                        entityId = techId,
                        routeUri = "content://media/pan.jpg",
                        priority = PendingActionPriority.HIGH,
                        status = PendingActionStatus.ACTIVE,
                        sourceStatus = null,
                        version = 1L,
                        createdAt = 1_000L,
                        updatedAt = 1_000L,
                        expiresAt = null,
                        resolvedAt = null,
                    ),
                )

            assertThat(vm.photoUploadRetryPending.value).isTrue()
        }

    @Test
    public fun `photoUploadRetryPending ignores unrelated PendingAction types`(): Unit =
        runTest {
            val vm = viewModel()

            pendingActionsFlow.value =
                listOf(
                    PendingAction(
                        id = "JOB_OFFER:technician:$techId:booking:bk-1",
                        userId = techId,
                        role = "technician",
                        type = PendingActionType.JOB_OFFER,
                        entityType = "booking",
                        entityId = "bk-1",
                        routeUri = "homeservices://offer/bk-1",
                        priority = PendingActionPriority.HIGH,
                        status = PendingActionStatus.ACTIVE,
                        sourceStatus = null,
                        version = 1L,
                        createdAt = 1_000L,
                        updatedAt = 1_000L,
                        expiresAt = null,
                        resolvedAt = null,
                    ),
                )

            assertThat(vm.photoUploadRetryPending.value).isFalse()
        }

    // ── retryPhotoUpload ───────────────────────────────────────────────────────

    @Test
    public fun `retryPhotoUpload replays the last submitted URI to the orchestrator`(): Unit =
        runTest {
            val vm = viewModel()
            val uri = mockk<Uri>()
            every {
                orchestrator.submitPan(uri, technicianId = techId)
            } returns flowOf(PanOcrResult.UploadError(RuntimeException("offline")))

            // Initial submission stores the URI and persists a retry row.
            vm.submitPan(uri)

            // The second submission must re-call the orchestrator with the same URI.
            vm.retryPhotoUpload()

            verify(atLeast = 2) {
                orchestrator.submitPan(uri, technicianId = techId)
            }
        }

    @Test
    public fun `submitPan UploadError persists a PHOTO_UPLOAD_RETRY row`(): Unit =
        runTest {
            val vm = viewModel()
            val uri = mockk<Uri>()
            every {
                orchestrator.submitPan(uri, technicianId = techId)
            } returns flowOf(PanOcrResult.UploadError(RuntimeException("offline")))

            vm.submitPan(uri)

            coVerify(atLeast = 1) {
                pendingActionStore.upsert(
                    match { it.type == PendingActionType.PHOTO_UPLOAD_RETRY && it.entityId == techId },
                )
            }
        }

    @Test
    public fun `submitPan Success clears the retry row`(): Unit =
        runTest {
            val vm = viewModel()
            val uri = mockk<Uri>()
            every {
                orchestrator.submitPan(uri, technicianId = techId)
            } returns flowOf(PanOcrResult.Success("ABCDE1234F"))

            vm.submitPan(uri)

            coVerify(atLeast = 1) { pendingActionStore.clearPhotoRetry(techId, any()) }
        }

    // Suppress unused warning — declared so it can be expanded later if needed.
    @Suppress("unused")
    private val callbackBusEvents: MutableSharedFlow<String> = MutableSharedFlow()
}
