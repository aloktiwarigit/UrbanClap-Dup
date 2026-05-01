package com.homeservices.customer.ui.shared

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
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
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        tonalElevation = 1.dp,
    ) {
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
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TrustDossierHeader()
        Text(
            text = stringResource(R.string.trust_dossier_loading_title),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        PlaceholderLine(widthFraction = 0.86f, height = 14.dp)
        PlaceholderLine(widthFraction = 0.58f, height = 14.dp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PlaceholderBlock(height = 34.dp, modifier = Modifier.weight(1f))
            PlaceholderBlock(height = 34.dp, modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun ErrorContent() {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        TrustDossierHeader()
        Text(
            text = stringResource(R.string.trust_dossier_error_title),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.error,
        )
        Text(
            text = stringResource(R.string.trust_dossier_error),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun UnavailableContent(compact: Boolean) {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TrustDossierHeader()
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text =
                    if (compact) {
                        stringResource(R.string.trust_dossier_stub)
                    } else {
                        stringResource(R.string.trust_dossier_unavailable_title)
                    },
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            if (!compact) {
                Text(
                    text = stringResource(R.string.trust_dossier_unavailable_body),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        TrustSignalList()
    }
}

@Composable
private fun CompactContent(profile: TechnicianProfile) {
    Row(
        modifier = Modifier.padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ProfileAvatar(profile = profile, size = 48.dp)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            TrustDossierHeader(showIcon = false)
            Text(
                text = profile.displayName,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (profile.verifiedAadhaar) BadgeChip(stringResource(R.string.trust_dossier_badge_aadhaar))
                if (profile.verifiedPoliceCheck) BadgeChip(stringResource(R.string.trust_dossier_badge_police))
            }
        }
    }
}

@Composable
private fun ExpandedContent(profile: TechnicianProfile) {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ProfileAvatar(profile = profile, size = 68.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                TrustDossierHeader(showIcon = false)
                Text(
                    text = profile.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text =
                        "${stringResource(R.string.trust_dossier_jobs, profile.totalJobsCompleted)}, " +
                            stringResource(R.string.trust_dossier_years, profile.yearsInService),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (profile.verifiedAadhaar) BadgeChip(stringResource(R.string.trust_dossier_badge_aadhaar))
            if (profile.verifiedPoliceCheck) BadgeChip(stringResource(R.string.trust_dossier_badge_police))
        }
        profile.trainingInstitution?.let { institution ->
            BadgeChip(stringResource(R.string.trust_dossier_trained_by, institution))
        }
        if (profile.certifications.isNotEmpty()) {
            TrustDetailBlock(title = stringResource(R.string.trust_dossier_certifications_label)) {
                profile.certifications.forEach { TrustSignalRow(it) }
            }
        }
        if (profile.languages.isNotEmpty()) {
            TrustDetailBlock(title = stringResource(R.string.trust_dossier_languages_label)) {
                Text(
                    text = profile.languages.joinToString(", "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (profile.lastReviews.isNotEmpty()) {
            TrustDetailBlock(title = stringResource(R.string.trust_dossier_reviews_label)) {
                profile.lastReviews.forEach { review ->
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = "Rating ${"%.1f".format(review.rating)}/5",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                        )
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
}

@Composable
private fun TrustDossierHeader(showIcon: Boolean = true) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        if (showIcon) {
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer,
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(7.dp).size(16.dp),
                )
            }
        }
        Text(
            text = stringResource(R.string.trust_dossier_title),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun TrustSignalList() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        TrustSignalRow(stringResource(R.string.trust_dossier_signal_identity))
        TrustSignalRow(stringResource(R.string.trust_dossier_signal_background))
        TrustSignalRow(stringResource(R.string.trust_dossier_signal_reviews))
    }
}

@Composable
private fun TrustSignalRow(label: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Surface(
            modifier = Modifier.size(7.dp),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primary,
        ) {}
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun TrustDetailBlock(
    title: String,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
        )
        content()
    }
}

@Composable
private fun ProfileAvatar(
    profile: TechnicianProfile,
    size: Dp,
) {
    val photoUrl = profile.photoUrl
    val initial =
        profile.displayName
            .trim()
            .firstOrNull()
            ?.uppercaseChar()
            ?.toString()
            ?: "P"
    if (photoUrl.isNullOrBlank()) {
        Surface(
            modifier = Modifier.size(size),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primaryContainer,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = initial,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    } else {
        AsyncImage(
            model = photoUrl,
            contentDescription = profile.displayName,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(size).clip(CircleShape),
        )
    }
}

@Composable
private fun BadgeChip(label: String) {
    Surface(
        shape = MaterialTheme.shapes.extraLarge,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun PlaceholderLine(
    widthFraction: Float,
    height: Dp,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(widthFraction).height(height),
        shape = MaterialTheme.shapes.small,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {}
}

@Composable
private fun PlaceholderBlock(
    height: Dp,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth().height(height),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {}
}
