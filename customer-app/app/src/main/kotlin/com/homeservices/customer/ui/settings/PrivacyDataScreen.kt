package com.homeservices.customer.ui.settings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsScreenTitle


/**
 * Settings → Privacy & data sub-screen.
 *
 * Minimal scaffold with two list items:
 *  - Download my data (DPDP data-export — Stream 2.3 / PR #211)
 *  - Delete account   (DPDP self-service erasure — Stream 2.4, this story)
 *
 * The delete-account row is gated behind [showDeleteAccount] (feature flag
 * `customer.dpdp-self-service.enabled`, default OFF).
 *
 * **Download row gating (FIX 3 / P2):** The "Download my data" row is only rendered
 * when [onDownloadData] is non-null. Stream 2.3 (PR #211) wires the actual route;
 * until that PR merges the callback is null here and the row is hidden. When PR #211
 * merges both the row and the route light up without further changes here.
 *
 * **Collision note (Stream 2.3):** Stream 2.3 (data-export UI) also adds this
 * sub-screen. Whichever PR merges first wins; the other rebases on top.
 *
 * @param onBack Navigate back to Settings root.
 * @param onDownloadData Navigate to the data-export screen (Stream 2.3). Pass null to hide the row.
 * @param onDeleteAccount Navigate to the delete-account entry screen.
 * @param showDeleteAccount Whether to show the delete-account row (feature flag).
 */
@Composable
public fun PrivacyDataScreen(
    onBack: () -> Unit,
    onDownloadData: (() -> Unit)?,
    onDeleteAccount: () -> Unit,
    showDeleteAccount: Boolean,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            // Top bar
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurface,
                    )
                }
                Spacer(Modifier.width(8.dp))
                HsScreenTitle(
                    text = stringResource(R.string.settings_privacy_and_data),
                )
            }

            // Download my data row — hidden until Stream 2.3 (PR #211) wires the actual route.
            if (onDownloadData != null) {
                PrivacyListItem(
                    icon = Icons.Default.CloudDownload,
                    iconBg = MaterialTheme.colorScheme.surfaceVariant,
                    iconTint = MaterialTheme.colorScheme.primary,
                    label = stringResource(R.string.settings_privacy_data_export_title),
                    onClick = onDownloadData,
                )
            }

            // Delete account row (feature-flagged)
            if (showDeleteAccount) {
                PrivacyListItem(
                    icon = Icons.Default.DeleteForever,
                    iconBg = MaterialTheme.colorScheme.errorContainer,
                    iconTint = MaterialTheme.colorScheme.error,
                    label = stringResource(R.string.settings_privacy_data_delete_title),
                    onClick = onDeleteAccount,
                    labelColor = MaterialTheme.colorScheme.error,
                )
            }
        }
    }
}

@Composable
private fun PrivacyListItem(
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    label: String,
    onClick: () -> Unit,
    labelColor: Color = Color.Unspecified,
) {
    val resolvedLabelColor = if (labelColor == Color.Unspecified) MaterialTheme.colorScheme.onSurface else labelColor
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        modifier =
            Modifier
                .fillMaxWidth()
                .height(80.dp)
                .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = iconBg) {
                Box(modifier = Modifier.size(48.dp), contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = iconTint)
                }
            }
            Spacer(Modifier.width(14.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = resolvedLabelColor,
                modifier = Modifier.weight(1f),
            )
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
