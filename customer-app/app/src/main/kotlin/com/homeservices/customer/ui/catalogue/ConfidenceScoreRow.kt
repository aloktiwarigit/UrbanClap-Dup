package com.homeservices.customer.ui.catalogue

import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ConfidenceScoreRow(
    uiState: ConfidenceScoreUiState,
    modifier: Modifier = Modifier,
) {
    var showMethodology by remember { mutableStateOf(false) }

    when (uiState) {
        is ConfidenceScoreUiState.Hidden -> Unit
        is ConfidenceScoreUiState.Loading -> ConfidenceScoreShimmer(modifier)
        is ConfidenceScoreUiState.Limited -> {
            Row(modifier = modifier.padding(vertical = 4.dp)) {
                AssistChip(
                    onClick = { showMethodology = true },
                    label = { Text("New in your area -- building track record") },
                )
            }
        }
        is ConfidenceScoreUiState.Loaded -> {
            val score = uiState.score
            Row(
                modifier = modifier.padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                AssistChip(
                    onClick = { showMethodology = true },
                    label = { Text("${score.onTimePercent}% on-time") },
                )
                score.areaRating?.let { rating ->
                    AssistChip(
                        onClick = { showMethodology = true },
                        label = { Text("${"%.1f".format(rating)} area rating") },
                    )
                }
                score.nearestEtaMinutes?.let { eta ->
                    AssistChip(
                        onClick = { showMethodology = true },
                        label = { Text("~$eta min away") },
                    )
                }
            }
        }
    }

    if (showMethodology) {
        ModalBottomSheet(
            onDismissRequest = { showMethodology = false },
            sheetState = rememberModalBottomSheetState(),
        ) {
            Text(
                text = "How we calculate this",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
            Text(
                text =
                    "On-time %: jobs started within 15 min of booked slot (last 30 days).\n\n" +
                        "Area rating: average star rating in your area.\n\n" +
                        "ETA: estimated travel time from technician's last location at 20 km/h.",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 24.dp),
            )
        }
    }
}

@Composable
private fun ConfidenceScoreShimmer(modifier: Modifier = Modifier) {
    val alpha by rememberInfiniteTransition(label = "shimmer").animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(animation = tween(800)),
        label = "shimmer_alpha",
    )
    Row(
        modifier = modifier.padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        repeat(3) {
            Box(
                modifier =
                    Modifier
                        .width(90.dp)
                        .height(32.dp)
                        .alpha(alpha)
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(50)),
            )
        }
    }
}
