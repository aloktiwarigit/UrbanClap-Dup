package com.homeservices.customer.ui.tracking

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalBottomSheetProperties
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsDangerButton
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SosBottomSheet(
    secondsLeft: Int,
    onCancel: () -> Unit,
    onConfirmNow: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    // SAFE-SOS-001: an armed SOS must NOT be disarmed by an incidental gesture. Swipe-down, scrim
    // tap and system back previously all routed to onCancel, so a customer fumbling their phone
    // during the exact incident SOS exists for would silently cancel it. Dismissal is now inert;
    // cancelling requires the explicit "Cancel alert" action below.
    ModalBottomSheet(
        onDismissRequest = {},
        sheetState = sheetState,
        properties = ModalBottomSheetProperties(shouldDismissOnBackPress = false),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                stringResource(R.string.sos_safety_alert),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = pluralStringResource(R.plurals.sos_sending_in, secondsLeft, secondsLeft),
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.error,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = stringResource(R.string.sos_send_body),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(24.dp))
            // SAFE-SOS-004: emergency dispatch carries danger colour, not brand primary.
            HsDangerButton(
                text = stringResource(R.string.sos_send_now),
                onClick = onConfirmNow,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            HsSecondaryButton(
                text = stringResource(R.string.sos_cancel_alert),
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SosUploadingEvidenceSheet(
    pct: Int,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                stringResource(R.string.sos_uploading_evidence, pct),
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { pct / 100f },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SosEvidenceSavedSheet(onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                stringResource(R.string.sos_evidence_saved),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

/**
 * SAFE-SOS-006: the upload failure reason was previously computed, passed in as [message], and then
 * discarded behind `@Suppress("UnusedParameter")` — the sheet rendered a generic string and offered
 * dismissal only, so safety evidence tied to a live emergency was lost with no way to recover it.
 * The reason is now shown, and [onRetry] re-attempts the upload.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SosEvidenceUploadErrorSheet(
    message: String,
    onRetry: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                stringResource(R.string.sos_evidence_upload_error),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
            )
            if (message.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
            Spacer(Modifier.height(16.dp))
            HsPrimaryButton(
                text = stringResource(R.string.sos_evidence_retry),
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            HsSecondaryButton(
                text = stringResource(R.string.sos_evidence_dismiss),
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}
