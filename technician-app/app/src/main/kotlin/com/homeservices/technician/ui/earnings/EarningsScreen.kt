package com.homeservices.technician.ui.earnings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
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
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = { TopAppBar(title = { Text("कमाई") }) },
        modifier = modifier,
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val state = uiState) {
                is EarningsUiState.Loading -> CircularProgressIndicator()
                is EarningsUiState.Error -> Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("डेटा लोड नहीं हो सका", style = MaterialTheme.typography.bodyLarge)
                    Button(onClick = viewModel::refresh) { Text("पुनः प्रयास करें") }
                }
                is EarningsUiState.Success -> SuccessContent(
                    summary = state.summary,
                    onViewRatings = onViewRatings,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }
}

@Composable
private fun SuccessContent(summary: EarningsSummary, onViewRatings: () -> Unit, modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    PeriodCard("आज", summary.today, modifier = Modifier.weight(1f))
                    PeriodCard("इस सप्ताह", summary.week, modifier = Modifier.weight(1f))
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    PeriodCard("इस महीने", summary.month, modifier = Modifier.weight(1f))
                    PeriodCard("कुल", summary.lifetime, modifier = Modifier.weight(1f))
                }
            }
        }
        item { GoalProgressCard(summary.month.techAmountPaise) }
        item { SparklineCard(summary.lastSevenDays) }
        item {
            OutlinedButton(
                onClick = onViewRatings,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("रेटिंग देखें")
            }
        }
    }
}

@Composable
private fun PeriodCard(label: String, period: EarningsPeriod, modifier: Modifier = Modifier) {
    Card(modifier = modifier) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text(formatRupees(period.techAmountPaise), style = MaterialTheme.typography.titleLarge)
            Text("${period.count} jobs", style = MaterialTheme.typography.bodySmall)
        }
    }
}

private val MONTHLY_GOAL_PAISE = 3_500_000L

@Composable
private fun GoalProgressCard(monthAmountPaise: Long) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Monthly Goal", style = MaterialTheme.typography.labelMedium)
            LinearProgressIndicator(
                progress = { (monthAmountPaise.toFloat() / MONTHLY_GOAL_PAISE).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth(),
            )
            Text(
                "${formatRupees(monthAmountPaise)} / ${formatRupees(MONTHLY_GOAL_PAISE)}",
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun SparklineCard(days: List<DailyEarnings>) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("पिछले 7 दिन", style = MaterialTheme.typography.labelMedium)
            EarningsSparkline(days = days, modifier = Modifier.fillMaxWidth().height(80.dp))
        }
    }
}

@Composable
private fun EarningsSparkline(days: List<DailyEarnings>, modifier: Modifier = Modifier) {
    if (days.isEmpty()) return
    val maxAmount = days.maxOfOrNull { it.techAmountPaise } ?: 0L
    val barColor = MaterialTheme.colorScheme.primary
    val labelColor = MaterialTheme.colorScheme.onSurfaceVariant

    Column(modifier = modifier) {
        Canvas(modifier = Modifier.weight(1f).fillMaxWidth()) {
            val count = days.size
            val spacing = size.width / count
            val barWidth = spacing * 0.6f
            val minBarPx = 4.dp.toPx()
            val maxBarHeight = size.height - minBarPx

            days.forEachIndexed { i, day ->
                val barHeight = if (maxAmount > 0L) {
                    (day.techAmountPaise.toFloat() / maxAmount) * maxBarHeight + minBarPx
                } else {
                    minBarPx
                }
                val x = i * spacing + (spacing - barWidth) / 2f
                drawRect(
                    color = barColor,
                    topLeft = Offset(x, size.height - barHeight),
                    size = Size(barWidth, barHeight),
                )
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            days.forEach { day ->
                val label = try {
                    LocalDate.parse(day.date).dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                } catch (_: Exception) {
                    "?"
                }
                Text(label, style = MaterialTheme.typography.labelSmall, color = labelColor)
            }
        }
    }
}

private fun formatRupees(paise: Long): String = "₹%,.0f".format(paise / 100.0)
