package com.homeservices.customer.data.device

import com.google.android.gms.tasks.Tasks
import com.google.firebase.messaging.FirebaseMessaging
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import java.io.IOException

/**
 * Unit tests for [DeviceTokenRegistrar].
 *
 * Contract:
 * - register() fetches the FCM token and POSTs it to DeviceApi with the correct body.
 * - register() swallows exceptions (best-effort — never throws).
 * - unregister() fetches the FCM token and calls DELETE on DeviceApi.
 * - unregister() swallows exceptions (best-effort — never throws).
 */
public class DeviceTokenRegistrarTest {
    private lateinit var firebaseMessaging: FirebaseMessaging
    private lateinit var deviceApi: DeviceApi
    private lateinit var sut: DeviceTokenRegistrar

    @Before
    public fun setUp() {
        firebaseMessaging = mockk()
        deviceApi = mockk()
        sut = DeviceTokenRegistrar(firebaseMessaging, deviceApi)

        // Default: FCM returns a token via Task
        every { firebaseMessaging.token } returns Tasks.forResult("test-fcm-token-abc123")
    }

    // ─── register ────────────────────────────────────────────────────────────

    @Test
    public fun `register posts token to api with correct deviceToken and platform`(): Unit =
        runTest {
            coEvery { deviceApi.registerDevice(any()) } returns Unit

            sut.register()

            coVerify(exactly = 1) {
                deviceApi.registerDevice(
                    match {
                        it.deviceToken == "test-fcm-token-abc123" && it.platform == "android"
                    },
                )
            }
        }

    @Test
    public fun `register includes appBuild when provided`(): Unit =
        runTest {
            coEvery { deviceApi.registerDevice(any()) } returns Unit

            sut.register(appBuild = "1.2.3")

            coVerify(exactly = 1) {
                deviceApi.registerDevice(
                    match {
                        it.deviceToken == "test-fcm-token-abc123" &&
                            it.platform == "android" &&
                            it.appBuild == "1.2.3"
                    },
                )
            }
        }

    @Test
    public fun `register swallows exception on api failure`(): Unit =
        runTest {
            coEvery { deviceApi.registerDevice(any()) } throws IOException("network timeout")

            // Must NOT throw
            sut.register()
        }

    @Test
    public fun `register swallows exception when FCM token fetch fails`(): Unit =
        runTest {
            every { firebaseMessaging.token } returns Tasks.forException(RuntimeException("FCM unavailable"))

            // Must NOT throw
            sut.register()
        }

    // ─── unregister ──────────────────────────────────────────────────────────

    @Test
    public fun `unregister calls delete on api with correct token`(): Unit =
        runTest {
            coEvery { deviceApi.unregisterDevice(any()) } returns Unit

            sut.unregister()

            coVerify(exactly = 1) { deviceApi.unregisterDevice("test-fcm-token-abc123") }
        }

    @Test
    public fun `unregister swallows exception on api failure`(): Unit =
        runTest {
            coEvery { deviceApi.unregisterDevice(any()) } throws IOException("network timeout")

            // Must NOT throw
            sut.unregister()
        }

    @Test
    public fun `unregister swallows exception when FCM token fetch fails`(): Unit =
        runTest {
            every { firebaseMessaging.token } returns Tasks.forException(RuntimeException("FCM unavailable"))

            // Must NOT throw
            sut.unregister()
        }
}
