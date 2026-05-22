package com.homeservices.customer.ui.consent

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.consent.GrantConsentUseCase
import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class ConsentViewModel
    @Inject
    constructor(
        private val grantConsentUseCase: GrantConsentUseCase,
        @Suppress("UnusedPrivateMember")
        private val isConsentRequiredUseCase: IsConsentRequiredUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow(ConsentUiState())
        public val uiState: StateFlow<ConsentUiState> = _uiState.asStateFlow()

        private val _navigateNext = Channel<Unit>(Channel.BUFFERED)
        public val navigateNext: Flow<Unit> = _navigateNext.receiveAsFlow()

        public fun toggleAnalytics(value: Boolean) {
            _uiState.update { it.copy(analyticsOptIn = value) }
        }

        public fun toggleCrash(value: Boolean) {
            _uiState.update { it.copy(crashOptIn = value) }
        }

        public fun toggleMarketing(value: Boolean) {
            _uiState.update { it.copy(marketingOptIn = value) }
        }

        @Suppress("TooGenericExceptionCaught")
        public fun onConfirm() {
            val state = _uiState.value
            viewModelScope.launch {
                _uiState.update { it.copy(isLoading = true, error = null) }
                try {
                    grantConsentUseCase(
                        analyticsOptIn = state.analyticsOptIn,
                        crashOptIn = state.crashOptIn,
                        marketingOptIn = state.marketingOptIn,
                    )
                    _navigateNext.send(Unit)
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    _uiState.update { it.copy(error = e.message ?: "Unknown error") }
                } finally {
                    _uiState.update { it.copy(isLoading = false) }
                }
            }
        }

        @Suppress("TooGenericExceptionCaught")
        public fun onDeclineAll() {
            viewModelScope.launch {
                _uiState.update { it.copy(isLoading = true, error = null) }
                try {
                    grantConsentUseCase(
                        analyticsOptIn = false,
                        crashOptIn = false,
                        marketingOptIn = false,
                    )
                    _navigateNext.send(Unit)
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    _uiState.update { it.copy(error = e.message ?: "Unknown error") }
                } finally {
                    _uiState.update { it.copy(isLoading = false) }
                }
            }
        }
    }
