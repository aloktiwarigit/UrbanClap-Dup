package com.homeservices.technician.ui.myratings

import com.homeservices.technician.domain.rating.model.TechRatingSummary

public sealed class MyRatingsUiState {
    public object Loading : MyRatingsUiState()

    public data class Success(
        val summary: TechRatingSummary,
    ) : MyRatingsUiState()

    public object Error : MyRatingsUiState()
}

public sealed class AppealState {
    public object Idle : AppealState()

    public data class Loading(
        val bookingId: String,
    ) : AppealState()

    public object Success : AppealState()

    public data class QuotaExceeded(
        val nextAvailableAt: String?,
    ) : AppealState()

    public object Error : AppealState()
}
