package com.homeservices.technician.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingAction
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
 * Observes [PendingActionStore] for dashboard-relevant pending actions (E11-S04).
 *
 * Filtered to [DASHBOARD_ACTION_TYPES]; sorted HIGH priority first, then by createdAt asc.
 * [reconcile] purges local TTL-expired and 30-day tombstone rows on screen resume.
 *
 * Note: server-side reconciliation via PendingActionIngestor.reconcile() is deferred until
 * the GET /v1/technicians/me/pending-actions endpoint is available (tracked follow-up).
 */
@HiltViewModel
public class TechnicianDashboardViewModel
    @Inject
    constructor(
        private val pendingActionStore: PendingActionStore,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _pendingActions = MutableStateFlow<List<PendingAction>>(emptyList())
        public val pendingActions: StateFlow<List<PendingAction>> = _pendingActions.asStateFlow()

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
                                        actions
                                            .filter { it.type in DASHBOARD_ACTION_TYPES }
                                            .sortedWith(
                                                compareBy<PendingAction> { it.priority.ordinal }
                                                    .thenBy { it.createdAt },
                                            )
                                    }
                            AuthState.Unauthenticated -> flowOf(emptyList())
                        }
                    }.collect { _pendingActions.value = it }
            }
        }

        /** Purges TTL-expired and 30-day-old resolved rows from the local Room table. */
        public fun reconcile() {
            viewModelScope.launch {
                val now = System.currentTimeMillis()
                pendingActionStore.purgeExpired(now)
                pendingActionStore.purgeTombstones(now - THIRTY_DAYS_MS)
            }
        }

        public companion object {
            /** Dashboard-relevant pending action types for technician home screen. */
            public val DASHBOARD_ACTION_TYPES: Set<PendingActionType> =
                setOf(
                    PendingActionType.JOB_OFFER,
                    PendingActionType.RATING_PROMPT_TECHNICIAN,
                    PendingActionType.RATING_RECEIVED,
                    PendingActionType.EARNINGS_UPDATE,
                )

            private const val THIRTY_DAYS_MS: Long = 30L * 24 * 60 * 60 * 1_000
        }
    }
