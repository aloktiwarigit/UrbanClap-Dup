package com.homeservices.customer.ui.wallet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.wallet.GetWalletBalanceUseCase
import com.homeservices.customer.domain.wallet.GetWalletLedgerUseCase
import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.WalletBalance
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** UI state for wallet balance. */
public sealed interface WalletBalanceUiState {
    public data object Loading : WalletBalanceUiState

    public data class Ready(
        val balance: WalletBalance,
    ) : WalletBalanceUiState

    public data object Error : WalletBalanceUiState
}

/** UI state for wallet ledger. */
public sealed interface LedgerUiState {
    public data object Loading : LedgerUiState

    public data class Ready(
        val entries: List<LedgerEntry>,
    ) : LedgerUiState

    public data object Error : LedgerUiState
}

@HiltViewModel
public class WalletViewModel
    @Inject
    public constructor(
        private val getBalance: GetWalletBalanceUseCase,
        private val getLedger: GetWalletLedgerUseCase,
    ) : ViewModel() {
        private val _balanceState = MutableStateFlow<WalletBalanceUiState>(WalletBalanceUiState.Loading)
        public val balanceState: StateFlow<WalletBalanceUiState> = _balanceState.asStateFlow()

        private val _ledgerState = MutableStateFlow<LedgerUiState>(LedgerUiState.Loading)
        public val ledgerState: StateFlow<LedgerUiState> = _ledgerState.asStateFlow()

        init {
            load()
        }

        public fun retry() {
            _balanceState.value = WalletBalanceUiState.Loading
            _ledgerState.value = LedgerUiState.Loading
            load()
        }

        private fun load() {
            viewModelScope.launch {
                getBalance().collect { result ->
                    _balanceState.value =
                        result.fold(
                            onSuccess = { WalletBalanceUiState.Ready(it) },
                            onFailure = { WalletBalanceUiState.Error },
                        )
                }
            }
            viewModelScope.launch {
                getLedger().collect { result ->
                    _ledgerState.value =
                        result.fold(
                            onSuccess = { LedgerUiState.Ready(it) },
                            onFailure = { LedgerUiState.Error },
                        )
                }
            }
        }
    }
