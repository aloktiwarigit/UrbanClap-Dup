package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.BookingSlot
import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val DATE_DISPLAY = DateTimeFormatter.ofPattern("EEE, d MMM")
private val DATE_ISO = DateTimeFormatter.ISO_LOCAL_DATE

private val TIME_WINDOWS = listOf(
    "08:00-10:00",
    "10:00-12:00",
    "12:00-14:00",
    "14:00-16:00",
    "16:00-18:00",
    "18:00-20:00",
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
internal fun SlotPickerScreen(
    onSlotSelected: (BookingSlot) -> Unit,
    onBack: () -> Unit,
) {
    val today = LocalDate.now()
    val dates = (0..6).map { today.plusDays(it.toLong()) }

    var selectedDate by rememberSaveable { mutableStateOf<LocalDate?>(null) }
    var selectedWindow by rememberSaveable { mutableStateOf<String?>(null) }

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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
        ) {
            Text(text = "Select Date", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                dates.forEach { date ->
                    FilterChip(
                        selected = selectedDate == date,
                        onClick = { selectedDate = date },
                        label = { Text(date.format(DATE_DISPLAY)) },
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            Text(text = "Select Time", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TIME_WINDOWS.forEach { window ->
                    FilterChip(
                        selected = selectedWindow == window,
                        onClick = { selectedWindow = window },
                        label = { Text(window) },
                    )
                }
            }

            Spacer(Modifier.weight(1f))
            Button(
                onClick = {
                    val date = selectedDate
                    val window = selectedWindow
                    if (date != null && window != null) {
                        onSlotSelected(BookingSlot(date.format(DATE_ISO), window))
                    }
                },
                enabled = selectedDate != null && selectedWindow != null,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.slot_picker_next))
            }
        }
    }
}
