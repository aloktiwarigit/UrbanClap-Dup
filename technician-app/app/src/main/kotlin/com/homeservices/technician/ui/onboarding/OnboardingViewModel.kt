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
 *
 * Treats both [PendingActionType.KYC_SUBMIT_PENDING] (optimistic submission marker
 * written when the upload starts) and [PendingActionType.PHOTO_UPLOAD_RETRY]
 * (failure-mode marker written when the upload fails) as "submission queued":
 * either state tells the technician that work is outstanding and that going
 * online will resume it.
 *
 * Note (E11-S05c follow-up): [OnboardingScreen] is currently not composed into
 * the technician onboarding nav graph (which starts at `service_selection`). The
 * chip is in place and correctly fed; wiring the screen into navigation is
 * tracked separately.
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
                                    .map { actions -> actions.any { it.type in QUEUED_TYPES } }
                            AuthState.Unauthenticated -> flowOf(false)
                        }
                    }.collect { _kycSubmitQueued.value = it }
            }
        }

        public companion object {
            /** PendingAction types that map to the "KYC submission queued" indicator. */
            public val QUEUED_TYPES: Set<PendingActionType> =
                setOf(
                    PendingActionType.KYC_SUBMIT_PENDING,
                    PendingActionType.PHOTO_UPLOAD_RETRY,
                )
        }
    }
