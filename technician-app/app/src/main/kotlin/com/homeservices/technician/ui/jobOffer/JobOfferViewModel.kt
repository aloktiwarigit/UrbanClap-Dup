package com.homeservices.technician.ui.jobOffer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.AcceptJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.DeclineJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class JobOfferViewModel @Inject constructor(
    private val eventBus: JobOfferEventBus,
    private val acceptUseCase: AcceptJobOfferUseCase,
    private val declineUseCase: DeclineJobOfferUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow<JobOfferUiState>(JobOfferUiState.Idle)
    public val uiState: StateFlow<JobOfferUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null

    init {
        viewModelScope.launch {
            eventBus.events.collect { offer ->
                countdownJob?.cancel()
                val remainingMs = offer.expiresAtMs - System.currentTimeMillis()
                if (remainingMs <= 0) {
                    _uiState.value = JobOfferUiState.Expired
                    scheduleReset(2_000L)
                    return@collect
                }
                val initialSeconds = (remainingMs / 1000).toInt().coerceAtLeast(0)
                _uiState.value = JobOfferUiState.Offering(offer, initialSeconds)
                countdownJob = viewModelScope.launch {
                    var seconds = initialSeconds
                    while (seconds > 0) {
                        delay(1_000L)
                        seconds--
                        val current = _uiState.value
                        if (current is JobOfferUiState.Offering) {
                            _uiState.value = current.copy(remainingSeconds = seconds)
                        } else {
                            break
                        }
                    }
                    if (_uiState.value is JobOfferUiState.Offering) {
                        _uiState.value = JobOfferUiState.Expired
                        scheduleReset(2_000L)
                    }
                }
            }
        }
    }

    public fun accept(): Unit {
        val current = _uiState.value as? JobOfferUiState.Offering ?: return
        countdownJob?.cancel()
        viewModelScope.launch {
            val result = try {
                acceptUseCase(current.offer.bookingId)
            } catch (_: Exception) {
                JobOfferResult.Expired(current.offer.bookingId)
            }
            _uiState.value = when (result) {
                is JobOfferResult.Accepted -> JobOfferUiState.Accepted
                is JobOfferResult.Expired -> JobOfferUiState.Expired
                is JobOfferResult.Declined -> JobOfferUiState.Declined
            }
            scheduleReset(2_000L)
        }
    }

    public fun decline(): Unit {
        val current = _uiState.value as? JobOfferUiState.Offering ?: return
        countdownJob?.cancel()
        viewModelScope.launch {
            declineUseCase(current.offer.bookingId)
            _uiState.value = JobOfferUiState.Declined
            scheduleReset(2_000L)
        }
    }

    private fun scheduleReset(delayMs: Long): Unit {
        viewModelScope.launch {
            delay(delayMs)
            _uiState.value = JobOfferUiState.Idle
        }
    }
}
