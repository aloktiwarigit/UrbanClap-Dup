package com.homeservices.customer.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class ProfileViewModel
    @Inject
    constructor(
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        val authState: StateFlow<AuthState> =
            sessionManager.authState.stateIn(
                viewModelScope,
                SharingStarted.WhileSubscribed(5_000),
                AuthState.Unauthenticated,
            )

        fun signOut() {
            viewModelScope.launch { sessionManager.clearSession() }
        }
    }
