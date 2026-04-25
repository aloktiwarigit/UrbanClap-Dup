package com.homeservices.technician.ui.rating

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
public class RatingScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun ratingScreenInitial() {
        // paparazzi.snapshot { RatingScreen() }  // recorded on CI workflow_dispatch
    }
}
