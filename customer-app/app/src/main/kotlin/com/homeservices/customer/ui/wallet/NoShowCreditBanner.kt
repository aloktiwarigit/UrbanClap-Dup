package com.homeservices.customer.ui.wallet

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.homeservices.customer.R
import com.homeservices.designsystem.format.formatRupees
import kotlinx.coroutines.delay

private const val AUTO_DISMISS_MS = 5_000L

/**
 * Full-width toast banner shown when a no-show credit FCM arrives.
 *
 * Auto-dismisses after 5 seconds via [LaunchedEffect]. Tap on the dismiss
 * button calls [onDismiss] immediately.
 */
@Composable
public fun NoShowCreditBanner(
    creditAmountPaise: Long,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LaunchedEffect(true) {
        delay(AUTO_DISMISS_MS)
        onDismiss()
    }

    val bannerText = stringResource(R.string.no_show_credit_banner, formatRupees(creditAmountPaise))
    val dismissDesc = stringResource(R.string.no_show_credit_banner_dismiss)

    Surface(
        modifier =
            modifier
                .fillMaxWidth()
                .semantics { contentDescription = bannerText },
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.primary,
        tonalElevation = 4.dp,
        shadowElevation = 4.dp,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Default.AccountBalanceWallet,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(20.dp),
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = bannerText,
                color = MaterialTheme.colorScheme.onPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f),
            )
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(32.dp),
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = dismissDesc,
                    tint = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
    }
}
