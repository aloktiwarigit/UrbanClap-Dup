package com.homeservices.customer.ui.tracking

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

// Golden recorded on CI via paparazzi-record.yml workflow_dispatch.
// See docs/patterns/paparazzi-cross-os-goldens.md — never record on Windows.
@RunWith(JUnit4::class)
public class LiveTrackingScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Ignore("Golden not yet recorded — trigger paparazzi-record.yml on CI after merge")
    @Test
    public fun `LiveTrackingScreen loading state`(): Unit = Unit
}
