package com.homeservices.customer.domain.auth.model

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.Test

public class AuthProviderTest {
    @Test
    public fun `AuthProvider Phone is a singleton data object`() {
        assertInstanceOf(AuthProvider.Phone::class.java, AuthProvider.Phone)
    }

    @Test
    public fun `AuthResult Error EmailAlreadyInUse is distinct from WrongCredential`() {
        val a: AuthResult = AuthResult.Error.EmailAlreadyInUse
        val b: AuthResult = AuthResult.Error.WrongCredential
        assertThat(a).isNotEqualTo(b)
    }
}
