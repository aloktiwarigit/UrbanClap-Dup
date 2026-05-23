package com.homeservices.customer.ui.booking

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.auth.model.BiometricResult
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
        private val biometricGate: BiometricGateUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<PriceApprovalUiState>(PriceApprovalUiState.Loading)
        public val uiState: StateFlow<PriceApprovalUiState> = _uiState.asStateFlow()

        private var pendingApprovalSnapshot: PriceApprovalUiState.PendingApproval? = null

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

        /**
         * Security gate (fires every call, no caching):
         * - null activity: fail closed, show error.
         * - canUseBiometric=true: require Authenticated; Cancelled/Lockout silently block.
         * - canUseBiometric=false: skip gate, proceed.
         */
        public fun submitDecisions(
            bookingId: String,
            decisions: List<AddOnDecision>,
            activity: FragmentActivity?,
        ) {
            if (activity == null) {
                _uiState.value = PriceApprovalUiState.Error("Authentication context unavailable")
                return
            }
            viewModelScope.launch {
                if (biometricGate.canUseBiometric(activity)) {
                    pendingApprovalSnapshot = _uiState.value as? PriceApprovalUiState.PendingApproval
                    _uiState.value = PriceApprovalUiState.BiometricPending
                    val result =
                        biometricGate.requestAuth(
                            activity,
                            "Confirm Price Approval",
                            "Authenticate to approve add-on charges",
                        )
                    if (result !is BiometricResult.Authenticated) {
                        _uiState.value =
                            pendingApprovalSnapshot
                                ?: PriceApprovalUiState.Error("Biometric authentication failed")
                        return@launch
                    }
                }
                dispatchApproval(bookingId, decisions)
            }
        }

        private suspend fun dispatchApproval(
            bookingId: String,
            decisions: List<AddOnDecision>,
        ) {
            approveFinalPrice(bookingId, decisions).collect { result ->
                _uiState.value =
                    result.fold(
                        onSuccess = { PriceApprovalUiState.Approved(it) },
                        onFailure = { PriceApprovalUiState.Error(it.message ?: "Approval failed") },
                    )
            }
        }
    }
