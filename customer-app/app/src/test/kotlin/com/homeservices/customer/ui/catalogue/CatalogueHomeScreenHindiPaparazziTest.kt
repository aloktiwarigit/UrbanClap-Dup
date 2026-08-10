package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

// Codex F2 (owner ruling 2026-08-09): HI-light variants only, dark deferred. The real risk is
// Devanagari category-name wrapping on the Ayodhya/UP Hindi pivot, not dark-mode drift. Locale
// switch follows RatingShieldHindiPaparazziTest's mechanism (DeviceConfig.copy(locale = "hi")) so
// stringResource() calls resolve against values-hi/ — not FirstLaunchLanguageScreenPaparazziTest's
// static bilingual-text mechanism, which doesn't apply to a screen driven by real string resources.
@RunWith(JUnit4::class)
public class CatalogueHomeScreenHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"))

    @Test
    public fun `catalogue home loading state hindiLight`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState = CatalogueHomeUiState.Loading,
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                    onTrackBooking = {},
                )
            }
        }
    }

    @Test
    public fun `catalogue home success state hindiLight`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState =
                        CatalogueHomeUiState.Success(
                            listOf(
                                Category("plumbing", "प्लंबिंग", "", 5, minPricePaise = 39900),
                                Category("ac-repair", "एसी मरम्मत", "", 8, minPricePaise = 59900),
                                Category("electrical", "इलेक्ट्रिकल", "", 3, minPricePaise = 29900),
                                Category("water-purifier", "आरओ / वाटर प्यूरीफायर", "", 2, minPricePaise = 49900),
                            ),
                        ),
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                    onTrackBooking = {},
                )
            }
        }
    }

    @Test
    public fun `catalogue home empty state hindiLight`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState = CatalogueHomeUiState.Success(emptyList()),
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                    onTrackBooking = {},
                )
            }
        }
    }

    @Test
    public fun `catalogue home error state hindiLight`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState = CatalogueHomeUiState.Error("net err"),
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                    onTrackBooking = {},
                )
            }
        }
    }
}
