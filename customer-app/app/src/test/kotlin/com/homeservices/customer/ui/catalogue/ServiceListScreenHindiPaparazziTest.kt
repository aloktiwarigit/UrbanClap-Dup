package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

// Codex F2 (owner ruling 2026-08-09): HI-light variants only, dark deferred. See
// CatalogueHomeScreenHindiPaparazziTest for the locale-switch rationale.
@RunWith(JUnit4::class)
public class ServiceListScreenHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"))

    @Test
    public fun `service list success state hindiLight`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceListContent(
                    uiState =
                        ServiceListUiState.Success(
                            listOf(
                                service("s1", "एसी डीप क्लीनिंग", "फोम क्लीनिंग, फिल्टर वॉश और ड्रेन चेक।", 79900, 60),
                                service("s2", "एसी गैस रीफिल", "लीक निरीक्षण और दबाव-समायोजित गैस रीफिल।", 129900, 90),
                                service("s3", "एसी मरम्मत विज़िट", "मरम्मत से पहले सत्यापित तकनीशियन द्वारा निदान।", 29900, 45),
                            ),
                        ),
                    onServiceClick = {},
                )
            }
        }
    }

    @Test
    public fun `service list error state hindiLight`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceListContent(
                    uiState = ServiceListUiState.Error("net err"),
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
