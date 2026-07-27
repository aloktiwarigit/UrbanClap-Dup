package com.homeservices.technician.ui.jobOffer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.AcceptJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.DeclineJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Clock
import javax.inject.Inject

@HiltViewModel
internal class JobOfferViewModel
    @Inject
    constructor(
        private val eventBus: JobOfferEventBus,
        private val acceptUseCase: AcceptJobOfferUseCase,
        private val declineUseCase: DeclineJobOfferUseCase,
        private val clock: Clock,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<JobOfferUiState>(JobOfferUiState.Idle)
        public val uiState: StateFlow<JobOfferUiState> = _uiState.asStateFlow()

        private var countdownJob: Job? = null

        init {
            viewModelScope.launch {
                eventBus.events.collect { offer ->
                    startOffer(offer)
                }
            }
        }

        @Suppress("ReturnCount")
        public fun accept(): Unit {
            val current = _uiState.value as? JobOfferUiState.Offering ?: return
            if (current.isAccepting) return
            if (remainingSeconds(current.offer) <= 0) {
                expireOffer()
                return
            }
            countdownJob?.cancel()
            _uiState.value = current.copy(isAccepting = true, errorMessage = null)
            viewModelScope.launch {
                val result =
                    try {
                        acceptUseCase(current.offer.bookingId)
                    } catch (_: Exception) {
                        null
                    }
                when (result) {
                    is JobOfferResult.Accepted -> {
                        _uiState.value = JobOfferUiState.Accepted(result.bookingId)
                        eventBus.clearCurrentOffer()
                        scheduleReset(2_000L)
                    }
                    is JobOfferResult.Expired,
                    is JobOfferResult.Conflict,
                    -> {
                        _uiState.value = JobOfferUiState.Expired
                        eventBus.clearCurrentOffer()
                        scheduleReset(2_000L)
                    }
                    is JobOfferResult.Declined -> {
                        _uiState.value = JobOfferUiState.Declined
                        eventBus.clearCurrentOffer()
                        scheduleReset(2_000L)
                    }
                    is JobOfferResult.UnknownError -> {
                        startOffer(
                            offer = current.offer,
                            errorMessage = "Server error (${result.httpCode}). Try again.",
                        )
                    }
                    null -> {
                        if (remainingSeconds(current.offer) <= 0) {
                            expireOffer()
                        } else {
                            startOffer(
                                offer = current.offer,
                                errorMessage = "Could not accept job. Check your connection and try again.",
                            )
                        }
                    }
                }
            }
        }

        public fun decline(): Unit {
            val current = _uiState.value as? JobOfferUiState.Offering ?: return
            // Codex review MAJOR-1: never decline an offer that is mid-accept. accept() leaves the
            // state as Offering(isAccepting = true) while the use case is in flight, so a decline
            // arriving in that window — most easily via system back on the lock-screen Activity —
            // would fire a decline request for a booking the technician already chose to accept,
            // and whichever request resolved last would win.
            if (current.isAccepting) return
            countdownJob?.cancel()
            viewModelScope.launch {
                declineUseCase(current.offer.bookingId)
                _uiState.value = JobOfferUiState.Declined
                eventBus.clearCurrentOffer()
                scheduleReset(2_000L)
            }
        }

        private fun expireOffer(): Unit {
            countdownJob?.cancel()
            _uiState.value = JobOfferUiState.Expired
            eventBus.clearCurrentOffer()
            scheduleReset(2_000L)
        }

        private fun startOffer(
            offer: JobOffer,
            errorMessage: String? = null,
        ): Unit {
            countdownJob?.cancel()
            val initialSeconds = remainingSeconds(offer)
            if (initialSeconds <= 0) {
                expireOffer()
                return
            }
            _uiState.value =
                JobOfferUiState.Offering(
                    offer = offer,
                    remainingSeconds = initialSeconds,
                    errorMessage = errorMessage,
                )
            countdownJob =
                viewModelScope.launch {
                    @Suppress("LoopWithTooManyJumpStatements")
                    while (true) {
                        delay(1_000L)
                        val current = _uiState.value as? JobOfferUiState.Offering ?: break
                        if (current.offer.bookingId != offer.bookingId) break
                        val seconds = remainingSeconds(offer)
                        if (seconds <= 0) break
                        _uiState.value = current.copy(remainingSeconds = seconds)
                    }
                    val current = _uiState.value as? JobOfferUiState.Offering
                    if (current?.offer?.bookingId == offer.bookingId) {
                        expireOffer()
                    }
                }
        }

        private fun remainingSeconds(offer: JobOffer): Int {
            val deviceNowMs = clock.millis()
            val adjustedNowMs = maxOf(deviceNowMs, deviceNowMs + offer.serverClockOffsetMs)
            val remainingMs = offer.expiresAtMs - adjustedNowMs
            return ((remainingMs + MS_PER_SECOND - 1L) / MS_PER_SECOND).toInt().coerceAtLeast(0)
        }

        private fun scheduleReset(delayMs: Long): Unit {
            viewModelScope.launch {
                delay(delayMs)
                _uiState.value = JobOfferUiState.Idle
            }
        }

        private companion object {
            const val MS_PER_SECOND = 1_000L
        }
    }
