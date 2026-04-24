package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
internal fun ServiceDetailScreen(
    viewModel: ServiceDetailViewModel,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val confidenceScoreState by viewModel.confidenceScoreState.collectAsStateWithLifecycle()

    Scaffold { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
        ) {
            when (uiState) {
                is ServiceDetailUiState.Loading -> Text("Loading...")
                is ServiceDetailUiState.Error ->
                    Text(text = (uiState as ServiceDetailUiState.Error).message, color = MaterialTheme.colorScheme.error)
                is ServiceDetailUiState.Success -> {
                    Text(
                        text = "Service: ${(uiState as ServiceDetailUiState.Success).serviceId}",
                        style = MaterialTheme.typography.headlineMedium,
                    )
                    Spacer(Modifier.height(8.dp))
                    ConfidenceScoreRow(
                        uiState = confidenceScoreState,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}
