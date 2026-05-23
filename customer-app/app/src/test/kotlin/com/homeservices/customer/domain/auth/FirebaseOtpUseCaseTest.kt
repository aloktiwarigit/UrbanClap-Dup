package com.homeservices.customer.domain.auth

import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.homeservices.customer.domain.auth.gateway.OtpSender
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult

public class FirebaseOtpUseCaseTest {
    private lateinit var otpSender: OtpSender
    private lateinit var useCase: FirebaseOtpUseCase

    @BeforeEach
    public fun setUp() {
        otpSender = mockk()
        useCase = FirebaseOtpUseCase(otpSender)
    }

    @Test
    public fun `signInWithCredential emits Success when OtpSender emits Success`(): Unit =
        runTest {
            val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-123" }
            val credential = mockk<PhoneAuthCredential>()

            every { otpSender.signInWithCredential(credential) } returns
                flowOf(AppAuthResult.Success(firebaseUser))

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
            assertThat((result as AppAuthResult.Success).user.uid).isEqualTo("uid-123")
        }

    @Test
    public fun `signInWithCredential emits WrongCode when OtpSender emits WrongCode`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()

            every { otpSender.signInWithCredential(credential) } returns
                flowOf(AppAuthResult.Error.WrongCode)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isEqualTo(AppAuthResult.Error.WrongCode)
        }

    @Test
    public fun `signInWithCredential emits General error when OtpSender emits General error`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val exception = RuntimeException("network error")

            every { otpSender.signInWithCredential(credential) } returns
                flowOf(AppAuthResult.Error.General(exception))

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `signInWithCredential emits CodeExpired when OtpSender emits CodeExpired`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()

            every { otpSender.signInWithCredential(credential) } returns
                flowOf(AppAuthResult.Error.CodeExpired)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isEqualTo(AppAuthResult.Error.CodeExpired)
        }

    @Test
    public fun `signInWithCredential emits RateLimited when OtpSender emits RateLimited`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()

            every { otpSender.signInWithCredential(credential) } returns
                flowOf(AppAuthResult.Error.RateLimited)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isEqualTo(AppAuthResult.Error.RateLimited)
        }

    @Test
    public fun `signInWithCredential emits General error when OtpSender emits null-user General error`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val nullUserError = AppAuthResult.Error.General(IllegalStateException("null user after sign-in"))

            every { otpSender.signInWithCredential(credential) } returns flowOf(nullUserError)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `signInWithCredential emits General when OtpSender emits unrecognized error`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val unknownError = AppAuthResult.Error.General(RuntimeException("unknown"))

            every { otpSender.signInWithCredential(credential) } returns flowOf(unknownError)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `verifyOtp delegates to OtpSender verifyOtp`(): Unit =
        runTest {
            val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-verify" }

            every { otpSender.verifyOtp("verificationId", "123456") } returns
                flowOf(AppAuthResult.Success(firebaseUser))

            val result = useCase.verifyOtp("verificationId", "123456").first()

            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
            assertThat((result as AppAuthResult.Success).user.uid).isEqualTo("uid-verify")
        }
}
