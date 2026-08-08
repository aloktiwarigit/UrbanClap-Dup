package com.homeservices.technician.ui.activeJob

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.technician.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ShieldReportSheet(
    onDismiss: () -> Unit,
    onSubmit: (description: String?) -> Unit,
    isSubmitting: Boolean,
    modifier: Modifier = Modifier,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = modifier,
    ) {
        ShieldReportSheetContent(onSubmit = onSubmit, isSubmitting = isSubmitting)
    }
}

/**
 * Pure content of [ShieldReportSheet], extracted so Paparazzi can snapshot it directly —
 * ModalBottomSheet's entrance animation never settles within Paparazzi's single-frame
 * capture, which renders the sheet blank. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
@Composable
internal fun ShieldReportSheetContent(
    onSubmit: (description: String?) -> Unit,
    isSubmitting: Boolean,
    modifier: Modifier = Modifier,
) {
    var description by rememberSaveable { mutableStateOf("") }

    Surface(modifier = modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.surface) {
        Column(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = stringResource(R.string.shield_report_title),
                style = MaterialTheme.typography.titleLarge,
            )
            Text(
                text = stringResource(R.string.shield_report_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = description,
                onValueChange = {
                    if (it.length <= 500) description = it
                },
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                maxLines = 4,
                placeholder = { Text(stringResource(R.string.shield_description_placeholder)) },
                enabled = !isSubmitting,
            )
            Text(
                text = stringResource(R.string.shield_report_char_count, description.length),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline,
                modifier = Modifier.fillMaxWidth(),
            )
            Text(
                text = stringResource(R.string.shield_report_block_warning),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                HsPrimaryButton(
                    text =
                        if (isSubmitting) {
                            stringResource(R.string.shield_report_submitting)
                        } else {
                            stringResource(R.string.shield_report_submit)
                        },
                    onClick = { onSubmit(description.takeIf { it.isNotBlank() }) },
                    modifier =
                        Modifier
                            .fillMaxWidth(),
                    enabled = !isSubmitting,
                )
            }
        }
    }
}
