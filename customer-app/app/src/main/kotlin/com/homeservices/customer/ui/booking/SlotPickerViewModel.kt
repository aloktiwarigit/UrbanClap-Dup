package com.homeservices.customer.ui.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.booking.GetSlotAvailabilityUseCase
import com.homeservices.customer.domain.booking.model.SlotWindow
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import javax.inject.Inject

@HiltViewModel
public class SlotPickerViewModel
    @Inject
    public constructor(
        private val getSlotAvailability: GetSlotAvailabilityUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<SlotPickerUiState>(SlotPickerUiState.Loading)
        public val uiState: StateFlow<SlotPickerUiState> = _uiState.asStateFlow()

        public fun loadSlots(
            serviceId: String,
            date: LocalDate,
        ) {
            _uiState.value = SlotPickerUiState.Loading
            viewModelScope.launch {
                getSlotAvailability(serviceId, date)
                    .catch { err ->
                        _uiState.value = SlotPickerUiState.Error(err.message ?: "Unknown error")
                    }.onEach { result ->
                        result
                            .onSuccess { slots ->
                                _uiState.value =
                                    SlotPickerUiState.Loaded(
                                        date = date,
                                        slots = slots,
                                        filteredSlots = applyPastTimeFilter(slots, date),
                                        selected = null,
                                    )
                            }.onFailure { err ->
                                _uiState.value = SlotPickerUiState.Error(err.message ?: "Unknown error")
                            }
                    }.collect()
            }
        }

        public fun selectSlot(slot: SlotWindow) {
            val current = _uiState.value
            if (current is SlotPickerUiState.Loaded) {
                _uiState.value = current.copy(selected = slot)
            }
        }

        public fun retry(
            serviceId: String,
            date: LocalDate,
        ) {
            loadSlots(serviceId, date)
        }

        private fun applyPastTimeFilter(
            slots: List<SlotWindow>,
            date: LocalDate,
        ): List<SlotWindow> {
            if (date != LocalDate.now()) return slots
            val nowHour = LocalTime.now().hour
            return slots.map { s ->
                val startHour = s.window.substringBefore(":").toIntOrNull() ?: 0
                if (startHour <= nowHour) s.copy(available = false) else s
            }
        }
    }
