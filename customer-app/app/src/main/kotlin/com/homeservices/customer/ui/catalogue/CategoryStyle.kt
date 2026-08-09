package com.homeservices.customer.ui.catalogue

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Plumbing
import androidx.compose.material.icons.filled.Water
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

internal data class CategoryStyle(
    val iconBackground: Color,
    val iconTint: Color,
    val icon: ImageVector,
)

@Composable
internal fun categoryStyle(id: String): CategoryStyle =
    MaterialTheme.colorScheme.let { colors ->
        when (id) {
            "ac-repair" -> CategoryStyle(colors.tertiaryContainer, colors.onTertiaryContainer, Icons.Default.AcUnit)
            "water-pump" -> CategoryStyle(colors.surfaceVariant, colors.onSurfaceVariant, Icons.Default.Water)
            "plumbing" -> CategoryStyle(colors.primaryContainer, colors.onPrimaryContainer, Icons.Default.Plumbing)
            "electrical" -> CategoryStyle(colors.secondaryContainer, colors.onSecondaryContainer, Icons.Default.ElectricBolt)
            "water-purifier" -> CategoryStyle(colors.primaryContainer, colors.onPrimaryContainer, Icons.Default.FilterAlt)
            else ->
                CategoryStyle(
                    iconBackground = MaterialTheme.colorScheme.surfaceVariant,
                    iconTint = MaterialTheme.colorScheme.onSurfaceVariant,
                    icon = Icons.Default.Build,
                )
        }
    }
