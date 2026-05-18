package com.homeservices.customer.ui.waitlist

import app.cash.paparazzi.Paparazzi
import com.google.testing.junit.testparameterinjector.TestParameterInjector
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(TestParameterInjector::class)
public class WaitlistScreenPaparazziTest {

    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun formStateEnglish(): Unit = paparazzi.snapshot {
        WaitlistScreenContent(
            uiState = WaitlistUiState.Form(phone = "+919876543210", isPhoneValid = true),
            phone = "+919876543210",
            onPhoneChange = {},
            onSubmit = {},
        )
    }

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun confirmedStateEnglish(): Unit = paparazzi.snapshot {
        WaitlistScreenContent(
            uiState = WaitlistUiState.Confirmed,
            phone = "+919876543210",
            onPhoneChange = {},
            onSubmit = {},
        )
    }

    @Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun formStateHindi(): Unit = paparazzi.snapshot {
        WaitlistScreenContent(
            uiState = WaitlistUiState.Form(phone = "", isPhoneValid = false),
            phone = "",
            onPhoneChange = {},
            onSubmit = {},
        )
    }
}
