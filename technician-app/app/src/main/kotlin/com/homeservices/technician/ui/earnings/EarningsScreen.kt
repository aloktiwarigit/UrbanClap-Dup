package com.homeservices.technician.ui.earnings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun EarningsScreen(
    modifier: Modifier = Modifier,
    viewModel: EarningsViewModel = hiltViewModel(),
    onViewRatings: () -> Unit = {},
    onPayoutSettings: () -> Unit = {},
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(topBar = { TopAppBar(title = { Text("Earnings") }) }, modifier = modifier) { padding ->
        EarningsContent(
            uiState = uiState,
            onRetry = viewModel::refresh,
            onViewRatings = onViewRatings,
            onPayoutSettings = onPayoutSettings,
            modifier = Modifier.padding(padding),
        )
    }
}

@Composable
internal fun EarningsContent(
    uiState: EarningsUiState,
    onRetry: () -> Unit,
    onViewRatings: () -> Unit,
    onPayoutSettings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (val state = uiState) {
            is EarningsUiState.Loading -> CenterState { CircularProgressIndicator() }
            is EarningsUiState.Error ->
                CenterState {
                    Text("Could not load earnings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Button(onClick = onRetry) { Text("Try again") }
                }
            is EarningsUiState.Success ->
                EarningsSuccess(
                    summary = state.summary,
                    onViewRatings = onViewRatings,
                    onPayoutSettings = onPayoutSettings,
                )
        }
    }
}

@Composable
private fun EarningsSuccess(
    summary: EarningsSummary,
    onViewRatings: () -> Unit,
    onPayoutSettings: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text("Your payout dashboard", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                PeriodCard("Today", summary.today, modifier = Modifier.weight(1f))
                PeriodCard("This week", summary.week, modifier = Modifier.weight(1f))
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                PeriodCard("This month", summary.month, modifier = Modifier.weight(1f))
                PeriodCard("Lifetime", summary.lifetime, modifier = Modifier.weight(1f))
            }
        }
        item { GoalProgressCard(summary.month.techAmountPaise) }
        item { SparklineCard(summary.lastSevenDays) }
        item { OutlinedButton(onClick = onViewRatings, modifier = Modifier.fillMaxWidth()) { Text("View ratings") } }
        item { OutlinedButton(onClick = onPayoutSettings, modifier = Modifier.fillMaxWidth()) { Text("Payout settings") } }
    }
}

@Composable
private fun PeriodCard(
    label: String,
    period: EarningsPeriod,
    modifier: Modifier = Modifier,
) {
    HsSectionCard(modifier = modifier) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(formatRupees(period.techAmountPaise), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("${period.count} jobs", style = MaterialTheme.typography.bodySmall)
    }
}

private val MONTHLY_GOAL_PAISE = 3_500_000L

@Composable
private fun GoalProgressCard(monthAmountPaise: Long) {
    HsSectionCard(title = "Monthly goal") {
        LinearProgressIndicator(
            progress = { (monthAmountPaise.toFloat() / MONTHLY_GOAL_PAISE).coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth(),
        )
        Text("${formatRupees(monthAmountPaise)} / ${formatRupees(MONTHLY_GOAL_PAISE)}", style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun SparklineCard(days: List<DailyEarnings>) {
    HsSectionCard(title = "Last 7 days") {
        EarningsSparkline(days = days, modifier = Modifier.fillMaxWidth().height(84.dp))
    }
}

@Composable
private fun EarningsSparkline(
    days: List<DailyEarnings>,
    modifier: Modifier = Modifier,
) {
    if (days.isEmpty()) return
    val maxAmount = days.maxOfOrNull { it.techAmountPaise } ?: 0L
    val barColor = MaterialTheme.colorScheme.primary
    val labelColor = MaterialTheme.colorScheme.onSurfaceVariant
    Column(modifier = modifier) {
        Canvas(modifier = Modifier.weight(1f).fillMaxWidth()) {
            val spacing = size.width / days.size
            val barWidth = spacing * 0.6f
            val minBarPx = 4.dp.toPx()
            val maxBarHeight = size.height - minBarPx
            days.forEachIndexed { i, day ->
                val barHeight = if (maxAmount > 0L) (day.techAmountPaise.toFloat() / maxAmount) * maxBarHeight + minBarPx else minBarPx
                val x = i * spacing + (spacing - barWidth) / 2f
                drawRect(color = barColor, topLeft = Offset(x, size.height - barHeight), size = Size(barWidth, barHeight))
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            days.forEach { day ->
                val label =
                    try {
                        LocalDate.parse(day.date).dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                    } catch (_: Exception) {
                        "?"
                    }
                Text(label, style = MaterialTheme.typography.labelSmall, color = labelColor)
            }
        }
    }
}

@Composable
private fun CenterState(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        content = content,
    )
}

private fun formatRupees(paise: Long): String = "Rs %,.0f".format(paise / 100.0)
