package com.homeservices.technician.ui.kyc

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.theme.HomeservicesColors
import com.homeservices.technician.R

/**
 * KYC-screen retry strip surfaced when a PAN photo upload is queued in the local
 * pending-actions table. Visually consistent with the [com.homeservices.technician.ui.kyc.KycScreen]
 * hero gradient: brand-hover background with white text + warning icon.
 *
 * Distinct from [com.homeservices.technician.ui.activeJob.PhotoUploadRetryBanner],
 * which uses the Material `tertiaryContainer` palette for the job-execution context.
 *
 * @param onRetry Called when the technician taps the trailing retry button.
 * @param modifier Layout modifier applied to the outer row.
 */
@Composable
public fun PhotoUploadRetryBanner(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier =
            modifier
                .fillMaxWidth()
                .background(
                    color = HomeservicesColors.Brand.primaryHover,
                    shape = RoundedCornerShape(12.dp),
                ).padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Filled.CloudUpload,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp),
            )
            Spacer(Modifier.width(12.dp))
            Text(
                text = stringResource(R.string.photo_upload_retry_banner_label),
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White,
            )
        }
        TextButton(
            onClick = onRetry,
            colors =
                ButtonDefaults.textButtonColors(
                    contentColor = Color.White,
                ),
        ) {
            Text(text = stringResource(R.string.photo_upload_retry_banner_action))
        }
    }
}
