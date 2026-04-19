package com.homeservices.designsystem.theme

import androidx.compose.ui.graphics.Color

/**
 * WCAG 2.1 relative-luminance contrast ratio helper — TEST-ONLY (not shipped in main).
 *
 * Formula:
 *   sRGB linearisation: c ≤ 0.03928 → c/12.92 ; otherwise ((c+0.055)/1.055)^2.4
 *   Luminance: L = 0.2126 R + 0.7152 G + 0.0722 B
 *   Contrast: (L_light + 0.05) / (L_dark + 0.05)
 *
 * Note: [Color.red], [Color.green], [Color.blue] return Float in 0..1 — do NOT divide by 255.
 */
internal object Wcag21Contrast {
    internal fun ratio(
        fg: Color,
        bg: Color,
    ): Double {
        val l1 = luminance(fg)
        val l2 = luminance(bg)
        val lighter = maxOf(l1, l2)
        val darker = minOf(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
    }

    private fun luminance(c: Color): Double {
        val r = channel(c.red)
        val g = channel(c.green)
        val b = channel(c.blue)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    private fun channel(value: Float): Double {
        val v = value.toDouble()
        return if (v <= 0.03928) v / 12.92 else Math.pow((v + 0.055) / 1.055, 2.4)
    }
}
