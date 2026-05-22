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
import kotlinx.coroutines.flow.collectLatest

// ── Design tokens ─────────────────────────────────────────────────────────────
private val HeroBg = Color(0xFF0B3D2E)
private val HeroBgDark = Color(0xFF062A20)
private val ScreenBgLight = Color(0xFFFBF7EF)
private val ScreenBgDark = Color(0xFF0D1A16)
private val CardBgLight = Color.White
private val CardBgDark = Color(0xFF1A2E24)
private val DividerLight = Color(0xFFEDE8E3)
private val DividerDark = Color(0xFF2A3E34)
private val TextMuted = Color(0xFF5F6C66)
private val TextOnDarkMuted = Color(0xFF8FA899)
private val TextOnDark = Color(0xFFE8F1EC)
private val BrandGreen = Color(0xFF0B3D2E)
private val SwitchCheckedThumb = Color(0xFF0B3D2E)
private val SwitchCheckedTrack = Color(0xFFC8E6C9)
private val SwitchUncheckedTrack = Color(0xFFE0E0E0)

private val AnalyticsBg = Color(0xFFE8F5E8)
private val AnalyticsTint = Color(0xFF0B3D2E)
private val CrashBg = Color(0xFFE8EDF5)
private val CrashTint = Color(0xFF1A4B8C)
private val MarketingBg = Color(0xFFFFF3E0)
private val MarketingTint = Color(0xFFE65100)

