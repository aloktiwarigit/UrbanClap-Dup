package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class ServiceDetailScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun `service detail success state`(): Unit {
        paparazzi.snapshot {
            ServiceDetailContent(
                uiState = ServiceDetailUiState.Success(sampleService()),
                confidenceScoreState = ConfidenceScoreUiState.Hidden,
                onBookNow = { _, _ -> },
            )
        }
    }

    private fun sampleService() =
        Service(
            id = "s1",
            categoryId = "c1",
            name = "Pipe Fix",
            description = "Full fix",
            basePrice = 50000,
            durationMinutes = 60,
            imageUrl = "https://example.com/img.jpg",
            includes = listOf("Tools", "Labour"),
            addOns = listOf(AddOn("Extra pipe", 10000)),
        )
}
