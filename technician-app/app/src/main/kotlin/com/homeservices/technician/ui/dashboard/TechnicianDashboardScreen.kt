package com.homeservices.technician.ui.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun TechnicianDashboardScreen(
    onOpenEarnings: () -> Unit,
    onOpenRatings: () -> Unit,
    onOpenKyc: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier,
        topBar = { TopAppBar(title = { Text("Technician home") }) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item { DashboardHeader() }
            item { AvailabilityCard() }
            item { TodaySnapshot() }
            item {
                WorkflowCard(
                    onOpenEarnings = onOpenEarnings,
                    onOpenRatings = onOpenRatings,
                    onOpenKyc = onOpenKyc,
                )
            }
            item { ActiveAssignmentCard() }
            item { JobOffersCard() }
            item { SupportCard() }
        }
    }
}

@Composable
private fun DashboardHeader() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        HsTrustBadge(text = "Live workspace")
        Text(
            text = "Technician operations",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Text(
            text = "Track availability, jobs, payouts, ratings, and support from one place.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun AvailabilityCard() {
    var available by remember { mutableStateOf(true) }
    HsSectionCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = if (available) "Available for jobs" else "Paused",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "Live requests appear as timed offers when dispatch assigns one.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(checked = available, onCheckedChange = { available = it })
        }
    }
}

@Composable
private fun TodaySnapshot() {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        MetricTile(
            label = "Today",
            value = "Rs 0",
            supportingText = "Earnings",
            modifier = Modifier.weight(1f),
        )
        MetricTile(
            label = "Queue",
            value = "0",
            supportingText = "Active jobs",
            modifier = Modifier.weight(1f),
        )
        MetricTile(
            label = "Rating",
            value = "New",
            supportingText = "No reviews",
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun MetricTile(
    label: String,
    value: String,
    supportingText: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = supportingText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun WorkflowCard(
    onOpenEarnings: () -> Unit,
    onOpenRatings: () -> Unit,
    onOpenKyc: () -> Unit,
) {
    HsSectionCard(title = "Core workflow") {
        DashboardNavRow(
            title = "Earnings",
            body = "Payout totals and 7-day activity",
            status = "Open",
            onClick = onOpenEarnings,
        )
        HorizontalDivider()
        DashboardNavRow(
            title = "Ratings",
            body = "Customer feedback and score breakdown",
            status = "Open",
            onClick = onOpenRatings,
        )
        HorizontalDivider()
        DashboardNavRow(
            title = "KYC and documents",
            body = "Identity and PAN verification flow",
            status = "Review",
            onClick = onOpenKyc,
        )
    }
}

@Composable
private fun DashboardNavRow(
    title: String,
    body: String,
    status: String,
    onClick: () -> Unit,
) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick)
                .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(text = title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            Text(
                text = body,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Text(
            text = status,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun ActiveAssignmentCard() {
    HsSectionCard(title = "Current assignment") {
        StatusPill(text = "No active job")
        Spacer(Modifier.height(10.dp))
        Text(
            text = "Accepted bookings open the live tracker with address, stage updates, navigation, and completion photos.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun JobOffersCard() {
    HsSectionCard(title = "Job offers") {
        StatusPill(text = "Standby")
        Spacer(Modifier.height(10.dp))
        Text(
            text = "New requests are shown as a full-screen offer with earnings, distance, slot, accept, and decline actions.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun SupportCard() {
    HsSectionCard(title = "Support and complaints") {
        StatusPill(text = "No open issues")
        Spacer(Modifier.height(10.dp))
        Text(
            text = "Issue reporting is available from job rating and completion flows when a booking needs support review.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun StatusPill(text: String) {
    Surface(
        shape = MaterialTheme.shapes.extraLarge,
        color = MaterialTheme.colorScheme.secondaryContainer,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSecondaryContainer,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}
