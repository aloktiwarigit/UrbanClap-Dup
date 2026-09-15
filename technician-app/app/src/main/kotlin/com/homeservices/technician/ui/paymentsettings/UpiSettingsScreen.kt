package com.homeservices.technician.ui.paymentsettings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.technician.R

@Composable
internal fun UpiSettingsScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: UpiSettingsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    UpiSettingsScreenContent(
        uiState = uiState,
        onVpaChange = viewModel::updateVpaInput,
        onSave = {
            val activity = context as? FragmentActivity
            if (activity != null) viewModel.save(activity)
        },
        onSaveSuccessConsumed = onBack,
        modifier = modifier,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun UpiSettingsScreenContent(
    uiState: UpiSettingsUiState,
    onVpaChange: (String) -> Unit,
    onSave: () -> Unit,
    onSaveSuccessConsumed: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is UpiSettingsUiState.SaveSuccess -> {
                snackbarHostState.showSnackbar("यूपीआई आईडी सेव हो गई")
                onSaveSuccessConsumed()
            }
            is UpiSettingsUiState.Error -> {
                snackbarHostState.showSnackbar(state.message)
            }
            is UpiSettingsUiState.Ready -> Unit
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text(stringResource(R.string.upi_settings_title)) }) },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier,
    ) { padding ->
        val readyState = uiState as? UpiSettingsUiState.Ready ?: UpiSettingsUiState.Ready(vpaInput = "")
        ReadyContent(
            state = readyState,
            onVpaChange = onVpaChange,
            onSave = onSave,
            modifier = Modifier.fillMaxSize().padding(padding),
        )
    }
}

@Composable
private fun ReadyContent(
    state: UpiSettingsUiState.Ready,
    onVpaChange: (String) -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        OutlinedTextField(
            value = state.vpaInput,
            onValueChange = onVpaChange,
            label = { Text(stringResource(R.string.upi_settings_vpa_label)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Text(
            text = stringResource(R.string.upi_settings_warning),
            style = MaterialTheme.typography.bodySmall,
        )

        HsPrimaryButton(
            text = stringResource(R.string.upi_settings_save_cta),
            onClick = onSave,
            enabled = state.vpaInput.isNotBlank() && !state.isSaving,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
