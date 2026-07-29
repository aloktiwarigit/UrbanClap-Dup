package com.homeservices.customer.ui.catalogue

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Plumbing
import androidx.compose.material.icons.filled.Water
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.ui.util.formatInr

private val PhotoCardShape = RoundedCornerShape(16.dp)

/**
 * Photo-first category card (E16-S03, AC-1).
 *
 * Renders a full-bleed [AsyncImage] loaded from [Category.imageUrl].
 * Falls back to the existing icon-tile layout when [Category.imageUrl] is blank
 * or when the CDN load fails — preserving offline usability.
 *
 * Gated behind the `customer.photo-first-catalogue.enabled` feature flag
 * (caller is responsible for the gate; this composable always renders photo-first).
 */
@Composable
internal fun PhotoFirstCategoryCard(
    category: Category,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val style = categoryStyle(category.id)
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "photo_card_scale",
    )

    // Track whether the Coil load succeeded so we can show the icon fallback.
    var imageLoadFailed by remember { mutableStateOf(false) }
    val showImage = shouldRenderCdnImage(category.imageUrl) && !imageLoadFailed

    Box(
        modifier =
            modifier
                .height(148.dp)
                .scale(scale)
                .clip(PhotoCardShape)
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.outline, PhotoCardShape)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            pressed = true
                            tryAwaitRelease()
                            pressed = false
                        },
                        onTap = { onClick() },
                    )
                },
    ) {
        if (showImage) {
            PhotoCardImageContent(
                category = category,
                onLoadFailed = { imageLoadFailed = true },
            )
        } else {
            PhotoCardIconFallback(category = category, style = style)
        }
    }
}

@Composable
private fun BoxScope.PhotoCardImageContent(
    category: Category,
    onLoadFailed: () -> Unit,
) {
    AsyncImage(
        model = category.imageUrl,
        contentDescription = category.name,
        contentScale = ContentScale.Crop,
        modifier = Modifier.fillMaxSize(),
        onState = { state ->
            if (state is AsyncImagePainter.State.Error) onLoadFailed()
        },
    )
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .height(80.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(listOf(Color.Transparent, MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f))),
                ),
    )
    Column(
        modifier = Modifier.align(Alignment.BottomStart).padding(start = 10.dp, end = 10.dp, bottom = 10.dp),
    ) {
        Text(
            text = category.name,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 17.sp),
            // Photo card text sits on a fixed black bottom scrim — use Color.White for dark-mode safety
            // (onPrimary resolves to a dark color in dark theme and loses contrast against the black scrim).
            color = Color.White,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        if (category.minPricePaise > 0) {
            Text(
                text = stringResource(R.string.catalogue_starting_price, formatInr(category.minPricePaise.toLong())),
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp, fontWeight = FontWeight.SemiBold),
                color = Color.White.copy(alpha = 0.88f),
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun PhotoCardIconFallback(
    category: Category,
    style: CategoryStyleTokens,
) {
    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(36.dp).background(style.iconBackground, RoundedCornerShape(12.dp)),
        ) {
            Icon(imageVector = style.icon, contentDescription = null, tint = style.iconTint, modifier = Modifier.size(21.dp))
        }
        Spacer(Modifier.height(8.dp))
        Text(
            text = category.name,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 18.sp),
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        if (category.minPricePaise > 0) {
            Spacer(Modifier.height(3.dp))
            Text(
                text = stringResource(R.string.catalogue_starting_price, formatInr(category.minPricePaise.toLong())),
                style = MaterialTheme.typography.labelLarge.copy(fontSize = 13.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.primary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

// Re-export so the CatalogueHomeScreen can call categoryStyle() internally.
// categoryStyle() is private in CatalogueHomeScreen.kt but we need it here too.
// Defined inline to avoid exposing it from the home screen.
@Composable
private fun categoryStyle(id: String): CategoryStyleTokens =
    when (id) {
        "ac-repair" ->
            CategoryStyleTokens(
                iconBackground = MaterialTheme.colorScheme.tertiaryContainer,
                iconTint = MaterialTheme.colorScheme.onTertiaryContainer,
                icon = Icons.Default.AcUnit,
            )
        "water-pump" ->
            CategoryStyleTokens(
                iconBackground = MaterialTheme.colorScheme.surfaceVariant,
                iconTint = MaterialTheme.colorScheme.onSurfaceVariant,
                icon = Icons.Default.Water,
            )
        "plumbing" ->
            CategoryStyleTokens(
                iconBackground = MaterialTheme.colorScheme.primaryContainer,
                iconTint = MaterialTheme.colorScheme.onPrimaryContainer,
                icon = Icons.Default.Plumbing,
            )
        "electrical" ->
            CategoryStyleTokens(
                iconBackground = MaterialTheme.colorScheme.secondaryContainer,
                iconTint = MaterialTheme.colorScheme.onSecondaryContainer,
                icon = Icons.Default.ElectricBolt,
            )
        "water-purifier" ->
            CategoryStyleTokens(
                iconBackground = MaterialTheme.colorScheme.primaryContainer,
                iconTint = MaterialTheme.colorScheme.onPrimaryContainer,
                icon = Icons.Default.FilterAlt,
            )
        else ->
            CategoryStyleTokens(
                iconBackground = MaterialTheme.colorScheme.surfaceVariant,
                iconTint = MaterialTheme.colorScheme.primary,
                icon = Icons.Default.Build,
            )
    }

private data class CategoryStyleTokens(
    val iconBackground: androidx.compose.ui.graphics.Color,
    val iconTint: androidx.compose.ui.graphics.Color,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
)
