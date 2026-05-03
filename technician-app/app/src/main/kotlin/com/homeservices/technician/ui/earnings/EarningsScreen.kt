package com.homeservices.technician.ui.earnings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.technician.R
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

private val WarmIvory = Color(0xFFFBF7EF)
private val BrandGreen = Color(0xFF0B3D2E)
private val AppBarStart = Color(0xFF062A20)
private val AppBarEnd = Color(0xFF0B3D2E)
private val BrandGreenSoft = Color(0xFFE8F1EC)
private val TextPrimary = Color(0xFF18231F)
private val TextSecondary = Color(0xFF5F6C66)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun EarningsScreen(
    modifier: Modifier = Modifier,
    viewModel: EarningsViewModel = hiltViewModel(),
    onViewRatings: () -> Unit = {},
    onPayoutSettings: () -> Unit = {},
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                modifier = Modifier.background(Brush.horizontalGradient(listOf(AppBarStart, AppBarEnd))),
                title = {
                    Text(
                        stringResource(R.string.earnings_title),
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    scrolledContainerColor = Color.Transparent,
                    titleContentColor = Color.White,
                ),
            )
        },
        modifier = modifier,
    ) { padding ->
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
    Surface(modifier = modifier.fillMaxSize(), color = WarmIvory) {
        when (val state = uiState) {
            is EarningsUiState.Loading -> CenterState { CircularProgressIndicator(color = BrandGreen) }
            is EarningsUiState.Error ->
                CenterState {
                    Text(
                        stringResource(R.string.earnings_error),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary,
                    )
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = onRetry,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandGreen),
                    ) { Text(stringResource(R.string.earnings_retry)) }
                }
            is EarningsUiState.Success ->
                if (state.summary.lifetime.count == 0) {
                    EarningsEmptyState(onPayoutSettings = onPayoutSettings)
                } else {
                    EarningsSuccess(
                        summary = state.summary,
                        onViewRatings = onViewRatings,
                        onPayoutSettings = onPayoutSettings,
                    )
                }
        }
    }
}

@Composable
private fun EarningsEmptyState(onPayoutSettings: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier =
                Modifier
                    .size(80.dp)
                    .background(BrandGreenSoft, shape = RoundedCornerShape(24.dp)),
        ) {
            Icon(
                imageVector = Icons.Default.AccountBalanceWallet,
                contentDescription = null,
                tint = BrandGreen,
                modifier = Modifier.size(40.dp),
            )
        }
        Spacer(Modifier.height(24.dp))
        Text(
            text = stringResource(R.string.earnings_empty_title),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.earnings_empty_body),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(32.dp))
        StepHint(icon = Icons.Default.Work, text = stringResource(R.string.earnings_hint_online))
        Spacer(Modifier.height(12.dp))
        StepHint(icon = Icons.AutoMirrored.Filled.TrendingUp, text = stringResource(R.string.earnings_hint_complete))
        Spacer(Modifier.height(12.dp))
        StepHint(icon = Icons.Default.Star, text = stringResource(R.string.earnings_hint_ratings))
        Spacer(Modifier.height(32.dp))
        OutlinedButton(onClick = onPayoutSettings, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.earnings_payout_settings))
        }
    }
}

@Composable
private fun StepHint(
    icon: ImageVector,
    text: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier =
                Modifier
                    .size(36.dp)
                    .background(BrandGreenSoft, shape = RoundedCornerShape(10.dp)),
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.size(12.dp))
        Text(text = text, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
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
            Text(stringResource(R.string.earnings_dashboard_title), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = TextPrimary)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                PeriodCard(stringResource(R.string.earnings_period_today), summary.today, modifier = Modifier.weight(1f))
                PeriodCard(stringResource(R.string.earnings_period_week), summary.week, modifier = Modifier.weight(1f))
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                PeriodCard(stringResource(R.string.earnings_period_month), summary.month, modifier = Modifier.weight(1f))
                PeriodCard(stringResource(R.string.earnings_period_lifetime), summary.lifetime, modifier = Modifier.weight(1f))
            }
        }
        item { GoalProgressCard(summary.month.techAmountPaise) }
        item { SparklineCard(summary.lastSevenDays) }
        item {
            OutlinedButton(onClick = onViewRatings, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.earnings_view_ratings))
            }
        }
        item {
            OutlinedButton(onClick = onPayoutSettings, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.earnings_payout_settings))
            }
        }
    }
}

@Composable
private fun PeriodCard(
    label: String,
    period: EarningsPeriod,
    modifier: Modifier = Modifier,
) {
    HsSectionCard(modifier = modifier) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = TextSecondary)
        Text(
            formatRupees(period.techAmountPaise),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
        )
        Text(
            text = if (period.count == 0) stringResource(R.string.earnings_no_jobs) else stringResource(R.string.earnings_jobs_count, period.count),
            style = MaterialTheme.typography.bodySmall,
            color = if (period.count == 0) TextSecondary else BrandGreen,
        )
    }
}

private val MONTHLY_GOAL_PAISE = 3_500_000L

@Composable
private fun GoalProgressCard(monthAmountPaise: Long) {
    HsSectionCard(title = stringResource(R.string.earnings_monthly_goal)) {
        LinearProgressIndicator(
            progress = { (monthAmountPaise.toFloat() / MONTHLY_GOAL_PAISE).coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(4.dp)),
            color = BrandGreen,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "${formatRupees(monthAmountPaise)} / ${formatRupees(MONTHLY_GOAL_PAISE)}",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )
    }
}

@Composable
private fun SparklineCard(days: List<DailyEarnings>) {
    HsSectionCard(title = stringResource(R.string.earnings_last_seven_days)) {
        if (days.isEmpty() || days.all { it.techAmountPaise == 0L }) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxWidth().height(84.dp),
            ) {
                Text(
                    stringResource(R.string.earnings_sparkline_empty),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    textAlign = TextAlign.Center,
                )
            }
        } else {
            EarningsSparkline(days = days, modifier = Modifier.fillMaxWidth().height(84.dp))
        }
    }
}

@Composable
private fun EarningsSparkline(
    days: List<DailyEarnings>,
    modifier: Modifier = Modifier,
) {
    val maxAmount = days.maxOfOrNull { it.techAmountPaise } ?: 0L
    val barColor = BrandGreen
    val labelColor = TextSecondary
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

private fun formatRupees(paise: Long): String = "₹%,.0f".format(paise / 100.0)
