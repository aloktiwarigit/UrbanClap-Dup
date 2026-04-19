package com.homeservices.customer.ui.auth

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
    public fun errorState_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
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
    public fun idleState_lightTheme() {
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
    public fun otpCodeEntryState_lightTheme() {
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
    public fun otpSendingState_lightTheme() {
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
    public fun otpVerifyingState_lightTheme() {
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

    @Test
    public fun errorStateNoRetries_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState =
                        AuthUiState.Error(
                            message = "Too many attempts. Try again later.",
                            retriesLeft = 0,
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
    public fun errorStateOneRetry_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState =
                        AuthUiState.Error(
                            message = "Incorrect code",
                            retriesLeft = 1,
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
