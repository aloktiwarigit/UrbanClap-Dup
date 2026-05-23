package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.SlotWindow
import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val DATE_DISPLAY = DateTimeFormatter.ofPattern("EEE, d MMM")
private val DATE_ISO = DateTimeFormatter.ISO_LOCAL_DATE

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SlotPickerScreen(
    serviceId: String,
    onSlotSelected: (BookingSlot) -> Unit,
    onBack: () -> Unit,
    viewModel: SlotPickerViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val initialDate = viewModel.currentIstDate()

    LaunchedEffect(serviceId) {
        viewModel.ensureInitialLoad(serviceId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.slot_picker_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.service_detail_back_desc),
                        )
                    }
                },
            )
        },
    ) { innerPadding ->
        SlotPickerContent(
            state = state,
            initialDate = initialDate,
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            onDateSelect = { date -> viewModel.loadSlots(serviceId, date) },
            onSlotSelect = viewModel::selectSlot,
            onRetry = viewModel::retry,
            onConfirm = { date, slot -> onSlotSelected(BookingSlot(date.format(DATE_ISO), slot.window)) },
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun SlotPickerContent(
    state: SlotPickerUiState,
    initialDate: LocalDate,
    modifier: Modifier = Modifier,
    onDateSelect: (LocalDate) -> Unit,
    onSlotSelect: (SlotWindow) -> Unit,
    onRetry: () -> Unit,
    onConfirm: (LocalDate, SlotWindow) -> Unit,
) {
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier =
                    Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    stringResource(R.string.slot_picker_heading),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    stringResource(R.string.slot_picker_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                DateChipsRow(
                    today = initialDate,
                    selectedDate = (state as? SlotPickerUiState.Loaded)?.date ?: initialDate,
                    onDateSelect = onDateSelect,
                )

                when (state) {
                    is SlotPickerUiState.Loading -> LoadingBlock()
                    is SlotPickerUiState.Error -> ErrorBlock(message = state.message, onRetry = onRetry)
                    is SlotPickerUiState.Loaded -> LoadedBlock(state = state, onSlotSelect = onSlotSelect)
                }
            }

            Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface, modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(16.dp)) {
                    val loaded = state as? SlotPickerUiState.Loaded
                    val selected = loaded?.selected
                    Button(
                        onClick = {
                            if (loaded != null && selected != null) onConfirm(loaded.date, selected)
                        },
                        enabled = selected != null && selected.available,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(stringResource(R.string.slot_picker_confirm_slot))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DateChipsRow(
    today: LocalDate,
    selectedDate: LocalDate,
    onDateSelect: (LocalDate) -> Unit,
) {
    val dates = (0..6).map { today.plusDays(it.toLong()) }
    SlotCard(title = stringResource(R.string.slot_picker_date_label)) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            dates.forEach { date ->
                FilterChip(
                    selected = selectedDate == date,
                    onClick = { onDateSelect(date) },
                    label = { Text(date.format(DATE_DISPLAY)) },
                )
            }
        }
    }
}

@Composable
private fun LoadingBlock() {
    val desc = stringResource(R.string.slot_picker_loading_desc)
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(32.dp)
                .semantics { contentDescription = desc },
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorBlock(
    message: String,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            stringResource(R.string.slot_picker_error_label),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error,
        )
        if (message.isNotBlank()) {
            Text(message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        OutlinedButton(onClick = onRetry) {
            Text(stringResource(R.string.slot_picker_retry_button))
        }
    }
}

@Composable
private fun LoadedBlock(
    state: SlotPickerUiState.Loaded,
    onSlotSelect: (SlotWindow) -> Unit,
) {
    val sections =
        listOf(
            stringResource(R.string.slot_picker_morning_label) to state.filteredSlots.filter { startHour(it.window) < MORNING_END },
            stringResource(R.string.slot_picker_afternoon_label) to
                state.filteredSlots.filter { startHour(it.window) in MORNING_END until EVENING_START },
            stringResource(R.string.slot_picker_evening_label) to state.filteredSlots.filter { startHour(it.window) >= EVENING_START },
        ).filter { it.second.isNotEmpty() }

    if (sections.isEmpty()) {
        Text(
            stringResource(R.string.slot_picker_no_slots_label),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        return
    }

    sections.forEach { (title, slots) ->
        SlotSection(
            title = title,
            slots = slots,
            selectedWindow = state.selected?.window,
            onSelect = onSlotSelect,
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun SlotSection(
    title: String,
    slots: List<SlotWindow>,
    selectedWindow: String?,
    onSelect: (SlotWindow) -> Unit,
) {
    SlotCard(title = title) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            slots.forEach { s ->
                SlotChip(
                    slot = s,
                    selected = selectedWindow == s.window,
                    onClick = { onSelect(s) },
                )
            }
        }
    }
}

@Composable
internal fun SlotChip(
    slot: SlotWindow,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        enabled = slot.available,
        label = { Text(slot.window) },
        colors =
            FilterChipDefaults.filterChipColors(
                disabledLabelColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f),
            ),
        modifier = modifier,
    )
}

@Composable
private fun SlotCard(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            content()
        }
    }
}

private const val MORNING_END = 12
private const val EVENING_START = 17

private fun startHour(window: String): Int = window.substringBefore(":").toIntOrNull() ?: 0
