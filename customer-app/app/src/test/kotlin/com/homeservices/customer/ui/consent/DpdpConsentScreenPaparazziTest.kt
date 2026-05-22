package com.homeservices.customer.ui.consent

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot regression tests for [DpdpConsentScreen].
 *
 * All tests are @Ignored on local Windows machines to prevent cross-OS font-antialiasing
 * drift from producing false failures. Goldens are recorded via the
 * `paparazzi-record.yml` workflow_dispatch workflow on CI (Linux).
 *
 * See `docs/patterns/paparazzi-cross-os-goldens.md`.
 */
@Ignore("Record on CI via paparazzi-record.yml workflow_dispatch — cross-OS font drift on Windows")
public class DpdpConsentScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun consentScreen_lightTheme_en() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DpdpConsentScreenContent(
                    uiState = ConsentUiState(
                        analyticsOptIn = true,
                        crashOptIn = true,
                        marketingOptIn = false,
                        isLoading = false,
                    ),
                    onToggleAnalytics = {},
                    onToggleCrash = {},
                    onToggleMarketing = {},
                    onConfirm = {},
                    onDeclineAll = {},
                )
            }
        }
    }

    @Test
    public fun consentScreen_darkTheme_en() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                DpdpConsentScreenContent(
                    uiState = ConsentUiState(
                        analyticsOptIn = true,
                        crashOptIn = true,
                        marketingOptIn = false,
                        isLoading = false,
                    ),
                    onToggleAnalytics = {},
                    onToggleCrash = {},
                    onToggleMarketing = {},
                    onConfirm = {},
                    onDeclineAll = {},
                )
            }
        }
    }

    @Test
    public fun consentScreen_lightTheme_hi() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                // Hindi locale is the default string language in this app;
                // this test captures the light-mode variant with all-accept state.
                DpdpConsentScreenContent(
                    uiState = ConsentUiState(
                        analyticsOptIn = true,
                        crashOptIn = true,
                        marketingOptIn = true,
                        isLoading = false,
                    ),
                    onToggleAnalytics = {},
                    onToggleCrash = {},
                    onToggleMarketing = {},
                    onConfirm = {},
                    onDeclineAll = {},
                )
            }
        }
    }

    @Test
    public fun consentScreen_darkTheme_hi() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                // Dark mode + all-accept state.
                DpdpConsentScreenContent(
                    uiState = ConsentUiState(
                        analyticsOptIn = true,
                        crashOptIn = true,
                        marketingOptIn = true,
                        isLoading = false,
                    ),
                    onToggleAnalytics = {},
                    onToggleCrash = {},
                    onToggleMarketing = {},
                    onConfirm = {},
                    onDeclineAll = {},
                )
            }
        }
    }
}
