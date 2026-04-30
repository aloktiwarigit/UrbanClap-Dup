package com.homeservices.customer.ui.tracking

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable

@Composable
internal fun SosConsentDialog(
    onGranted: () -> Unit,
    onDenied: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDenied,
        title = { Text("Record audio with alert?") },
        text = {
            Text("You can attach a short local audio recording to help owner support review the situation.")
        },
        confirmButton = {
            TextButton(onClick = onGranted) { Text("Allow") }
        },
        dismissButton = {
            TextButton(onClick = onDenied) { Text("Skip") }
        },
    )
}
