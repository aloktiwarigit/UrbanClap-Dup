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
        val uploadedStoragePath: String? = null, // non-null = photo already uploaded; skip re-upload on retry
        val photoUploadInProgress: Boolean = false,
        val photoUploadError: String? = null,
        val showShieldSheet: Boolean = false,
        val shieldReportInProgress: Boolean = false,
        val shieldReportSuccess: Boolean = false,
        val shieldReportError: String? = null,
        /** True when the last MARK_REACHED call detected a mock/spoofed GPS location. */
        val mockLocationWarning: Boolean = false,
        /**
         * True when an active PHOTO_UPLOAD_PENDING row exists for this booking in
         * the local pending-actions Room table. Surfaces the retry banner above
         * the job content. E11-S05a.
         */
        val photoUploadPending: Boolean = false,
        /**
         * Transient UI flag — true when the technician has tapped Complete and the
         * confirmation dialog is open. Reset on confirm or cancel. Not persisted;
         * survives polling refresh by being preserved in [getActiveJob] collector.
         * E11-S05a.
         */
        val awaitingCompletionConfirm: Boolean = false,
    ) : ActiveJobUiState()

    public data class Completed(
        val bookingId: String = "",
    ) : ActiveJobUiState()

    public data class Error(
        val message: String,
    ) : ActiveJobUiState()
}
