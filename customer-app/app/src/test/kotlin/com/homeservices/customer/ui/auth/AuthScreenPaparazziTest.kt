package com.homeservices.customer.ui.auth

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class AuthScreenPaparazziTest {

    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5,
        theme = "android:Theme.Material.Light.NoActionBar",
    )

    @Test
    public fun truecallerLoadingState_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.TruecallerLoading,
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun truecallerLoadingState_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                AuthScreen(
                    uiState = AuthUiState.TruecallerLoading,
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun phoneEntryState_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.OtpEntry(phoneNumber = "", verificationId = null),
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun phoneEntryState_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                AuthScreen(
                    uiState = AuthUiState.OtpEntry(phoneNumber = "", verificationId = null),
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun errorState_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.Error(
                        message = "Incorrect code",
                        retriesLeft = 2,
                    ),
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun errorState_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                AuthScreen(
                    uiState = AuthUiState.Error(
                        message = "Incorrect code",
                        retriesLeft = 2,
                    ),
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }
}
