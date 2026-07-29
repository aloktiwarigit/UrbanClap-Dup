package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

internal class BorderWidthTokensTest {
    @Test
    internal fun border_width_tokens_cover_hairline_and_focus_strokes() {
        assertThat(HomeservicesBorderWidth.none.value).isEqualTo(0f)
        assertThat(HomeservicesBorderWidth.hairline.value).isEqualTo(1f)
        assertThat(HomeservicesBorderWidth.focus.value).isEqualTo(2f)
    }

    @Test
    internal fun localHomeservicesBorderWidth_isNotNull() {
        assertThat(LocalHomeservicesBorderWidth).isNotNull()
    }
}
