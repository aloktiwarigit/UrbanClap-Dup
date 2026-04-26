package com.homeservices.customer.ui.complaint

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
public class ComplaintScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun complaintScreenIdle() {
        // paparazzi.snapshot { ComplaintScreen(bookingId = "test-booking", onBack = {}) }  // recorded on CI workflow_dispatch
    }
}
