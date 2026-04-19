@file:Suppress("TooManyFunctions") // Gallery files intentionally have many small section composables

/**
 * TokenGallery — Paparazzi-rendered visual catalog of all UX §5 design tokens.
 *
 * Consumed exclusively by [TokenGalleryPaparazziTest] via Paparazzi V_SCROLL rendering.
 * Internal visibility: this file is NOT part of the public module API.
 *
 * Static content only — no state, no remember, no animations, no click handlers.
 * Sections are split into helper composables to stay under detekt's LongMethod (60 lines).
 *
 * NOTE: [HomeservicesColors.semantic.warning] and [HomeservicesColors.semantic.success] are
 * pulled from the static light-palette object in [SectionSemanticColours]. In the dark-theme
 * snapshot these two swatches will render as the light-mode hues — intentional for T6.
 * A future story adds dark-variant overrides to [HomeservicesExtendedColors] for these tokens.
 */

package com.homeservices.designsystem.gallery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.theme.HomeservicesColors
import com.homeservices.designsystem.theme.HomeservicesElevation
import com.homeservices.designsystem.theme.HomeservicesMotion
import com.homeservices.designsystem.theme.HomeservicesRadius
import com.homeservices.designsystem.theme.HomeservicesSpacing
import com.homeservices.designsystem.theme.LocalHomeservicesExtendedColors

// ─────────────────────────────────────────────────────────────────────────────
// Root gallery composable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-page visual catalog of all UX §5 design tokens.
 * Renders as a vertically-scrollable Column — Paparazzi V_SCROLL captures full height.
 */
@Composable
internal fun TokenGallery() {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.background)
                .padding(
                    horizontal = HomeservicesSpacing.space4,
                    vertical = HomeservicesSpacing.space6,
                ),
        verticalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space4),
    ) {
        SectionBrandColours()
        HorizontalDivider()
        SectionSemanticColours()
        HorizontalDivider()
        SectionNeutrals()
        HorizontalDivider()
        SectionTrustDossier()
        HorizontalDivider()
        SectionTypography()
        HorizontalDivider()
        SectionSpacing()
        HorizontalDivider()
        SectionRadius()
        HorizontalDivider()
        SectionElevation()
        HorizontalDivider()
        SectionMotion()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section helpers
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.headlineMedium,
        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp),
        color = MaterialTheme.colorScheme.onBackground,
    )
}

@Composable
private fun Swatch(
    color: Color,
    label: String,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(72.dp),
    ) {
        Box(
            modifier =
                Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(HomeservicesRadius.md))
                    .background(color),
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}

@Composable
private fun SectionBrandColours() {
    SectionTitle("Brand colours")
    Row(horizontalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        Swatch(MaterialTheme.colorScheme.primary, "primary")
        Swatch(LocalHomeservicesExtendedColors.current.brandPrimaryHover, "primaryHover")
        Swatch(MaterialTheme.colorScheme.secondary, "accent")
        Swatch(MaterialTheme.colorScheme.primaryContainer, "primaryCont.")
    }
}

@Composable
private fun SectionSemanticColours() {
    SectionTitle("Semantic colours")
    // NOTE: success and warning are pulled from the static light-palette.
    // In the dark snapshot these two swatches render the light hue — intentional for T6.
    // Dark-variant overrides for success/warning land in a future story.
    Row(horizontalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        // NOTE: HomeservicesColors.semantic.success is the light static value
        Swatch(HomeservicesColors.semantic.success, "success")
        // NOTE: HomeservicesColors.semantic.warning is the light static value
        Swatch(HomeservicesColors.semantic.warning, "warning")
        Swatch(MaterialTheme.colorScheme.error, "danger")
        Swatch(MaterialTheme.colorScheme.tertiary, "info")
    }
}

@Composable
private fun SectionNeutrals() {
    SectionTitle("Neutrals")
    Row(horizontalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        Swatch(MaterialTheme.colorScheme.background, "background")
        Swatch(MaterialTheme.colorScheme.surface, "surface")
        Swatch(MaterialTheme.colorScheme.surfaceVariant, "surfaceVar.")
        Swatch(MaterialTheme.colorScheme.outline, "outline")
        Swatch(MaterialTheme.colorScheme.onSurface, "onSurface")
        Swatch(MaterialTheme.colorScheme.onBackground, "onBg")
    }
}

