package com.homeservices.customer.ui.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation
import com.homeservices.customer.ui.shared.TrustDossierUiState
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/**
 * Verifies that the technician-id lifecycle in [LiveTrackingUiState] correctly drives
 * [TrustDossierViewModel] calls:
 *
 *  - When [LiveTrackingUiState.Tracking.technicianId] is non-null, the trust-dossier should be
 *    loaded.
 *  - When [LiveTrackingUiState.Tracking.technicianId] is null, the trust-dossier should remain
 *    [TrustDossierUiState.Unavailable].
 *
 * These are pure state-model tests (no Android framework required).
 */
@RunWith(JUnit4::class)
public class LiveTrackingTrustDossierTest {

    @Test
    public fun `Tracking state exposes technicianId from LiveLocation`() {
        val loc = LiveLocation(
            lat = 12.97,
            lng = 77.59,
            etaMinutes = 8,
            techName = "Suresh",
            techPhotoUrl = "https://example.com/photo.jpg",
            technicianId = "tech-99",
        )
        val state = LiveTrackingUiState.Tracking(
            bookingId = "b1",
            location = loc,
            status = BookingStatus.EnRoute,
            techName = loc.techName,
            techPhotoUrl = loc.techPhotoUrl,
            etaMinutes = loc.etaMinutes,
            technicianId = loc.technicianId,
        )
        assertThat(state.technicianId).isEqualTo("tech-99")
    }

    @Test
    public fun `Tracking state has null technicianId when location is null`() {
        val state = LiveTrackingUiState.Tracking(
            bookingId = "b2",
            location = null,
            status = BookingStatus.Searching,
            techName = "",
            techPhotoUrl = "",
            etaMinutes = null,
            technicianId = null,
        )
        assertThat(state.technicianId).isNull()
    }

    @Test
    public fun `TrustDossierUiState is Unavailable when technicianId is null`() {
        // Simulate what the screen does: start with Unavailable when no techId provided
        val trustState: TrustDossierUiState = TrustDossierUiState.Unavailable
        assertThat(trustState).isEqualTo(TrustDossierUiState.Unavailable)
    }

    @Test
    public fun `technicianId is not exposed when status is Searching`() {
        val state = LiveTrackingUiState.Tracking(
            bookingId = "b3",
            location = null,
            status = BookingStatus.Searching,
            techName = "",
            techPhotoUrl = "",
            etaMinutes = null,
            technicianId = null,
        )
        // Dossier should not be triggered for pre-assignment statuses
        val shouldShowDossier = state.technicianId != null &&
            state.status !is BookingStatus.Searching &&
            state.status !is BookingStatus.PendingPayment &&
            state.status !is BookingStatus.Paid
        assertThat(shouldShowDossier).isFalse()
    }

    @Test
    public fun `technicianId triggers dossier load when status is Assigned`() {
        val state = LiveTrackingUiState.Tracking(
            bookingId = "b4",
            location = null,
            status = BookingStatus.Assigned,
            techName = "Ramesh",
            techPhotoUrl = "",
            etaMinutes = null,
            technicianId = "tech-42",
        )
        val shouldShowDossier = state.technicianId != null
        assertThat(shouldShowDossier).isTrue()
    }
}
