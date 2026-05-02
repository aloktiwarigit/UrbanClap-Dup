package com.homeservices.technician.ui.myratings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun RatingAppealSheet(
    bookingId: String,
    onDismiss: () -> Unit,
    onSubmit: (bookingId: String, reason: String) -> Unit,
    isSubmitting: Boolean,
    modifier: Modifier = Modifier,
) {
    var reason by remember { mutableStateOf("") }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val canSubmit = reason.length >= 20 && !isSubmitting

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = modifier,
    ) {
        Column(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "रेटिंग अपील",
                style = MaterialTheme.typography.titleLarge,
            )
            Text(
                text = "क्यों रेटिंग गलत है? (कम से कम 20 अक्षर)",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = reason,
                onValueChange = {
                    if (it.length <= 500) reason = it
                },
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                maxLines = 5,
                placeholder = { Text("कारण लिखें…") },
                enabled = !isSubmitting,
            )
            Text(
                text = "${reason.length}/500",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { onSubmit(bookingId, reason) },
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                enabled = canSubmit,
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text("अपील दर्ज करें")
                }
            }
        }
    }
}
