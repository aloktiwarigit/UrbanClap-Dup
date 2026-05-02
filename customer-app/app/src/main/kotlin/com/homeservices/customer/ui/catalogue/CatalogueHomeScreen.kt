package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Plumbing
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Water
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Category

private val WarmIvory = Color(0xFFFFFDF8)
private val CardWhite = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF20243A)
private val TextSecondary = Color(0xFF6F6A60)
private val TrustChipBg = Color(0xFFD8F0E8)
private val TrustChipText = Color(0xFF0F5C48)

private data class CategoryStyle(
    val containerColor: Color,
    val iconColor: Color,
    val icon: ImageVector,
)

private fun categoryStyle(id: String): CategoryStyle =
    when (id) {
        "ac-repair" -> CategoryStyle(Color(0xFFE6F4F8), Color(0xFF087A90), Icons.Default.AcUnit)
        "water-pump" -> CategoryStyle(Color(0xFFE8F0FF), Color(0xFF315FBA), Icons.Default.Water)
        "plumbing" -> CategoryStyle(Color(0xFFE0F4EE), Color(0xFF0A6B45), Icons.Default.Plumbing)
        "electrical" -> CategoryStyle(Color(0xFFFFF1C7), Color(0xFF9B6A00), Icons.Default.ElectricBolt)
        "water-purifier" -> CategoryStyle(Color(0xFFE6F7E6), Color(0xFF2E7D32), Icons.Default.FilterAlt)
        else -> CategoryStyle(Color(0xFFF3EBDD), Color(0xFF5C4A37), Icons.Default.Build)
    }

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
    Surface(modifier = Modifier.fillMaxSize(), color = WarmIvory) {
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
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
                ) {
                    item(span = {
                        androidx.compose.foundation.lazy.grid
                            .GridItemSpan(maxLineSpan)
                    }) {
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
        modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = stringResource(R.string.catalogue_home_title),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.catalogue_home_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
            )
            Spacer(Modifier.height(12.dp))
            TrustBadge()
        }
        IconButton(onClick = onSettingsClick) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = stringResource(R.string.settings_title),
                tint = TextSecondary,
            )
        }
    }
}

@Composable
private fun TrustBadge() {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier =
            Modifier
                .background(TrustChipBg, shape = RoundedCornerShape(999.dp))
                .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = TrustChipText,
            modifier = Modifier.size(15.dp),
        )
        Spacer(Modifier.width(5.dp))
        Text(
            text = stringResource(R.string.catalogue_trust_chip),
            color = TrustChipText,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun CategoryCard(
    category: Category,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val style = categoryStyle(category.id)
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                contentAlignment = Alignment.Center,
                modifier =
                    Modifier
                        .size(52.dp)
                        .background(style.containerColor, shape = RoundedCornerShape(14.dp)),
            ) {
                Icon(
                    imageVector = style.icon,
                    contentDescription = null,
                    tint = style.iconColor,
                    modifier = Modifier.size(28.dp),
                )
            }
            Spacer(Modifier.height(14.dp))
            Text(
                text = category.name,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = stringResource(R.string.category_service_count, category.serviceCount),
                style = MaterialTheme.typography.labelMedium,
                color = TextSecondary,
                modifier = Modifier.padding(top = 2.dp),
            )
        }
    }
}

@Composable
private fun CatalogueLoadingSkeleton() {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
    ) {
        item(span = {
            androidx.compose.foundation.lazy.grid
                .GridItemSpan(maxLineSpan)
        }) {
            Column(modifier = Modifier.padding(bottom = 20.dp)) {
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
        shape = RoundedCornerShape(16.dp),
        color = CardWhite,
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Surface(
                modifier = Modifier.size(52.dp),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.outlineVariant,
            ) {}
            Spacer(Modifier.height(14.dp))
            PlaceholderLine(widthFraction = 0.78f, height = 14.dp)
            Spacer(Modifier.height(6.dp))
            PlaceholderLine(widthFraction = 0.45f, height = 12.dp)
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
            color = TextPrimary,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = stringResource(R.string.catalogue_error),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )
    }
}
