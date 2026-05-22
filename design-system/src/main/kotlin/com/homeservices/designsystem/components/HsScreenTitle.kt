package com.homeservices.designsystem.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle

/**
 * Accessible screen-title composable.
 *
 * Wraps [Text] with [Modifier.semantics] { [heading]() } so that TalkBack's
 * heading-navigation gesture (swipe with two fingers) can jump directly to the
 * screen title. Every customer-app and technician-app screen MUST use this for
 * its primary visible heading.
 *
 * Default [style] is `headlineMedium` — override for screens that use a
 * larger hero headline (e.g. auth, catalogue home).
 */
@Composable
public fun HsScreenTitle(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.headlineMedium,
    color: Color = MaterialTheme.colorScheme.onSurface,
) {
    Text(
        text = text,
        style = style,
        color = color,
        modifier = modifier.semantics { heading() },
    )
}
