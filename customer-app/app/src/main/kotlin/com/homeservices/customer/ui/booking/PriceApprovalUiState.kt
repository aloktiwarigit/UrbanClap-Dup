package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.booking.model.PendingAddOn

public sealed class PriceApprovalUiState {
    public data object Loading : PriceApprovalUiState()

    public data class PendingApproval(
        public val bookingId: String,
        public val addOns: List<PendingAddOn>,
        public val decisions: Map<String, Boolean> = emptyMap(),
    ) : PriceApprovalUiState()

    public data class Approved(
        public val finalAmount: Int,
    ) : PriceApprovalUiState()

    public data class Error(
        public val message: String,
    ) : PriceApprovalUiState()
}
