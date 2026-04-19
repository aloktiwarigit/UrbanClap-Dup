package com.homeservices.customer.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class FirebaseOtpUseCaseTest {

    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var useCase: FirebaseOtpUseCase

    @BeforeEach
    public fun setUp() {
        firebaseAuth = mockk()
        useCase = FirebaseOtpUseCase(firebaseAuth)
    }

    @Test
    public fun `signInWithCredential emits Success when Firebase succeeds`(): Unit = runTest {
        val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-123" }
        val authResultMock = mockk<AuthResult> { every { user } returns firebaseUser }
        val credential = mockk<PhoneAuthCredential>()

        every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(authResultMock)

        val result = useCase.signInWithCredential(credential).first()

        assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
        assertThat((result as AppAuthResult.Success).user.uid).isEqualTo("uid-123")
    }

    @Test
    public fun `signInWithCredential emits WrongCode when Firebase throws invalid credentials`(): Unit = runTest {
        val credential = mockk<PhoneAuthCredential>()
        val exception = mockk<FirebaseAuthInvalidCredentialsException> {
            every { message } returns "ERROR_INVALID_VERIFICATION_CODE"
        }

        every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

        val result = useCase.signInWithCredential(credential).first()

        assertThat(result).isEqualTo(AppAuthResult.Error.WrongCode)
    }

    @Test
    public fun `signInWithCredential emits General error for unexpected exceptions`(): Unit = runTest {
        val credential = mockk<PhoneAuthCredential>()
        val exception = RuntimeException("network error")

        every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

        val result = useCase.signInWithCredential(credential).first()

        assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
    }
}
