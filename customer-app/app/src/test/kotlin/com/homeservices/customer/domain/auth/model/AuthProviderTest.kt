package com.homeservices.customer.domain.auth.model

import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.Test

internal class AuthProviderTest {
    @Test
    fun `AuthProvider Phone is a singleton data object`() {
        assertInstanceOf(AuthProvider.Phone::class.java, AuthProvider.Phone)
    }

    @Test
    fun `AuthResult Error EmailAlreadyInUse is distinct from WrongCredential`() {
        val a: AuthResult = AuthResult.Error.EmailAlreadyInUse
        val b: AuthResult = AuthResult.Error.WrongCredential
        assert(a != b)
    }
}
