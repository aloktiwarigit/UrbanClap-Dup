package com.homeservices.customer.ui.deleteaccount

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsScreenTitle

// Design tokens â€” mirror DeleteAccountScreen palette
private val ErrorRed = Color(0xFFB3261E)
private val ErrorRedSurface = Color(0xFFFFF0EE)

// Identity gate: last-4 digits of registered phone number.
private const val PIN_LENGTH = 4

/**
 * Confirmation screen for account deletion.
 *
 * The user must:
 * 1. Type the locale-appropriate confirmation phrase exactly (phrase gate).
 * 2. Type the last 4 digits of their registered phone number (identity gate).
 *
 * Only when both match is the Submit button enabled.
 *
 * @param onBack Navigate back to the entry screen. The nav layer calls
 *   [DeleteAccountViewModel.onBackFromConfirmation] before invoking this callback (FIX 3 / P2).
 * @param onConfirmed Navigate to the cool-off screen after successful submission;
 *   receives (requestId, scheduledDeletionAt) from [DeleteAccountUiState.CoolOff].
 */
@Composable
public fun DeleteAccountConfirmScreen(
    onBack: () -> Unit,
    onConfirmed: (requestId: String, scheduledDeletionAt: String) -> Unit,
    viewModel: DeleteAccountViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val activity = LocalContext.current as? FragmentActivity
    val snackbarHostState = remember { SnackbarHostState() }

    // FIX 1 (P2 â€” system back bypasses onBackFromConfirmation):
    // System back gesture / button bypasses the in-app back control wired to [onBack].
    // BackHandler intercepts it and routes through the same lambda so
    // SettingsGraph's wrapper calls viewModel.onBackFromConfirmation() before popping.
    BackHandler { onBack() }

    val errorUnknown = stringResource(R.string.delete_account_error_unknown)

    // Navigate away when submission succeeds or a pre-existing request is detected.
    LaunchedEffect(uiState) {
        when (val s = uiState) {
            is DeleteAccountUiState.CoolOff -> onConfirmed(s.requestId, s.scheduledDeletionAt)
            is DeleteAccountUiState.ExistingRequestDetected -> onConfirmed(s.requestId, "")
            is DeleteAccountUiState.Error -> {
                val err = s
                snackbarHostState.showSnackbar(err.message.ifEmpty { errorUnknown })
                viewModel.onErrorDismissed()
            }
            else -> Unit
        }
    }

    val confirming = uiState as? DeleteAccountUiState.Confirming
    val isSubmitting = uiState is DeleteAccountUiState.Submitting

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
        ) {
            Column(
                modifier =
                    Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                DeleteAccountConfirmTopBar(onBack = onBack)

                DeleteAccountConfirmInstructionCard()

                DeleteAccountConfirmPhraseField(
                    confirming = confirming,
                    isSubmitting = isSubmitting,
                    onPhraseChanged = { viewModel.onPhraseChanged(it) },
                )

                DeleteAccountConfirmPinField(
                    confirming = confirming,
                    isSubmitting = isSubmitting,
                    onPinChanged = { if (it.length <= PIN_LENGTH) viewModel.onPinChanged(it) },
                )
            }

            DeleteAccountConfirmSubmitBar(
                confirming = confirming,
                isSubmitting = isSubmitting,
                onSubmitClicked = { viewModel.onSubmitClicked(activity) },
                onBack = onBack,
            )

            SnackbarHost(hostState = snackbarHostState) { data ->
                Snackbar(snackbarData = data, containerColor = ErrorRed)
            }
        }
    }
}

@Composable
private fun DeleteAccountConfirmTopBar(onBack: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurface,
            )
        }
        Spacer(Modifier.width(8.dp))
        HsScreenTitle(
            text = stringResource(R.string.delete_account_confirm_title),
        )
    }
}

@Composable
private fun DeleteAccountConfirmInstructionCard() {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = ErrorRedSurface,
        border = BorderStroke(1.dp, ErrorRed.copy(alpha = 0.3f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = ErrorRed,
                modifier = Modifier.size(20.dp),
            )
            Text(
                text = stringResource(R.string.delete_account_confirm_instruction),
                style = MaterialTheme.typography.bodyMedium,
                color = ErrorRed,
            )
        }
    }
}

@Composable
private fun DeleteAccountConfirmPhraseField(
    confirming: DeleteAccountUiState.Confirming?,
    isSubmitting: Boolean,
    onPhraseChanged: (String) -> Unit,
) {
    val phraseTyped = confirming?.typedPhrase ?: ""
    val phraseExpected = confirming?.phraseExpected ?: ""
    val isPhraseError = confirming != null && phraseTyped.isNotEmpty() && phraseTyped != phraseExpected

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = stringResource(R.string.delete_account_phrase_label),
            style =
                MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.SemiBold,
                ),
            color = MaterialTheme.colorScheme.onSurface,
        )
        // Show the expected phrase so the user knows what to type.
        Text(
            text = "\"$phraseExpected\"",
            style =
                MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                ),
            color = ErrorRed,
        )
        OutlinedTextField(
            value = phraseTyped,
            onValueChange = onPhraseChanged,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors =
                OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ErrorRed,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                ),
            isError = isPhraseError,
            supportingText =
                if (isPhraseError) {
                    { Text(stringResource(R.string.delete_account_phrase_mismatch), color = ErrorRed) }
                } else {
                    null
                },
            singleLine = true,
            enabled = !isSubmitting,
        )
    }
}

@Composable
private fun DeleteAccountConfirmPinField(
    confirming: DeleteAccountUiState.Confirming?,
    isSubmitting: Boolean,
    onPinChanged: (String) -> Unit,
) {
    val pinTyped = confirming?.typedPin ?: ""
    val isPinError = confirming != null && pinTyped.length == PIN_LENGTH && pinTyped != confirming.last4Expected

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                Icons.Default.Lock,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(16.dp),
            )
            Text(
                text = stringResource(R.string.delete_account_pin_label),
                style =
                    MaterialTheme.typography.labelLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                    ),
                color = MaterialTheme.colorScheme.onSurface,
            )
        }
        OutlinedTextField(
            value = pinTyped,
            onValueChange = onPinChanged,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors =
                OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ErrorRed,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                ),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            isError = isPinError,
            singleLine = true,
            enabled = !isSubmitting,
        )
    }
}

@Composable
private fun DeleteAccountConfirmSubmitBar(
    confirming: DeleteAccountUiState.Confirming?,
    isSubmitting: Boolean,
    onSubmitClicked: () -> Unit,
    onBack: () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
        Button(
            onClick = onSubmitClicked,
            enabled = (confirming?.isSubmitEnabled == true) && !isSubmitting,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(16.dp),
            colors =
                ButtonDefaults.buttonColors(
                    containerColor = ErrorRed,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                    disabledContainerColor = ErrorRed.copy(alpha = 0.38f),
                    disabledContentColor = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.6f),
                ),
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Icon(Icons.Default.DeleteForever, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.delete_account_submit_cta),
                    style =
                        MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                        ),
                )
            }
        }

        TextButton(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = stringResource(R.string.delete_account_cancel_cta),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
