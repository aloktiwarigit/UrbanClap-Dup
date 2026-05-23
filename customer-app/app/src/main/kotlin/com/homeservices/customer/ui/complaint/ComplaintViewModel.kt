package com.homeservices.customer.ui.complaint

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.customer.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.customer.domain.complaint.PhotoUploadUseCase
import com.homeservices.customer.domain.complaint.ReopenComplaintUseCase
import com.homeservices.customer.domain.complaint.SubmitComplaintUseCase
import com.homeservices.customer.observability.analytics.AnalyticsEvents
import com.homeservices.customer.observability.analytics.AnalyticsFacade
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class ComplaintUiState {
    public data class Idle(
        val selectedReason: ComplaintReason? = null,
        val description: String = "",
        val photoStoragePath: String? = null,
        val submitEnabled: Boolean = false,
    ) : ComplaintUiState()

    public data object PhotoUploading : ComplaintUiState()

    public data object Submitting : ComplaintUiState()

    public data class Success(
        val complaintId: String,
        val acknowledgeDeadlineAt: String?,
        val status: String = "NEW",
        val isAcknowledged: Boolean = false,
        val isResolved: Boolean = false,
    ) : ComplaintUiState()

    public data class Error(
        val message: String,
    ) : ComplaintUiState()
}

private const val UNKNOWN_ERROR_FALLBACK = "Unknown error"
private const val STATUS_ACKNOWLEDGED = "ACKNOWLEDGED"
private const val STATUS_RESOLVED = "RESOLVED"

@HiltViewModel
public class ComplaintViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitComplaintUseCase,
        private val photoUploadUseCase: PhotoUploadUseCase,
        private val getStatusUseCase: GetComplaintStatusUseCase,
        private val reopenUseCase: ReopenComplaintUseCase,
        private val analytics: AnalyticsFacade,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<ComplaintUiState>(ComplaintUiState.Idle())
        public val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

        public fun loadStatus(bookingId: String) {
            viewModelScope.launch {
                getStatusUseCase(bookingId).collect { result ->
                    val existing = result.getOrNull()?.firstOrNull()
                    if (existing != null && _uiState.value is ComplaintUiState.Idle) {
                        _uiState.value =
                            ComplaintUiState.Success(
                                complaintId = existing.id,
                                acknowledgeDeadlineAt = existing.acknowledgeDeadlineAt,
                                status = existing.status ?: "NEW",
                                isAcknowledged = existing.status == STATUS_ACKNOWLEDGED,
                                isResolved = existing.status == STATUS_RESOLVED,
                            )
                    }
                }
            }
        }

        public fun onRetry() {
            _uiState.value = ComplaintUiState.Idle()
        }

        public fun onReasonSelected(reason: ComplaintReason) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            _uiState.value =
                current.copy(
                    selectedReason = reason,
                    submitEnabled = isSubmitEnabled(reason, current.description),
                )
        }

        public fun onDescriptionChanged(description: String) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            _uiState.value =
                current.copy(
                    description = description,
                    submitEnabled = isSubmitEnabled(current.selectedReason, description),
                )
        }

        public fun onPhotoSelected(
            localFilePath: String,
            bookingId: String,
        ) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            _uiState.value = ComplaintUiState.PhotoUploading
            viewModelScope.launch {
                val result = photoUploadUseCase(bookingId, localFilePath)
                _uiState.value =
                    current.copy(
                        photoStoragePath = result.getOrNull(),
                        submitEnabled = isSubmitEnabled(current.selectedReason, current.description),
                    )
            }
        }

        public fun onSubmit(bookingId: String) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            val reason = current.selectedReason ?: return
            _uiState.value = ComplaintUiState.Submitting
            viewModelScope.launch {
                submitUseCase(bookingId, reason, current.description, current.photoStoragePath)
                    .collect { result ->
                        _uiState.value =
                            result.fold(
                                onSuccess = { dto ->
                                    runCatching {
                                        analytics.track(
                                            AnalyticsEvents.COMPLAINT_FILED,
                                            mapOf("booking_id" to bookingId, "complaint_id" to dto.id),
                                        )
                                    }
                                    ComplaintUiState.Success(
                                        complaintId = dto.id,
                                        acknowledgeDeadlineAt = dto.acknowledgeDeadlineAt,
                                        status = dto.status ?: "NEW",
                                        isAcknowledged = dto.status == STATUS_ACKNOWLEDGED,
                                        isResolved = dto.status == STATUS_RESOLVED,
                                    )
                                },
                                onFailure = { e ->
                                    // error message surfaced via R.string.complaint_error_unknown in the UI layer
                                    ComplaintUiState.Error(e.message ?: UNKNOWN_ERROR_FALLBACK)
                                },
                            )
                    }
            }
        }

        public fun onReopen() {
            val current = _uiState.value as? ComplaintUiState.Success ?: return
            viewModelScope.launch {
                reopenUseCase(current.complaintId).collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { dto ->
                                ComplaintUiState.Success(
                                    complaintId = dto.id,
                                    acknowledgeDeadlineAt = dto.acknowledgeDeadlineAt,
                                    status = dto.status ?: "REOPENED",
                                    isAcknowledged = dto.status == STATUS_ACKNOWLEDGED,
                                    isResolved = dto.status == STATUS_RESOLVED,
                                )
                            },
                            onFailure = { e ->
                                ComplaintUiState.Error(e.message ?: UNKNOWN_ERROR_FALLBACK)
                            },
                        )
                }
            }
        }

        private fun isSubmitEnabled(
            reason: ComplaintReason?,
            description: String,
        ): Boolean = reason != null && description.length >= 10
    }
