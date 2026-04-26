package com.homeservices.technician.ui.earnings

import com.homeservices.technician.domain.earnings.model.EarningsSummary

public sealed class EarningsUiState {
    public object Loading : EarningsUiState()
    public data class Success(val summary: EarningsSummary) : EarningsUiState()
    public object Error : EarningsUiState()
}
