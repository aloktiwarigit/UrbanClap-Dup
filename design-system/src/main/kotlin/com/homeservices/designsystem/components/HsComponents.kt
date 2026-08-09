package com.homeservices.designsystem.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.format.formatRupees
import com.homeservices.designsystem.motion.rememberReducedMotion
import com.homeservices.designsystem.theme.LocalHomeservicesElevation
import com.homeservices.designsystem.theme.LocalHomeservicesSize
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing

@Composable
public fun HsPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.defaultMinSize(minHeight = LocalHomeservicesSize.current.controlLg),
    ) {
        Text(text)
    }
}

/**
 * Destructive / emergency primary action.
 *
 * Identical in weight to [HsPrimaryButton] but carries `colorScheme.error` rather than the brand
 * colour, so an irreversible action is never visually indistinguishable from a routine one.
 *
 * Introduced for SAFE-SOS-004: the SOS send action was rendered with [HsPrimaryButton], giving an
 * emergency dispatch the same brand-green treatment as "Book now". See docs/design/uiux-audit-2026.md.
 */
@Composable
public fun HsDangerButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.defaultMinSize(minHeight = LocalHomeservicesSize.current.controlLg),
        colors =
            ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error,
                contentColor = MaterialTheme.colorScheme.onError,
            ),
    ) {
        Text(text)
    }
}

@Composable
public fun HsSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.defaultMinSize(minHeight = LocalHomeservicesSize.current.controlMd),
    ) {
        Text(text)
    }
}

@Composable
public fun HsActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingContent: (@Composable () -> Unit)? = null,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.defaultMinSize(minHeight = LocalHomeservicesSize.current.controlLg),
        shape = MaterialTheme.shapes.medium,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        colors =
            ButtonDefaults.outlinedButtonColors(
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface,
            ),
    ) {
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (leadingContent != null) {
                Box(modifier = Modifier.size(22.dp), contentAlignment = Alignment.Center) {
                    leadingContent()
                }
                Spacer(modifier = Modifier.width(10.dp))
            }
            // Codex review MINOR-1: was maxLines = 1 + Ellipsis, which contradicted the rest of the
            // button family. Ellipsising a Devanagari label truncates mid-word and can destroy the
            // meaning of the action; the button grows instead, matching HsPrimaryButton and
            // HsSecondaryButton now that all three use defaultMinSize rather than a fixed height.
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
public fun HsSectionCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = LocalHomeservicesElevation.current.elev1),
    ) {
        Column(modifier = Modifier.padding(LocalHomeservicesSpacing.current.space4)) {
            if (title != null) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(bottom = LocalHomeservicesSpacing.current.space2),
                )
            }
            content()
        }
    }
}

private const val SKELETON_BAND_FRACTION = 0.4f
private const val SKELETON_SWEEP_MILLIS = 1_200

@Composable
public fun HsSkeletonBlock(
    modifier: Modifier = Modifier,
    widthFraction: Float = 1f,
    height: Dp,
    shape: Shape = MaterialTheme.shapes.small,
) {
    val restingFill = MaterialTheme.colorScheme.surfaceVariant
    val highlight = MaterialTheme.colorScheme.surface
    val reducedMotion = rememberReducedMotion()

    val progress =
        if (reducedMotion) {
            0f
        } else {
            val transition = rememberInfiniteTransition(label = "hs_skeleton")
            val animated by transition.animateFloat(
                initialValue = 0f,
                targetValue = 1f,
                animationSpec =
                    infiniteRepeatable(
                        animation = tween(SKELETON_SWEEP_MILLIS, easing = LinearEasing),
                        repeatMode = RepeatMode.Restart,
                    ),
                label = "hs_skeleton_progress",
            )
            animated
        }

    Box(
        modifier =
            modifier
                .fillMaxWidth(widthFraction)
                .height(height)
                .clip(shape)
                .drawBehind {
                    // Resting fill first — this is what makes the block visible on frame one and
                    // between sweeps. The previous implementation had none.
                    drawRect(color = restingFill)
                    if (!reducedMotion) {
                        val band = size.width * SKELETON_BAND_FRACTION
                        val startX = -band + progress * (size.width + 2f * band)
                        drawRect(
                            brush =
                                Brush.horizontalGradient(
                                    colors = listOf(Color.Transparent, highlight, Color.Transparent),
                                    startX = startX,
                                    endX = startX + band,
                                ),
                        )
                    }
                },
    )
}

@Composable
public fun HsInfoRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            // titleMedium (16sp/24sp/SemiBold) is bodyLarge's own size/line-height with SemiBold
            // weight already built in — reproduces the prior bodyLarge + manual SemiBold override
            // pixel-for-pixel without layering a raw weight on top of the token.
            text = value,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
public fun HsPriceText(
    pricePaise: Int,
    modifier: Modifier = Modifier,
) {
    Text(
        text = formatRupees(pricePaise),
        style = MaterialTheme.typography.titleLarge,
        // S-30: the one intentional fontWeight override left in this file. Money is bolded
        // regardless of the base slot's own weight, matching the established convention already
        // used outside the design system (PriceApprovalScreen.kt, ServiceDetailScreen.kt,
        // ServiceListScreen.kt, EarningsScreen.kt). No M3 slot exists at titleLarge's 18sp/26sp
        // with a Bold weight, so there is no redundant-token substitute available here without also
        // changing the rendered size. See HsComponentsTypographyLeakTest.
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        modifier = modifier,
    )
}

@Composable
public fun HsTimelineStep(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
) {
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Surface(
            modifier =
                Modifier
                    .padding(top = LocalHomeservicesSpacing.current.space1)
                    .size(LocalHomeservicesSpacing.current.space3),
            shape = MaterialTheme.shapes.extraSmall,
            color = MaterialTheme.colorScheme.primary,
        ) {}
        Column(modifier = Modifier.padding(start = LocalHomeservicesSpacing.current.space3)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
public fun HsTrustBadge(
    text: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = MaterialTheme.shapes.extraLarge,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            modifier =
                Modifier.padding(
                    horizontal = LocalHomeservicesSpacing.current.space3,
                    vertical = LocalHomeservicesSpacing.current.space2,
                ),
        )
    }
}
