package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/**
 * E16-S03 — Paparazzi screenshots for [PhotoFirstServiceCard].
 *
 * All tests are @Ignored: photo assets are not yet commissioned, the
 * `customer.photo-first-catalogue.enabled` flag stays OFF in prod, and Paparazzi
 * goldens for this story are recorded on CI Linux only — see
 * docs/patterns/paparazzi-cross-os-goldens.md.
 */
@RunWith(JUnit4::class)
public class PhotoFirstServiceCardPaparazziTest {
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
                PhotoFirstServiceCard(
                    service =
                        Service(
                            id = "s1",
                            categoryId = "ac-repair",
                            name = "AC deep cleaning",
                            description = "Foam cleaning, filter wash, and drain check.",
                            basePrice = 79900,
                            durationMinutes = 60,
                            imageUrl = "https://cdn.example.com/ac-clean.jpg",
                            includes = emptyList(),
                            addOns = emptyList(),
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
                PhotoFirstServiceCard(
                    service =
                        Service(
                            id = "s2",
                            categoryId = "ac-repair",
                            name = "AC gas refill",
                            description = "Leak inspection and pressure-adjusted gas refill.",
                            basePrice = 129900,
                            durationMinutes = 90,
                            imageUrl = "",
                            includes = emptyList(),
                            addOns = emptyList(),
                        ),
                    onClick = {},
                )
            }
        }
    }
}
