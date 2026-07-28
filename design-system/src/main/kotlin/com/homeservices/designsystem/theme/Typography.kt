package com.homeservices.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontLoadingStrategy
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.homeservices.designsystem.R

/**
 * Combined font family: Geist Sans Variable (Latin + symbols) with Noto Sans Devanagari fallback.
 *
 * Compose resolves font families per-glyph: when the Geist Sans variable font has no glyph for
 * a Devanagari codepoint (which it does not), the runtime falls through to the Noto entry.
 * Registering all four weight buckets for both typefaces ensures that Bold/SemiBold Devanagari
 * text receives the correct visual weight rather than falling back to the system Roboto.
 *
 * By embedding the Devanagari fallback here — rather than in a separate family — every text style
 * in [HomeservicesTypography] automatically gets multi-script support, and the test assertion
 * `style.fontFamily isSameAs HomeservicesFontFamily` continues to hold for all roles.
 *
 * Asset locations:
 *   design-system/src/main/res/font/geist_sans_variable.ttf  (SIL OFL-1.1)
 *   design-system/src/main/res/font/noto_sans_devanagari.ttf  (SIL OFL-1.1)
 */
@OptIn(ExperimentalTextApi::class)
public val HomeservicesFontFamily: FontFamily =
    FontFamily(
        // Geist Sans Variable — Latin, symbols, numerals
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.Normal,
            style = FontStyle.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
            variationSettings = FontVariation.Settings(FontVariation.weight(400)),
        ),
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.Medium,
            style = FontStyle.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
            variationSettings = FontVariation.Settings(FontVariation.weight(500)),
        ),
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.SemiBold,
            style = FontStyle.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
            variationSettings = FontVariation.Settings(FontVariation.weight(600)),
        ),
        Font(
            resId = R.font.geist_sans_variable,
            weight = FontWeight.Bold,
            style = FontStyle.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
            variationSettings = FontVariation.Settings(FontVariation.weight(700)),
        ),
        // Noto Sans Devanagari — Hindi (hi) locale fallback glyphs
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.Medium,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.SemiBold,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.Bold,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
    )

/**
 * Noto Sans Devanagari standalone family — kept for direct use in non-typography contexts
 * (e.g. standalone Hindi-only text that must not fall back to Geist).
 *
 * Asset location: design-system/src/main/res/font/noto_sans_devanagari.ttf
 * License: OFL-1.1 (see design-system/src/main/res/font/LICENSE_NOTO_SANS_DEVANAGARI.txt)
 */
@OptIn(ExperimentalTextApi::class)
public val NotoSansDevanagariFontFamily: FontFamily =
    FontFamily(
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.Medium,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.SemiBold,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.noto_sans_devanagari,
            weight = FontWeight.Bold,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
    )

/**
 * Alias for [HomeservicesFontFamily].
 *
 * The Devanagari fallback was merged into [HomeservicesFontFamily] itself so that ALL
 * text styles automatically support Hindi glyphs without requiring a separate family.
 * This alias preserves backward compatibility for any external references; new code
 * should reference [HomeservicesFontFamily] directly.
 */
public val HomeservicesDevanagariFontFamily: FontFamily = HomeservicesFontFamily

/**
 * JetBrains Mono — D1 §Typography, for tabular numerals.
 *
 * Android previously shipped no mono family at all while admin-web had one, so tabular figures were
 * impossible on Android. That is a direct cause of misaligned money columns: without fixed-advance
 * digits, a rupee column cannot align down a list. Required by S-31 (one money formatter).
 *
 * Use for amounts, counts, timestamps and IDs — never for prose, and never for Devanagari, which
 * this face does not cover.
 *
 * Asset: design-system/src/main/res/font/jetbrains_mono.ttf (SIL OFL-1.1, see
 * design-system/LICENSES/LICENSE_JETBRAINS_MONO.txt)
 */
@OptIn(ExperimentalTextApi::class)
public val HomeservicesMonoFontFamily: FontFamily =
    FontFamily(
        Font(
            resId = R.font.jetbrains_mono,
            weight = FontWeight.Normal,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.jetbrains_mono,
            weight = FontWeight.Medium,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
        Font(
            resId = R.font.jetbrains_mono,
            weight = FontWeight.SemiBold,
            loadingStrategy = FontLoadingStrategy.OptionalLocal,
        ),
    )

/**
 * Homeservices M3 typography — D1 §Typography. **All 15 slots are mapped.**
 *
 * | M3 slot        | D1 token   | size | line | weight   |
 * |----------------|------------|------|------|----------|
 * | displayLarge   | —          | 48sp | 56sp | Bold     |
 * | displayMedium  | display.lg | 40sp | 48sp | Bold     |
 * | displaySmall   | —          | 32sp | 40sp | Bold     |
 * | headlineLarge  | title.xl   | 28sp | 36sp | SemiBold |
 * | headlineMedium | title.lg   | 22sp | 30sp | SemiBold |
 * | headlineSmall  | —          | 20sp | 28sp | SemiBold |
 * | titleLarge     | title.md   | 18sp | 26sp | SemiBold |
 * | titleMedium    | —          | 16sp | 24sp | SemiBold |
 * | titleSmall     | —          | 14sp | 20sp | SemiBold |
 * | bodyLarge      | body.lg    | 16sp | 24sp | Normal   |
 * | bodyMedium     | body.md    | 14sp | 22sp | Normal   |
 * | bodySmall      | body.sm    | 12sp | 18sp | Medium   |
 * | labelLarge     | label.lg   | 14sp | 20sp | SemiBold |
 * | labelMedium    | —          | 12sp | 16sp | SemiBold |
 * | labelSmall     | label.sm   | 11sp | 16sp | SemiBold |
 *
 * WHY THE FIVE EXTRA SLOTS ARE NOW MAPPED (TOK-002).
 *
 * `displaySmall`, `headlineSmall`, `titleMedium`, `titleSmall` and `labelMedium` were previously
 * left unmapped and the omission documented as intentional. It did not hold, because this module's
 * own components used three of them — `HsSectionCard` (`titleMedium`, 37 call sites),
 * `HsTimelineStep` (`titleSmall`, 10) and `HsInfoRow` (`labelMedium`, 5). The shared library shipped
 * mixed typefaces. Across both apps there were 130 unmapped-slot usages (customer 76, technician 54).
 *
 * Leaving a slot unmapped is not neutral: M3 fills it with its Roboto-based default. For Latin that
 * means Geist silently becomes Roboto. For Devanagari it means something subtler and worse to debug —
 * Roboto has no Devanagari glyphs, so Hindi falls through to whatever Noto the *device* ships rather
 * than the Noto bundled here, making Hindi rendering vary by handset.
 *
 * Every slot below therefore names [HomeservicesFontFamily] explicitly, and every slot carries an
 * explicit lineHeight — Devanagari matras need deliberate vertical space, not an inherited default.
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
        displaySmall =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 32.sp,
                lineHeight = 40.sp,
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
        headlineSmall =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 20.sp,
                lineHeight = 28.sp,
            ),
        titleLarge =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 18.sp,
                lineHeight = 26.sp,
            ),
        titleMedium =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 16.sp,
                lineHeight = 24.sp,
            ),
        titleSmall =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                lineHeight = 20.sp,
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
        labelMedium =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 12.sp,
                lineHeight = 16.sp,
            ),
        labelSmall =
            TextStyle(
                fontFamily = HomeservicesFontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp,
                lineHeight = 16.sp,
            ),
    )
