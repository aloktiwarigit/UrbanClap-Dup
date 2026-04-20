package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Category
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class CatalogueHomeScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun `catalogue home loading state`(): Unit {
        paparazzi.snapshot {
            CatalogueHomeContent(
                uiState = CatalogueHomeUiState.Loading,
                onCategoryClick = {},
            )
        }
    }

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun `catalogue home success state`(): Unit {
        paparazzi.snapshot {
            CatalogueHomeContent(
                uiState =
                    CatalogueHomeUiState.Success(
                        listOf(Category("1", "Plumbing", "https://example.com/img.jpg", 5)),
                    ),
                onCategoryClick = {},
            )
        }
    }
}
