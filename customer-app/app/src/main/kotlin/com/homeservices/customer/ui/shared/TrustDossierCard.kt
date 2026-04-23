package com.homeservices.customer.ui.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.technician.model.TechnicianProfile

@Composable
public fun TrustDossierCard(
    uiState: TrustDossierUiState,
    compact: Boolean,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth()) {
        when (uiState) {
            is TrustDossierUiState.Loading -> LoadingContent()
            is TrustDossierUiState.Error -> ErrorContent()
            is TrustDossierUiState.Unavailable -> UnavailableContent(compact)
            is TrustDossierUiState.Loaded ->
                if (compact) CompactContent(uiState.profile) else ExpandedContent(uiState.profile)
        }
    }
}

@Composable
private fun LoadingContent() {
    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
        Spacer(Modifier.width(8.dp))
        Text(stringResource(R.string.trust_dossier_loading), style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun ErrorContent() {
    Text(
        text = stringResource(R.string.trust_dossier_error),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.error,
        modifier = Modifier.padding(12.dp),
    )
}

@Composable
private fun UnavailableContent(compact: Boolean) {
    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = Icons.Default.Lock,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(8.dp))
        Column {
            Text(
                text = if (compact) stringResource(R.string.trust_dossier_stub)
                       else stringResource(R.string.trust_dossier_assigning),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
            )
            if (!compact) {
                Text(
                    text = stringResource(R.string.trust_dossier_promise),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun CompactContent(profile: TechnicianProfile) {
    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(
            model = profile.photoUrl,
            contentDescription = profile.displayName,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(40.dp).clip(CircleShape),
        )
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(profile.displayName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (profile.verifiedAadhaar) BadgeChip(stringResource(R.string.trust_dossier_badge_aadhaar))
                if (profile.verifiedPoliceCheck) BadgeChip(stringResource(R.string.trust_dossier_badge_police))
            }
        }
    }
}

@Composable
private fun ExpandedContent(profile: TechnicianProfile) {
    Column(modifier = Modifier.padding(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = profile.photoUrl,
                contentDescription = profile.displayName,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(64.dp).clip(CircleShape),
            )
            Spacer(Modifier.width(12.dp))
            Column {
                Text(profile.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    text = "${stringResource(R.string.trust_dossier_jobs, profile.totalJobsCompleted)} · ${stringResource(R.string.trust_dossier_years, profile.yearsInService)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (profile.verifiedAadhaar) BadgeChip(stringResource(R.string.trust_dossier_badge_aadhaar))
            if (profile.verifiedPoliceCheck) BadgeChip(stringResource(R.string.trust_dossier_badge_police))
            profile.trainingInstitution?.let { BadgeChip(stringResource(R.string.trust_dossier_trained_by, it)) }
        }
        if (profile.certifications.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(stringResource(R.string.trust_dossier_certifications_label), style = MaterialTheme.typography.labelSmall)
            profile.certifications.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
        }
        if (profile.languages.isNotEmpty()) {
            Spacer(Modifier.height(6.dp))
            Text(stringResource(R.string.trust_dossier_languages_label), style = MaterialTheme.typography.labelSmall)
            Text(profile.languages.joinToString(", "), style = MaterialTheme.typography.bodySmall)
        }
        if (profile.lastReviews.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(stringResource(R.string.trust_dossier_reviews_label), style = MaterialTheme.typography.labelSmall)
            profile.lastReviews.forEach { review ->
                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    Text("★".repeat(review.rating.toInt()), style = MaterialTheme.typography.bodySmall)
                    Text(review.text, style = MaterialTheme.typography.bodySmall)
                    Text(
                        review.date.take(10),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun BadgeChip(label: String) {
    Text(text = "✓ $label", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
}
