package com.homeservices.customer.ui.tracking

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.sos.SosConsentStore
import com.homeservices.customer.domain.sos.SosUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class SosViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val sosUseCase: SosUseCase,
    private val consentStore: SosConsentStore,
    @ApplicationContext private val context: Context,
) : ViewModel() {

    private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])
    private val _sosUiState = MutableStateFlow<SosUiState>(SosUiState.Idle)
    public val sosUiState: StateFlow<SosUiState> = _sosUiState.asStateFlow()

    private var countdownJob: Job? = null

    public fun onSosTapped() {
        viewModelScope.launch {
            val consent = consentStore.getAudioConsent()
            if (consent == null) {
                _sosUiState.value = SosUiState.ShowConsent
            } else {
                startCountdown()
            }
        }
    }

    public fun onConsentResolved(granted: Boolean) {
        viewModelScope.launch {
            consentStore.setAudioConsent(granted)
            startCountdown()
        }
    }

    public fun onCancelCountdown() {
        countdownJob?.cancel()
        countdownJob = null
        _sosUiState.value = SosUiState.Idle
    }

    private fun startCountdown() {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            for (sec in 30 downTo 1) {
                _sosUiState.value = SosUiState.Countdown(sec)
                delay(1_000L)
            }
            fireSos()
        }
    }

    private suspend fun fireSos() {
        val result = sosUseCase.execute(bookingId)
        _sosUiState.value = if (result.isSuccess) {
            SosUiState.SosConfirmed
        } else {
            SosUiState.SosError(result.exceptionOrNull()?.message ?: "Unknown error")
        }
    }

    override fun onCleared() {
        super.onCleared()
        countdownJob?.cancel()
    }
}
