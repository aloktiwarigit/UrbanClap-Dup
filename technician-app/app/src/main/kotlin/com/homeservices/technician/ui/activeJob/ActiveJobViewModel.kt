package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.CompleteJobUseCase
import com.homeservices.technician.domain.activeJob.MarkReachedUseCase
import com.homeservices.technician.domain.activeJob.StartTripUseCase
import com.homeservices.technician.domain.activeJob.StartWorkUseCase
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import com.homeservices.technician.domain.photo.UploadJobPhotoUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
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
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

        private val _uiState = MutableStateFlow<ActiveJobUiState>(ActiveJobUiState.Loading)
        public val uiState: StateFlow<ActiveJobUiState> = _uiState.asStateFlow()

        private val _navigationEvents = MutableSharedFlow<NavigationEvent>(extraBufferCapacity = 1)
        public val navigationEvents: SharedFlow<NavigationEvent> = _navigationEvents.asSharedFlow()

        init {
            viewModelScope.launch {
                repository.getActiveJob(bookingId).collect { job ->
                    val hasPending =
                        (_uiState.value as? ActiveJobUiState.Active)?.hasPendingTransitions ?: false
                    _uiState.value =
                        if (job.status == ActiveJobStatus.COMPLETED) {
                            ActiveJobUiState.Completed
                        } else {
                            ActiveJobUiState.Active(
                                job = job,
                                availableAction = job.status.toAction(),
                                hasPendingTransitions = hasPending,
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
            viewModelScope.launch { markReachedUseCase(bookingId) }
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
            _uiState.value = current.copy(pendingPhotoStage = targetStage, photoUploadError = null)
        }

        /** User cancelled out of the photo capture screen without taking a photo. */
        public fun onPhotoCancelled() {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            _uiState.value = current.copy(pendingPhotoStage = null, photoUploadError = null)
        }

        /** User confirmed the captured photo — upload it then fire the stage transition. */
        public fun onPhotoConfirmed(localFilePath: String) {
            val current = _uiState.value as? ActiveJobUiState.Active ?: return
            val stage = current.pendingPhotoStage ?: return
            _uiState.value = current.copy(photoUploadInProgress = true, photoUploadError = null)
            viewModelScope.launch {
                val result = uploadJobPhotoUseCase.execute(bookingId, stage, localFilePath)
                if (result.isSuccess) {
                    val s = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                    _uiState.value = s.copy(pendingPhotoStage = null, photoUploadInProgress = false)
                    when (stage) {
                        "EN_ROUTE" -> {
                            val (r, navEvent) = startTripUseCase(bookingId)
                            if (r.isSuccess && navEvent != null) _navigationEvents.emit(navEvent)
                        }
                        "REACHED" -> markReachedUseCase(bookingId)
                        "IN_PROGRESS" -> startWorkUseCase(bookingId)
                        "COMPLETED" -> completeJobUseCase(bookingId)
                    }
                } else {
                    val s = _uiState.value as? ActiveJobUiState.Active ?: return@launch
                    _uiState.value = s.copy(
                        photoUploadInProgress = false,
                        photoUploadError = result.exceptionOrNull()?.message ?: "Upload failed",
                    )
                }
            }
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
