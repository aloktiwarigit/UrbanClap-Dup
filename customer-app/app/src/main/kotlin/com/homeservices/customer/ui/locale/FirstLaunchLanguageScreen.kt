package com.homeservices.customer.ui.locale

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard

@Composable
public fun FirstLaunchLanguageScreen(
    onConfirmed: () -> Unit,
    viewModel: FirstLaunchLanguageViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val confirmed by viewModel.confirmedFlow.collectAsStateWithLifecycle()

    if (confirmed) {
        onConfirmed()
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Choose your language\nभाषा चुनें",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selected,
                onSelect = viewModel::onSelect,
            )
            Button(onClick = viewModel::onConfirm, modifier = Modifier.fillMaxWidth()) {
                Text(text = "Continue / जारी रखें")
            }
        }
    }
}
