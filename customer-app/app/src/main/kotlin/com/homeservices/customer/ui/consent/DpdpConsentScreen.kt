package com.homeservices.customer.ui.consent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.theme.HomeservicesColors
import kotlinx.coroutines.flow.collectLatest

// ── Design tokens ─────────────────────────────────────────────────────────────
private const val HERO_FRACTION = 0.40f
private const val PRIVACY_POLICY_URL = "https://aloktiwarigit.github.io/homeheroo-privacy/customer/"

// ── Layout & spacing ──────────────────────────────────────────────────────
private const val HERO_ICON_SIZE_DP = 72
private const val HERO_ICON_INNER_SIZE_DP = 36
private const val HERO_SPACING_DP = 12
private const val HERO_PADDING_DP = 24
private const val HERO_SUBTITLE_ALPHA = 0.70f
private const val HERO_DARK_MODE_THRESHOLD = 0.5f
private const val CARD_OVERLAP_DP = 20
private const val CARD_CORNER_RADIUS_DP = 24
private const val CARD_TOP_PADDING_DP = 28
private const val CARD_SIDE_PADDING_DP = 20
private const val CARD_BOTTOM_PADDING_DP = 20
private const val CARD_SHADOW_ELEVATION_DP = 4
private const val CONSENT_SECTION_TITLE_FONT_SIZE = 26
private const val CONSENT_TITLE_SIZE_DP = 16
private const val CONSENT_DESCRIPTION_SIZE_DP = 14
private const val CONSENT_SMALL_TEXT_SIZE_DP = 12
private const val DIVIDER_THICKNESS_DP = 1
private const val DIVIDER_PADDING_DP = 4
private const val TOGGLE_ROW_PADDING_DP = 10
private const val TOGGLE_ROW_SPACING_DP = 12
private const val TOGGLE_ICON_SIZE_DP = 44
private const val TOGGLE_ICON_RADIUS_DP = 12
private const val TOGGLE_ICON_INNER_SIZE_DP = 22
private const val TOGGLE_TEXT_TITLE_FONT_SIZE = 14
private const val TOGGLE_TEXT_SPACING_DP = 2
private const val CTA_HEIGHT_DP = 56
private const val CTA_CORNER_RADIUS_DP = 16
private const val CTA_DISABLED_ALPHA = 0.50f
private const val CTA_PADDING_HORIZONTAL_DP = 20
private const val CTA_PADDING_VERTICAL_DP = 16
private const val CTA_SPACING_DP = 8
private const val PROGRESS_INDICATOR_SIZE_DP = 24

// ── Glow effects (atmospheric) ─────────────────────────────────────────
private const val GLOW_TOP_RIGHT_RADIUS_DP = 180
private const val GLOW_TOP_RIGHT_X_OFFSET_DP = 60
private const val GLOW_TOP_RIGHT_Y_OFFSET_DP = 80
private const val GLOW_TOP_RIGHT_ALPHA = 0.05f
private const val GLOW_BOTTOM_LEFT_RADIUS_DP = 90
private const val GLOW_BOTTOM_LEFT_X_OFFSET_DP = 50
private const val GLOW_BOTTOM_LEFT_Y_OFFSET_DP = 30
private const val GLOW_BOTTOM_LEFT_ALPHA = 0.08f
private const val GLOW_CENTER_RADIUS_DP = 120
private const val GLOW_CENTER_X_FRACTION = 0.75f
private const val GLOW_CENTER_Y_FRACTION = 0.55f
private const val GLOW_CENTER_ALPHA = 0.10f

// ── Color values ──────────────────────────────────────────────────────
private const val CTA_DISABLED_TEXT_ALPHA = 0.40f

/**
 * Entry composable — collects ViewModel state and wires navigation.
 * Renders [DpdpConsentScreenContent] for visual logic.
 */
