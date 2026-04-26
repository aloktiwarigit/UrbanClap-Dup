package com.homeservices.technician.ui.myratings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.rating.GetMyRatingsSummaryUseCase
import com.homeservices.technician.domain.shield.FileRatingAppealUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class MyRatingsViewModel
    @Inject
    constructor(
        private val useCase: GetMyRatingsSummaryUseCase,
        private val ratingReceivedEventBus: RatingReceivedEventBus,
        private val fileRatingAppealUseCase: FileRatingAppealUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<MyRatingsUiState>(MyRatingsUiState.Loading)
        public val uiState: StateFlow<MyRatingsUiState> = _uiState.asStateFlow()

        private val _appealState = MutableStateFlow<AppealState>(AppealState.Idle)
        public val appealState: StateFlow<AppealState> = _appealState.asStateFlow()

        init {
            loadRatings()
            viewModelScope.launch {
                ratingReceivedEventBus.events.collect { loadRatings() }
            }
        }

        public fun refresh(): Unit = loadRatings()

        public fun fileRatingAppeal(
            bookingId: String,
            reason: String,
        ) {
            viewModelScope.launch {
                _appealState.value = AppealState.Loading(bookingId)
                val result = fileRatingAppealUseCase.invoke(bookingId, reason)
                _appealState.value =
                    result.fold(
                        onSuccess = { r ->
                            if (r.quotaExceeded) {
                                AppealState.QuotaExceeded(r.nextAvailableAt)
                            } else {
                                AppealState.Success
                            }
                        },
                        onFailure = { AppealState.Error },
                    )
            }
        }

        public fun consumeAppealState() {
            _appealState.value = AppealState.Idle
        }

        private fun loadRatings() {
            viewModelScope.launch {
                _uiState.value = MyRatingsUiState.Loading
                _uiState.value =
                    useCase.invoke().fold(
                        onSuccess = { MyRatingsUiState.Success(it) },
                        onFailure = { MyRatingsUiState.Error },
                    )
            }
        }
    }
