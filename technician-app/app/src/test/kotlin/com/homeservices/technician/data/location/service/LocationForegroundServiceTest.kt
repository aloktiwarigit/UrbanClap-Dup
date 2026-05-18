package com.homeservices.technician.data.location.service

import android.content.Intent
import android.os.Build
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.homeservices.technician.data.activeJob.ActiveJobApiService
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Unit tests for [LocationForegroundService] using Robolectric + MockK.
 *
 * Tests use setter injection (same pattern as [ActiveJobForegroundServiceTest]): the
 * service is instantiated via Robolectric's controller, then `api` and `locationProvider`
 * are injected via the public/internal lateinit vars before `onStartCommand` is called.
 *
 * Hilt is NOT used in these tests — per `docs/patterns/hilt-module-android-test-scope.md`.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R]) // API 30 — deterministic isFromMockProvider path
public class LocationForegroundServiceTest {

    private lateinit var api: ActiveJobApiService
    private lateinit var locationProvider: FusedLocationProviderClient
    private lateinit var service: LocationForegroundService

    @Before
    public fun setUp() {
        api = mockk(relaxed = true)
        locationProvider = mockk(relaxed = true)
        service = Robolectric.buildService(LocationForegroundService::class.java).create().get()
        service.api = api
        service.locationProvider = locationProvider
    }

    @After
    public fun tearDown() {
        service.onDestroy()
    }

    @Test
    public fun `CHANNEL_ID constant has expected value`() {
        assertThat(LocationForegroundService.CHANNEL_ID).isEqualTo("active_job_location")
    }

    @Test
    public fun `EXTRA_BOOKING_ID constant has expected value`() {
        assertThat(LocationForegroundService.EXTRA_BOOKING_ID).isEqualTo("bookingId")
    }

    @Test
    public fun `onStartCommand with no bookingId returns START_NOT_STICKY`() {
        val result = service.onStartCommand(Intent(), 0, 1)
        assertThat(result).isEqualTo(android.app.Service.START_NOT_STICKY)
    }

    @Test
    public fun `onStartCommand with bookingId returns START_STICKY`() {
        val intent = Intent().putExtra(LocationForegroundService.EXTRA_BOOKING_ID, "bk-1")
        val result = service.onStartCommand(intent, 0, 1)
        assertThat(result).isEqualTo(android.app.Service.START_STICKY)
    }

    @Test
    public fun `onStartCommand_sameBookingTwice_isIdempotent — requestLocationUpdates called only once`() {
        val callbackSlot = slot<LocationCallback>()
        every {
            locationProvider.requestLocationUpdates(any(), capture(callbackSlot), any())
        } returns mockk(relaxed = true)

        val intent = Intent().putExtra(LocationForegroundService.EXTRA_BOOKING_ID, "bk-2")

        service.onStartCommand(intent, 0, 1)
        service.onStartCommand(intent, 0, 2) // same bookingId — idempotent guard

        // requestLocationUpdates should only be called once (on first command)
        verify(exactly = 1) { locationProvider.requestLocationUpdates(any(), any<LocationCallback>(), any()) }
    }

    @Test
    public fun `onDestroy_removesLocationCallback — removeLocationUpdates is called after start`() {
        val capturedCallback = slot<LocationCallback>()
        every {
            locationProvider.requestLocationUpdates(any(), capture(capturedCallback), any())
        } returns mockk(relaxed = true)

        val intent = Intent().putExtra(LocationForegroundService.EXTRA_BOOKING_ID, "bk-3")
        service.onStartCommand(intent, 0, 1)

        // Verify callback was registered before destroy
        assertThat(capturedCallback.isCaptured).isTrue()

        // Now call onDestroy (tearDown calls it too — this call is explicit to verify the behavior)
        service.onDestroy()

        verify(exactly = 1) { locationProvider.removeLocationUpdates(any<LocationCallback>()) }
    }

    @Test
    public fun `onDestroy without start does not crash — removeLocationUpdates not called`() {
        // No onStartCommand, so no callback registered
        service.onDestroy()

        verify(exactly = 0) { locationProvider.removeLocationUpdates(any<LocationCallback>()) }
    }
}
