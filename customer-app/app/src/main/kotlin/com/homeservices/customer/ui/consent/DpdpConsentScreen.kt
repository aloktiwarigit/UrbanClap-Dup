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
    val isDark = MaterialTheme.colorScheme.background.red < 0.5f
    val screenBg = if (isDark) ScreenBgDark else ScreenBgLight
    val cardBg = if (isDark) CardBgDark else CardBgLight
    val dividerColor = if (isDark) DividerDark else DividerLight
    val textPrimary = if (isDark) TextOnDark else Color(0xFF18231F)
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
                                color = Color.White.copy(alpha = 0.05f),
                                radius = 180.dp.toPx(),
                                center = Offset(size.width - 60.dp.toPx(), -80.dp.toPx()),
                            )
                            // Bottom-left accent glow
                            drawCircle(
                                color = Color.White.copy(alpha = 0.08f),
                                radius = 90.dp.toPx(),
                                center = Offset(50.dp.toPx(), size.height - 30.dp.toPx()),
                            )
                            // Center-right mid glow
                            drawCircle(
                                color = Color(0xFF4CAF50).copy(alpha = 0.10f),
                                radius = 120.dp.toPx(),
                                center = Offset(size.width * 0.75f, size.height * 0.55f),
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
                        color = Color.White.copy(alpha = 0.70f),
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
                color = Color(0xFF18231F),
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
