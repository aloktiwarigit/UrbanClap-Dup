package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.booking.model.SlotWindow
import java.time.LocalDate

public sealed class SlotPickerUiState {
    public object Loading : SlotPickerUiState()

    public data class Loaded(
        val date: LocalDate,
        val slots: List<SlotWindow>,
        val filteredSlots: List<SlotWindow>,
        val selected: SlotWindow?,
    ) : SlotPickerUiState()

    public data class Error(
        val message: String,
    ) : SlotPickerUiState()
}
