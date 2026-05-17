package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.activeJob.BookingStatusEventBus
import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.CompleteJobUseCase
import com.homeservices.technician.domain.activeJob.MarkReachedUseCase
import com.homeservices.technician.domain.activeJob.StartTripUseCase
import com.homeservices.technician.domain.activeJob.StartWorkUseCase
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.photo.UploadJobPhotoUseCase
import com.homeservices.technician.domain.shield.FileShieldReportUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@Suppress("LongParameterList") // Hilt-injected dependencies for the active-job feature; extracting an aggregator would only hide the wiring
internal class ActiveJobViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val repository: ActiveJobRepository,
        private val startTripUseCase: StartTripUseCase,
        private val markReachedUseCase: MarkReachedUseCase,
        private val startWorkUseCase: StartWorkUseCase,
        private val completeJobUseCase: CompleteJobUseCase,
        private val connectivityObserver: ConnectivityObserver,
        private val uploadJobPhotoUseCase: UploadJobPhotoUseCase,
        private val fileShieldReportUseCase: FileShieldReportUseCase,
        private val bookingStatusEventBus: BookingStatusEventBus,
        private val pendingActionStore: PendingActionStore,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

        private val _uiState = MutableStateFlow<ActiveJobUiState>(ActiveJobUiState.Loading)
        public val uiState: StateFlow<ActiveJobUiState> = _uiState.asStateFlow()

        private val _navigationEvents = MutableSharedFlow<NavigationEvent>(extraBufferCapacity = 1)
        public val navigationEvents: SharedFlow<NavigationEvent> = _navigationEvents.asSharedFlow()

        init {
            viewModelScope.launch {
                repository.startObserving(bookingId)
            }
            viewModelScope.launch {
                repository.getActiveJob(bookingId).collect { job ->
                    val current = _uiState.value as? ActiveJobUiState.Active
                    _uiState.value =
                        if (job.status == ActiveJobStatus.COMPLETED) {
                            ActiveJobUiState.Completed(bookingId = bookingId)
                        } else {
                            ActiveJobUiState.Active(
                                job = job,
                                availableAction = job.status.toAction(),
                                // Preserve transient UI state across polling refreshes so that
                                // an in-progress photo capture or upload is not interrupted.
                                hasPendingTransitions = current?.hasPendingTransitions ?: false,
                                pendingPhotoStage = current?.pendingPhotoStage,
                                uploadedStoragePath = current?.uploadedStoragePath,
                                photoUploadInProgress = current?.photoUploadInProgress ?: false,
                                photoUploadError = current?.photoUploadError,
                                showShieldSheet = current?.showShieldSheet ?: false,
                                shieldReportInProgress = current?.shieldReportInProgress ?: false,
                                shieldReportSuccess = current?.shieldReportSuccess ?: false,
                                shieldReportError = current?.shieldReportError,
                                mockLocationWarning = current?.mockLocationWarning ?: false,
                                photoUploadPending = current?.photoUploadPending ?: false,
                                awaitingCompletionConfirm = current?.awaitingCompletionConfirm ?: false,
                            )
                        }
                }
            }
            viewModelScope.launch {
                repository.hasPendingTransitions.collect { hasPending ->
                    val current = _uiState.value
                    if (current is ActiveJobUiState.Active) {
                        _uiState.value = current.copy(hasPendingTransitions = hasPending)
                    }
                }
            }
            viewModelScope.launch {
                connectivityObserver.isConnected.collect { connected ->
                    if (connected) repository.syncPendingTransitions()
                }
            }
            // E11-S05a: react to server-confirmed booking-status pushes.
            viewModelScope.launch {
                bookingStatusEventBus.events.collect { event ->
                    if (event.bookingId != bookingId) return@collect
                    when (event.newStatus) {
                        "PRICE_APPROVED", "PRICE_REJECTED" -> repository.startObserving(bookingId)
                        else -> Unit
                    }
                }
            }
            // E11-S05a: derive photoUploadPending from the local pending-actions table.
            @OptIn(ExperimentalCoroutinesApi::class)
            viewModelScope.launch {
                sessionManager.authState
                    .flatMapLatest { authState ->
                        when (authState) {
                            is AuthState.Authenticated ->
                                pendingActionStore
                                    .observeActive(authState.uid)
                                    .map { actions ->
                                        actions.any {
                                            it.type == PendingActionType.PHOTO_UPLOAD_PENDING &&
                                                it.entityId == bookingId
                                        }
                                    }
                            AuthState.Unauthenticated -> flowOf(false)
                        }
                    }.collect { hasPending ->
                        val current = _uiState.value as? ActiveJobUiState.Active ?: return@collect
                        if (current.photoUploadPending != hasPending) {
                            _uiState.value = current.copy(photoUploadPending = hasPending)
                        }
                    }
            }
        }

        public fun startTrip(): Unit {
            viewModelScope.launch {
                val (result, navEvent) = startTripUseCase(bookingId)
                if (result.isSuccess && navEvent != null) {
                    _navigationEvents.emit(navEvent)
                }
            }
        }

        public fun markReached(): Unit {
            viewModelScope.launch {
                val outcome = markReachedUseCase(bookingId)
                if (outcome.isMock) {
                    val current = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                    _uiState.value = current.copy(mockLocationWarning = true)
                }
            }
        }

        /** Consumes the mock-location warning Snackbar so it is not shown again on recomposition. */
        public fun consumeMockLocationWarning() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(mockLocationWarning = false)
        }

        public fun startWork(): Unit {
            viewModelScope.launch { startWorkUseCase(bookingId) }
        }

        public fun completeJob(): Unit {
            viewModelScope.launch { completeJobUseCase(bookingId) }
        }

        /** Intercepts a CTA tap — shows PhotoCaptureScreen before firing the transition. */
        public fun onTransitionRequested(targetStage: String) {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            // Clear any previously uploaded path from a failed transition so the technician
            // must take a fresh photo for each new stage attempt (FR-5.4 compliance).
            _uiState.value =
                current.copy(
                    pendingPhotoStage = targetStage,
                    uploadedStoragePath = null,
                    photoUploadError = null,
                )
        }

        /** User cancelled out of the photo capture screen without taking a photo. */
        public fun onPhotoCancelled() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            // Also clear uploaded path — the technician must restart the capture flow.
            _uiState.value =
                current.copy(
                    pendingPhotoStage = null,
                    uploadedStoragePath = null,
                    photoUploadError = null,
                )
        }

        /** User tapped Retake after an upload error — clear the error so the fresh capture gets a clean slate. */
        public fun onPhotoRetake() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(photoUploadError = null)
        }

        /**
         * User confirmed the captured photo — upload it then fire the stage transition.
         *
         * Design note (FR-5.4): photo upload is intentionally a hard prerequisite for every
         * stage transition. If the upload fails (device offline, quota exceeded, etc.) the
         * transition is blocked and the technician must retry. This deliberately diverges
         * from the pre-E06-S02 offline queue because evidence photos cannot be deferred —
         * a transition without a timestamped photo would break audit integrity.
         * Offline technicians should reconnect before marking job progress.
         */
        public fun onPhotoConfirmed(localFilePath: String) {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            val stage = current.pendingPhotoStage ?: return
            // If photo already uploaded (e.g. retrying after transition failure), skip re-upload.
            if (current.uploadedStoragePath != null) {
                fireTransition(stage)
                return
            }
            _uiState.value = current.copy(photoUploadInProgress = true, photoUploadError = null)
            viewModelScope.launch {
                val uploadResult = uploadJobPhotoUseCase.execute(bookingId, stage, localFilePath)
                if (uploadResult.isSuccess) {
                    val storagePath = uploadResult.getOrThrow()
                    val s = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                    // Keep photoUploadInProgress = true until fireTransition completes so the
                    // Confirm button stays disabled and duplicate transitions are prevented.
                    _uiState.value = s.copy(uploadedStoragePath = storagePath)
                    fireTransition(stage)
                } else {
                    val s = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                    _uiState.value =
                        s.copy(
                            photoUploadInProgress = false,
                            photoUploadError = uploadResult.exceptionOrNull()?.message ?: "Upload failed",
                        )
                }
            }
        }

        private fun fireTransition(stage: String) {
            viewModelScope.launch {
                var isMock = false
                val transitionResult =
                    when (stage) {
                        "EN_ROUTE" -> {
                            val (r, navEvent) = startTripUseCase(bookingId)
                            if (r.isSuccess && navEvent != null) _navigationEvents.emit(navEvent)
                            r
                        }
                        "REACHED" -> {
                            val outcome = markReachedUseCase(bookingId)
                            isMock = outcome.isMock
                            outcome.result
                        }
                        "IN_PROGRESS" -> startWorkUseCase(bookingId)
                        "COMPLETED" -> completeJobUseCase(bookingId)
                        else -> return@launch
                    }
                val s = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                if (transitionResult.isSuccess) {
                    _uiState.value =
                        s.copy(
                            pendingPhotoStage = null,
                            uploadedStoragePath = null,
                            photoUploadInProgress = false,
                            photoUploadError = null,
                            mockLocationWarning = isMock,
                        )
                } else {
                    // Transition failed — keep stage + uploadedStoragePath so user can retry
                    // without re-uploading the photo.
                    _uiState.value =
                        s.copy(
                            photoUploadInProgress = false,
                            photoUploadError = transitionResult.exceptionOrNull()?.message ?: "Transition failed — tap Retry",
                            mockLocationWarning = isMock,
                        )
                }
            }
        }

        public fun onShowShieldSheet() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(showShieldSheet = true, shieldReportError = null)
        }

        public fun onDismissShieldSheet() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(showShieldSheet = false)
        }

        public fun fileShieldReport(description: String?) {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            val bid = current.job.bookingId
            _uiState.value = current.copy(shieldReportInProgress = true, shieldReportError = null)
            viewModelScope.launch {
                val result = fileShieldReportUseCase.invoke(bid, description)
                val s = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                _uiState.value =
                    if (result.isSuccess) {
                        s.copy(
                            shieldReportInProgress = false,
                            shieldReportSuccess = true,
                            showShieldSheet = false,
                            shieldReportError = null,
                        )
                    } else {
                        s.copy(
                            shieldReportInProgress = false,
                            shieldReportError = result.exceptionOrNull()?.message ?: "Report failed",
                        )
                    }
            }
        }

        public fun consumeShieldReportSuccess() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(shieldReportSuccess = false)
        }

        public fun consumeShieldReportError() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(shieldReportError = null)
        }

        // ── E11-S05a: completion-confirm + photo retry ────────────────────────────

        /** Shows the completion confirmation dialog before [completeJob] fires. */
        public fun requestCompletionConfirm() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(awaitingCompletionConfirm = true)
        }

        /** Dismisses the completion dialog without firing the transition. */
        public fun cancelCompletionConfirm() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(awaitingCompletionConfirm = false)
        }

        /** Confirms completion — clears the dialog flag and dispatches [completeJob]. */
        public fun confirmCompletion() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(awaitingCompletionConfirm = false)
            completeJob()
        }

        /**
         * Reopens [PhotoCaptureScreen] for the queued photo upload of the current
         * stage so the technician can retry the upload that previously failed.
         */
        public fun onPhotoRetryRequested() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            val pendingStage = current.job.status.toStageName()
            _uiState.value =
                current.copy(
                    pendingPhotoStage = pendingStage,
                    photoUploadError = null,
                )
        }

        /** Maps the current job status to the *target* stage of the next transition. */
        private fun ActiveJobStatus.toStageName(): String =
            when (this) {
                ActiveJobStatus.ASSIGNED -> "EN_ROUTE"
                ActiveJobStatus.EN_ROUTE -> "REACHED"
                ActiveJobStatus.REACHED -> "IN_PROGRESS"
                ActiveJobStatus.IN_PROGRESS -> "COMPLETED"
                ActiveJobStatus.COMPLETED -> "COMPLETED"
            }

        private fun ActiveJobStatus.toAction(): ActiveJobAction =
            when (this) {
                ActiveJobStatus.ASSIGNED -> ActiveJobAction.START_TRIP
                ActiveJobStatus.EN_ROUTE -> ActiveJobAction.MARK_ARRIVED
                ActiveJobStatus.REACHED -> ActiveJobAction.START_WORK
                ActiveJobStatus.IN_PROGRESS -> ActiveJobAction.COMPLETE_JOB
                ActiveJobStatus.COMPLETED -> ActiveJobAction.NONE
            }
    }
