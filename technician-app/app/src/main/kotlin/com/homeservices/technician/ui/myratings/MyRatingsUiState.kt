package com.homeservices.technician.ui.myratings

import com.homeservices.technician.domain.rating.model.TechRatingSummary

public sealed class MyRatingsUiState {
    public object Loading : MyRatingsUiState()
    public data class Success(val summary: TechRatingSummary) : MyRatingsUiState()
    public object Error : MyRatingsUiState()
}
