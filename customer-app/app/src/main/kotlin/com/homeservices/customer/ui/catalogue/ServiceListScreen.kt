package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ServiceListScreen(
    viewModel: ServiceListViewModel,
    onServiceClick: (String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.service_list_title)) },
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
        ServiceListContent(
            uiState = uiState,
            onServiceClick = onServiceClick,
            modifier = Modifier.padding(innerPadding),
        )
    }
}

@Composable
internal fun ServiceListContent(
    uiState: ServiceListUiState,
    onServiceClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (uiState) {
            is ServiceListUiState.Loading -> ServiceListSkeleton()
            is ServiceListUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = stringResource(R.string.catalogue_error),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(24.dp),
                    )
                }
            }
            is ServiceListUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                ) {
                    item {
                        Text(
                            text = stringResource(R.string.service_list_subtitle),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 12.dp),
                        )
                    }
                    items(uiState.services, key = { it.id }) { service ->
                        ServiceCard(service = service, onClick = { onServiceClick(service.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun ServiceCard(
    service: Service,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(modifier = Modifier.fillMaxWidth()) {
            if (service.imageUrl.isBlank()) {
                ServiceImageFallback(
                    name = service.name,
                    modifier = Modifier.fillMaxWidth(0.36f).aspectRatio(1f),
                )
            } else {
                AsyncImage(
                    model = service.imageUrl,
                    contentDescription = stringResource(R.string.service_image_desc, service.name),
                    modifier = Modifier.fillMaxWidth(0.36f).aspectRatio(1f),
                    contentScale = ContentScale.Crop,
                )
            }
            Column(modifier = Modifier.padding(14.dp).weight(1f)) {
                Text(
                    text = service.name,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = service.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = formatPrice(service.basePrice),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(stringResource(R.string.service_duration_label, service.durationMinutes))
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ServiceImageFallback(
    name: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().padding(12.dp)) {
            Text(
                text = name.take(2).uppercase(),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun ServiceListSkeleton(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
    ) {
        item {
            PlaceholderLine(widthFraction = 0.8f, height = 16.dp)
            Spacer(Modifier.height(12.dp))
        }
        items(5) {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant,
            ) {
                Row {
                    Surface(
                        modifier = Modifier.fillMaxWidth(0.36f).aspectRatio(1f),
                        color = MaterialTheme.colorScheme.outlineVariant,
                    ) {}
                    Column(modifier = Modifier.padding(14.dp).weight(1f)) {
                        PlaceholderLine(widthFraction = 0.78f, height = 18.dp)
                        Spacer(Modifier.height(10.dp))
                        PlaceholderLine(widthFraction = 0.92f, height = 12.dp)
                        Spacer(Modifier.height(8.dp))
                        PlaceholderLine(widthFraction = 0.5f, height = 14.dp)
                    }
                }
            }
        }
    }
}

@Composable
private fun PlaceholderLine(
    widthFraction: Float,
    height: androidx.compose.ui.unit.Dp,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(widthFraction).height(height),
        shape = MaterialTheme.shapes.small,
        color = MaterialTheme.colorScheme.outlineVariant,
    ) {}
}

private fun formatPrice(pricePaise: Int): String = "Rs ${pricePaise / 100}"
