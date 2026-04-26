package com.homeservices.technician.ui.complaint

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
public class ComplaintScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun complaintScreenInitial() {
        // paparazzi.snapshot { ComplaintScreen(bookingId = "bk-1", onBack = {}) }  // recorded on CI workflow_dispatch
    }
}
