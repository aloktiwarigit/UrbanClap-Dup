package com.homeservices.technician.ui.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.auth.model.AuthState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Observes [PendingActionStore] for a queued KYC submission (E11-S05c).
 *
 * Exposes a single [kycSubmitQueued] flag that drives a small offline chip on
 * [OnboardingScreen] — a heads-up that "your KYC will be sent when you go online"
 * so the technician knows the app already captured the submission and is waiting
 * for connectivity.
 */
@HiltViewModel
public class OnboardingViewModel
    @Inject
    constructor(
        private val pendingActionStore: PendingActionStore,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _kycSubmitQueued = MutableStateFlow(false)
        public val kycSubmitQueued: StateFlow<Boolean> = _kycSubmitQueued.asStateFlow()

        init {
            @OptIn(ExperimentalCoroutinesApi::class)
            viewModelScope.launch {
                sessionManager.authState
                    .flatMapLatest { authState ->
                        when (authState) {
                            is AuthState.Authenticated ->
                                pendingActionStore
                                    .observeActive(authState.uid)
                                    .map { actions ->
                                        actions.any { it.type == PendingActionType.KYC_SUBMIT_PENDING }
                                    }
                            AuthState.Unauthenticated -> flowOf(false)
                        }
                    }.collect { _kycSubmitQueued.value = it }
            }
        }
    }
