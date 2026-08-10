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

// Codex F2 (owner ruling 2026-08-09): HI-light variant only, dark deferred. See
// CatalogueHomeScreenHindiPaparazziTest for the locale-switch rationale.
@RunWith(JUnit4::class)
public class ServiceDetailScreenHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"))

    @Test
    public fun `service detail success state hindiLight`(): Unit {
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
            name = "एसी डीप क्लीनिंग",
            description = "इनडोर यूनिट क्लीनिंग, फिल्टर वॉश, ड्रेन चेक और बुनियादी प्रदर्शन निरीक्षण।",
            basePrice = 79900,
            durationMinutes = 60,
            imageUrl = "",
            includes = listOf("इनडोर यूनिट फोम क्लीनिंग", "फिल्टर वॉश", "ड्रेन पाइप निरीक्षण"),
            addOns = listOf(AddOn("गैस प्रेशर चेक", 14900), AddOn("आउटडोर यूनिट वॉश", 19900)),
        )
}
