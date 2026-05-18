package com.homeservices.technician.data.location.service

import com.google.android.gms.location.FusedLocationProviderClient
import com.homeservices.technician.data.activeJob.ActiveJobApiService
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/**
 * Unit tests for [LocationForegroundService] business-logic constants and DI wiring.
 *
 * Per `docs/patterns/hilt-module-android-test-scope.md`, Hilt is not used in unit
 * tests for technician-app services. We follow the established pattern from
 * [com.homeservices.technician.data.activeJob.service.ActiveJobForegroundServiceTest]:
 *   - Construct the service with a plain `Service()` constructor.
 *   - Verify constants and that the `lateinit var` setters accept their dependencies.
 *
 * Full foreground-service lifecycle (`onStartCommand`, `onDestroy`, foreground promotion,
 * notification channel creation) requires a real `Application` context and Hilt entry-point
 * injection, both incompatible with this test scope. Lifecycle coverage is provided by:
 *   - Manual QA checklist on Android device (PR test plan)
 *   - Future instrumented `androidTest` suite tracked separately
 */
public class LocationForegroundServiceTest {
    @Test
    public fun `CHANNEL_ID constant has expected value`() {
        assertThat(LocationForegroundService.CHANNEL_ID).isEqualTo("active_job_location")
    }

    @Test
    public fun `EXTRA_BOOKING_ID constant has expected value`() {
        assertThat(LocationForegroundService.EXTRA_BOOKING_ID).isEqualTo("bookingId")
    }

    @Test
    public fun `service fields accept injected dependencies via setter`() {
        val api = mockk<ActiveJobApiService>(relaxed = true)
        val locationProvider = mockk<FusedLocationProviderClient>(relaxed = true)

        val service = LocationForegroundService()
        service.api = api
        service.locationProvider = locationProvider

        assertThat(service.api).isSameAs(api)
        assertThat(service.locationProvider).isSameAs(locationProvider)
    }
}
