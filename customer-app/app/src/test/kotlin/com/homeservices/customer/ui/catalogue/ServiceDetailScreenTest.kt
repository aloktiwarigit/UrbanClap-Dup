package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class ServiceDetailScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `service detail success state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceDetailContent(
                    uiState = ServiceDetailUiState.Success(sampleService()),
                    confidenceScoreState = ConfidenceScoreUiState.Hidden,
                    onBookNow = { _, _ -> },
                )
            }
        }
    }

    private fun sampleService() =
        Service(
            id = "s1",
            categoryId = "c1",
            name = "AC deep cleaning",
            description = "Indoor unit cleaning, filter wash, drain check, and basic performance inspection.",
            basePrice = 79900,
            durationMinutes = 60,
            imageUrl = "",
            includes = listOf("Indoor unit foam cleaning", "Filter wash", "Drain pipe inspection"),
            addOns = listOf(AddOn("Gas pressure check", 14900), AddOn("Outdoor unit wash", 19900)),
        )
}