private const val HERO_FRACTION = 0.40f
private const val PRIVACY_POLICY_URL = "https://homeservices.app/privacy"

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
private const val DIVIDER_VERTICAL_PADDING_DP = 16
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
private const val PROGRESS_INDICATOR_STROKE_WIDTH_DP = 2.5f
private const val STICKY_RESERVE_BOTTOM_DP = 112
private const val SCREEN_SCROLL_SPACER_DP = 4

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
private val TEXT_PRIMARY_LIGHT = Color(0xFF18231F)
private val GLOW_CENTER_COLOR = Color(0xFF4CAF50)
private const val TEXT_PRIMARY_DISABLED_ALPHA = 0.40f

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
    val isDark = MaterialTheme.colorScheme.background.red < HERO_DARK_MODE_THRESHOLD
    val screenBg = if (isDark) ScreenBgDark else ScreenBgLight
    val cardBg = if (isDark) CardBgDark else CardBgLight
    val dividerColor = if (isDark) DividerDark else DividerLight
    val textPrimary = if (isDark) TextOnDark else TEXT_PRIMARY_LIGHT
    val textMuted = if (isDark) TextOnDarkMuted else TextMuted

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
                                brush = Brush.verticalGradient(listOf(HeroBgDark, HeroBg)),
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
                                color = GLOW_CENTER_COLOR.copy(alpha = GLOW_CENTER_ALPHA),
                                radius = GLOW_CENTER_RADIUS_DP.dp.toPx(),
                                center =
                                    Offset(
                                        size.width * GLOW_CENTER_X_FRACTION,
                                        size.height * GLOW_CENTER_Y_FRACTION,
                                    ),
                            )
                        }.statusBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 24.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    // Brand icon circle
                    Surface(
                        modifier = Modifier.size(72.dp),
                        shape = CircleShape,
                        color = Color.White,
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Eco,
                                contentDescription = null,
                                tint = BrandGreen,
                                modifier = Modifier.size(36.dp),
                            )
                        }
                    }

                    Text(
                        text = "गोपनीयता आपकी, चुनाव आपका",
                        style =
                            MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 26.sp,
                            ),
                        color = Color.White,
                        textAlign = TextAlign.Center,
                    )

                    Text(
                        text = "सेवा शुरू करने से पहले बताएं, हम क्या जानकारी इस्तेमाल कर सकते हैं",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
                        color = Color.White.copy(alpha = HERO_SUBTITLE_ALPHA),
                        textAlign = TextAlign.Center,
                    )
                }
            }

            // ── Consent card (overlaps hero by 20dp for depth) ─────────────────
            Surface(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .offset(y = (-20).dp),
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                color = cardBg,
                shadowElevation = 4.dp,
            ) {
                Column(
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .padding(top = 28.dp, start = 20.dp, end = 20.dp, bottom = 20.dp),
                ) {
                    // Section heading
                    Text(
                        text = "डेटा उपयोग सहमति",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = textPrimary,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "अपनी पसंद के अनुसार चुनें:",
                        style = MaterialTheme.typography.bodySmall,
                        color = textMuted,
                    )

                    Spacer(Modifier.height(16.dp))

                    // Analytics toggle
                    ConsentToggleRow(
                        icon = Icons.Default.BarChart,
                        iconBg = AnalyticsBg,
                        iconTint = AnalyticsTint,
                        title = "ऐप की गुणवत्ता सुधारें",
                        description = "हम समझते हैं ऐप कैसे इस्तेमाल होता है",
                        checked = uiState.analyticsOptIn,
                        onChecked = onToggleAnalytics,
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 4.dp),
                        thickness = 1.dp,
                        color = dividerColor,
                    )

                    // Crash toggle
                    ConsentToggleRow(
                        icon = Icons.Default.Security,
                        iconBg = CrashBg,
                        iconTint = CrashTint,
                        title = "क्रैश रिपोर्ट भेजें",
                        description = "बग जल्दी ठीक करने के लिए",
                        checked = uiState.crashOptIn,
                        onChecked = onToggleCrash,
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 4.dp),
                        thickness = 1.dp,
                        color = dividerColor,
                    )

                    // Marketing toggle
                    ConsentToggleRow(
                        icon = Icons.Default.Notifications,
                        iconBg = MarketingBg,
                        iconTint = MarketingTint,
                        title = "ऑफर और अपडेट",
                        description = "व्यक्तिगत ऑफर और प्रमोशन",
                        checked = uiState.marketingOptIn,
                        onChecked = onToggleMarketing,
                    )

                    Spacer(Modifier.height(16.dp))

                    HorizontalDivider(thickness = 1.dp, color = dividerColor)

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
                    .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Primary CTA
            Button(
                onClick = onConfirm,
                enabled = !uiState.isLoading,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = BrandGreen,
                        disabledContainerColor = BrandGreen.copy(alpha = 0.50f),
                    ),
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.5.dp,
                    )
                } else {
                    Text(
                        text = "सहमत हों और जारी रखें",
                        style =
                            MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
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
                    text = "सभी अस्वीकार करें",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
                    color = if (uiState.isLoading) TextMuted.copy(alpha = 0.40f) else TextMuted,
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
                .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Icon box
        Surface(
            modifier = Modifier.size(44.dp),
            shape = RoundedCornerShape(12.dp),
            color = iconBg,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(22.dp),
                )
            }
        }

        // Title + description
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = title,
                style =
                    MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                    ),
                color = TEXT_PRIMARY_LIGHT,
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                color = TextMuted,
            )
        }

        // Switch
        Switch(
            checked = checked,
            onCheckedChange = onChecked,
            colors =
                SwitchDefaults.colors(
                    checkedThumbColor = SwitchCheckedThumb,
                    checkedTrackColor = SwitchCheckedTrack,
                    uncheckedTrackColor = SwitchUncheckedTrack,
                    uncheckedThumbColor = Color.White,
                ),
        )
    }
}

@Composable
private fun LegalCopyText(textMuted: Color) {
    val annotatedString =
        buildAnnotatedString {
            withStyle(SpanStyle(color = textMuted, fontSize = 12.sp)) {
                append("जारी रखकर आप हमारी ")
            }
            withLink(
                LinkAnnotation.Url(
                    url = PRIVACY_POLICY_URL,
                    styles =
                        TextLinkStyles(
                            style =
                                SpanStyle(
                                    color = BrandGreen,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    textDecoration = TextDecoration.Underline,
                                ),
                        ),
                ),
            ) {
                append("गोपनीयता नीति")
            }
            withStyle(SpanStyle(color = textMuted, fontSize = 12.sp)) {
                append(" से सहमत हैं")
            }
        }

    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        BasicText(
            text = annotatedString,
            style = TextStyle(textAlign = TextAlign.Center),
        )
    }
}
