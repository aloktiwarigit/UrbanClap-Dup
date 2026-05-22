package com.homeservices.customer.ui.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.LedgerEntryType
import com.homeservices.customer.domain.wallet.model.WalletBalance
import com.homeservices.customer.ui.util.formatInr
import com.homeservices.designsystem.components.HsScreenTitle
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

// ── Colour tokens (keep only those not in design-system token mapping) ────────
private val CreditColor = Color(0xFF1A7A4A)
private val DebitColor = Color(0xFFC0392B)
private val BrandGreenDark = Color(0xFF1A5C44)

// ── Entry point ───────────────────────────────────────────────────────────────
@Composable
internal fun WalletScreen(
    viewModel: WalletViewModel,
    onBack: () -> Unit,
) {
    val balanceState by viewModel.balanceState.collectAsStateWithLifecycle()
    val ledgerState by viewModel.ledgerState.collectAsStateWithLifecycle()
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { WalletTopBar(onBack = onBack) },
    ) { scaffoldPadding ->
        WalletContent(
            balanceState = balanceState,
            ledgerState = ledgerState,
            onRetry = viewModel::retry,
            modifier = Modifier.padding(scaffoldPadding),
        )
    }
}

// Extracted for Paparazzi testing
@Composable
internal fun WalletContent(
    balanceState: WalletBalanceUiState,
    ledgerState: LedgerUiState,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
    ) {
        item {
            BalanceHeroCard(balanceState = balanceState, onRetry = onRetry)
        }
        item {
            Spacer(Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.wallet_ledger_title),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 20.dp),
            )
            Spacer(Modifier.height(8.dp))
        }
        when (ledgerState) {
            is LedgerUiState.Loading ->
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(160.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp))
                    }
                }
            is LedgerUiState.Error ->
                item { LedgerErrorState(onRetry = onRetry) }
            is LedgerUiState.Ready ->
                if (ledgerState.entries.isEmpty()) {
                    item { LedgerEmptyState() }
                } else {
                    items(ledgerState.entries) { entry ->
                        LedgerEntryRow(entry = entry)
                    }
                }
        }
    }
}

@Composable
private fun WalletTopBar(onBack: () -> Unit) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.background)
                .statusBarsPadding()
                .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = stringResource(R.string.wallet_back_content_desc),
                tint = MaterialTheme.colorScheme.primary,
            )
        }
        Spacer(Modifier.width(4.dp))
        HsScreenTitle(
            text = stringResource(R.string.wallet_screen_title),
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
        )
    }
}

@Composable
private fun BalanceHeroCard(
    balanceState: WalletBalanceUiState,
    onRetry: () -> Unit,
) {
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Brush.horizontalGradient(listOf(MaterialTheme.colorScheme.primary, BrandGreenDark))),
        contentAlignment = Alignment.Center,
    ) {
        when (balanceState) {
            is WalletBalanceUiState.Loading ->
                Box(
                    modifier = Modifier.height(100.dp).fillMaxWidth(),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(32.dp))
                }
            is WalletBalanceUiState.Error ->
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = stringResource(R.string.wallet_balance_error),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f),
                    )
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = onRetry,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.2f)),
                    ) {
                        Text(stringResource(R.string.wallet_retry_cta), color = MaterialTheme.colorScheme.onPrimary)
                    }
                }
            is WalletBalanceUiState.Ready ->
                BalanceReadyContent(balance = balanceState.balance)
        }
    }
}

@Composable
private fun BalanceReadyContent(balance: WalletBalance) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.AccountBalanceWallet,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f),
                modifier = Modifier.size(20.dp),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = stringResource(R.string.wallet_balance_label),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f),
            )
        }
        Text(
            text = formatInr(balance.balanceInPaise),
            style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.ExtraBold),
            color = MaterialTheme.colorScheme.onPrimary,
        )
    }
}

@Composable
internal fun LedgerEntryRow(entry: LedgerEntry) {
    val isCredit = entry.type == LedgerEntryType.CREDIT_ISSUED || entry.type == LedgerEntryType.REFUND
    val amountSign = if (isCredit) "+" else "−"
    val amountColor = if (isCredit) CreditColor else DebitColor
    val typeIcon = entryTypeIcon(entry.type)

    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 5.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier =
                Modifier
                    .size(40.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp)),
        ) {
            Icon(typeIcon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = entry.reason,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = formatLedgerDate(entry.createdAt),
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Text(
            text = "$amountSign${formatInr(entry.amountInPaise)}",
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = amountColor,
        )
    }
}

@Composable
private fun LedgerEmptyState() {
    Box(
        modifier = Modifier.fillMaxWidth().padding(40.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = stringResource(R.string.wallet_no_transactions),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun LedgerErrorState(onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = stringResource(R.string.wallet_ledger_error),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
        ) {
            Text(stringResource(R.string.wallet_retry_cta), color = MaterialTheme.colorScheme.onPrimary)
        }
    }
}

private fun entryTypeIcon(type: LedgerEntryType): ImageVector =
    when (type) {
        LedgerEntryType.CREDIT_ISSUED -> Icons.Default.CardGiftcard
        LedgerEntryType.REFUND -> Icons.Default.Add
        LedgerEntryType.CREDIT_APPLIED -> Icons.Default.Remove
    }

private val DATE_FORMATTER: DateTimeFormatter =
    DateTimeFormatter
        .ofPattern("d MMM yyyy, h:mm a", Locale.ENGLISH)
        .withZone(ZoneId.systemDefault())

private fun formatLedgerDate(isoDate: String): String = runCatching { DATE_FORMATTER.format(Instant.parse(isoDate)) }.getOrDefault(isoDate)
