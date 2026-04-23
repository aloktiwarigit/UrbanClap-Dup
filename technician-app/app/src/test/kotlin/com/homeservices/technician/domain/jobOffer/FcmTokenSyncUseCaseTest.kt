package com.homeservices.technician.domain.jobOffer

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import com.homeservices.technician.data.jobOffer.FcmTokenRequest
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
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
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var useCase: FcmTokenSyncUseCase

    @BeforeEach
    public fun setUp(): Unit {
        api = mockk()
        firebaseAuth = mockk()
        useCase = FcmTokenSyncUseCase(api, firebaseAuth)
    }

    private fun stubFirebaseToken(idToken: String): Unit {
        val tokenResult = mockk<GetTokenResult> { every { this@mockk.token } returns idToken }
        val user = mockk<FirebaseUser> { every { getIdToken(false) } returns Tasks.forResult(tokenResult) }
        every { firebaseAuth.currentUser } returns user
    }

    @Test
    public fun `invoke calls api with correct token and auth header`(): Unit =
        runTest {
            stubFirebaseToken("id-token-xyz")
            coEvery {
                api.syncFcmToken("Bearer id-token-xyz", FcmTokenRequest("fcm-device-token"))
            } returns Response.success(Unit)

            useCase.invokeWithFcmToken("fcm-device-token")

            coVerify(exactly = 1) {
                api.syncFcmToken("Bearer id-token-xyz", FcmTokenRequest("fcm-device-token"))
            }
        }

    @Test
    public fun `invoke handles network error gracefully (no exception escapes)`(): Unit =
        runTest {
            stubFirebaseToken("id-token-xyz")
            coEvery { api.syncFcmToken(any(), any()) } throws IOException("Network unavailable")

            useCase.invokeWithFcmToken("fcm-device-token") // IOException is swallowed — no throw
        }
}
