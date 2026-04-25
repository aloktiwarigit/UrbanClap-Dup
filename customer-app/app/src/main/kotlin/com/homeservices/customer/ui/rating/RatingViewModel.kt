package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class RatingShieldState {
    public object Idle : RatingShieldState()

    public object ShowDialog : RatingShieldState()

    public data class Escalated(
        val expiresAtMs: Long,
    ) : RatingShieldState()
}

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
        private val submitUseCase: SubmitRatingUseCase,
        private val getUseCase: GetRatingUseCase,
        private val escalateUseCase: EscalateRatingUseCase,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        public val bookingId: String =
            savedStateHandle.get<String>("bookingId") ?: error("bookingId required")

        private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
        public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

        private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
        public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()

        private val _overall = MutableStateFlow(0)
        public val overall: StateFlow<Int> = _overall.asStateFlow()

        private val _punctuality = MutableStateFlow(0)
        public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()

        private val _skill = MutableStateFlow(0)
        public val skill: StateFlow<Int> = _skill.asStateFlow()

        private val _behaviour = MutableStateFlow(0)
        public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()

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
                                    snap.status == RatingSnapshot.Status.REVEALED -> RatingUiState.Revealed(snap)
                                    snap.customerSide is SideState.Submitted -> RatingUiState.AwaitingPartner(snap)
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

        public fun setPunctuality(stars: Int) {
            _punctuality.value = stars
            recompute()
        }

        public fun setSkill(stars: Int) {
            _skill.value = stars
            recompute()
        }

        public fun setBehaviour(stars: Int) {
            _behaviour.value = stars
            recompute()
        }

        public fun setComment(text: String) {
            _comment.value = text.take(500)
        }

        private fun recompute() {
            _canSubmit.value =
                overall.value in 1..5 &&
                punctuality.value in 1..5 &&
                skill.value in 1..5 &&
                behaviour.value in 1..5
        }

        public fun submit() {
            if (!_canSubmit.value) return
            if (overall.value <= 2 && _shieldState.value == RatingShieldState.Idle) {
                _shieldState.value = RatingShieldState.ShowDialog
                return
            }
            doSubmit()
        }

        public fun onSkipShield() {
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onPostAnyway() {
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onEscalate() {
            viewModelScope.launch {
                val result =
                    escalateUseCase.invoke(
                        bookingId = bookingId,
                        draftOverall = overall.value,
                        draftComment = comment.value.ifBlank { null },
                    )
                result
                    .onSuccess { r ->
                        _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
                        startCountdown(r.expiresAtMs)
                    }.onFailure {
                        _shieldState.value = RatingShieldState.Idle
                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
                    }
            }
        }

        private fun startCountdown(expiresAtMs: Long) {
            viewModelScope.launch {
                val remaining = expiresAtMs - System.currentTimeMillis()
                if (remaining > 0) delay(remaining)
                onPostAnyway()
            }
        }

        private fun doSubmit() {
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase
                    .invoke(
                        bookingId = bookingId,
                        overall = overall.value,
                        subScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value),
                        comment = comment.value.ifBlank { null },
                    ).collect { result ->
                        result
                            .onSuccess { _uiState.value = RatingUiState.AwaitingPartner(null) }
                            .onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                    }
            }
        }
    }
