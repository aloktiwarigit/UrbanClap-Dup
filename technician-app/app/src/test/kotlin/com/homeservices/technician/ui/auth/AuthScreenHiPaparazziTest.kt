package com.homeservices.technician.ui.auth

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class AuthScreenHiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    // Goldens recorded on CI Linux via paparazzi-record.yml; never locally on Windows.

    @Test
    public fun authScreen_idle_hi() {
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
    public fun authScreen_otpEntry_hi() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AuthScreen(
                    uiState = AuthUiState.OtpEntry(phoneNumber = "+919876543210", verificationId = "ver-id-123"),
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }
}
