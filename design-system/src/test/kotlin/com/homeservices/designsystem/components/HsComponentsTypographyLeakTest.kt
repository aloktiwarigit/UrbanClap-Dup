package com.homeservices.designsystem.components

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.io.File

/**
 * S-30 — typography leak sites inside the design-system module itself.
 *
 * Before this story, five `Text` calls in HsComponents.kt paired a
 * `style = MaterialTheme.typography.*` reference with a raw `fontWeight = FontWeight.*` override —
 * exactly the "raw weight instead of referencing the M3 typography token" pattern S-30 exists to
 * eliminate, even though the `style =` half of each call already pointed at a mapped slot:
 *
 *   - `HsActionButton` (labelLarge + SemiBold)  — override was redundant; labelLarge is SemiBold.
 *   - `HsSectionCard`  (titleMedium + SemiBold) — redundant; titleMedium is SemiBold.
 *   - `HsInfoRow`      (bodyLarge + SemiBold)   — bodyLarge is Normal, but the rendered result
 *                                                 (16sp/24sp/SemiBold) is pixel-identical to
 *                                                 titleMedium, so the fix re-points `style` there
 *                                                 instead of layering a manual override.
 *   - `HsTimelineStep` (titleSmall + SemiBold)  — redundant; titleSmall is SemiBold.
 *   - `HsPriceText`    (titleLarge + Bold)      — kept. Money is bolded regardless of the base
 *                                                 slot's own weight as an established, consistent
 *                                                 convention already used outside the design system
 *                                                 (PriceApprovalScreen.kt, ServiceDetailScreen.kt,
 *                                                 ServiceListScreen.kt, EarningsScreen.kt). No M3
 *                                                 slot exists at 18sp/26sp/Bold, so there is no
 *                                                 redundant-token substitute available here without
 *                                                 also changing the rendered size.
 *
 * This test locks the first four in as fixed and the fifth in as a documented, singular exception —
 * a regression guard against a sixth raw override quietly reappearing in this file.
 */
public class HsComponentsTypographyLeakTest {
    @Test
    public fun `only HsPriceText overrides a typography token's own weight`() {
        val source = locateSource().readText()
        val overrideOffsets =
            Regex("fontWeight = FontWeight\\.\\w+")
                .findAll(source)
                .map { it.range.first }
                .toList()

        assertThat(overrideOffsets)
            .describedAs(
                "expected exactly one raw fontWeight override in HsComponents.kt (HsPriceText); " +
                    "found at offsets %s",
                overrideOffsets,
            ).hasSize(1)

        val priceTextStart = source.indexOf("public fun HsPriceText")
        assertThat(priceTextStart).describedAs("HsPriceText not found in HsComponents.kt").isGreaterThan(-1)
        val priceTextEnd = source.indexOf("public fun HsTimelineStep").let { if (it == -1) source.length else it }

        assertThat(overrideOffsets.single())
            .describedAs("the sole fontWeight override must live inside HsPriceText")
            .isGreaterThan(priceTextStart)
            .isLessThan(priceTextEnd)
    }

    @Test
    public fun `LanguagePickerCard has no raw typography at all`() {
        val source = locateSource("locale/LanguagePickerCard.kt").readText()
        val rawTypographyPattern = Regex("fontSize\\s*=|fontWeight\\s*=|lineHeight\\s*=|TextStyle\\(")

        assertThat(rawTypographyPattern.containsMatchIn(source))
            .describedAs("LanguagePickerCard.kt should reference typography tokens only, no raw overrides")
            .isFalse()
    }

    private fun locateSource(relativePath: String = "components/HsComponents.kt"): File {
        val cwd = File("").absoluteFile
        val candidates =
            listOf(
                // Gradle test cwd = module dir (design-system/)
                File(cwd, "src/main/kotlin/com/homeservices/designsystem/$relativePath"),
                File(cwd, "design-system/src/main/kotlin/com/homeservices/designsystem/$relativePath"),
            )
        return candidates.firstOrNull { it.isFile }
            ?: error("Could not locate $relativePath from cwd=$cwd. Tried: ${candidates.map { it.path }}")
    }
}
