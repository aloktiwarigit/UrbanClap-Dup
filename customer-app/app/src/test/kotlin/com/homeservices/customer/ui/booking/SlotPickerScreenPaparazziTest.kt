package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.booking.model.SlotWindow
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import java.time.LocalDate

public class SlotPickerScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private val today: LocalDate = LocalDate.of(2026, 5, 20)
    private val tomorrow: LocalDate = today.plusDays(1)

    private fun slot(
        window: String,
        available: Boolean = true,
    ): SlotWindow = SlotWindow(window = window, available = available)

    private val morningSlots =
        listOf(
            slot("08:00-10:00"),
            slot("10:00-12:00"),
        )

    private val afternoonSlots =
        listOf(
            slot("12:00-14:00"),
            slot("14:00-16:00"),
        )

    private val mixedSlots =
        listOf(
            slot("08:00-10:00", available = false),
            slot("10:00-12:00", available = false),
            slot("12:00-14:00"),
            slot("14:00-16:00"),
            slot("16:00-18:00"),
            slot("18:00-20:00"),
        )

    @Ignore("Goldens recorded on CI Linux only — paparazzi-record.yml")
    @Test
    public fun slotPickerLoadedMorningSlots_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerContent(
                    state =
                        SlotPickerUiState.Loaded(
                            date = tomorrow,
                            slots = morningSlots,
                            filteredSlots = morningSlots,
                            selected = null,
                        ),
                    initialDate = tomorrow,
                    onDateSelect = {},
                    onSlotSelect = {},
                    onRetry = {},
                    onConfirm = { _, _ -> },
                )
            }
        }
    }

    @Ignore("Goldens recorded on CI Linux only — paparazzi-record.yml")
    @Test
    public fun slotPickerLoadedAfternoonSlots_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerContent(
                    state =
                        SlotPickerUiState.Loaded(
                            date = tomorrow,
                            slots = afternoonSlots,
                            filteredSlots = afternoonSlots,
                            selected = afternoonSlots[0],
                        ),
                    initialDate = tomorrow,
                    onDateSelect = {},
                    onSlotSelect = {},
                    onRetry = {},
                    onConfirm = { _, _ -> },
                )
            }
        }
    }

    @Ignore("Goldens recorded on CI Linux only — paparazzi-record.yml")
    @Test
    public fun slotPickerPastTimeFiltered_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerContent(
                    state =
                        SlotPickerUiState.Loaded(
                            date = today,
                            slots = mixedSlots,
                            filteredSlots = mixedSlots,
                            selected = null,
                        ),
                    initialDate = today,
                    onDateSelect = {},
                    onSlotSelect = {},
                    onRetry = {},
                    onConfirm = { _, _ -> },
                )
            }
        }
    }

    @Ignore("Goldens recorded on CI Linux only — paparazzi-record.yml")
    @Test
    public fun slotPickerEmptyState_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerContent(
                    state =
                        SlotPickerUiState.Loaded(
                            date = today,
                            slots = emptyList(),
                            filteredSlots = emptyList(),
                            selected = null,
                        ),
                    initialDate = today,
                    onDateSelect = {},
                    onSlotSelect = {},
                    onRetry = {},
                    onConfirm = { _, _ -> },
                )
            }
        }
    }

    @Ignore("Goldens recorded on CI Linux only — paparazzi-record.yml")
    @Test
    public fun slotPickerErrorState_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerContent(
                    state = SlotPickerUiState.Error(message = "Network unreachable"),
                    initialDate = today,
                    onDateSelect = {},
                    onSlotSelect = {},
                    onRetry = {},
                    onConfirm = { _, _ -> },
                )
            }
        }
    }

    @Ignore("Goldens recorded on CI Linux only — paparazzi-record.yml")
    @Test
    public fun slotPickerLoading_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerContent(
                    state = SlotPickerUiState.Loading,
                    initialDate = today,
                    onDateSelect = {},
                    onSlotSelect = {},
                    onRetry = {},
                    onConfirm = { _, _ -> },
                )
            }
        }
    }
}
