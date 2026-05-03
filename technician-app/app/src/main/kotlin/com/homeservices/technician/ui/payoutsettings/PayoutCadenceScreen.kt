package com.homeservices.technician.ui.payoutsettings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton

private data class CadenceOption(
    val value: String,
    val label: String,
    val detail: String,
    val feeLabel: String,
)

private val CADENCE_OPTIONS =
    listOf(
        CadenceOption("WEEKLY", "साप्ताहिक (मुफ्त)", "हर सोमवार", "मुफ्त"),
        CadenceOption("NEXT_DAY", "अगले दिन (₹15)", "सुबह 10 बजे तक", "₹15/पेमेंट"),
        CadenceOption("INSTANT", "तुरंत (₹25)", "जॉब के 30 मिनट में", "₹25/पेमेंट"),
    )

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun PayoutCadenceScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PayoutCadenceViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is PayoutCadenceUiState.SaveSuccess -> {
                snackbarHostState.showSnackbar("सेटिंग सेव हो गई")
                onBack()
            }
            is PayoutCadenceUiState.Error -> {
                snackbarHostState.showSnackbar(state.message)
            }
            else -> Unit
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("पेमेंट सेटिंग") }) },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier,
    ) { padding ->
        when (val state = uiState) {
            is PayoutCadenceUiState.Loading -> {
                Column(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    CircularProgressIndicator()
                }
            }
            is PayoutCadenceUiState.Ready -> {
                ReadyContent(
                    state = state,
                    onSelectCadence = viewModel::selectCadence,
                    onSave = {
                        val activity = context as? FragmentActivity
                        if (activity != null) viewModel.saveCadence(activity)
                    },
                    modifier = Modifier.fillMaxSize().padding(padding),
                )
            }
            is PayoutCadenceUiState.SaveSuccess, is PayoutCadenceUiState.Error -> {
                // Handled by LaunchedEffect — show nothing additional
            }
        }
    }
}

@Composable
private fun ReadyContent(
    state: PayoutCadenceUiState.Ready,
    onSelectCadence: (String) -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("पेमेंट कब चाहिए?", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(4.dp))

        CADENCE_OPTIONS.forEach { option ->
            CadenceCard(
                option = option,
                isSelected = state.selectedCadence == option.value,
                onClick = { onSelectCadence(option.value) },
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        HsPrimaryButton(
            text = if (state.isSaving) "Saving..." else "\u0938\u0947\u0935 \u0915\u0930\u0947\u0902",
            onClick = onSave,
            enabled = state.isDirty && !state.isSaving,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun CadenceCard(
    option: CadenceOption,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            RadioButton(selected = isSelected, onClick = onClick)
            Column(modifier = Modifier.weight(1f)) {
                Text(option.label, style = MaterialTheme.typography.bodyLarge)
                Text(option.detail, style = MaterialTheme.typography.bodySmall)
            }
            Text(option.feeLabel, style = MaterialTheme.typography.labelMedium)
        }
    }
}
