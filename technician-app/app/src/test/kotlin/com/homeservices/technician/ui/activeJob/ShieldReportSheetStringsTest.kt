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
        assertThat(context.getString(R.string.shield_report_trigger)).isEqualTo("Report customer")
        assertThat(context.getString(R.string.shield_report_trigger_desc))
            .isEqualTo("Report this customer for abusive or unsafe behaviour")
        assertThat(context.getString(R.string.shield_report_block_warning))
            .isEqualTo("This will block this customer from future bookings with you.")
        assertThat(context.getString(R.string.shield_report_snackbar_success)).isEqualTo("Report submitted.")
        assertThat(context.getString(R.string.shield_report_snackbar_error))
            .isEqualTo("Could not submit report. Try again.")
    }

    @Test
    public fun `shield report strings resolve in hindi`(): Unit {
        RuntimeEnvironment.setQualifiers("hi")
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.shield_report_title)).isEqualTo("ग्राहक रिपोर्ट करें")
        assertThat(context.getString(R.string.shield_report_subtitle)).isEqualTo("क्या हुआ बताएं (वैकल्पिक)")
        assertThat(context.getString(R.string.shield_report_submit)).isEqualTo("रिपोर्ट सबमिट करें")
        assertThat(context.getString(R.string.shield_report_submitting)).isEqualTo("रिपोर्ट सबमिट हो रही है")
        assertThat(context.getString(R.string.shield_report_trigger)).isEqualTo("ग्राहक की रिपोर्ट करें")
        assertThat(context.getString(R.string.shield_report_block_warning))
            .isEqualTo("इससे यह ग्राहक आपके भविष्य के बुकिंग से ब्लॉक हो जाएगा।")
    }
}
