@file:Suppress("MatchingDeclarationName")

package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** Border-width tokens for strokes, dividers and focus outlines. */
public object HomeservicesBorderWidth {
    /** No border. */
    public val none: Dp = 0.dp

    /** 1 dp hairline stroke. */
    public val hairline: Dp = 1.dp

    /** 2 dp focus or selected-state stroke. */
    public val focus: Dp = 2.dp
}

/** CompositionLocal carrier for [HomeservicesBorderWidth]. */
public val LocalHomeservicesBorderWidth: ProvidableCompositionLocal<HomeservicesBorderWidth> =
    staticCompositionLocalOf { HomeservicesBorderWidth }
