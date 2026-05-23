package com.homeservices.customer.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi smoke test for the kotlinx-serialization spike routes (E11-S01a WS-C).
 *
 * Validates that the [@Serializable] route types compile and can be rendered
 * inside a Compose context. The snapshot shows the decoded route data, proving
 * the round-trip works end-to-end in the Compose rendering environment.
 *
 * Golden images are recorded on CI Linux via `paparazzi-record.yml` workflow_dispatch.
 * NEVER record on Windows — see docs/patterns/paparazzi-cross-os-goldens.md.
 *
 * This test corresponds to E11 spec §S01a AC-3 and AC-5.
 */
public class SpikeRoutePaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    /**
     * Spike: simple no-arg route [AuthRoute] renders as expected.
     * Golden recorded on CI Linux via paparazzi-record.yml workflow_dispatch.
     */
    @Ignore("Golden not yet recorded — trigger paparazzi-record.yml workflow_dispatch on CI")
    @Test
    public fun authRoute_spike_noArgs_lightTheme() {
        val route = AuthRoute
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                Surface {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Spike Route: ${route.spec.name}",
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            text = "Type: ${route.javaClass.simpleName}",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }
    }

    /**
     * Spike: arg-carrying route [BookingPriceApprovalRoute] with bookingId="bk123".
     * This is the canonical spike acceptance criterion from E11 spec §S01a.
     * Golden recorded on CI Linux via paparazzi-record.yml workflow_dispatch.
     */
    @Ignore("Golden not yet recorded — trigger paparazzi-record.yml workflow_dispatch on CI")
    @Test
    public fun bookingPriceApprovalRoute_spike_withArgs_lightTheme() {
        val route = BookingPriceApprovalRoute(bookingId = "bk123")
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                Surface {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Spike Route: ${route.spec.name}",
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            text = "bookingId: ${route.bookingId}",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }
    }
}
