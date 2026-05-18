package com.homeservices.customer.ui.booking

import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.places.PlacePrediction
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi golden tests for [AddressPickerScreenContent].
 *
 * All cases are @Ignored on Windows — goldens are recorded on CI Linux only
 * via the `paparazzi-record.yml` workflow_dispatch.
 * See docs/patterns/paparazzi-cross-os-goldens.md.
 */
public class AddressPickerScreenPaparazziTest {

    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun searching_withThreePredictions_lightTheme() {
        paparazzi.snapshot {
            AddressPickerScreenContent(
                uiState = AddressPickerUiState.PredictionsAvailable(
                    query = "Ram M",
                    predictions = listOf(
                        PlacePrediction("p1", "Ram Mandir", "Ayodhya, UP"),
                        PlacePrediction("p2", "Ram Ghat", "Ayodhya, UP"),
                        PlacePrediction("p3", "Ram Lala Complex", "Faizabad, UP"),
                    ),
                ),
                query = "Ram M",
                onQueryChange = {},
                onClearQuery = {},
                onPredictionClick = {},
                onMarkerDragEnd = { _, _ -> },
                onConfirm = {},
                onNotifyMe = {},
            )
        }
    }

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun selectedInServiceArea_lightTheme() {
        paparazzi.snapshot {
            AddressPickerScreenContent(
                uiState = AddressPickerUiState.Selected(
                    formattedAddress = "Ram Janmabhoomi, Ayodhya 224123",
                    lat = 26.7958,
                    lng = 82.1947,
                    isInService = true,
                ),
                query = "Ram Mandir",
                onQueryChange = {},
                onClearQuery = {},
                onPredictionClick = {},
                onMarkerDragEnd = { _, _ -> },
                onConfirm = {},
                onNotifyMe = {},
            )
        }
    }

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun refusedOutOfArea_lightTheme() {
        paparazzi.snapshot {
            AddressPickerScreenContent(
                uiState = AddressPickerUiState.RefusedOutOfArea(
                    lat = 27.1336,
                    lng = 81.9612,
                ),
                query = "Gonda",
                onQueryChange = {},
                onClearQuery = {},
                onPredictionClick = {},
                onMarkerDragEnd = { _, _ -> },
                onConfirm = {},
                onNotifyMe = {},
            )
        }
    }

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun searchUnavailable_dropPinFallback_lightTheme() {
        paparazzi.snapshot {
            AddressPickerScreenContent(
                uiState = AddressPickerUiState.PredictionsAvailable(
                    query = "anything",
                    predictions = emptyList(),
                ),
                query = "anything",
                onQueryChange = {},
                onClearQuery = {},
                onPredictionClick = {},
                onMarkerDragEnd = { _, _ -> },
                onConfirm = {},
                onNotifyMe = {},
            )
        }
    }

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun selectedInServiceArea_hindiLocale_lightTheme() {
        paparazzi.snapshot {
            AddressPickerScreenContent(
                uiState = AddressPickerUiState.Selected(
                    formattedAddress = "राम जन्मभूमि, अयोध्या 224123",
                    lat = 26.7958,
                    lng = 82.1947,
                    isInService = true,
                ),
                query = "राम मंदिर",
                onQueryChange = {},
                onClearQuery = {},
                onPredictionClick = {},
                onMarkerDragEnd = { _, _ -> },
                onConfirm = {},
                onNotifyMe = {},
            )
        }
    }
}
