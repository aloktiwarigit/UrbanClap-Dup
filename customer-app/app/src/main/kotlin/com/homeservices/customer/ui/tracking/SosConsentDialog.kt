package com.homeservices.customer.ui.tracking

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.homeservices.customer.R

@Composable
internal fun SosConsentDialog(
    onGranted: () -> Unit,
    onDenied: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDenied,
        title = { Text(stringResource(R.string.sos_consent_title)) },
        text = {
            Text(stringResource(R.string.sos_consent_body))
        },
        confirmButton = {
            TextButton(onClick = onGranted) { Text(stringResource(R.string.sos_consent_allow)) }
        },
        dismissButton = {
            TextButton(onClick = onDenied) { Text(stringResource(R.string.sos_consent_skip)) }
        },
    )
}
