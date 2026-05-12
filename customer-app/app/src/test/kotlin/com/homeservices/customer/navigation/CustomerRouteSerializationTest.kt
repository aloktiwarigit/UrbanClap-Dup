package com.homeservices.customer.navigation

import kotlinx.serialization.json.Json
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * JVM unit tests for [@Serializable] customer route round-trips.
 *
 * These tests verify that the spike acceptance criterion is met:
 *   `BookingPriceApprovalRoute(bookingId="bk123")` round-trips through Json
 *   encode/decode, which proves kotlinx-serialization is wired correctly.
 *
 * The Compose Nav `composable<T>()` + `entry.toRoute<T>()` API uses the same
 * kotlinx-serialization codec internally. If Json round-trip works, typed nav works.
 *
 * See E11 spec §E11-S01a acceptance criterion AC-3.
 */
public class CustomerRouteSerializationTest {

    private val json = Json { ignoreUnknownKeys = true }

    // ── Spike target: BookingPriceApprovalRoute (arg route) ───────────────────

    @Nested
    public inner class BookingPriceApprovalRouteTests {

        @Test
        public fun `BookingPriceApprovalRoute round-trips through JSON serialization`() {
            val original = BookingPriceApprovalRoute(bookingId = "bk123")
            val encoded = json.encodeToString(BookingPriceApprovalRoute.serializer(), original)
            val decoded = json.decodeFromString(BookingPriceApprovalRoute.serializer(), encoded)

            assertThat(decoded.bookingId).isEqualTo("bk123")
            assertThat(decoded).isEqualTo(original)
        }

        @Test
        public fun `BookingPriceApprovalRoute with special characters in bookingId`() {
            val original = BookingPriceApprovalRoute(bookingId = "booking/with/slashes")
            val encoded = json.encodeToString(BookingPriceApprovalRoute.serializer(), original)
            val decoded = json.decodeFromString(BookingPriceApprovalRoute.serializer(), encoded)

            assertThat(decoded.bookingId).isEqualTo("booking/with/slashes")
        }

        @Test
        public fun `BookingPriceApprovalRoute spec is correct`() {
            val route = BookingPriceApprovalRoute(bookingId = "bk-999")
            assertThat(route.spec).isEqualTo(CustomerRouteSpec.BookingPriceApproval)
        }
    }

    // ── Simple no-arg route: AuthRoute ────────────────────────────────────────

    @Nested
    public inner class AuthRouteTests {

        @Test
        public fun `AuthRoute round-trips through JSON serialization`() {
            val original = AuthRoute
            val encoded = json.encodeToString(AuthRoute.serializer(), original)
            val decoded = json.decodeFromString(AuthRoute.serializer(), encoded)

            assertThat(decoded).isEqualTo(original)
        }

        @Test
        public fun `AuthRoute spec is Auth`() {
            assertThat(AuthRoute.spec).isEqualTo(CustomerRouteSpec.Auth)
        }
    }

    // ── ServiceTrackingRoute ──────────────────────────────────────────────────

    @Nested
    public inner class ServiceTrackingRouteTests {

        @Test
        public fun `ServiceTrackingRoute round-trips through JSON`() {
            val original = ServiceTrackingRoute(bookingId = "tracking-bk-42")
            val encoded = json.encodeToString(ServiceTrackingRoute.serializer(), original)
            val decoded = json.decodeFromString(ServiceTrackingRoute.serializer(), encoded)

            assertThat(decoded).isEqualTo(original)
        }
    }

    // ── ComplaintRoute with nullable arg ──────────────────────────────────────

    @Nested
    public inner class ComplaintRouteTests {

        @Test
        public fun `ComplaintRoute with null complaintId round-trips`() {
            val original = ComplaintRoute(bookingId = "bk-1", complaintId = null)
            val encoded = json.encodeToString(ComplaintRoute.serializer(), original)
            val decoded = json.decodeFromString(ComplaintRoute.serializer(), encoded)

            assertThat(decoded.bookingId).isEqualTo("bk-1")
            assertThat(decoded.complaintId).isNull()
        }

        @Test
        public fun `ComplaintRoute with non-null complaintId round-trips`() {
            val original = ComplaintRoute(bookingId = "bk-2", complaintId = "cmp-99")
            val encoded = json.encodeToString(ComplaintRoute.serializer(), original)
            val decoded = json.decodeFromString(ComplaintRoute.serializer(), encoded)

            assertThat(decoded.complaintId).isEqualTo("cmp-99")
        }
    }
}
