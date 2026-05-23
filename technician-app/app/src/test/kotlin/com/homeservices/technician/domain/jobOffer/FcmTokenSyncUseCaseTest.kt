package com.homeservices.technician.domain.jobOffer

import com.homeservices.technician.data.jobOffer.FcmTokenRequest
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
public class FcmTokenSyncUseCaseTest {
    private lateinit var api: JobOfferApiService
    private lateinit var useCase: FcmTokenSyncUseCase

    @BeforeEach
    public fun setUp(): Unit {
        api = mockk()
        useCase = FcmTokenSyncUseCase(api)
    }

    @Test
    public fun `invoke calls api with correct fcm token`(): Unit =
        runTest {
            coEvery {
                api.syncFcmToken(FcmTokenRequest("fcm-device-token"))
            } returns Response.success(Unit)

            useCase.invokeWithFcmToken("fcm-device-token")

            coVerify(exactly = 1) {
                api.syncFcmToken(FcmTokenRequest("fcm-device-token"))
            }
        }

    @Test
    public fun `invoke handles network error gracefully (no exception escapes)`(): Unit =
        runTest {
            coEvery { api.syncFcmToken(any()) } throws IOException("Network unavailable")

            useCase.invokeWithFcmToken("fcm-device-token") // IOException is swallowed — no throw
        }
}
