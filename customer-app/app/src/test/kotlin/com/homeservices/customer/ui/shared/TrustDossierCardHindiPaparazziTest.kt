package com.homeservices.customer.ui.shared

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

// Codex F2 (owner ruling 2026-08-09): HI-light variants only, dark deferred. See
// com.homeservices.customer.ui.catalogue.CatalogueHomeScreenHindiPaparazziTest for the
// locale-switch rationale.
@RunWith(JUnit4::class)
public class TrustDossierCardHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun compact_unavailable_hindiLight(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Unavailable, compact = true)
            }
        }
    }

    @Test
    public fun expanded_unavailable_hindiLight(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Unavailable, compact = false)
            }
        }
    }

    @Test
    public fun compact_loaded_hindiLight(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Loaded(sampleProfile()), compact = true)
            }
        }
    }

    @Test
    public fun expanded_loaded_hindiLight(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Loaded(sampleProfile()), compact = false)
            }
        }
    }

    private fun sampleProfile() =
        TechnicianProfile(
            id = "tech-1",
            displayName = "रमेश कुमार",
            photoUrl = null,
            verifiedAadhaar = true,
            verifiedPoliceCheck = true,
            trainingInstitution = "होमस्किल्स अकादमी",
            certifications = listOf("प्लंबिंग L2", "इलेक्ट्रिकल सेफ्टी"),
            languages = listOf("हिंदी", "अंग्रेज़ी"),
            yearsInService = 5,
            totalJobsCompleted = 312,
            lastReviews = emptyList(),
        )
}
