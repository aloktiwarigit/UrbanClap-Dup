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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import com.homeservices.customer.domain.catalogue.model.Category

@Composable
internal fun CatalogueHomeScreen(
    viewModel: CatalogueHomeViewModel,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    CatalogueHomeContent(uiState = uiState, onCategoryClick = onCategoryClick, onSettingsClick = onSettingsClick)
}

@Composable
internal fun CatalogueHomeContent(
    uiState: CatalogueHomeUiState,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (uiState) {
            is CatalogueHomeUiState.Loading -> {
                CatalogueLoadingSkeleton()
            }
            is CatalogueHomeUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    ErrorMessage()
                }
            }
            is CatalogueHomeUiState.Success -> {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                ) {
                    item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
                        StorefrontHeader(onSettingsClick = onSettingsClick)
                    }
                    items(uiState.categories, key = { it.id }) { category ->
                        CategoryCard(
                            category = category,
                            onClick = { onCategoryClick(category.id) },
                            modifier = Modifier.padding(6.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StorefrontHeader(onSettingsClick: () -> Unit) {
    Row(
        verticalAlignment = Alignment.Top,
        modifier = Modifier.fillMaxWidth().padding(bottom = 14.dp),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = stringResource(R.string.catalogue_home_title),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.catalogue_home_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(10.dp))
            AssistChip(
                onClick = {},
                label = { Text(stringResource(R.string.catalogue_trust_chip)) },
            )
        }
        IconButton(onClick = onSettingsClick) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = stringResource(R.string.settings_title),
            )
        }
    }
}

@Composable
private fun CategoryCard(
    category: Category,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        colors =
            CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface,
            ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column {
            if (category.imageUrl.isBlank()) {
                CategoryImageFallback(
                    name = category.name,
                    modifier = Modifier.aspectRatio(1f).fillMaxWidth(),
                )
            } else {
                AsyncImage(
                    model = category.imageUrl,
                    contentDescription = stringResource(R.string.category_image_desc, category.name),
                    modifier = Modifier.aspectRatio(1f).fillMaxWidth(),
                    contentScale = ContentScale.Crop,
                )
            }
            Text(
                text = category.name,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(start = 12.dp, top = 10.dp, end = 12.dp),
            )
            Text(
                text = stringResource(R.string.category_service_count, category.serviceCount),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 12.dp, top = 2.dp, end = 12.dp, bottom = 12.dp),
            )
        }
    }
}

@Composable
private fun CategoryImageFallback(
    name: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text(
                text = name.take(2).uppercase(),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun CatalogueLoadingSkeleton() {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
    ) {
        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
            Column(modifier = Modifier.padding(bottom = 14.dp)) {
                PlaceholderLine(widthFraction = 0.55f, height = 34.dp)
                Spacer(Modifier.height(10.dp))
                PlaceholderLine(widthFraction = 0.82f, height = 16.dp)
                Spacer(Modifier.height(14.dp))
                PlaceholderLine(widthFraction = 0.48f, height = 32.dp)
            }
        }
        items(6) {
            PlaceholderCard(modifier = Modifier.padding(6.dp))
        }
    }
}

@Composable
private fun PlaceholderCard(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Column {
            Surface(
                modifier = Modifier.fillMaxWidth().aspectRatio(1f),
                color = MaterialTheme.colorScheme.outlineVariant,
            ) {}
            Column(modifier = Modifier.padding(12.dp)) {
                PlaceholderLine(widthFraction = 0.78f, height = 14.dp)
                Spacer(Modifier.height(8.dp))
                PlaceholderLine(widthFraction = 0.45f, height = 12.dp)
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

@Composable
private fun ErrorMessage() {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
        Text(
            text = stringResource(R.string.catalogue_error_title),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = stringResource(R.string.catalogue_error),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
