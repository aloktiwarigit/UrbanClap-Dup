package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.customer.ui.shared.TrustDossierCard
import com.homeservices.customer.ui.shared.TrustDossierUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ServiceDetailScreen(
    viewModel: ServiceDetailViewModel,
    onBookNow: (serviceId: String, categoryId: String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val confidenceScoreState by viewModel.confidenceScoreState.collectAsStateWithLifecycle()
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
            confidenceScoreState = confidenceScoreState,
            onBookNow = onBookNow,
            modifier = Modifier.padding(innerPadding),
        )
    }
}

@Composable
internal fun ServiceDetailContent(
    uiState: ServiceDetailUiState,
    confidenceScoreState: ConfidenceScoreUiState,
    onBookNow: (serviceId: String, categoryId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (uiState) {
            is ServiceDetailUiState.Loading -> ServiceDetailSkeleton()
            is ServiceDetailUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = stringResource(R.string.catalogue_error),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(24.dp),
                    )
                }
            }
            is ServiceDetailUiState.Success -> {
                ServiceDetailBody(
                    service = uiState.service,
                    confidenceScoreState = confidenceScoreState,
                    onBookNow = { onBookNow(uiState.service.id, uiState.service.categoryId) },
                )
            }
        }
    }
}

@Composable
private fun ServiceDetailBody(
    service: Service,
    confidenceScoreState: ConfidenceScoreUiState,
    onBookNow: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxSize()) {
        Column(
            modifier =
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
        ) {
            if (service.imageUrl.isBlank()) {
                ServiceHeroFallback(
                    name = service.name,
                    modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f),
                )
            } else {
                AsyncImage(
                    model = service.imageUrl,
                    contentDescription = stringResource(R.string.service_image_desc, service.name),
                    modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f),
                    contentScale = ContentScale.Crop,
                )
            }
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = service.name,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = service.description,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = formatPrice(service.basePrice),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Spacer(Modifier.weight(1f))
                        Surface(
                            shape = MaterialTheme.shapes.small,
                            color = MaterialTheme.colorScheme.primaryContainer,
                        ) {
                            Text(
                                text = stringResource(R.string.service_duration_label, service.durationMinutes),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            )
                        }
                    }
                }

                TrustDossierCard(
                    uiState = TrustDossierUiState.Unavailable,
                    compact = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                ConfidenceScoreRow(
                    uiState = confidenceScoreState,
                    modifier = Modifier.fillMaxWidth(),
                )
                ServiceSection(title = stringResource(R.string.includes_label)) {
                    service.includes.forEach { item ->
                        Text(
                            text = "- $item",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
                if (service.addOns.isNotEmpty()) {
                    ServiceSection(title = stringResource(R.string.addons_label)) {
                        service.addOns.forEach { addOn ->
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = addOn.name,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.weight(1f),
                                )
                                Text(
                                    text = "+${formatPrice(addOn.price)}",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }
                    }
                }
                Spacer(Modifier.height(72.dp))
            }
        }
        Surface(
            shadowElevation = 8.dp,
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stringResource(R.string.service_price_label),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = formatPrice(service.basePrice),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                }
                Button(onClick = onBookNow) {
                    Text(stringResource(R.string.book_now))
                }
            }
        }
    }
}

@Composable
private fun ServiceHeroFallback(
    name: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().padding(24.dp)) {
            Text(
                text = name,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun ServiceSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            content()
        }
    }
}

@Composable
private fun ServiceDetailSkeleton(modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize()) {
        Surface(
            modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f),
            color = MaterialTheme.colorScheme.surfaceVariant,
        ) {}
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            PlaceholderLine(widthFraction = 0.72f, height = 30.dp)
            PlaceholderLine(widthFraction = 0.95f, height = 16.dp)
            PlaceholderLine(widthFraction = 0.52f, height = 28.dp)
            repeat(3) {
                Surface(
                    modifier = Modifier.fillMaxWidth().height(92.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.surfaceVariant,
                ) {}
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
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {}
}

private fun formatPrice(pricePaise: Int): String = "Rs ${pricePaise / 100}"
