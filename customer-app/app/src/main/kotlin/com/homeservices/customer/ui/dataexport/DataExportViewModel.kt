package com.homeservices.customer.ui.dataexport

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.dataexport.DataExportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import java.io.OutputStream
import javax.inject.Inject

private const val UNKNOWN_ERROR = "Unknown error"

/**
 * Abstraction over the SAF output-stream lookup, kept internal so tests can inject
 * a fake without depending on Android framework classes.
 *
 * Returns a ready [OutputStream], or null when the storage provider has revoked
 * access (triggers [DataExportUiState.Error] in [DataExportViewModel.saveToUri]).
 * The opener is expected to have a closure over the specific [Uri] it targets.
 */
internal fun interface UriStreamOpener {
    fun open(): OutputStream?
}

/** ViewModel for the data-export screen (E15-S01, DPDP §11). */
@HiltViewModel
public class DataExportViewModel
    @Inject
    constructor(
        private val repository: DataExportRepository,
    ) : ViewModel() {
        /**
         * IO dispatcher used by [saveToUri].  Defaults to [Dispatchers.IO] in
         * production; tests replace it with [StandardTestDispatcher] so that
         * [withContext] is driven by the test scheduler.
         *
         * Exposed as `internal` so unit tests in the same module can override it
         * without requiring a full Hilt binding.
         */
        internal var ioDispatcher: CoroutineDispatcher = Dispatchers.IO
        private val _uiState = MutableStateFlow<DataExportUiState>(DataExportUiState.Idle)
        public val uiState: StateFlow<DataExportUiState> = _uiState.asStateFlow()

        /**
         * Trigger a data-export request.
         *
         * State transitions:
         *   [Idle] → [Loading] (synchronous before coroutine runs)
         *   [Loading] → [Ready] on success
         *   [Loading] → [Error] on network / auth failure
         */
        public fun requestExport() {
            _uiState.value = DataExportUiState.Loading
            viewModelScope.launch {
                try {
                    repository.fetchExport().collect { result ->
                        _uiState.value =
                            result.fold(
                                onSuccess = { bytes -> DataExportUiState.Ready(bytes) },
                                onFailure = { e -> DataExportUiState.Error(e.message ?: UNKNOWN_ERROR) },
                            )
                    }
                } catch (e: IOException) {
                    _uiState.value = DataExportUiState.Error(e.message ?: UNKNOWN_ERROR)
                }
            }
        }

        /**
         * Called when the user cancels the SAF picker (back gesture / system cancel).
         *
         * The [DataExportUiState.Ready] state remains in memory but the screen must
         * return to [DataExportUiState.Idle] so the user can see the "Download" button
         * again and retry — rather than being stuck on a loading spinner.
         */
        public fun onSaveCancelled() {
            _uiState.value = DataExportUiState.Idle
        }

        /**
         * Write [bytes] to the SAF [uri] chosen by the user.
         *
         * Runs entirely on [ioDispatcher] (default: [Dispatchers.IO]) to avoid
         * blocking Main. Transitions to [DataExportUiState.Saved] on success or
         * [DataExportUiState.Error] when the storage provider returns a null output
         * stream (permission revoked) or when the write itself fails (e.g. no space).
         */
        public fun saveToUri(
            context: Context,
            uri: Uri,
            bytes: ByteArray,
        ) {
            saveToUri(uriString = uri.toString(), bytes = bytes) {
                context.contentResolver.openOutputStream(uri)
            }
        }

        /**
         * Testable overload — avoids Android framework classes ([Uri], [ContentResolver])
         * by accepting [uriString] and a [UriStreamOpener] lambda.
         *
         * Tests pass a fake opener returning an in-memory stream (success path) or
         * null / throwing (error paths).  Production code should use the public
         * [saveToUri(Context, Uri, ByteArray)] overload.
         */
        internal fun saveToUri(
            uriString: String,
            bytes: ByteArray,
            opener: UriStreamOpener,
        ) {
            viewModelScope.launch {
                val result =
                    withContext(ioDispatcher) {
                        runCatching {
                            opener.open()?.use { it.write(bytes) }
                                ?: throw IOException("Storage provider returned null output stream")
                        }
                    }
                result.fold(
                    onSuccess = { _uiState.value = DataExportUiState.Saved(uriString) },
                    onFailure = { e ->
                        _uiState.value = DataExportUiState.Error(e.localizedMessage ?: UNKNOWN_ERROR)
                    },
                )
            }
        }

        /** Called after the SAF write completes successfully. Resets state to [Idle]. */
        public fun onSaved() {
            _uiState.value = DataExportUiState.Idle
        }

        /** Called when the user taps "Retry" from the [Error] state. */
        public fun onRetry() {
            _uiState.value = DataExportUiState.Idle
        }
    }
