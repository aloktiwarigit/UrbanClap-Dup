package com.homeservices.technician.ui.myratings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.rating.GetMyRatingsSummaryUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class MyRatingsViewModel @Inject constructor(
    private val useCase: GetMyRatingsSummaryUseCase,
    private val ratingReceivedEventBus: RatingReceivedEventBus,
) : ViewModel() {
    private val _uiState = MutableStateFlow<MyRatingsUiState>(MyRatingsUiState.Loading)
    public val uiState: StateFlow<MyRatingsUiState> = _uiState.asStateFlow()

    init {
        loadRatings()
        viewModelScope.launch {
            ratingReceivedEventBus.events.collect { loadRatings() }
        }
    }

    public fun refresh(): Unit = loadRatings()

    private fun loadRatings() {
        viewModelScope.launch {
            _uiState.value = MyRatingsUiState.Loading
            _uiState.value = useCase.invoke().fold(
                onSuccess = { MyRatingsUiState.Success(it) },
                onFailure = { MyRatingsUiState.Error },
            )
        }
    }
}
