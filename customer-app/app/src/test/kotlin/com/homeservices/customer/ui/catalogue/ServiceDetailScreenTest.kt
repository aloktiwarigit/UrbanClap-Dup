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

    // I-4: acceptance 2/3 claim coverage for the two states this story added to this screen
    // (ServiceDetailError retry treatment, ServiceDetailSkeleton on HsSkeletonBlock) — previously
    // resting on code reading alone. Mirrors ServiceListScreenPaparazziTest's error case and
    // CatalogueHomeScreenTest's loading case.
    @Test
    public fun `service detail error state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceDetailContent(
                    uiState = ServiceDetailUiState.Error("net err"),
                    confidenceScoreState = ConfidenceScoreUiState.Hidden,
                    onBookNow = { _, _ -> },
                )
            }
        }
    }

    @Test
    public fun `service detail loading state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceDetailContent(
                    uiState = ServiceDetailUiState.Loading,
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
