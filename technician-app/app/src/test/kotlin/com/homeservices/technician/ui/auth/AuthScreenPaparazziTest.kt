package com.homeservices.technician.ui.auth

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class AuthScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun authScreen_idle() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.Idle,
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun authScreen_otpEntry() {
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
    public fun authScreen_error() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState =
                        AuthUiState.Error(
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
    public fun authScreen_truecallerLoading() {
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
    public fun authScreen_otpEntry_darkTheme() {
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
    public fun authScreen_otpCodeEntry() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState =
                        AuthUiState.OtpEntry(
                            phoneNumber = "+919876543210",
                            verificationId = "ver-id-123",
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
    public fun authScreen_otpSending() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.OtpSending,
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun authScreen_otpVerifying() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.OtpVerifying,
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }
}