@Composable
public fun DpdpConsentScreen(
    onConsentComplete: () -> Unit,
    viewModel: ConsentViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.navigateNext.collectLatest { onConsentComplete() }
    }

    DpdpConsentScreenContent(
        uiState = uiState,
        onToggleAnalytics = viewModel::toggleAnalytics,
        onToggleCrash = viewModel::toggleCrash,
        onToggleMarketing = viewModel::toggleMarketing,
        onConfirm = viewModel::onConfirm,
        onDeclineAll = viewModel::onDeclineAll,
    )
}

/**
 * Stateless content composable — all parameters are explicit for Paparazzi testability.
 *
 * Layout:
 *  1. Hero zone (~40% height) — dark green with radial glows, icon, title, subtitle.
 *  2. Consent card (white surface, overlaps hero by 20dp, rounded top corners 24dp).
 *     Three toggle rows + legal copy.
 *  3. Sticky CTA column pinned to bottom.
 */
@Suppress("LongMethod")
@Composable
internal fun DpdpConsentScreenContent(
    uiState: ConsentUiState,
    onToggleAnalytics: (Boolean) -> Unit,
    onToggleCrash: (Boolean) -> Unit,
    onToggleMarketing: (Boolean) -> Unit,
    onConfirm: () -> Unit,
    onDeclineAll: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = MaterialTheme.colorScheme
    val isDark = colors.background.red < HERO_DARK_MODE_THRESHOLD
    val screenBg = colors.background
    val cardBg = colors.surface
    val dividerColor = colors.outlineVariant
    val textPrimary = colors.onSurface
    val textMuted = colors.onSurfaceVariant
    val brandColor = colors.primary
    val heroStart = if (isDark) colors.surfaceVariant else HomeservicesColors.brand.accentDim
    val heroEnd = if (isDark) HomeservicesColors.brand.accentDim else colors.onSurface
    val heroTextColor = if (isDark) colors.onSurface else Color.White
    val analyticsBg = colors.primaryContainer
    val analyticsTint = colors.onPrimaryContainer
    val crashBg = colors.tertiaryContainer
    val crashTint = colors.onTertiaryContainer
    val marketingBg = colors.secondaryContainer
    val marketingTint = colors.onSecondaryContainer

    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(screenBg),
    ) {
        // ── Scrollable body ────────────────────────────────────────────────────
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 112.dp),
            // reserve space for sticky CTAs
        ) {
            // ── Hero zone ──────────────────────────────────────────────────────
            Box(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .fillMaxHeight(HERO_FRACTION)
                        .drawBehind {
                            drawRect(
                                brush = Brush.verticalGradient(listOf(heroStart, heroEnd)),
                                size = size,
                            )
                            // Top-right atmospheric glow
                            drawCircle(
                                color = Color.White.copy(alpha = GLOW_TOP_RIGHT_ALPHA),
                                radius = GLOW_TOP_RIGHT_RADIUS_DP.dp.toPx(),
                                center =
                                    Offset(
                                        size.width - GLOW_TOP_RIGHT_X_OFFSET_DP.dp.toPx(),
                                        -GLOW_TOP_RIGHT_Y_OFFSET_DP.dp.toPx(),
                                    ),
                            )
                            // Bottom-left accent glow
                            drawCircle(
                                color = Color.White.copy(alpha = GLOW_BOTTOM_LEFT_ALPHA),
                                radius = GLOW_BOTTOM_LEFT_RADIUS_DP.dp.toPx(),
                                center =
                                    Offset(
                                        GLOW_BOTTOM_LEFT_X_OFFSET_DP.dp.toPx(),
                                        size.height - GLOW_BOTTOM_LEFT_Y_OFFSET_DP.dp.toPx(),
                                    ),
                            )
                            // Center-right mid glow
                            drawCircle(
                                color = brandColor.copy(alpha = GLOW_CENTER_ALPHA),
                                radius = GLOW_CENTER_RADIUS_DP.dp.toPx(),
                                center =
                                    Offset(
                                        size.width * GLOW_CENTER_X_FRACTION,
                                        size.height * GLOW_CENTER_Y_FRACTION,
                                    ),
                            )
                        }.statusBarsPadding()
                        .padding(horizontal = HERO_PADDING_DP.dp, vertical = HERO_PADDING_DP.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(HERO_SPACING_DP.dp),
                ) {
                    // Brand icon circle
                    Surface(
                        modifier = Modifier.size(HERO_ICON_SIZE_DP.dp),
                        shape = CircleShape,
                        color = Color.White,
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Eco,
                                contentDescription = null,
                                tint = brandColor,
                                modifier = Modifier.size(HERO_ICON_INNER_SIZE_DP.dp),
                            )
                        }
                    }

                    Text(
                        text = stringResource(R.string.dpdp_consent_hero_title),
                        style =
                            MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = CONSENT_SECTION_TITLE_FONT_SIZE.sp,
                            ),
                        color = heroTextColor,
                        textAlign = TextAlign.Center,
                    )

                    Text(
                        text = stringResource(R.string.dpdp_consent_hero_subtitle),
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = CONSENT_DESCRIPTION_SIZE_DP.sp),
                        color = heroTextColor.copy(alpha = HERO_SUBTITLE_ALPHA),
                        textAlign = TextAlign.Center,
                    )
                }
            }

            // ── Consent card (overlaps hero by 20dp for depth) ─────────────────
            Surface(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .offset(y = (-CARD_OVERLAP_DP).dp),
                shape = RoundedCornerShape(topStart = CARD_CORNER_RADIUS_DP.dp, topEnd = CARD_CORNER_RADIUS_DP.dp),
                color = cardBg,
                shadowElevation = CARD_SHADOW_ELEVATION_DP.dp,
            ) {
                Column(
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .padding(
                                top = CARD_TOP_PADDING_DP.dp,
                                start = CARD_SIDE_PADDING_DP.dp,
                                end = CARD_SIDE_PADDING_DP.dp,
                                bottom = CARD_BOTTOM_PADDING_DP.dp,
                            ),
                ) {
                    // Section heading
                    Text(
                        text = stringResource(R.string.dpdp_consent_section_title),
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = textPrimary,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.dpdp_consent_section_subtitle),
                        style = MaterialTheme.typography.bodySmall,
                        color = textMuted,
                    )

                    Spacer(Modifier.height(16.dp))

                    // Analytics toggle
                    ConsentToggleRow(
                        icon = Icons.Default.BarChart,
                        iconBg = analyticsBg,
                        iconTint = analyticsTint,
                        title = stringResource(R.string.dpdp_consent_analytics_title),
                        description = stringResource(R.string.dpdp_consent_analytics_description),
                        checked = uiState.analyticsOptIn,
                        onChecked = onToggleAnalytics,
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = DIVIDER_PADDING_DP.dp),
                        thickness = DIVIDER_THICKNESS_DP.dp,
                        color = dividerColor,
                    )

                    // Crash toggle
                    ConsentToggleRow(
                        icon = Icons.Default.Security,
                        iconBg = crashBg,
                        iconTint = crashTint,
                        title = stringResource(R.string.dpdp_consent_crash_title),
                        description = stringResource(R.string.dpdp_consent_crash_description),
                        checked = uiState.crashOptIn,
                        onChecked = onToggleCrash,
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = DIVIDER_PADDING_DP.dp),
                        thickness = DIVIDER_THICKNESS_DP.dp,
                        color = dividerColor,
                    )

                    // Marketing toggle
                    ConsentToggleRow(
                        icon = Icons.Default.Notifications,
                        iconBg = marketingBg,
                        iconTint = marketingTint,
                        title = stringResource(R.string.dpdp_consent_marketing_title),
                        description = stringResource(R.string.dpdp_consent_marketing_description),
                        checked = uiState.marketingOptIn,
                        onChecked = onToggleMarketing,
                    )

                    Spacer(Modifier.height(16.dp))

                    HorizontalDivider(thickness = DIVIDER_THICKNESS_DP.dp, color = dividerColor)

                    Spacer(Modifier.height(12.dp))

                    // Legal clickable text
                    LegalCopyText(textMuted = textMuted)

                    Spacer(Modifier.height(4.dp))
                }
            }
        }

        // ── Sticky CTAs pinned to bottom ───────────────────────────────────────
        Column(
            modifier =
                Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(cardBg)
                    .padding(horizontal = CTA_PADDING_HORIZONTAL_DP.dp, vertical = CTA_PADDING_VERTICAL_DP.dp),
            verticalArrangement = Arrangement.spacedBy(CTA_SPACING_DP.dp),
        ) {
            // Primary CTA
            Button(
                onClick = onConfirm,
                enabled = !uiState.isLoading,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(CTA_HEIGHT_DP.dp),
                shape = RoundedCornerShape(CTA_CORNER_RADIUS_DP.dp),
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = brandColor,
                        disabledContainerColor = brandColor.copy(alpha = CTA_DISABLED_ALPHA),
                    ),
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(PROGRESS_INDICATOR_SIZE_DP.dp),
                        color = Color.White,
                        strokeWidth = 2.5.dp,
                    )
                } else {
                    Text(
                        text = stringResource(R.string.dpdp_consent_agree_continue),
                        style =
                            MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = CONSENT_TITLE_SIZE_DP.sp,
                            ),
                        color = Color.White,
                    )
                }
            }

            // Secondary CTA
            TextButton(
                onClick = onDeclineAll,
                enabled = !uiState.isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = stringResource(R.string.dpdp_consent_reject_all),
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = CONSENT_DESCRIPTION_SIZE_DP.sp),
                    color = if (uiState.isLoading) textMuted.copy(alpha = CTA_DISABLED_TEXT_ALPHA) else textMuted,
                )
            }
        }
    }
}

