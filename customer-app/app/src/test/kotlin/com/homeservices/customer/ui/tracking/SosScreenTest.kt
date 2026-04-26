package com.homeservices.customer.ui.tracking

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class SosScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Ignore("Goldens recorded on CI Linux — never record on Windows")
    @Test
    public fun sosBottomSheetGolden(): Unit {
        paparazzi.snapshot {
            SosBottomSheet(secondsLeft = 15, onCancel = {}, onConfirmNow = {})
        }
    }

    @Ignore("Goldens recorded on CI Linux — never record on Windows")
    @Test
    public fun sosConsentDialogGolden(): Unit {
        paparazzi.snapshot {
            SosConsentDialog(onGranted = {}, onDenied = {})
        }
    }
}
