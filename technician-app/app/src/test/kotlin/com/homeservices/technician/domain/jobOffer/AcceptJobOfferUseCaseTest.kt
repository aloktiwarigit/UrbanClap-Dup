package com.homeservices.technician.domain.jobOffer

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import retrofit2.Response
import java.io.IOException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest

@OptIn(ExperimentalCoroutinesApi::class)
public class AcceptJobOfferUseCaseTest {
    private lateinit var api: JobOfferApiService
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var useCase: AcceptJobOfferUseCase

    @BeforeEach
    public fun setUp(): Unit {
        api = mockk()
        firebaseAuth = mockk()
        useCase = AcceptJobOfferUseCase(api, firebaseAuth)
    }

    private fun stubFirebaseToken(token: String): Unit {
        val tokenResult = mockk<GetTokenResult> { every { this@mockk.token } returns token }
        val user = mockk<FirebaseUser> { every { getIdToken(false) } returns Tasks.forResult(tokenResult) }
        every { firebaseAuth.currentUser } returns user
    }

    @Test
    public fun `invoke returns Accepted on HTTP 200`(): Unit =
        runTest {
            stubFirebaseToken("test-id-token")
            coEvery { api.acceptOffer("Bearer test-id-token", "booking-123") } returns
                Response.success(Unit)

            val result = useCase("booking-123")

            assertThat(result).isEqualTo(JobOfferResult.Accepted("booking-123"))
        }

    @Test
    public fun `invoke returns Expired on HTTP 410`(): Unit =
        runTest {
            stubFirebaseToken("test-id-token")
            coEvery { api.acceptOffer("Bearer test-id-token", "booking-expired") } returns
                Response.error(410, "".toResponseBody(null))

            val result = useCase("booking-expired")

            assertThat(result).isEqualTo(JobOfferResult.Expired("booking-expired"))
        }

    @Test
    public fun `invoke throws RuntimeException on unexpected HTTP error`(): Unit =
        runTest {
            stubFirebaseToken("test-id-token")
            coEvery { api.acceptOffer("Bearer test-id-token", "booking-500") } returns
                Response.error(500, "".toResponseBody(null))

            assertThrows<RuntimeException> { useCase("booking-500") }
        }

    @Test
    public fun `invoke propagates IOException on network error`(): Unit =
        runTest {
            stubFirebaseToken("test-id-token")
            coEvery { api.acceptOffer(any(), any()) } throws IOException("Connection reset")

            assertThrows<IOException> { useCase("booking-net-err") }
        }
}
