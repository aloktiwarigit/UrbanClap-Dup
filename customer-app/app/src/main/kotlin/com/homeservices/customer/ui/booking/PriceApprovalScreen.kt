package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.AddOnDecision
import com.homeservices.customer.domain.booking.model.PendingAddOn
import com.homeservices.designsystem.components.HsPriceText
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsSkeletonBlock

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
    Scaffold(topBar = { TopAppBar(title = { Text(stringResource(R.string.price_approval_title)) }) }) { padding ->
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
        is PriceApprovalUiState.Loading -> PriceApprovalSkeleton(modifier = modifier)
        is PriceApprovalUiState.Error -> {
            Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = stringResource(R.string.price_approval_error, uiState.message),
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(24.dp),
                )
            }
        }
        is PriceApprovalUiState.Approved -> {}
        is PriceApprovalUiState.PendingApproval -> {
            val decisions = remember(uiState.bookingId) { mutableStateMapOf<String, Boolean>() }
            Column(modifier.fillMaxSize().padding(16.dp)) {
                Text(
                    text = stringResource(R.string.price_approval_heading),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = stringResource(R.string.price_approval_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(16.dp))
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(uiState.addOns, key = { it.name }) { addOn ->
                        AddOnDecisionCard(
                            addOn = addOn,
                            decision = decisions[addOn.name],
                            onApprove = { decisions[addOn.name] = true },
                            onDecline = { decisions[addOn.name] = false },
                        )
                    }
                }
                Spacer(Modifier.height(14.dp))
                TotalDecisionSummary(uiState.addOns, decisions)
                Spacer(Modifier.height(12.dp))
                HsPrimaryButton(
                    text = stringResource(R.string.price_approval_confirm),
                    onClick = {
                        onSubmit(uiState.addOns.map { AddOnDecision(it.name, decisions[it.name] ?: false) })
                    },
                    enabled = decisions.size == uiState.addOns.size,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                )
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
    HsSectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(addOn.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    addOn.triggerDescription,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            HsPriceText(pricePaise = addOn.price)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HsPrimaryButton(
                text =
                    if (decision == true) {
                        stringResource(R.string.price_approval_approved)
                    } else {
                        stringResource(R.string.price_approval_approve)
                    },
                onClick = onApprove,
                modifier = Modifier.weight(1f),
            )
            HsSecondaryButton(
                text =
                    if (decision == false) {
                        stringResource(R.string.price_approval_declined)
                    } else {
                        stringResource(R.string.price_approval_decline)
                    },
                onClick = onDecline,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun TotalDecisionSummary(
    addOns: List<PendingAddOn>,
    decisions: Map<String, Boolean>,
) {
    val approvedTotal = addOns.filter { decisions[it.name] == true }.sumOf { it.price }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = stringResource(R.string.price_approval_selected_total),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = "Rs ${approvedTotal / 100}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
        }
    }
}

@Composable
private fun PriceApprovalSkeleton(modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        HsSkeletonBlock(widthFraction = 0.78f, height = 30.dp)
        HsSkeletonBlock(widthFraction = 0.95f, height = 16.dp)
        repeat(2) {
            Surface(
                modifier = Modifier.fillMaxWidth().height(132.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant,
            ) {}
        }
    }
}
