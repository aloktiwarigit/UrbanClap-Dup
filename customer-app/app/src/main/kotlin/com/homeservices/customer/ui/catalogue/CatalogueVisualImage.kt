package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage

internal enum class CatalogueVisualSize {
    Category,
    ServiceCard,
    Hero,
}

@Composable
internal fun CatalogueVisualImage(
    title: String,
    imageUrl: String,
    contentDescription: String,
    modifier: Modifier = Modifier,
    supportingText: String? = null,
    visualSize: CatalogueVisualSize = CatalogueVisualSize.Category,
) {
    var imageFailed by remember(imageUrl) { mutableStateOf(false) }

    Box(modifier = modifier) {
        CatalogueImagePlaceholder(
            title = title,
            supportingText = supportingText,
            visualSize = visualSize,
            modifier = Modifier.fillMaxSize(),
        )
        if (imageUrl.isNotBlank() && !imageFailed) {
            AsyncImage(
                model = imageUrl,
                contentDescription = contentDescription,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                onError = { imageFailed = true },
            )
        }
    }
}

@Composable
private fun CatalogueImagePlaceholder(
    title: String,
    supportingText: String?,
    visualSize: CatalogueVisualSize,
    modifier: Modifier = Modifier,
) {
    val palette = paletteFor(title)
    val contentPadding =
        when (visualSize) {
            CatalogueVisualSize.ServiceCard -> 10.dp
            CatalogueVisualSize.Category -> 14.dp
            CatalogueVisualSize.Hero -> 24.dp
        }

    Surface(
        modifier = modifier,
        color = palette.start,
    ) {
        Box(
            modifier =
                Modifier
                    .fillMaxSize()
                    .background(Brush.linearGradient(listOf(palette.start, palette.end)))
                    .padding(contentPadding),
        ) {
            VisualBars(
                color = palette.accent,
                modifier = Modifier.align(Alignment.TopEnd),
                compact = visualSize == CatalogueVisualSize.ServiceCard,
            )
            InitialsTile(
                title = title,
                color = palette.accent,
                size =
                    when (visualSize) {
                        CatalogueVisualSize.ServiceCard -> 44.dp
                        CatalogueVisualSize.Category -> 52.dp
                        CatalogueVisualSize.Hero -> 68.dp
                    },
                modifier =
                    when (visualSize) {
                        CatalogueVisualSize.ServiceCard -> Modifier.align(Alignment.Center)
                        else -> Modifier.align(Alignment.TopStart)
                    },
            )
            if (visualSize == CatalogueVisualSize.Category) {
                Column(
                    modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth(0.86f),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        text = title,
                        style =
                            if (visualSize == CatalogueVisualSize.Hero) {
                                MaterialTheme.typography.titleLarge
                            } else {
                                MaterialTheme.typography.titleSmall
                            },
                        fontWeight = FontWeight.SemiBold,
                        color = palette.text,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    supportingText?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.labelMedium,
                            color = palette.text.copy(alpha = 0.72f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun InitialsTile(
    title: String,
    color: Color,
    size: Dp,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.size(size),
        shape = MaterialTheme.shapes.medium,
        color = Color.White.copy(alpha = 0.58f),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = initialsFor(title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color,
            )
        }
    }
}

@Composable
private fun VisualBars(
    color: Color,
    compact: Boolean,
    modifier: Modifier = Modifier,
) {
    val barWidth = if (compact) 8.dp else 12.dp
    val baseHeight = if (compact) 22.dp else 34.dp
    val heightStep = if (compact) 7.dp else 10.dp
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(if (compact) 3.dp else 5.dp),
        verticalAlignment = Alignment.Top,
    ) {
        repeat(3) { index ->
            Surface(
                modifier =
                    Modifier
                        .width(barWidth)
                        .height(baseHeight + heightStep * index.toFloat()),
                shape = MaterialTheme.shapes.extraSmall,
                color = color.copy(alpha = 0.16f + index * 0.05f),
            ) {}
        }
    }
}

private data class CataloguePalette(
    val start: Color,
    val end: Color,
    val accent: Color,
    val text: Color = Color(0xFF18202A),
)

private fun paletteFor(title: String): CataloguePalette {
    val key = title.lowercase()
    return when {
        key.contains("clean") ->
            CataloguePalette(Color(0xFFE7F4F1), Color(0xFFD3ECE7), Color(0xFF00796B))
        key.contains("repair") || key.contains("electric") || key.contains("plumb") ->
            CataloguePalette(Color(0xFFE8F0FB), Color(0xFFD7E5F7), Color(0xFF2E5EAA))
        key.contains("beauty") || key.contains("salon") || key.contains("spa") ->
            CataloguePalette(Color(0xFFF7E8EE), Color(0xFFF0D8E2), Color(0xFF9C3B63))
        key.contains("appliance") || key.contains("ac") || key.contains("fridge") ->
            CataloguePalette(Color(0xFFFFF3DF), Color(0xFFF8E4BC), Color(0xFF9A6500))
        key.contains("paint") || key.contains("carpenter") ->
            CataloguePalette(Color(0xFFEDECF6), Color(0xFFDDD9EF), Color(0xFF5A4E9A))
        else -> fallbackPalettes[stableIndex(title, fallbackPalettes.size)]
    }
}

private val fallbackPalettes =
    listOf(
        CataloguePalette(Color(0xFFE9F2EE), Color(0xFFD9E9E2), Color(0xFF276749)),
        CataloguePalette(Color(0xFFF2ECE3), Color(0xFFE7DCCB), Color(0xFF7A5A2A)),
        CataloguePalette(Color(0xFFE9EEF5), Color(0xFFD8E1EC), Color(0xFF415A77)),
        CataloguePalette(Color(0xFFF4E9E3), Color(0xFFEAD8CD), Color(0xFF8A4F35)),
        CataloguePalette(Color(0xFFEAF1F2), Color(0xFFD8E5E8), Color(0xFF2F6470)),
    )

private fun stableIndex(
    value: String,
    size: Int,
): Int = value.fold(0) { acc, char -> acc + char.code }.let { kotlin.math.abs(it) % size }

private fun initialsFor(title: String): String {
    val initials =
        title
            .split(" ", "-", "&", "/")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercaseChar().toString() }
    return initials.ifBlank { "HS" }
}
