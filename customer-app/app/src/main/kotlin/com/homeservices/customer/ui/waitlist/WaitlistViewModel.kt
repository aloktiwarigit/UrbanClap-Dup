package com.homeservices.customer.ui.waitlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.waitlist.RateLimitedException
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.waitlist.JoinWaitlistUseCase
import com.homeservices.customer.domain.waitlist.WaitlistRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Indian mobile number: +91 followed by a digit 6-9 and nine more digits. */
private val PHONE_REGEX = Regex("""^\+91[6-9]\d{9}$""")

@HiltViewModel
public class WaitlistViewModel @Inject constructor(
    private val joinWaitlist: JoinWaitlistUseCase,
    private val sessionManager: SessionManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow<WaitlistUiState>(
        WaitlistUiState.Form(phone = "", isPhoneValid = false),
    )
    public val uiState: StateFlow<WaitlistUiState> = _uiState.asStateFlow()

    init {
        // SessionManager stores only phoneLastFour — full phone number unavailable for pre-fill.
        // Guard unauthenticated edge-case: if the user somehow lands here without a session, show error.
        val authState = sessionManager.authState.value
        if (authState is AuthState.Unauthenticated) {
            _uiState.value = WaitlistUiState.Error(
                reason = "Session expired. Please sign in again.",
                retryable = false,
            )
        }
    }

    /** Update the phone field and validate it. Safe to call from any thread. */
    public fun onPhoneChange(phone: String) {
        _uiState.value = WaitlistUiState.Form(
            phone = phone,
            isPhoneValid = PHONE_REGEX.matches(phone),
        )
    }

    /**
     * Submit the waitlist join request.
     *
     * - Validates phone format first; emits [WaitlistUiState.Error] (non-retryable) if invalid.
     * - Emits [WaitlistUiState.Submitting] while the API call is in-flight.
     * - On success → [WaitlistUiState.Confirmed].
     * - On HTTP 429 → [WaitlistUiState.RateLimited] with the retry-after value.
     * - On any other failure → [WaitlistUiState.Error] (retryable).
     */
    public fun onSubmit(lat: Double, lng: Double, serviceId: String) {
        val current = _uiState.value as? WaitlistUiState.Form
            ?: return // ignore if already submitting/confirmed

        if (!current.isPhoneValid) {
            _uiState.value = WaitlistUiState.Error(
                reason = "Please enter a valid Indian mobile number (+91XXXXXXXXXX).",
                retryable = false,
            )
            return
        }

        val phone = current.phone
        viewModelScope.launch {
            _uiState.value = WaitlistUiState.Submitting
            val result = joinWaitlist.invoke(
                WaitlistRequest(
                    phone = phone,
                    lat = lat,
                    lng = lng,
                    serviceId = serviceId,
                ),
            )
            _uiState.value = result.fold(
                onSuccess = { WaitlistUiState.Confirmed },
                onFailure = { throwable ->
                    when (throwable) {
                        is RateLimitedException ->
                            WaitlistUiState.RateLimited(retryAfterSec = throwable.retryAfterSec)
                        else ->
                            WaitlistUiState.Error(
                                reason = throwable.message ?: "Something went wrong.",
                                retryable = true,
                            )
                    }
                },
            )
        }
    }
}
