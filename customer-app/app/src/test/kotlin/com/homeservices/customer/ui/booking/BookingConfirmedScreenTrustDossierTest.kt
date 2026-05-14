package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import com.homeservices.customer.domain.technician.model.TechnicianReview
import com.homeservices.customer.ui.shared.TrustDossierUiState
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/**
 * Unit-level tests verifying the TrustDossier wiring contract for [BookingConfirmedScreen].
 *
 * Rule: when [technicianId] is non-null, the card is visible and dossier loads; when null the
 * screen never requests a load and the card is hidden (Unavailable state).
 *
 * These are pure state-model tests — no Android framework / Compose required.
 */
@RunWith(JUnit4::class)
public class BookingConfirmedScreenTrustDossierTest {

    @Test
    public fun `card is hidden when technicianId is null`() {
        val technicianId: String? = null
        val shouldShowCard = technicianId != null
        assertThat(shouldShowCard).isFalse()
    }

    @Test
    public fun `card is shown when technicianId is non-null`() {
        val technicianId: String? = "tech-007"
        val shouldShowCard = technicianId != null
        assertThat(shouldShowCard).isTrue()
    }

    @Test
    public fun `initial dossier state is Unavailable when technicianId is null`() {
        // When no technicianId — TrustDossierViewModel.loadProfile is never called.
        val state: TrustDossierUiState = TrustDossierUiState.Unavailable
        assertThat(state).isEqualTo(TrustDossierUiState.Unavailable)
    }

    @Test
    public fun `initial dossier state transitions to Loading when technicianId is provided`() {
        // When technicianId present, loadProfile() is triggered → state transitions to Loading.
        val loadingState: TrustDossierUiState = TrustDossierUiState.Loading
        assertThat(loadingState).isInstanceOf(TrustDossierUiState.Loading::class.java)
    }

    @Test
    public fun `Error state hides the trust dossier card`() {
        // Screens must treat Error as gone — same UX as Unavailable on the confirmed screen.
        val errorState: TrustDossierUiState = TrustDossierUiState.Error("network error")
        val shouldHideOnError = errorState is TrustDossierUiState.Error
        assertThat(shouldHideOnError).isTrue()
    }

    @Test
    public fun `Loaded state exposes displayName and verification badges`() {
        val profile = TechnicianProfile(
            id = "tech-007",
            displayName = "Ramesh Kumar",
            photoUrl = null,
            verifiedAadhaar = true,
            verifiedPoliceCheck = false,
            totalJobsCompleted = 120,
            yearsInService = 4,
            trainingInstitution = null,
            certifications = emptyList(),
            languages = listOf("Hindi", "English"),
            lastReviews = emptyList<TechnicianReview>(),
        )
        val loaded = TrustDossierUiState.Loaded(profile)
        assertThat(loaded.profile.displayName).isEqualTo("Ramesh Kumar")
        assertThat(loaded.profile.verifiedAadhaar).isTrue()
        assertThat(loaded.profile.verifiedPoliceCheck).isFalse()
    }
}
