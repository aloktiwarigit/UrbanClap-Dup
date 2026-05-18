package com.homeservices.customer.firebase

import com.homeservices.customer.data.tracking.LocationUpdateEvent
import com.homeservices.customer.data.tracking.LocationUpdateEventBus
import com.homeservices.customer.data.tracking.TrackingEventBus
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.yield
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Unit tests for the slim LOCATION_UPDATE FCM branch introduced in E17-S02.
 *
 * Constructs [CustomerFirebaseMessagingService] directly and manually wires the
 * [@Inject] fields. The real [LocationUpdateEventBus] is used for emission
 * assertions; [TrackingEventBus] is a MockK relaxed mock to verify it is NOT called
 * on the slim path.
 *
 * [RobolectricTestRunner] is required because [CustomerFirebaseMessagingService]
 * extends [com.google.firebase.messaging.FirebaseMessagingService] (an Android type).
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
public class CustomerFirebaseMessagingServiceLocationSlimTest {
    private val locationBus = LocationUpdateEventBus()
    private val trackingBus: TrackingEventBus = mockk(relaxed = true)

    private lateinit var service: CustomerFirebaseMessagingService

    @Before
    public fun setUp() {
        service = CustomerFirebaseMessagingService()
        // Manually wire all @Inject lateinit var fields to avoid the Hilt application component.
        service.locationUpdateEventBus = locationBus
        service.trackingEventBus = trackingBus
        service.priceApprovalEventBus = mockk(relaxed = true)
        service.ratingPromptEventBus = mockk(relaxed = true)
        service.noShowCreditEventBus = mockk(relaxed = true)
        service.router = mockk(relaxed = true)
        service.ingestor = mockk(relaxed = true)
    }

    // ── 1. Slim payload (capturedAt present) → locationBus called; trackingBus NOT ──

    @Test
    public fun `LOCATION_UPDATE with capturedAt posts to locationUpdateEventBus`(): Unit =
        runTest {
            val data =
                mapOf(
                    "type" to "LOCATION_UPDATE",
                    "bookingId" to "bk-1",
                    "lat" to "12.9716",
                    "lng" to "77.5946",
                    "capturedAt" to "1700000000000",
                )

            var received: LocationUpdateEvent? = null
            val job = launch { locationBus.events.collect { received = it } }
            yield()

            service.handleSlimLocationUpdate(data)

            advanceUntilIdle()
            job.cancel()

            assertThat(received).isNotNull
            assertThat(received!!.bookingId).isEqualTo("bk-1")
            assertThat(received!!.lat).isEqualTo(12.9716)
            assertThat(received!!.lng).isEqualTo(77.5946)
            assertThat(received!!.capturedAt).isEqualTo(1_700_000_000_000L)

            verify(exactly = 0) { trackingBus.post(any()) }
        }

    // ── 2. No capturedAt → handleSlimLocationUpdate is a no-op (early return) ─────

    @Test
    public fun `LOCATION_UPDATE without capturedAt is a no-op in handleSlimLocationUpdate`(): Unit =
        runTest {
            val data =
                mapOf(
                    "type" to "LOCATION_UPDATE",
                    "bookingId" to "bk-2",
                    "lat" to "12.9716",
                    "lng" to "77.5946",
                    // capturedAt deliberately absent
                )

            var received: LocationUpdateEvent? = null
            val job = launch { locationBus.events.collect { received = it } }
            yield()

            service.handleSlimLocationUpdate(data)

            advanceUntilIdle()
            job.cancel()

            assertThat(received).isNull()
            verify(exactly = 0) { trackingBus.post(any()) }
        }

    // ── 3. Malformed lat → no-op, no crash ───────────────────────────────────────

    @Test
    public fun `LOCATION_UPDATE with malformed lat is a no-op and does not crash`(): Unit =
        runTest {
            val data =
                mapOf(
                    "type" to "LOCATION_UPDATE",
                    "bookingId" to "bk-3",
                    "lat" to "not-a-number",
                    "lng" to "77.5946",
                    "capturedAt" to "1700000000000",
                )

            var received: LocationUpdateEvent? = null
            val job = launch { locationBus.events.collect { received = it } }
            yield()

            service.handleSlimLocationUpdate(data)

            advanceUntilIdle()
            job.cancel()

            assertThat(received).isNull()
        }
}
