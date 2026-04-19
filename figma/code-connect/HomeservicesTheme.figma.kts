/**
 * figma-code-connect stubs for the Homeservices design system.
 *
 * STATUS: STUBS ONLY — Dev Mode (Figma Professional plan) required to publish.
 *
 * These stubs are committed as documentation artifacts. Once the team activates a
 * paid Figma plan, run:
 *   npm install -g @figma/code-connect
 *   figma connect publish --token <FIGMA_PAT>
 *
 * Until then, the node URLs below are PLACEHOLDER strings that must be replaced
 * with real Figma component node URLs (right-click component → Copy link to selection).
 *
 * See figma/README.md Part 2 for full activation steps.
 *
 * Kotlin source: design-system/src/main/kotlin/com/homeservices/designsystem/theme/
 */

// ─────────────────────────────────────────────────────────────────────────────
// HomeservicesTheme wrapper
// Figma equivalent: the top-level "Frame" or "Component Set" that applies the
// design system theme. Every screen component should be nested inside this.
// ─────────────────────────────────────────────────────────────────────────────

figma(
    url = "PLACEHOLDER: https://www.figma.com/file/<FILE_ID>?node-id=<NODE_ID>",
    component = "HomeservicesTheme"
) {
    imports(listOf("com.homeservices.designsystem.theme.HomeservicesTheme"))
    variant("Dark mode", FigmaBoolean(false)) {
        code {
            """
            HomeservicesTheme(darkTheme = false) {
                content()
            }
            """.trimIndent()
        }
    }
    variant("Dark mode", FigmaBoolean(true)) {
        code {
            """
            HomeservicesTheme(darkTheme = true) {
                content()
            }
            """.trimIndent()
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Color token usage examples (for designer reference in Dev Mode)
// ─────────────────────────────────────────────────────────────────────────────

figma(
    url = "PLACEHOLDER: https://www.figma.com/file/<FILE_ID>?node-id=<COLOR_SWATCH_NODE_ID>",
    component = "ColorSwatch"
) {
    imports(listOf(
        "androidx.compose.material3.MaterialTheme",
        "com.homeservices.designsystem.theme.HomeservicesColors",
        "com.homeservices.designsystem.theme.LocalHomeservicesExtendedColors"
    ))
    code {
        """
        // Brand primary: MaterialTheme.colorScheme.primary  (#0E4F47 light / #1E8378 dark)
        // Brand accent:  MaterialTheme.colorScheme.secondary (#EF6F4B light / #F78866 dark)
        // Verified badge: LocalHomeservicesExtendedColors.current.verified
        // Neighbourhood:  LocalHomeservicesExtendedColors.current.neighbourhood
        """.trimIndent()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Typography token usage examples
// ─────────────────────────────────────────────────────────────────────────────

figma(
    url = "PLACEHOLDER: https://www.figma.com/file/<FILE_ID>?node-id=<TYPOGRAPHY_NODE_ID>",
    component = "TypographyScale"
) {
    imports(listOf(
        "androidx.compose.material3.MaterialTheme",
        "androidx.compose.material3.Text"
    ))
    code {
        """
        // display.xl  → MaterialTheme.typography.displayLarge   (48sp, Bold)
        // display.lg  → MaterialTheme.typography.displayMedium  (40sp, Bold)
        // title.lg    → MaterialTheme.typography.headlineLarge  (28sp, SemiBold)
        // title.md    → MaterialTheme.typography.headlineMedium (22sp, SemiBold)
        // title.sm    → MaterialTheme.typography.titleLarge     (18sp, SemiBold)
        // body.lg     → MaterialTheme.typography.bodyLarge      (16sp, Normal)
        // body.md     → MaterialTheme.typography.bodyMedium     (14sp, Normal)
        // body.sm     → MaterialTheme.typography.bodySmall      (12sp, Medium)
        // label.lg    → MaterialTheme.typography.labelLarge     (14sp, SemiBold)
        // label.sm    → MaterialTheme.typography.labelSmall     (11sp, SemiBold)
        Text(text = "Example", style = MaterialTheme.typography.bodyLarge)
        """.trimIndent()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Spacing token usage examples
// ─────────────────────────────────────────────────────────────────────────────

figma(
    url = "PLACEHOLDER: https://www.figma.com/file/<FILE_ID>?node-id=<SPACING_NODE_ID>",
    component = "SpacingGuide"
) {
    imports(listOf("com.homeservices.designsystem.theme.LocalHomeservicesSpacing"))
    code {
        """
        val spacing = LocalHomeservicesSpacing.current
        // spacing.space0  = 0.dp    spacing.space1  = 4.dp
        // spacing.space2  = 8.dp    spacing.space3  = 12.dp
        // spacing.space4  = 16.dp   spacing.space6  = 24.dp
        // spacing.space8  = 32.dp   spacing.space12 = 48.dp
        // spacing.space16 = 64.dp   spacing.space24 = 96.dp
        """.trimIndent()
    }
}
