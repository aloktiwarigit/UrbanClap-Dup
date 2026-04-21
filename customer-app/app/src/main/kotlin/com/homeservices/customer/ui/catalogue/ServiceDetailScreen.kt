package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ServiceDetailScreen(
    viewModel: ServiceDetailViewModel,
    onBookNow: (serviceId: String, categoryId: String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.service_detail_back_desc),
                        )
                    }
                },
            )
        },
    ) { innerPadding ->
        ServiceDetailContent(
            uiState = uiState,
            onBookNow = onBookNow,
            modifier = Modifier.padding(innerPadding),
        )
    }
}

@Composable
internal fun ServiceDetailContent(
    uiState: ServiceDetailUiState,
    onBookNow: (serviceId: String, categoryId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (uiState) {
        is ServiceDetailUiState.Loading -> {
            Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is ServiceDetailUiState.Error -> {
            Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = stringResource(R.string.catalogue_error),
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }
        is ServiceDetailUiState.Success -> {
            ServiceDetailBody(
                service = uiState.service,
                onBookNow = { onBookNow(uiState.service.id, uiState.service.categoryId) },
                modifier = modifier,
            )
        }
    }
}

@Composable
private fun ServiceDetailBody(
    service: Service,
    onBookNow: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
    ) {
        AsyncImage(
            model = service.imageUrl,
            contentDescription = service.name,
            modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f),
            contentScale = ContentScale.Crop,
        )
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = service.name, style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(4.dp))
            Text(
                text = "₹${service.basePrice / 100}",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text(text = service.description, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))

            // Includes
            Text(
                text = stringResource(R.string.includes_label),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            service.includes.forEach { item ->
                Text(text = "• $item", style = MaterialTheme.typography.bodyMedium)
            }
            Spacer(Modifier.height(16.dp))

            // Add-ons
            if (service.addOns.isNotEmpty()) {
                Text(
                    text = stringResource(R.string.addons_label),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                service.addOns.forEach { addOn ->
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                        Text(text = addOn.name, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.weight(1f))
                        Text(
                            text = "+₹${addOn.price / 100}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                        )
                    }
                }
                Spacer(Modifier.height(16.dp))
            }

            // Trust Dossier stub
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(modifier = Modifier.padding(4.dp))
                    Text(
                        text = stringResource(R.string.trust_dossier_stub),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            Spacer(Modifier.height(16.dp))

            Button(
                onClick = onBookNow,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.book_now))
            }
        }
    }
}
