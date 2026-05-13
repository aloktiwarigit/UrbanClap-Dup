package com.homeservices.customer.ui.deleteaccount

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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R

// Design tokens — mirror DeleteAccountScreen palette
private val WarmIvory = Color(0xFFFBF7EF)
private val ErrorRed = Color(0xFFB3261E)
private val ErrorRedSurface = Color(0xFFFFF0EE)
private val CardBorder = Color(0xFFDED8CD)
private val TextPrimary = Color(0xFF18231F)
private val TextSecondary = Color(0xFF5F6C66)

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
    val snackbarHostState = remember { SnackbarHostState() }

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

    Surface(modifier = Modifier.fillMaxSize(), color = WarmIvory) {
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
                // Top bar
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = null,
                            tint = TextPrimary,
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.delete_account_confirm_title),
                        style =
                            MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                            ),
                        color = TextPrimary,
                    )
                }

                // Phrase instruction card
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

                // Phrase text field
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = stringResource(R.string.delete_account_phrase_label),
                        style =
                            MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                            ),
                        color = TextPrimary,
                    )
                    // Show the expected phrase so the user knows what to type.
                    Text(
                        text = "\"${confirming?.phraseExpected ?: ""}\"",
                        style =
                            MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                            ),
                        color = ErrorRed,
                    )
                    OutlinedTextField(
                        value = confirming?.typedPhrase ?: "",
                        onValueChange = { viewModel.onPhraseChanged(it) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors =
                            OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ErrorRed,
                                unfocusedBorderColor = CardBorder,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                            ),
                        isError =
                            confirming != null &&
                                confirming.typedPhrase.isNotEmpty() &&
                                confirming.typedPhrase != confirming.phraseExpected,
                        supportingText =
                            if (confirming != null &&
                                confirming.typedPhrase.isNotEmpty() &&
                                confirming.typedPhrase != confirming.phraseExpected
                            ) {
                                {
                                    Text(
                                        stringResource(R.string.delete_account_phrase_mismatch),
                                        color = ErrorRed,
                                    )
                                }
                            } else {
                                null
                            },
                        singleLine = true,
                        enabled = !isSubmitting,
                    )
                }

                // PIN / last4 field
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Icon(
                            Icons.Default.Lock,
                            contentDescription = null,
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp),
                        )
                        Text(
                            text = stringResource(R.string.delete_account_pin_label),
                            style =
                                MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = FontWeight.SemiBold,
                                ),
                            color = TextPrimary,
                        )
                    }
                    OutlinedTextField(
                        value = confirming?.typedPin ?: "",
                        onValueChange = { if (it.length <= 4) viewModel.onPinChanged(it) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors =
                            OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ErrorRed,
                                unfocusedBorderColor = CardBorder,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                            ),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        isError =
                            confirming != null &&
                                confirming.typedPin.length == 4 &&
                                confirming.typedPin != confirming.last4Expected,
                        singleLine = true,
                        enabled = !isSubmitting,
                    )
                }
            }

            // Sticky submit button
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                Button(
                    onClick = { viewModel.onSubmitClicked() },
                    enabled = (confirming?.isSubmitEnabled == true) && !isSubmitting,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors =
                        ButtonDefaults.buttonColors(
                            containerColor = ErrorRed,
                            contentColor = Color.White,
                            disabledContainerColor = ErrorRed.copy(alpha = 0.38f),
                            disabledContentColor = Color.White.copy(alpha = 0.6f),
                        ),
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = Color.White,
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
                        color = TextSecondary,
                    )
                }
            }

            SnackbarHost(hostState = snackbarHostState) { data ->
                Snackbar(snackbarData = data, containerColor = ErrorRed)
            }
        }
    }
}
