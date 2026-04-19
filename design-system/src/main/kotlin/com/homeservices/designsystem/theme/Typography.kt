package com.homeservices.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.homeservices.designsystem.R

/**
 * Geist Sans Variable font family wired to the variable-font weight axis (UX §5.2).
 *
 * Uses `FontVariation.weight(N)` to instruct the runtime to render each weight
 * bucket via the single variable TTF rather than loading a separate static file.
 * This avoids the B3 trap where `Font(resId, FontWeight.Bold)` is treated as a
 * *hint* by the static-font loader and the variable axis is silently ignored.
 *
 * Four weight buckets are registered to cover all slots used by [HomeservicesTypography]:
 * Normal (400), Medium (500), SemiBold (600), Bold (700).
 */
@OptIn(ExperimentalTextApi::class)
public val HomeservicesFontFamily: FontFamily =
    FontFamily(
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.Normal,
            style = FontStyle.Normal,
            variationSettings = FontVariation.Settings(FontVariation.weight(400)),
        ),
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.Medium,
            style = FontStyle.Normal,
            variationSettings = FontVariation.Settings(FontVariation.weight(500)),
        ),
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.SemiBold,
            style = FontStyle.Normal,
            variationSettings = FontVariation.Settings(FontVariation.weight(600)),
        ),
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.Bold,
            style = FontStyle.Normal,
            variationSettings = FontVariation.Settings(FontVariation.weight(700)),
        ),
    )

/**
 * Homeservices M3 typography scale mapped to UX §5.2 tokens.
 *
 * Mapped slots (10 total):
 * | M3 slot        | UX token    | size | lineHeight | weight    |
 * |----------------|-------------|------|------------|-----------|
 * | displayLarge   | display.xl  | 48sp | 56sp       | Bold(700) |
 * | displayMedium  | display.lg  | 40sp | 48sp       | Bold(700) |
 * | headlineLarge  | title.lg    | 28sp | 36sp       | SemiBold  |
 * | headlineMedium | title.md    | 22sp | 30sp       | SemiBold  |
 * | titleLarge     | title.sm    | 18sp | 26sp       | SemiBold  |
 * | bodyLarge      | body.lg     | 16sp | 24sp       | Normal    |
 * | bodyMedium     | body.md     | 14sp | 22sp       | Normal    |
 * | bodySmall      | body.sm     | 12sp | 18sp       | Medium    |
 * | labelLarge     | label.lg    | 14sp | 20sp       | SemiBold  |
 * | labelSmall     | label.sm    | 11sp | 16sp       | SemiBold  |
 *
 * Unmapped M3 slots (displaySmall, headlineSmall, titleMedium, titleSmall, labelMedium)
 * retain M3's built-in Roboto-based defaults per brainstorm §7 decision. This is
 * intentional — they are not part of the UX §5.2 scale.
 */
public val HomeservicesTypography: Typography =
    Typography(
        displayLarge =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 48.sp,
                lineHeight = 56.sp,
            ),
        displayMedium =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 40.sp,
                lineHeight = 48.sp,
            ),
        headlineLarge =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 28.sp,
                lineHeight = 36.sp,
            ),
        headlineMedium =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 22.sp,
                lineHeight = 30.sp,
            ),
        titleLarge =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 18.sp,
                lineHeight = 26.sp,
            ),
        bodyLarge =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.Normal,
                fontSize = 16.sp,
                lineHeight = 24.sp,
            ),
        bodyMedium =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.Normal,
                fontSize = 14.sp,
                lineHeight = 22.sp,
            ),
        bodySmall =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.Medium,
                fontSize = 12.sp,
                lineHeight = 18.sp,
            ),
        labelLarge =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                lineHeight = 20.sp,
            ),
        labelSmall =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp,
                lineHeight = 16.sp,
            ),
    )
