package com.homeservices.technician.ui.activeJob

import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/**
 * [ShieldReportSheet] hardcoded two Devanagari literals and one English literal directly in the
 * composable, bypassing string resources entirely (S-33). These tests assert the replacement
 * resources exist and carry en/hi parity, so the composable can render through stringResource()
 * instead.
 */
@RunWith(RobolectricTestRunner::class)
public class ShieldReportSheetStringsTest {
    @Test
    public fun `shield report strings resolve in english by default`(): Unit {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.shield_report_title)).isEqualTo("Report customer")
        assertThat(context.getString(R.string.shield_report_subtitle)).isEqualTo("What happened (optional)")
        assertThat(context.getString(R.string.shield_report_char_count, 0)).isEqualTo("0/500")
        assertThat(context.getString(R.string.shield_report_submit)).isEqualTo("Submit report")
        assertThat(context.getString(R.string.shield_report_submitting)).isEqualTo("Submitting report")
    }

    @Test
    public fun `shield report strings resolve in hindi`(): Unit {
        RuntimeEnvironment.setQualifiers("hi")
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.shield_report_title)).isEqualTo("ग्राहक रिपोर्ट करें")
        assertThat(context.getString(R.string.shield_report_subtitle)).isEqualTo("क्या हुआ बताएं (वैकल्पिक)")
        assertThat(context.getString(R.string.shield_report_submit)).isEqualTo("रिपोर्ट सबमिट करें")
        assertThat(context.getString(R.string.shield_report_submitting)).isEqualTo("रिपोर्ट सबमिट हो रही है")
    }
}