@Composable
private fun ConsentToggleRow(
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    title: String,
    description: String,
    checked: Boolean,
    onChecked: (Boolean) -> Unit,
) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(vertical = TOGGLE_ROW_PADDING_DP.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(TOGGLE_ROW_SPACING_DP.dp),
    ) {
        // Icon box
        Surface(
            modifier = Modifier.size(TOGGLE_ICON_SIZE_DP.dp),
            shape = RoundedCornerShape(TOGGLE_ICON_RADIUS_DP.dp),
            color = iconBg,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(TOGGLE_ICON_INNER_SIZE_DP.dp),
                )
            }
        }

        // Title + description
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(TOGGLE_TEXT_SPACING_DP.dp)) {
            Text(
                text = title,
                style =
                    MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = TOGGLE_TEXT_TITLE_FONT_SIZE.sp,
                    ),
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        // Switch
        Switch(
            checked = checked,
            onCheckedChange = onChecked,
            colors =
                SwitchDefaults.colors(
                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                    checkedTrackColor = MaterialTheme.colorScheme.primaryContainer,
                    uncheckedTrackColor = MaterialTheme.colorScheme.surfaceVariant,
                    uncheckedThumbColor = Color.White,
                ),
        )
    }
}

@Composable
private fun LegalCopyText(textMuted: Color) {
    val annotatedString =
        buildAnnotatedString {
            withStyle(SpanStyle(color = textMuted, fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp)) {
                append(stringResource(R.string.dpdp_consent_legal_prefix))
            }
            withLink(
                LinkAnnotation.Url(
                    url = PRIVACY_POLICY_URL,
                    styles =
                        TextLinkStyles(
                            style =
                                SpanStyle(
                                    color = MaterialTheme.colorScheme.primary,
                                    fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    textDecoration = TextDecoration.Underline,
                                ),
                        ),
                ),
            ) {
                append(stringResource(R.string.dpdp_consent_privacy_policy))
            }
            withStyle(SpanStyle(color = textMuted, fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp)) {
                append(stringResource(R.string.dpdp_consent_legal_suffix))
            }
        }

    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        BasicText(
            text = annotatedString,
            style = TextStyle(textAlign = TextAlign.Center),
        )
    }
}
