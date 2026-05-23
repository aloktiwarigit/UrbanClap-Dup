package com.homeservices.technician.ui.deleteaccount

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.R
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class DeleteAccountUiState {
    public object Idle : DeleteAccountUiState()

    public object ActiveJobBlocked : DeleteAccountUiState()

    public object Submitting : DeleteAccountUiState()

    public data class Error(
        val messageRes: Int,
    ) : DeleteAccountUiState()

    public data class Done(
        val scheduledDeletionAt: String,
    ) : DeleteAccountUiState()
}

@HiltViewModel
public class DeleteAccountViewModel
    @Inject
    constructor(
        private val submitErasureRequest: SubmitErasureRequestUseCase,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<DeleteAccountUiState>(DeleteAccountUiState.Idle)
        public val uiState: StateFlow<DeleteAccountUiState> = _uiState.asStateFlow()

        public fun onConfirmDelete() {
            _uiState.value = DeleteAccountUiState.Submitting
            viewModelScope.launch {
                val result = submitErasureRequest()
                if (result is ErasureSubmitResult.Success) {
                    // Persist a sign-out flag before updating UI so that if the user
                    // kills the app before pressing Done, the next launch signs them out.
                    sessionManager.markPendingDeletion()
                }
                _uiState.value =
                    when (result) {
                        is ErasureSubmitResult.Success ->
                            DeleteAccountUiState.Done(result.scheduledDeletionAt)
                        is ErasureSubmitResult.ActiveJobExists ->
                            DeleteAccountUiState.ActiveJobBlocked
                        is ErasureSubmitResult.DuplicatePending ->
                            DeleteAccountUiState.Error(R.string.delete_account_duplicate_pending)
                        is ErasureSubmitResult.UnknownError ->
                            DeleteAccountUiState.Error(R.string.delete_account_generic_error)
                    }
            }
        }

        public fun onDismissError() {
            _uiState.value = DeleteAccountUiState.Idle
        }
    }
