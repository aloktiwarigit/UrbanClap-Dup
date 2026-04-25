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
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class RatingShieldState {
    public object Idle : RatingShieldState()

    public object ShowDialog : RatingShieldState()

    /** API call in flight — sheet buttons disabled to prevent double-tap race. */
    public object Escalating : RatingShieldState()

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
        private val savedStateHandle: SavedStateHandle,
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

        // Snapshot of the full rating at the moment escalation was sent to the owner.
        // doSubmit() uses these values (not the live flows) when shieldState is Escalated,
        // so the public rating always matches the draft the owner reviewed.
        private data class EscalatedDraft(
            val overall: Int,
            val subScores: CustomerSubScores,
            val comment: String?,
        )

        private var escalatedDraft: EscalatedDraft? = null

        // Held so onPostAnyway() / onSkipShield() can cancel the auto-post before it fires.
        private var countdownJob: Job? = null

        init {
            // Restore full shield state from SavedStateHandle after OS-initiated process death.
            // Without the draft, the auto-post would submit default (zero-star) values.
            val savedExpiry = savedStateHandle.get<Long>("shieldExpiresAtMs")
            if (savedExpiry != null && savedExpiry > System.currentTimeMillis()) {
                val dOverall = savedStateHandle.get<Int>("shieldDraftOverall") ?: 0
                val dPunct = savedStateHandle.get<Int>("shieldDraftPunct") ?: 0
                val dSkill = savedStateHandle.get<Int>("shieldDraftSkill") ?: 0
                val dBehav = savedStateHandle.get<Int>("shieldDraftBehav") ?: 0
                val dComment = savedStateHandle.get<String>("shieldDraftComment")?.ifBlank { null }
                if (dOverall > 0) {
                    _overall.value = dOverall
                    _punctuality.value = dPunct
                    _skill.value = dSkill
                    _behaviour.value = dBehav
                    dComment?.let { _comment.value = it }
                    recompute()
                    escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill, dBehav), dComment)
                }
                _shieldState.value = RatingShieldState.Escalated(savedExpiry)
                startCountdown(savedExpiry)
            }

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

        public fun onDismissShieldDialog() {
            if (_shieldState.value == RatingShieldState.Escalating) return // ignore dismiss during in-flight call
            _shieldState.value = RatingShieldState.Idle
            // Intentionally does NOT submit — scrim tap / back gesture is not an opt-out.
        }

        public fun onSkipShield() {
            countdownJob?.cancel()
            countdownJob = null
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onPostAnyway() {
            countdownJob?.cancel()
            countdownJob = null
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onEscalate() {
            if (_shieldState.value != RatingShieldState.ShowDialog) return // guard re-entrant / double-tap
            _shieldState.value = RatingShieldState.Escalating
            val capturedOverall = overall.value
            val capturedSubScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value)
            val capturedComment = comment.value.ifBlank { null }
            viewModelScope.launch {
                val result =
                    escalateUseCase.invoke(
                        bookingId = bookingId,
                        draftOverall = capturedOverall,
                        draftComment = capturedComment,
                    )
                result
                    .onSuccess { r ->
                        escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScores, capturedComment)
                        savedStateHandle["shieldExpiresAtMs"] = r.expiresAtMs
                        savedStateHandle["shieldDraftOverall"] = capturedOverall
                        savedStateHandle["shieldDraftPunct"] = capturedSubScores.punctuality
                        savedStateHandle["shieldDraftSkill"] = capturedSubScores.skill
                        savedStateHandle["shieldDraftBehav"] = capturedSubScores.behaviour
                        savedStateHandle["shieldDraftComment"] = capturedComment ?: ""
                        _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
                        startCountdown(r.expiresAtMs)
                    }.onFailure {
                        _shieldState.value = RatingShieldState.ShowDialog // allow retry
                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
                    }
            }
        }

        private fun startCountdown(expiresAtMs: Long) {
            countdownJob =
                viewModelScope.launch {
                    val remaining = expiresAtMs - System.currentTimeMillis()
                    if (remaining > 0) delay(remaining)
                    onPostAnyway()
                }
        }

        private fun doSubmit() {
            val draft = escalatedDraft
            val submitOverall = draft?.overall ?: overall.value
            val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
            val submitComment = draft?.comment ?: comment.value.ifBlank { null }
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase
                    .invoke(
                        bookingId = bookingId,
                        overall = submitOverall,
                        subScores = submitSubScores,
                        comment = submitComment,
                    ).collect { result ->
                        result
                            .onSuccess {
                                // Clear shield state only after confirmed success — preserves
                                // draft for retry if the network call fails.
                                escalatedDraft = null
                                savedStateHandle.remove<Long>("shieldExpiresAtMs")
                                savedStateHandle.remove<Int>("shieldDraftOverall")
                                savedStateHandle.remove<Int>("shieldDraftPunct")
                                savedStateHandle.remove<Int>("shieldDraftSkill")
                                savedStateHandle.remove<Int>("shieldDraftBehav")
                                savedStateHandle.remove<String>("shieldDraftComment")
                                _uiState.value = RatingUiState.AwaitingPartner(null)
                            }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                    }
            }
        }
    }
