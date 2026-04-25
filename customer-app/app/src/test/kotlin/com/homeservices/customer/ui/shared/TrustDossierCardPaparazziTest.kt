package com.homeservices.customer.ui.shared

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class TrustDossierCardPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun compact_unavailable(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Unavailable, compact = true)
            }
        }
    }

    @Test
    public fun expanded_unavailable(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Unavailable, compact = false)
            }
        }
    }

    @Ignore("HandlerDispatcher IllegalStateException — Coil async handler fires after Paparazzi Looper quits on Loaded state; fix with Coil test dispatcher before recording")
    @Test
    public fun compact_loaded(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Loaded(sampleProfile()), compact = true)
            }
        }
    }

    @Ignore("HandlerDispatcher IllegalStateException — Coil async handler fires after Paparazzi Looper quits on Loaded state; fix with Coil test dispatcher before recording")
    @Test
    public fun expanded_loaded(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Loaded(sampleProfile()), compact = false)
            }
        }
    }

    private fun sampleProfile() =
        TechnicianProfile(
            id = "tech-1",
            displayName = "Ramesh Kumar",
            photoUrl = null,
            verifiedAadhaar = true,
            verifiedPoliceCheck = true,
            trainingInstitution = "HomeSkills Academy",
            certifications = listOf("Plumbing L2", "Electrical Safety"),
            languages = listOf("Hindi", "English"),
            yearsInService = 5,
            totalJobsCompleted = 312,
            lastReviews = emptyList(),
        )
}
