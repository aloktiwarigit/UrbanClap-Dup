package com.homeservices.technician.ui.myratings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.technician.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun RatingAppealSheet(
    bookingId: String,
    onDismiss: () -> Unit,
    onSubmit: (bookingId: String, reason: String) -> Unit,
    isSubmitting: Boolean,
    modifier: Modifier = Modifier,
) {
    var reason by rememberSaveable { mutableStateOf("") }
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
                text = stringResource(R.string.rating_appeal_title),
                style = MaterialTheme.typography.titleLarge,
            )
            Text(
                text = stringResource(R.string.rating_appeal_subtitle),
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
                placeholder = { Text(stringResource(R.string.rating_appeal_reason_placeholder)) },
                enabled = !isSubmitting,
            )
            Text(
                text = stringResource(R.string.rating_appeal_char_count, reason.length),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            HsPrimaryButton(
                text =
                    if (isSubmitting) {
                        stringResource(R.string.rating_appeal_submitting)
                    } else {
                        stringResource(R.string.rating_appeal_submit)
                    },
                onClick = { onSubmit(bookingId, reason) },
                modifier =
                    Modifier
                        .fillMaxWidth(),
                enabled = canSubmit,
            )
        }
    }
}
