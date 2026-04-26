package com.homeservices.technician.ui.myratings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SuggestionChip
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
import com.homeservices.technician.domain.rating.model.ReceivedRating
import com.homeservices.technician.domain.rating.model.RatingWeekTrend
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
                title = { Text("मेरी रेटिंग") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        modifier = modifier,
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val state = uiState) {
                is MyRatingsUiState.Loading -> CircularProgressIndicator()
                is MyRatingsUiState.Error -> Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("डेटा लोड नहीं हो सका", style = MaterialTheme.typography.bodyLarge)
                    Button(onClick = viewModel::refresh) { Text("पुनः प्रयास करें") }
                }
                is MyRatingsUiState.Success -> RatingsContent(
                    summary = state.summary,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }
}

@Composable
private fun RatingsContent(summary: TechRatingSummary, modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier,
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "${summary.averageOverall} ★",
                    style = MaterialTheme.typography.displaySmall,
                )
                Text(
                    "${summary.totalCount} रेटिंग",
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                SubScoreColumn("समय", summary.averageSubScores.punctuality)
                SubScoreColumn("कौशल", summary.averageSubScores.skill)
                SubScoreColumn("व्यवहार", summary.averageSubScores.behaviour)
            }
        }
        if (summary.trend.isNotEmpty()) {
            item { TrendCard(weeks = summary.trend) }
        }
        if (summary.items.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text("अभी तक कोई रेटिंग नहीं", style = MaterialTheme.typography.bodyLarge)
                }
            }
        } else {
            items(summary.items) { rating ->
                RatingItemCard(rating = rating)
            }
        }
    }
}

@Composable
private fun SubScoreColumn(label: String, value: Double, modifier: Modifier = Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("%.1f".format(value), style = MaterialTheme.typography.titleMedium)
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun TrendCard(weeks: List<RatingWeekTrend>) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("साप्ताहिक रुझान", style = MaterialTheme.typography.labelMedium)
            RatingTrendChart(weeks = weeks, modifier = Modifier.fillMaxWidth().height(80.dp))
        }
    }
}

@Composable
private fun RatingTrendChart(weeks: List<RatingWeekTrend>, modifier: Modifier = Modifier) {
    if (weeks.isEmpty()) return
    val maxAvg = weeks.maxOfOrNull { it.average } ?: 5.0
    val barColor = MaterialTheme.colorScheme.primary
    Canvas(modifier = modifier) {
        val count = weeks.size
        val spacing = size.width / count
        val barWidth = spacing * 0.6f
        val minBarPx = 4.dp.toPx()
        val maxBarHeight = size.height - minBarPx
        weeks.forEachIndexed { i, week ->
            val barHeight = if (maxAvg > 0.0) {
                (week.average / maxAvg).toFloat() * maxBarHeight + minBarPx
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
}

private val DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH)

@Composable
private fun RatingItemCard(rating: ReceivedRating) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                repeat(5) { i ->
                    Text(if (i < rating.overall) "★" else "☆", style = MaterialTheme.typography.titleMedium)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                SuggestionChip(onClick = {}, label = { Text("समय: ${rating.punctuality}") })
                SuggestionChip(onClick = {}, label = { Text("कौशल: ${rating.skill}") })
                SuggestionChip(onClick = {}, label = { Text("व्यवहार: ${rating.behaviour}") })
            }
            if (!rating.comment.isNullOrBlank()) {
                Text(
                    rating.comment,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                formatDate(rating.submittedAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline,
            )
        }
    }
}

private fun formatDate(isoString: String): String = try {
    val instant = Instant.parse(isoString)
    DATE_FORMATTER.format(instant.atZone(ZoneId.systemDefault()))
} catch (_: Exception) {
    isoString
}
