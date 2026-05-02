package com.homeservices.customer.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard

@Composable
public fun LanguageSettingsScreen(
    onSaved: () -> Unit,
    viewModel: LanguageSettingsViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val saved by viewModel.savedFlow.collectAsStateWithLifecycle()

    if (saved) onSaved()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = stringResource(R.string.settings_language_title),
                style = MaterialTheme.typography.headlineSmall,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selected,
                onSelect = viewModel::onSelect,
            )
            Button(onClick = viewModel::onSave, modifier = Modifier.fillMaxWidth()) {
                Text(text = stringResource(R.string.settings_language_save))
            }
        }
    }
}