@Composable
private fun SectionTrustDossier() {
    SectionTitle("Trust dossier")
    Row(horizontalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        Swatch(LocalHomeservicesExtendedColors.current.verified, "verified")
        Swatch(LocalHomeservicesExtendedColors.current.neighbourhood, "neighbourhood")
    }
}

@Composable
private fun SectionTypography() {
    SectionTitle("Typography")
    Column(verticalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        Text(
            text = "displayLarge 48/56 700",
            style = MaterialTheme.typography.displayLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "displayMedium 40/48 700",
            style = MaterialTheme.typography.displayMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "headlineLarge 28/36 600",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "headlineMedium 22/30 600",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "titleLarge 18/26 600",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "bodyLarge 16/24 400",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "bodyMedium 14/22 400",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "bodySmall 12/18 500",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "labelLarge 14/20 600",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "labelSmall 11/16 600",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}

@Composable
private fun SectionSpacing() {
    SectionTitle("Spacing")
    Column(verticalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        SpacingRow("space0 (0dp)", HomeservicesSpacing.space0)
        SpacingRow("space1 (4dp)", HomeservicesSpacing.space1)
        SpacingRow("space2 (8dp)", HomeservicesSpacing.space2)
        SpacingRow("space3 (12dp)", HomeservicesSpacing.space3)
        SpacingRow("space4 (16dp)", HomeservicesSpacing.space4)
        SpacingRow("space6 (24dp)", HomeservicesSpacing.space6)
        SpacingRow("space8 (32dp)", HomeservicesSpacing.space8)
        SpacingRow("space12 (48dp)", HomeservicesSpacing.space12)
        SpacingRow("space16 (64dp)", HomeservicesSpacing.space16)
        SpacingRow("space24 (96dp)", HomeservicesSpacing.space24)
    }
}

@Composable
private fun SpacingRow(
    label: String,
    value: Dp,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.width(120.dp),
        )
        Spacer(modifier = Modifier.width(value))
        Box(
            modifier =
                Modifier
                    .size(16.dp)
                    .background(MaterialTheme.colorScheme.primary),
        )
    }
}

@Composable
private fun SectionRadius() {
    SectionTitle("Radius")
    Row(horizontalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        RadiusSwatch(HomeservicesRadius.sm, "sm 4dp")
        RadiusSwatch(HomeservicesRadius.md, "md 8dp")
        RadiusSwatch(HomeservicesRadius.lg, "lg 12dp")
        RadiusSwatch(HomeservicesRadius.xl, "xl 20dp")
        RadiusSwatch(HomeservicesRadius.full, "full")
    }
}

@Composable
private fun RadiusSwatch(
    radius: Dp,
    label: String,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(60.dp),
    ) {
        Box(
            modifier =
                Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(radius))
                    .background(MaterialTheme.colorScheme.primary),
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}

@Composable
private fun SectionElevation() {
    SectionTitle("Elevation")
    Row(horizontalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        ElevationCard(HomeservicesElevation.elev0, "elev0 0dp")
        ElevationCard(HomeservicesElevation.elev1, "elev1 1dp")
        ElevationCard(HomeservicesElevation.elev2, "elev2 4dp")
        ElevationCard(HomeservicesElevation.elev3, "elev3 8dp")
        ElevationCard(HomeservicesElevation.elev4, "elev4 16dp")
    }
}

@Composable
private fun ElevationCard(
    elevation: Dp,
    label: String,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(60.dp),
    ) {
        Card(
            modifier = Modifier.size(56.dp),
            elevation =
                CardDefaults.cardElevation(
                    defaultElevation = elevation,
                ),
            colors =
                CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
        ) {}
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}

@Composable
private fun SectionMotion() {
    SectionTitle("Motion")
    Column(verticalArrangement = Arrangement.spacedBy(HomeservicesSpacing.space2)) {
        Text(
            text = "fast: ${HomeservicesMotion.fast}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "base: ${HomeservicesMotion.base}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "medium: ${HomeservicesMotion.medium}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = "slow: ${HomeservicesMotion.slow}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}
