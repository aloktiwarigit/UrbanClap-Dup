package com.homeservices.technician.ui.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob

public enum class ActiveJobAction {
    START_TRIP,
    MARK_ARRIVED,
    START_WORK,
    COMPLETE_JOB,
    NONE,
}

public sealed class ActiveJobUiState {
    public data object Loading : ActiveJobUiState()

    public data class Active(
        val job: ActiveJob,
        val availableAction: ActiveJobAction,
        val hasPendingTransitions: Boolean = false,
        val pendingPhotoStage: String? = null,
        val photoUploadInProgress: Boolean = false,
        val photoUploadError: String? = null,
    ) : ActiveJobUiState()

    public data object Completed : ActiveJobUiState()

    public data class Error(
        val message: String,
    ) : ActiveJobUiState()
}
