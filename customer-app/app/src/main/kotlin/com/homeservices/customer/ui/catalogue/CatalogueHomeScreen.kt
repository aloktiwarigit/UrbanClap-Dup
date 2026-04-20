package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Category

@Composable
internal fun CatalogueHomeScreen(
    viewModel: CatalogueHomeViewModel,
    onCategoryClick: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    CatalogueHomeContent(uiState = uiState, onCategoryClick = onCategoryClick)
}

@Composable
internal fun CatalogueHomeContent(
    uiState: CatalogueHomeUiState,
    onCategoryClick: (String) -> Unit,
) {
    when (uiState) {
        is CatalogueHomeUiState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is CatalogueHomeUiState.Error -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = stringResource(R.string.catalogue_error),
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }
        is CatalogueHomeUiState.Success -> {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxSize().padding(8.dp),
            ) {
                items(uiState.categories) { category ->
                    CategoryCard(category = category, onClick = { onCategoryClick(category.id) })
                }
            }
        }
    }
}

@Composable
private fun CategoryCard(
    category: Category,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.padding(4.dp),
    ) {
        Column {
            AsyncImage(
                model = category.imageUrl,
                contentDescription = stringResource(R.string.category_image_desc, category.name),
                modifier = Modifier.aspectRatio(1f).fillMaxWidth(),
                contentScale = ContentScale.Crop,
            )
            Text(
                text = category.name,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(8.dp),
            )
        }
    }
}
