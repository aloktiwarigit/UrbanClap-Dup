package com.homeservices.technician.ui.activeJob

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.homeservices.technician.R

/**
 * Confirmation dialog presented before the final COMPLETE_JOB transition fires.
 * Completion is irreversible (the customer is notified and the job is archived),
 * so the technician must explicitly confirm.
 */
@Composable
public fun CompletionConfirmationDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = stringResource(R.string.complete_job_confirm_title)) },
        text = { Text(text = stringResource(R.string.complete_job_confirm_body)) },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(text = stringResource(R.string.complete_job_confirm_cta))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = stringResource(R.string.complete_job_cancel_cta))
            }
        },
    )
}
