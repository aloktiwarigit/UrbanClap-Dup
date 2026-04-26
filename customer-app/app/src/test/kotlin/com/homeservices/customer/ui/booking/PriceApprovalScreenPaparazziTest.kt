package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.booking.model.PendingAddOn
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class PriceApprovalScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private val pending =
        PriceApprovalUiState.PendingApproval(
            bookingId = "bk-1",
            addOns = listOf(PendingAddOn("Gas refill", 120000, "Pressure below threshold")),
        )

    @Test
    public fun priceApproval_pendingApproval_light() {
        paparazzi.snapshot { HomeservicesTheme(darkTheme = false) { PriceApprovalContent(pending, {}) } }
    }

    @Test
    public fun priceApproval_loading_light() {
        paparazzi.snapshot { HomeservicesTheme(darkTheme = false) { PriceApprovalContent(PriceApprovalUiState.Loading, {}) } }
    }
}
