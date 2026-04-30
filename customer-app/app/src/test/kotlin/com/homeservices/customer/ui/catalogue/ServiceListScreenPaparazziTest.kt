package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class ServiceListScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `service list success state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceListContent(
                    uiState =
                        ServiceListUiState.Success(
                            listOf(
                                service("s1", "AC deep cleaning", "Foam cleaning, filter wash, and drain check.", 79900, 60),
                                service("s2", "AC gas refill", "Leak inspection and pressure-adjusted gas refill.", 129900, 90),
                                service("s3", "AC repair visit", "Diagnosis by a verified technician before repair.", 29900, 45),
                            ),
                        ),
                    onServiceClick = {},
                )
            }
        }
    }

    private fun service(
        id: String,
        name: String,
        description: String,
        price: Int,
        durationMinutes: Int,
    ): Service =
        Service(
            id = id,
            categoryId = "ac",
            name = name,
            description = description,
            basePrice = price,
            durationMinutes = durationMinutes,
            imageUrl = "",
            includes = emptyList(),
            addOns = emptyList(),
        )
}
