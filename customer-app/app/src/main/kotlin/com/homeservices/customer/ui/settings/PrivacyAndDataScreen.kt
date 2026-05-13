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

private val PrivacyWarmIvory = Color(0xFFFBF7EF)
private val PrivacyBrandGreen = Color(0xFF0B3D2E)
private val PrivacyMutedGreen = Color(0xFFE8F1EC)
private val PrivacyCardBorder = Color(0xFFDED8CD)
private val PrivacyTextPrimary = Color(0xFF18231F)
private val PrivacyTextSecondary = Color(0xFF5F6C66)

/**
 * Privacy & data sub-screen under Settings.
 *
 * Contains two list items:
 *  - "Download my data" (routes to DataExportScreen, E15-S01)
 *  - "Delete account" — visible only when [onDeleteAccountClick] is non-null.
 *    Pass a non-null lambda only when `featureFlags.dpdpSelfServiceEnabled()` is
 *    true (wired in SettingsGraph).  Default is OFF until Play Store submission
 *    (per project DPDP policy).  E15-S02 (Stream 2.4) wires the actual route.
 *
 * Whichever of E15-S01 or E15-S02 merges first wins the scaffold. The other
 * branch should rebase rather than re-creating this composable.
 */
@Composable
public fun PrivacyAndDataScreen(
    onDownloadDataClick: () -> Unit,
    /**
     * Callback for the "Delete account" row.
     *
     * Pass `null` when `featureFlags.dpdpSelfServiceEnabled()` is `false` — the
     * row is hidden entirely so users on the flag-OFF path never see a broken stub.
     */
    onDeleteAccountClick: (() -> Unit)?,
    onBack: () -> Unit,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = PrivacyWarmIvory) {
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
                        tint = PrivacyTextPrimary,
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.settings_privacy_and_data),
                    style =
                        MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                        ),
                    color = PrivacyTextPrimary,
                )
            }

            // Download my data
            PrivacyListItem(
                icon = Icons.Default.CloudDownload,
                title = stringResource(R.string.settings_privacy_data_export_title),
                onClick = onDownloadDataClick,
            )

            // Delete account — hidden when flag is OFF (onDeleteAccountClick == null).
            // E15-S02 (Stream 2.4) wires the actual delete-account route; this gating
            // remains in place so the row is only visible when the flag is flipped ON.
            if (onDeleteAccountClick != null) {
                PrivacyListItem(
                    icon = Icons.Default.DeleteForever,
                    title = stringResource(R.string.settings_privacy_data_delete_title),
                    onClick = onDeleteAccountClick,
                )
            }
        }
    }
}

@Composable
private fun PrivacyListItem(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        border = BorderStroke(1.dp, PrivacyCardBorder),
        modifier =
            Modifier
                .fillMaxWidth()
                .height(72.dp)
                .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(shape = RoundedCornerShape(14.dp), color = PrivacyMutedGreen) {
                Box(modifier = Modifier.size(44.dp), contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = PrivacyBrandGreen)
                }
            }
            Spacer(Modifier.width(14.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                color = PrivacyTextPrimary,
                modifier = Modifier.weight(1f),
            )
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = PrivacyTextSecondary,
            )
        }
    }
}
