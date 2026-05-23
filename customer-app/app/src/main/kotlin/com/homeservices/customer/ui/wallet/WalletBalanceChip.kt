package com.homeservices.customer.ui.wallet

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import com.homeservices.customer.R
import com.homeservices.customer.ui.util.formatInr

/**
 * A compact wallet-balance chip displayed on HomeScreen.
 *
 * Only shown when [balanceInPaise] > 0 and the `customer.wallet.visible` flag is on.
 * Tapping navigates to WalletScreen.
 */
@Composable
public fun WalletBalanceChip(
    balanceInPaise: Long,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AssistChip(
        onClick = onClick,
        label = {
            Text(
                text = formatInr(balanceInPaise),
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.primary,
            )
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.AccountBalanceWallet,
                contentDescription = stringResource(R.string.wallet_chip_content_desc),
                tint = MaterialTheme.colorScheme.primary,
            )
        },
        colors =
            AssistChipDefaults.assistChipColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                leadingIconContentColor = MaterialTheme.colorScheme.primary,
            ),
        border = AssistChipDefaults.assistChipBorder(enabled = true, borderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)),
        modifier = modifier,
    )
}
