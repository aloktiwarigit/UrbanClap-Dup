package com.homeservices.technician.data.device

import com.google.android.gms.tasks.Tasks
import com.google.firebase.messaging.FirebaseMessaging
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response
import java.io.IOException

public class DeviceTokenRegistrarTest {
    private lateinit var api: DeviceApi
    private lateinit var messaging: FirebaseMessaging
    private lateinit var registrar: DeviceTokenRegistrar

    @BeforeEach
    public fun setUp() {
        api = mockk()
        messaging = mockk()
        registrar = DeviceTokenRegistrar(api, messaging)
    }

    @Test
    public fun `register fetches FCM token and posts to server`(): Unit =
        runTest {
            every { messaging.token } returns Tasks.forResult("test-fcm-token")
            coEvery {
                api.registerToken(RegisterDeviceTokenRequest("test-fcm-token", "android"))
            } returns Response.success(Unit)

            registrar.register()

            coVerify(exactly = 1) {
                api.registerToken(RegisterDeviceTokenRequest("test-fcm-token", "android"))
            }
        }

    @Test
    public fun `register swallows FCM token fetch failure`(): Unit =
        runTest {
            every { messaging.token } returns Tasks.forException(IOException("FCM unavailable"))

            registrar.register() // must not throw
        }

    @Test
    public fun `register swallows server error`(): Unit =
        runTest {
            every { messaging.token } returns Tasks.forResult("test-fcm-token")
            coEvery { api.registerToken(any()) } throws IOException("Network error")

            registrar.register() // must not throw
        }

    @Test
    public fun `unregister sends DELETE request to server`(): Unit =
        runTest {
            coEvery { api.unregisterToken() } returns Response.success(Unit)

            registrar.unregister()

            coVerify(exactly = 1) { api.unregisterToken() }
        }

    @Test
    public fun `unregister swallows server error`(): Unit =
        runTest {
            coEvery { api.unregisterToken() } throws IOException("Network error")

            registrar.unregister() // must not throw
        }
}
