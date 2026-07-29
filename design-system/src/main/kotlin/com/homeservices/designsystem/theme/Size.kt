/**
 * D1 control-size tokens — heights and minimum hit areas for interactive controls.
 *
 * WHY THIS FILE EXISTS (TOK-003).
 *
 * The module had no size/height category at all, so spacing tokens were borrowed as a stand-in.
 * The result shipped three different button heights from three different sourcing strategies:
 *
 *   HsPrimaryButton    space16  -> 64 dp   (a spacing token used as a height)
 *   HsSecondaryButton  space12  -> 48 dp   (a different spacing token, same misuse)
 *   HsActionButton     52.dp                (a raw literal on neither scale)
 *
 * That is not three deliberate sizes — it is the absence of a token category. Sizing a control from
 * the spacing scale also means any future change to spacing silently resizes buttons.
 *
 * Fixing the individual buttons without adding this category would have left the cause in place.
 *
 * Dual-exposure pattern: prefer `LocalHomeservicesSize.current.<token>` inside @Composable code so a
 * future density variant lands in one place; use the object directly elsewhere.
 */
@file:Suppress("MatchingDeclarationName") // object + val = 2 top-level decls; detekt counts class-like nodes only

package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** D1 control sizing. */
public object HomeservicesSize {
    /**
     * 48 dp — the floor for anything tappable.
     *
     * D2 users are on entry Android in the field, often outdoors and one-handed, and the audit found
     * interactive targets below this across both apps. No control may go under it, including icon
     * buttons in dense toolbars.
     */
    public val minTouchTarget: Dp = 48.dp

    /** 40 dp — compact controls inside dense rows. Never use for a primary action. */
    public val controlSm: Dp = 40.dp

    /** 48 dp — the default control height. Buttons, inputs, list-row actions. */
    public val controlMd: Dp = 48.dp

    /** 56 dp — prominent single-decision controls: booking CTA, accept/decline, SOS confirm. */
    public val controlLg: Dp = 56.dp

    /** 24 dp — standard inline icon. */
    public val iconMd: Dp = 24.dp

    /** 20 dp — icon paired with body text. */
    public val iconSm: Dp = 20.dp

    /** 40 dp — avatar / technician photo in a list row. */
    public val avatarMd: Dp = 40.dp
}

/**
 * CompositionLocal carrier for [HomeservicesSize]. Provide a custom value to support a dense-mode
 * variant. Defaults to the singleton.
 */
public val LocalHomeservicesSize: ProvidableCompositionLocal<HomeservicesSize> =
    staticCompositionLocalOf { HomeservicesSize }
