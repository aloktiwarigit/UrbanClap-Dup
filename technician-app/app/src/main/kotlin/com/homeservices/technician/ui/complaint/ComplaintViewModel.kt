package com.homeservices.technician.ui.complaint

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.technician.domain.complaint.PhotoUploadUseCase
import com.homeservices.technician.domain.complaint.SubmitComplaintUseCase
import com.homeservices.technician.domain.complaint.TechComplaintReason
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class ComplaintUiState {
    public data class Idle(
        val selectedReason: TechComplaintReason? = null,
        val description: String = "",
        val photoStoragePath: String? = null,
        val submitEnabled: Boolean = false,
    ) : ComplaintUiState()

    public data object PhotoUploading : ComplaintUiState()

    public data object Submitting : ComplaintUiState()

    public data class Success(
        val complaintId: String,
        val acknowledgeDeadlineAt: String?,
    ) : ComplaintUiState()

    public data class Error(
        val message: String,
    ) : ComplaintUiState()
}

@HiltViewModel
public class ComplaintViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitComplaintUseCase,
        private val photoUploadUseCase: PhotoUploadUseCase,
        private val getStatusUseCase: GetComplaintStatusUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<ComplaintUiState>(ComplaintUiState.Idle())
        public val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

        public fun onReasonSelected(reason: TechComplaintReason) {
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
                                    ComplaintUiState.Success(
                                        complaintId = dto.id,
                                        acknowledgeDeadlineAt = dto.acknowledgeDeadlineAt,
                                    )
                                },
                                onFailure = { e ->
                                    ComplaintUiState.Error(e.message ?: "Unknown error")
                                },
                            )
                    }
            }
        }

        private fun isSubmitEnabled(
            reason: TechComplaintReason?,
            description: String,
        ): Boolean = reason != null && description.length >= 10
    }
