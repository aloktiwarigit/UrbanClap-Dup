package com.homeservices.customer.domain.auth

import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.homeservices.customer.domain.auth.model.AuthResult
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class FirebaseOtpUseCaseErrorMappingTest {

    @Test
    public fun `mapFirebaseSignInError maps ERROR_INVALID_VERIFICATION_CODE to WrongCode`() {
        val e = mockk<FirebaseAuthInvalidCredentialsException>()
        every { e.errorCode } returns "ERROR_INVALID_VERIFICATION_CODE"
        assertThat(mapFirebaseSignInError(e)).isEqualTo(AuthResult.Error.WrongCode)
    }

    @Test
    public fun `mapFirebaseSignInError maps ERROR_SESSION_EXPIRED to CodeExpired`() {
        val e = mockk<FirebaseAuthException>()
        every { e.errorCode } returns "ERROR_SESSION_EXPIRED"
        assertThat(mapFirebaseSignInError(e)).isEqualTo(AuthResult.Error.CodeExpired)
    }

    @Test
    public fun `mapFirebaseSignInError maps ERROR_TOO_MANY_REQUESTS to RateLimited`() {
        val e = mockk<FirebaseAuthException>()
        every { e.errorCode } returns "ERROR_TOO_MANY_REQUESTS"
        assertThat(mapFirebaseSignInError(e)).isEqualTo(AuthResult.Error.RateLimited)
    }

    @Test
    public fun `mapFirebaseSignInError maps unknown exception to General`() {
        val e = RuntimeException("unexpected")
        val result = mapFirebaseSignInError(e)
        assertThat(result).isInstanceOf(AuthResult.Error.General::class.java)
        assertThat((result as AuthResult.Error.General).cause).isEqualTo(e)
    }
}
