package com.homeservices.customer.ui.dataexport

/** UI state for the data-export screen. */
public sealed class DataExportUiState {
    /** No export in progress — ready for the user to initiate a download. */
    public data object Idle : DataExportUiState()

    /** Export request is in-flight. */
    public data object Loading : DataExportUiState()

    /**
     * Export succeeded.
     *
     * [jsonBytes] carries the raw JSON that must be written to a file chosen via the
     * Storage Access Framework.  Call [DataExportViewModel.onSaved] after the write
     * completes so the screen resets to [Idle].
     */
    public data class Ready(
        val jsonBytes: ByteArray,
    ) : DataExportUiState()

    /**
     * SAF write completed successfully.
     *
     * [filePath] is the URI string of the file that was written, useful for
     * snackbar confirmation or analytics.  The screen shows a success snackbar
     * then resets to [Idle].
     */
    public data class Saved(
        val filePath: String,
    ) : DataExportUiState()

    /**
     * Export failed — either the network request or the SAF write.
     *
     * [message] is a localised or technical description of the failure,
     * surfaced in the UI via [R.string.data_export_error_unknown].
     */
    public data class Error(
        val message: String,
    ) : DataExportUiState()
}
