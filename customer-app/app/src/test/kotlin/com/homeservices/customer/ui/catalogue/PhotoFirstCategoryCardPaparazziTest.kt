package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/**
 * E16-S03 — Paparazzi screenshots for [PhotoFirstCategoryCard].
 *
 * All tests are @Ignored: photo assets are not yet commissioned, the
 * `customer.photo-first-catalogue.enabled` flag stays OFF in prod, and Paparazzi
 * goldens for this story are recorded on CI Linux only — see
 * docs/patterns/paparazzi-cross-os-goldens.md.
 */
@Ignore("Re-record on CI Linux via workflow_dispatch paparazzi-record.yml after sprint2a merge")
@RunWith(JUnit4::class)
public class PhotoFirstCategoryCardPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Ignore("Goldens recorded on CI Linux only — assets not yet commissioned (E16-S03)")
    @Test
    public fun withPhotoUrl_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                PhotoFirstCategoryCard(
                    category =
                        Category(
                            id = "ac-repair",
                            name = "AC Repair",
                            imageUrl = "https://cdn.example.com/ac-hero.jpg",
                            serviceCount = 5,
                            minPricePaise = 29900,
                        ),
                    onClick = {},
                )
            }
        }
    }

    @Ignore("Goldens recorded on CI Linux only — assets not yet commissioned (E16-S03)")
    @Test
    public fun fallbackNoUrl_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                PhotoFirstCategoryCard(
                    category =
                        Category(
                            id = "plumbing",
                            name = "Plumbing",
                            imageUrl = "",
                            serviceCount = 4,
                            minPricePaise = 19900,
                        ),
                    onClick = {},
                )
            }
        }
    }
}
