package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.domain.booking.model.AddOnDecision
import com.homeservices.customer.domain.booking.model.PendingAddOn

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun PriceApprovalScreen(
    viewModel: PriceApprovalViewModel,
    bookingId: String,
    onApprovalComplete: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(bookingId) { viewModel.loadAddOns(bookingId) }
    if (state is PriceApprovalUiState.Approved) {
        LaunchedEffect(Unit) { onApprovalComplete() }
        return
    }
    Scaffold(topBar = { TopAppBar(title = { Text("Approve Add-ons") }) }) { padding ->
        PriceApprovalContent(
            uiState = state,
            onSubmit = { viewModel.submitDecisions(bookingId, it) },
            modifier = Modifier.padding(padding),
        )
    }
}

@Composable
internal fun PriceApprovalContent(
    uiState: PriceApprovalUiState,
    onSubmit: (List<AddOnDecision>) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (uiState) {
        is PriceApprovalUiState.Loading -> CircularProgressIndicator(modifier.padding(32.dp))
        is PriceApprovalUiState.Error -> Text("Error: ${uiState.message}", modifier.padding(16.dp))
        is PriceApprovalUiState.Approved -> {}
        is PriceApprovalUiState.PendingApproval -> {
            val decisions = remember { mutableStateMapOf<String, Boolean>() }
            Column(modifier.padding(16.dp)) {
                Text(
                    "Technician is requesting add-on approval:",
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(Modifier.height(12.dp))
                LazyColumn(Modifier.weight(1f)) {
                    items(uiState.addOns) { addOn ->
                        AddOnDecisionCard(
                            addOn = addOn,
                            decision = decisions[addOn.name],
                            onApprove = { decisions[addOn.name] = true },
                            onDecline = { decisions[addOn.name] = false },
                        )
                        Spacer(Modifier.height(8.dp))
                    }
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        onSubmit(uiState.addOns.map { AddOnDecision(it.name, decisions[it.name] ?: false) })
                    },
                    enabled = decisions.size == uiState.addOns.size,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Confirm Decisions") }
            }
        }
    }
}

@Composable
private fun AddOnDecisionCard(
    addOn: PendingAddOn,
    decision: Boolean?,
    onApprove: () -> Unit,
    onDecline: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(addOn.name, style = MaterialTheme.typography.titleSmall)
            Text("₹${addOn.price / 100}", style = MaterialTheme.typography.bodyMedium)
            Text(addOn.triggerDescription, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
            Row {
                Button(onClick = onApprove, modifier = Modifier.weight(1f)) {
                    Text(if (decision == true) "✓ Approved" else "Approve")
                }
                Spacer(Modifier.width(8.dp))
                OutlinedButton(onClick = onDecline, modifier = Modifier.weight(1f)) {
                    Text(if (decision == false) "✗ Declined" else "Decline")
                }
            }
        }
    }
}
