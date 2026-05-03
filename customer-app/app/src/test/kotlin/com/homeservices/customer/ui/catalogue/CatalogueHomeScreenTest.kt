package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class CatalogueHomeScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `catalogue home loading state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState = CatalogueHomeUiState.Loading,
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                )
            }
        }
    }

    @Test
    public fun `catalogue home success state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState =
                        CatalogueHomeUiState.Success(
                            listOf(
                                Category("plumbing", "Plumbing", "", 5, minPricePaise = 39900),
                                Category("ac-repair", "AC Repair", "", 8, minPricePaise = 59900),
                                Category("electrical", "Electrical", "", 3, minPricePaise = 29900),
                                Category("water-purifier", "RO / Water Purifier", "", 2, minPricePaise = 49900),
                            ),
                        ),
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                )
            }
        }
    }
}
