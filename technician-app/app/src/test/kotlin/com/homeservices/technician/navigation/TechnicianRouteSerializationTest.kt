package com.homeservices.technician.navigation

import kotlinx.serialization.json.Json
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * JVM unit tests for [@Serializable] technician route round-trips.
 *
 * Verifies the spike for technician-app: `JobOfferRoute(offerId="offer-123")` round-trips
 * through Json encode/decode, proving kotlinx-serialization is wired correctly.
 */
public class TechnicianRouteSerializationTest {

    private val json = Json { ignoreUnknownKeys = true }

    // ── Spike target: JobOfferRoute (arg route) ───────────────────────────────

    @Nested
    inner class JobOfferRouteTests {

        @Test
        public fun `JobOfferRoute round-trips through JSON serialization`() {
            val original = JobOfferRoute(offerId = "offer-123")
            val encoded = json.encodeToString(JobOfferRoute.serializer(), original)
            val decoded = json.decodeFromString(JobOfferRoute.serializer(), encoded)

            assertThat(decoded.offerId).isEqualTo("offer-123")
            assertThat(decoded).isEqualTo(original)
        }

        @Test
        public fun `JobOfferRoute spec is JobOffer`() {
            val route = JobOfferRoute(offerId = "offer-xyz")
            assertThat(route.spec).isEqualTo(TechnicianRouteSpec.JobOffer)
        }
    }

    // ── Simple no-arg route: TechnicianAuthRoute ──────────────────────────────

    @Nested
    inner class TechnicianAuthRouteTests {

        @Test
        public fun `TechnicianAuthRoute round-trips through JSON serialization`() {
            val original = TechnicianAuthRoute
            val encoded = json.encodeToString(TechnicianAuthRoute.serializer(), original)
            val decoded = json.decodeFromString(TechnicianAuthRoute.serializer(), encoded)

            assertThat(decoded).isEqualTo(original)
        }

        @Test
        public fun `TechnicianAuthRoute spec is Auth`() {
            assertThat(TechnicianAuthRoute.spec).isEqualTo(TechnicianRouteSpec.Auth)
        }
    }

    // ── ActiveJobRoute ────────────────────────────────────────────────────────

    @Nested
    inner class ActiveJobRouteTests {

        @Test
        public fun `ActiveJobRoute round-trips through JSON`() {
            val original = ActiveJobRoute(bookingId = "job-bk-77")
            val encoded = json.encodeToString(ActiveJobRoute.serializer(), original)
            val decoded = json.decodeFromString(ActiveJobRoute.serializer(), encoded)

            assertThat(decoded).isEqualTo(original)
        }
    }

    // ── TechnicianComplaintRoute with nullable complaintId ────────────────────

    @Nested
    inner class TechnicianComplaintRouteTests {

        @Test
        public fun `TechnicianComplaintRoute with null complaintId round-trips`() {
            val original = TechnicianComplaintRoute(bookingId = "bk-3", complaintId = null)
            val encoded = json.encodeToString(TechnicianComplaintRoute.serializer(), original)
            val decoded = json.decodeFromString(TechnicianComplaintRoute.serializer(), encoded)

            assertThat(decoded.complaintId).isNull()
        }
    }
}
