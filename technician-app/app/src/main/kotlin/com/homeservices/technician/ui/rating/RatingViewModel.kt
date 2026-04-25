package com.homeservices.technician.ui.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.rating.GetTechRatingUseCase
import com.homeservices.technician.domain.rating.SubmitTechRatingUseCase
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import com.homeservices.technician.domain.rating.model.TechSubScores
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class RatingUiState {
    public object Loading : RatingUiState()

    public data class Editing(
        val snapshot: RatingSnapshot?,
    ) : RatingUiState()

    public object Submitting : RatingUiState()

    public data class AwaitingPartner(
        val snapshot: RatingSnapshot?,
    ) : RatingUiState()

    public data class Revealed(
        val snapshot: RatingSnapshot,
    ) : RatingUiState()

    public data class Error(
        val message: String,
    ) : RatingUiState()
}

@HiltViewModel
public class RatingViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitTechRatingUseCase,
        private val getUseCase: GetTechRatingUseCase,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        public val bookingId: String =
            savedStateHandle.get<String>("bookingId") ?: error("bookingId required")

        private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
        public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

        private val _overall = MutableStateFlow(0)
        public val overall: StateFlow<Int> = _overall.asStateFlow()

        private val _behaviour = MutableStateFlow(0)
        public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()

        private val _communication = MutableStateFlow(0)
        public val communication: StateFlow<Int> = _communication.asStateFlow()

        private val _comment = MutableStateFlow("")
        public val comment: StateFlow<String> = _comment.asStateFlow()

        private val _canSubmit = MutableStateFlow(false)
        public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()

        init {
            viewModelScope.launch {
                getUseCase.invoke(bookingId).collect { result ->
                    result
                        .onSuccess { snap ->
                            _uiState.value =
                                when {
                                    snap.status == RatingSnapshot.Status.REVEALED ->
                                        RatingUiState.Revealed(snap)
                                    snap.techSide is SideState.Submitted ->
                                        RatingUiState.AwaitingPartner(snap)
                                    else -> RatingUiState.Editing(snap)
                                }
                        }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
                }
            }
        }

        public fun setOverall(stars: Int) {
            _overall.value = stars
            recompute()
        }

        public fun setBehaviour(stars: Int) {
            _behaviour.value = stars
            recompute()
        }

        public fun setCommunication(stars: Int) {
            _communication.value = stars
            recompute()
        }

        public fun setComment(text: String) {
            _comment.value = text.take(500)
        }

        private fun recompute() {
            _canSubmit.value =
                overall.value in 1..5 &&
                behaviour.value in 1..5 &&
                communication.value in 1..5
        }

        public fun submit() {
            if (!_canSubmit.value) return
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase
                    .invoke(
                        bookingId = bookingId,
                        overall = overall.value,
                        subScores = TechSubScores(behaviour.value, communication.value),
                        comment = comment.value.ifBlank { null },
                    ).collect { result ->
                        result
                            .onSuccess { _uiState.value = RatingUiState.AwaitingPartner(null) }
                            .onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                    }
            }
        }
    }
