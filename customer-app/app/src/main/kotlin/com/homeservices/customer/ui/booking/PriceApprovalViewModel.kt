package com.homeservices.customer.ui.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.booking.ApproveFinalPriceUseCase
import com.homeservices.customer.domain.booking.GetPendingAddOnsUseCase
import com.homeservices.customer.domain.booking.model.AddOnDecision
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class PriceApprovalViewModel
    @Inject
    constructor(
        private val getPendingAddOns: GetPendingAddOnsUseCase,
        private val approveFinalPrice: ApproveFinalPriceUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<PriceApprovalUiState>(PriceApprovalUiState.Loading)
        public val uiState: StateFlow<PriceApprovalUiState> = _uiState.asStateFlow()

        public fun loadAddOns(bookingId: String) {
            viewModelScope.launch {
                getPendingAddOns(bookingId).collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { addOns -> PriceApprovalUiState.PendingApproval(bookingId, addOns) },
                            onFailure = { PriceApprovalUiState.Error(it.message ?: "Failed to load add-ons") },
                        )
                }
            }
        }

        public fun submitDecisions(
            bookingId: String,
            decisions: List<AddOnDecision>,
        ) {
            viewModelScope.launch {
                approveFinalPrice(bookingId, decisions).collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { PriceApprovalUiState.Approved(it) },
                            onFailure = { PriceApprovalUiState.Error(it.message ?: "Approval failed") },
                        )
                }
            }
        }
    }
