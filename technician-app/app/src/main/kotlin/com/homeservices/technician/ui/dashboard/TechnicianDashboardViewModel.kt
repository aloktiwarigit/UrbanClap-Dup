package com.homeservices.technician.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.auth.model.AuthState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
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

        @OptIn(ExperimentalCoroutinesApi::class)
        public val pendingActions: StateFlow<List<PendingAction>> =
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
                }
                .stateIn(
                    scope = viewModelScope,
                    started = SharingStarted.WhileSubscribed(5_000),
                    initialValue = emptyList(),
                )

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
            public val DASHBOARD_ACTION_TYPES: Set<PendingActionType> = setOf(
                PendingActionType.JOB_OFFER,
                PendingActionType.RATING_PROMPT_TECHNICIAN,
                PendingActionType.RATING_RECEIVED,
                PendingActionType.EARNINGS_UPDATE,
            )

            /** [PendingActionPriority] ordinal mapping: HIGH=0, NORMAL=1, LOW=2. */
            @Suppress("UnusedPrivateProperty")
            private val PRIORITY_ORDER: Comparator<PendingAction> =
                compareBy { it.priority.ordinal }

            private const val THIRTY_DAYS_MS: Long = 30L * 24 * 60 * 60 * 1_000
        }
    }
