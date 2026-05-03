package com.homeservices.technician.ui.myratings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SuggestionChip
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
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.technician.domain.rating.model.RatingWeekTrend
import com.homeservices.technician.domain.rating.model.ReceivedRating
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun MyRatingsScreen(
    modifier: Modifier = Modifier,
    viewModel: MyRatingsViewModel = hiltViewModel(),
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My ratings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        modifier = modifier,
    ) { padding ->
        MyRatingsContent(uiState = uiState, onRetry = viewModel::refresh, modifier = Modifier.padding(padding))
    }
}

@Composable
internal fun MyRatingsContent(
    uiState: MyRatingsUiState,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (val state = uiState) {
            is MyRatingsUiState.Loading -> CenterState { CircularProgressIndicator() }
            is MyRatingsUiState.Error ->
                CenterState {
                    Text("Could not load ratings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    HsPrimaryButton(text = "Try again", onClick = onRetry)
                }
            is MyRatingsUiState.Success -> RatingsSuccess(summary = state.summary)
        }
    }
}

@Composable
private fun RatingsSuccess(summary: TechRatingSummary) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HsSectionCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            "%.1f".format(summary.averageOverall),
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            "${summary.totalCount} customer ratings",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text("\u2605", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                SubScoreColumn("Punctuality", summary.averageSubScores.punctuality)
                SubScoreColumn("Skill", summary.averageSubScores.skill)
                SubScoreColumn("Behaviour", summary.averageSubScores.behaviour)
            }
        }
        if (summary.trend.isNotEmpty()) item { TrendCard(weeks = summary.trend) }
        if (summary.items.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text("No ratings yet", style = MaterialTheme.typography.bodyLarge)
                }
            }
        } else {
            items(summary.items) { rating -> RatingItemCard(rating = rating) }
        }
    }
}

@Composable
private fun SubScoreColumn(
    label: String,
    value: Double,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("%.1f".format(value), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun TrendCard(weeks: List<RatingWeekTrend>) {
    HsSectionCard(title = "Weekly trend") {
        RatingTrendChart(weeks = weeks, modifier = Modifier.fillMaxWidth().height(80.dp))
    }
}

@Composable
private fun RatingTrendChart(
    weeks: List<RatingWeekTrend>,
    modifier: Modifier = Modifier,
) {
    if (weeks.isEmpty()) return
    val maxAvg = weeks.maxOfOrNull { it.average } ?: 5.0
    val barColor = MaterialTheme.colorScheme.primary
    Canvas(modifier = modifier) {
        val spacing = size.width / weeks.size
        val barWidth = spacing * 0.6f
        val minBarPx = 4.dp.toPx()
        val maxBarHeight = size.height - minBarPx
        weeks.forEachIndexed { i, week ->
            val barHeight = if (maxAvg > 0.0) (week.average / maxAvg).toFloat() * maxBarHeight + minBarPx else minBarPx
            val x = i * spacing + (spacing - barWidth) / 2f
            drawRect(color = barColor, topLeft = Offset(x, size.height - barHeight), size = Size(barWidth, barHeight))
        }
    }
}

private val DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH)

@Composable
private fun RatingItemCard(rating: ReceivedRating) {
    HsSectionCard {
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            repeat(5) { i ->
                Text(
                    if (i <
                        rating.overall
                    ) {
                        "\u2605"
                    } else {
                        "\u2606"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            SuggestionChip(onClick = {}, label = { Text("Punctuality ${rating.punctuality}") })
            SuggestionChip(onClick = {}, label = { Text("Skill ${rating.skill}") })
        }
        if (!rating.comment.isNullOrBlank()) {
            Text(rating.comment, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(formatDate(rating.submittedAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
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

private fun formatDate(isoString: String): String =
    try {
        val instant = Instant.parse(isoString)
        DATE_FORMATTER.format(instant.atZone(ZoneId.systemDefault()))
    } catch (_: Exception) {
        isoString
    }
