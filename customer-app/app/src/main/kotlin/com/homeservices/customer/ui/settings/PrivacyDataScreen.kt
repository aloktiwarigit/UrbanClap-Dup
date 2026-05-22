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
import androidx.compose.material.icons.filled.ManageAccounts
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

// Design tokens — consistent with SettingsScreen palette
private val WarmIvory = Color(0xFFFBF7EF)
private val BrandGreen = Color(0xFF0B3D2E)
private val MutedGreen = Color(0xFFE8F1EC)
private val ShieldBlue = Color(0xFFE8EDF5)
private val ShieldBlueTint = Color(0xFF1A4B8C)
private val ErrorRed = Color(0xFFB3261E)
private val ErrorRedSurface = Color(0xFFFFF0EE)
private val CardBorder = Color(0xFFDED8CD)
private val TextPrimary = Color(0xFF18231F)
private val TextSecondary = Color(0xFF5F6C66)

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
 * @param onManageConsentClick Navigate to the consent management screen (WS-D). Pass null to hide the row.
 */
@Composable
public fun PrivacyDataScreen(
    onBack: () -> Unit,
    onDownloadData: (() -> Unit)?,
    onDeleteAccount: () -> Unit,
    showDeleteAccount: Boolean,
    onManageConsentClick: (() -> Unit)? = null,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = WarmIvory) {
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
                        tint = TextPrimary,
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.settings_privacy_and_data),
                    style =
                        MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                        ),
                    color = TextPrimary,
                )
            }

            // Download my data row — hidden until Stream 2.3 (PR #211) wires the actual route.
            if (onDownloadData != null) {
                PrivacyListItem(
                    icon = Icons.Default.CloudDownload,
                    iconBg = MutedGreen,
                    iconTint = BrandGreen,
                    label = stringResource(R.string.settings_privacy_data_export_title),
                    onClick = onDownloadData,
                )
            }

            // Manage consent row — visible when callback is wired (WS-D)
            if (onManageConsentClick != null) {
                PrivacyListItem(
                    icon = Icons.Default.ManageAccounts,
                    iconBg = ShieldBlue,
                    iconTint = ShieldBlueTint,
                    label = "गोपनीयता सहमति प्रबंधित करें",
                    onClick = onManageConsentClick,
                )
            }

            // Delete account row (feature-flagged)
            if (showDeleteAccount) {
                PrivacyListItem(
                    icon = Icons.Default.DeleteForever,
                    iconBg = ErrorRedSurface,
                    iconTint = ErrorRed,
                    label = stringResource(R.string.settings_privacy_data_delete_title),
                    onClick = onDeleteAccount,
                    labelColor = ErrorRed,
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
    labelColor: Color = TextPrimary,
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        border = BorderStroke(1.dp, CardBorder),
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
                color = labelColor,
                modifier = Modifier.weight(1f),
            )
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = TextSecondary,
            )
        }
    }
}
