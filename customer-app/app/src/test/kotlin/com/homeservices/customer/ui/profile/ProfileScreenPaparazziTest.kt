package com.homeservices.customer.ui.profile

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.designsystem.theme.HomeservicesTheme
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class ProfileScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun authenticatedVm(): ProfileViewModel =
        mockk<ProfileViewModel>(relaxed = true).also { vm ->
            every { vm.authState } returns
                MutableStateFlow(
                    AuthState.Authenticated(
                        uid = "u1",
                        displayName = "Priya Sharma",
                        phoneLastFour = "4321",
                    ),
                )
        }

    private fun unauthenticatedVm(): ProfileViewModel =
        mockk<ProfileViewModel>(relaxed = true).also { vm ->
            every { vm.authState } returns MutableStateFlow(AuthState.Unauthenticated)
        }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch — Sprint 5 follow-up PR")
    @Test
    public fun authenticatedUser_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ProfileScreen(viewModel = authenticatedVm())
            }
        }
    }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch — Sprint 5 follow-up PR")
    @Test
    public fun authenticatedUser_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                ProfileScreen(viewModel = authenticatedVm())
            }
        }
    }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch — Sprint 5 follow-up PR")
    @Test
    public fun unauthenticatedUser_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ProfileScreen(viewModel = unauthenticatedVm())
            }
        }
    }
}
