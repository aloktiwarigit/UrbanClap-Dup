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
        title = { Text("Audio रिकॉर्डिंग") },
        text = {
            Text("क्या आप audio record करना चाहते हैं? यह सिर्फ आपके device पर save होगा।")
        },
        confirmButton = {
            TextButton(onClick = onGranted) { Text("हाँ") }
        },
        dismissButton = {
            TextButton(onClick = onDenied) { Text("नहीं") }
        },
    )
}
