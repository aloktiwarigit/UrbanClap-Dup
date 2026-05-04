package com.homeservices.customer.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.data.auth.remote.AuthApi
import com.homeservices.customer.data.auth.remote.dto.TruecallerVerifyRequest
import com.homeservices.customer.data.auth.remote.dto.TruecallerVerifyResponse
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.HttpException
import retrofit2.Response

public class VerifyTruecallerUseCaseTest {
    private lateinit var authApi: AuthApi
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var useCase: VerifyTruecallerUseCase

    @BeforeEach
    public fun setUp() {
        authApi = mockk()
        firebaseAuth = mockk()
        useCase = VerifyTruecallerUseCase(authApi, firebaseAuth)
    }

    @Test
    public fun `invoke returns Success when API returns customToken and Firebase signs in`(): Unit =
        runTest {
            val mockUser = mockk<FirebaseUser> { every { uid } returns "phone-uid-abc" }
            val mockAuthResult = mockk<AuthResult> { every { user } returns mockUser }

            coEvery {
                authApi.verifyTruecaller(
                    TruecallerVerifyRequest(
                        payload = "payload-b64",
                        signature = "sig-b64",
                        signatureAlgorithm = "SHA512withRSA",
                        fcmToken = null,
                    ),
                )
            } returns TruecallerVerifyResponse(
                firebaseCustomToken = "firebase-custom-token-xyz",
                sessionExpiresAt = 9_999_999L,
            )

            every {
                firebaseAuth.signInWithCustomToken("firebase-custom-token-xyz")
            } returns Tasks.forResult(mockAuthResult)

            val result = useCase.invoke(
                payload = "payload-b64",
                signature = "sig-b64",
                signatureAlgorithm = "SHA512withRSA",
            )

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrNull()).isSameAs(mockUser)
        }

    @Test
    public fun `invoke returns Failure when API call throws HTTP exception`(): Unit =
        runTest {
            coEvery {
                authApi.verifyTruecaller(any())
            } throws HttpException(Response.error<TruecallerVerifyResponse>(400, okhttp3.ResponseBody.create(null, "")))

            val result = useCase.invoke(
                payload = "payload-b64",
                signature = "bad-sig",
                signatureAlgorithm = "SHA512withRSA",
            )

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isInstanceOf(HttpException::class.java)
        }

    @Test
    public fun `invoke returns Failure when API succeeds but Firebase signInWithCustomToken fails`(): Unit =
        runTest {
            coEvery {
                authApi.verifyTruecaller(any())
            } returns TruecallerVerifyResponse(
                firebaseCustomToken = "custom-token",
                sessionExpiresAt = 9_999_999L,
            )

            every {
                firebaseAuth.signInWithCustomToken("custom-token")
            } returns Tasks.forException(Exception("Firebase sign-in failed"))

            val result = useCase.invoke(
                payload = "p",
                signature = "s",
                signatureAlgorithm = "SHA512withRSA",
            )

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `invoke returns Failure when Firebase user is null after sign-in`(): Unit =
        runTest {
            coEvery { authApi.verifyTruecaller(any()) } returns TruecallerVerifyResponse(
                firebaseCustomToken = "ct",
                sessionExpiresAt = 0L,
            )

            val mockAuthResult = mockk<AuthResult> { every { user } returns null }
            every { firebaseAuth.signInWithCustomToken("ct") } returns Tasks.forResult(mockAuthResult)

            val result = useCase.invoke("p", "s", "SHA512withRSA")

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()?.message).contains("null user")
        }
}
