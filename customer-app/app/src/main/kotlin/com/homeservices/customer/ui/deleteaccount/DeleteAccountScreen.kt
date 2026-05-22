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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsScreenTitle

// Design tokens — consistent with SettingsScreen palette
private val ErrorRed = Color(0xFFB3261E)
private val ErrorRedSurface = Color(0xFFFFF0EE)

/**
 * Entry point for the delete-account flow.
 *
 * Shows a warning card, a list of what gets deleted, and a "Continue" CTA.
 * Always starts in Idle state — the old POST-probe active-check has been removed
 * (DPDP-CRITICAL P1 fix; see DeleteAccountViewModel for details).
 *
 * If a pre-existing pending request is detected (409 on submit), the ViewModel
 * transitions to [DeleteAccountUiState.ExistingRequestDetected] and navigation
 * routes to the cool-off screen via [onNavigateToCoolOff].
 *
 * @param onBack Navigate back to Privacy & data settings.
 * @param onContinue Navigate to [DeleteAccountConfirmScreen].
 * @param onNavigateToCoolOff Navigate to [DeleteAccountCoolOffScreen]; receives (requestId, scheduledDeletionAt).
 */
@Composable
public fun DeleteAccountScreen(
    onBack: () -> Unit,
    onContinue: () -> Unit,
    onNavigateToCoolOff: (requestId: String, scheduledDeletionAt: String) -> Unit,
    viewModel: DeleteAccountViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Set the locale-appropriate confirmation phrase so the ViewModel can build Confirming state.
    val confirmationPhrase = stringResource(R.string.delete_my_account_confirmation_phrase)
    LaunchedEffect(confirmationPhrase) {
        viewModel.expectedPhrase = confirmationPhrase
    }

    // Route side-effects: navigate when state changes.
    // FIX 3 (P2): onBackFromConfirmation() resets state to Idle before popping from the
    // confirmation screen, so the Confirming branch here does not re-fire on re-entry.
    LaunchedEffect(uiState) {
        when (val s = uiState) {
            is DeleteAccountUiState.Confirming -> onContinue()
            is DeleteAccountUiState.CoolOff ->
                onNavigateToCoolOff(s.requestId, s.scheduledDeletionAt)
            is DeleteAccountUiState.ExistingRequestDetected ->
                onNavigateToCoolOff(s.requestId, "")
            else -> Unit
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            DeleteAccountTopBar(onBack = onBack)

            DeleteAccountWarningCard()

            DeleteAccountWhatDeletedCard()

            Spacer(Modifier.weight(1f))

            DeleteAccountContinueButton(onContinueClicked = { viewModel.onContinueClicked() })
        }
    }
}

@Composable
private fun DeleteAccountTopBar(onBack: () -> Unit) {
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
            text = stringResource(R.string.delete_account_title),
        )
    }
}

@Composable
private fun DeleteAccountWarningCard() {
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
                modifier = Modifier.size(24.dp),
            )
            Text(
                text = stringResource(R.string.delete_account_warning),
                style = MaterialTheme.typography.bodyMedium,
                color = ErrorRed,
            )
        }
    }
}

@Composable
private fun DeleteAccountWhatDeletedCard() {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.delete_account_what_deleted_label),
                style =
                    MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                    ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(12.dp))
            DeletionItem(
                icon = Icons.Default.Bookmark,
                labelRes = R.string.delete_account_item_bookings,
            )
            HorizontalDivider(color = MaterialTheme.colorScheme.outline, modifier = Modifier.padding(vertical = 8.dp))
            DeletionItem(
                icon = Icons.Default.Home,
                labelRes = R.string.delete_account_item_addresses,
            )
            HorizontalDivider(color = MaterialTheme.colorScheme.outline, modifier = Modifier.padding(vertical = 8.dp))
            DeletionItem(
                icon = Icons.Default.CreditCard,
                labelRes = R.string.delete_account_item_payment_methods,
            )
            HorizontalDivider(color = MaterialTheme.colorScheme.outline, modifier = Modifier.padding(vertical = 8.dp))
            DeletionItem(
                icon = Icons.Default.Settings,
                labelRes = R.string.delete_account_item_preferences,
            )
        }
    }
}

@Composable
private fun DeleteAccountContinueButton(onContinueClicked: () -> Unit) {
    Button(
        onClick = onContinueClicked,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(16.dp),
        colors =
            ButtonDefaults.buttonColors(
                containerColor = ErrorRed,
                contentColor = MaterialTheme.colorScheme.onPrimary,
            ),
    ) {
        Icon(Icons.Default.DeleteForever, contentDescription = null)
        Spacer(Modifier.width(8.dp))
        Text(
            text = stringResource(R.string.delete_account_continue_cta),
            style =
                MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                ),
        )
    }
}

@Composable
private fun DeletionItem(
    icon: ImageVector,
    labelRes: Int,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
        Text(
            text = stringResource(labelRes),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}
