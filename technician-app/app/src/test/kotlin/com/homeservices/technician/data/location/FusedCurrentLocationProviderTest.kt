package com.homeservices.technician.data.location

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.tasks.Tasks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R]) // API 30 — uses isFromMockProvider path
public class FusedCurrentLocationProviderTest {
    private lateinit var context: Context
    private lateinit var fusedClient: FusedLocationProviderClient
    private lateinit var provider: FusedCurrentLocationProvider

    @Before
    public fun setUp() {
        mockkStatic(LocationServices::class)
        context = mockk(relaxed = true)
        fusedClient = mockk(relaxed = true)
        every { LocationServices.getFusedLocationProviderClient(context) } returns fusedClient
        every {
            context.checkPermission(Manifest.permission.ACCESS_FINE_LOCATION, any(), any())
        } returns PackageManager.PERMISSION_GRANTED
        every {
            context.checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION, any(), any())
        } returns PackageManager.PERMISSION_GRANTED
        provider = FusedCurrentLocationProvider(context)
    }

    @After
    public fun tearDown() {
        unmockkStatic(LocationServices::class)
    }

    private fun makeLocation(
        lat: Double = 26.8,
        lng: Double = 82.2,
        accuracy: Float = 10f,
        isMock: Boolean = false,
    ): Location {
        val loc = Location("test")
        loc.latitude = lat
        loc.longitude = lng
        loc.accuracy = accuracy
        @Suppress("DEPRECATION")
        loc.isFromMockProvider = isMock
        return loc
    }

    @Test
    public fun `isMock is false when location is from real GPS`(): Unit =
        runTest {
            val realLocation = makeLocation(isMock = false)
            every { fusedClient.getCurrentLocation(any(), any()) } returns Tasks.forResult(realLocation)

            val result = provider.currentLocation()

            assertThat(result).isNotNull
            assertThat(result!!.fidelity.isMock).isFalse()
            assertThat(result.latLng.lat).isEqualTo(26.8)
            assertThat(result.latLng.lng).isEqualTo(82.2)
        }

    @Test
    public fun `isMock is true when isFromMockProvider is set on location`(): Unit =
        runTest {
            val mockLocation = makeLocation(accuracy = 1f, isMock = true)
            every { fusedClient.getCurrentLocation(any(), any()) } returns Tasks.forResult(mockLocation)

            val result = provider.currentLocation()

            assertThat(result).isNotNull
            assertThat(result!!.fidelity.isMock).isTrue()
            assertThat(result.fidelity.accuracyMetres).isEqualTo(1f)
        }

    @Test
    public fun `returns null when no location is available`(): Unit =
        runTest {
            every { fusedClient.getCurrentLocation(any(), any()) } returns Tasks.forResult(null)
            every { fusedClient.lastLocation } returns Tasks.forResult(null)

            val result = provider.currentLocation()

            assertThat(result).isNull()
        }

    @Test
    public fun `falls back to lastLocation when getCurrentLocation returns null`(): Unit =
        runTest {
            val lastKnown = makeLocation(lat = 26.9, lng = 82.3, isMock = false)
            every { fusedClient.getCurrentLocation(any(), any()) } returns Tasks.forResult(null)
            every { fusedClient.lastLocation } returns Tasks.forResult(lastKnown)

            val result = provider.currentLocation()

            assertThat(result).isNotNull
            assertThat(result!!.latLng.lat).isEqualTo(26.9)
            assertThat(result.fidelity.isMock).isFalse()
        }

    @Test
    public fun `returns null when location permission is denied`(): Unit =
        runTest {
            every {
                context.checkPermission(Manifest.permission.ACCESS_FINE_LOCATION, any(), any())
            } returns PackageManager.PERMISSION_DENIED
            every {
                context.checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION, any(), any())
            } returns PackageManager.PERMISSION_DENIED

            val result = provider.currentLocation()

            assertThat(result).isNull()
        }

    @Test
    public fun `accuracyMetres is correctly propagated from location`(): Unit =
        runTest {
            val loc = makeLocation(accuracy = 25.5f, isMock = false)
            every { fusedClient.getCurrentLocation(any(), any()) } returns Tasks.forResult(loc)

            val result = provider.currentLocation()

            assertThat(result).isNotNull
            assertThat(result!!.fidelity.accuracyMetres).isEqualTo(25.5f)
        }
}
