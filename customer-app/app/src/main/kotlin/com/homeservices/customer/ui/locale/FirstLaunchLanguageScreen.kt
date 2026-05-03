package com.homeservices.customer.ui.locale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard

@Composable
public fun FirstLaunchLanguageScreen(
    onConfirmed: () -> Unit,
    viewModel: FirstLaunchLanguageViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val confirmed by viewModel.confirmedFlow.collectAsStateWithLifecycle()

    // Per Codex P2: keep navigation in a LaunchedEffect so it consumes the event once.
    // setApplicationLocales() can recreate the Activity; calling onConfirmed() during
    // composition would re-fire on every recomposition and pop past intended destinations.
    // Reset confirmedFlow before navigating so a recreated Activity restoring confirmed=true
    // does not retrigger.
    LaunchedEffect(confirmed) {
        if (confirmed) {
            viewModel.confirmedFlow.value = false
            onConfirmed()
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            HsTrustBadge(text = "Homeservices")
            Text(
                text = "Choose your language",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = "Language can be changed anytime from Settings.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selected,
                onSelect = viewModel::onSelect,
            )
            HsPrimaryButton(
                text = "Continue",
                onClick = viewModel::onConfirm,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
