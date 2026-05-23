package com.homeservices.technician.data.network.di

import com.homeservices.technician.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.technician.data.network.auth.IdTokenCache
import io.mockk.mockk
import okhttp3.logging.HttpLoggingInterceptor
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class NetworkModuleHiltTest {
    @Test
    public fun `auth and unauth clients are different instances`() {
        val logging = NetworkModule.provideLoggingInterceptor()
        val idTokenCache: IdTokenCache = mockk()
        val authenticator: FirebaseTokenAuthenticator = mockk()

        val authClient = NetworkModule.provideAuthOkHttpClient(idTokenCache, authenticator, logging)
        val unauthClient = NetworkModule.provideUnauthOkHttpClient(logging)

        assertThat(authClient).isNotSameAs(unauthClient)
    }

    @Test
    public fun `auth client carries the FirebaseTokenAuthenticator`() {
        val logging = NetworkModule.provideLoggingInterceptor()
        val idTokenCache: IdTokenCache = mockk()
        val authenticator: FirebaseTokenAuthenticator = mockk()

        val authClient = NetworkModule.provideAuthOkHttpClient(idTokenCache, authenticator, logging)

        assertThat(authClient.authenticator).isSameAs(authenticator)
    }

    @Test
    public fun `unauth client does not carry the FirebaseTokenAuthenticator`() {
        val logging = NetworkModule.provideLoggingInterceptor()

        val unauthClient = NetworkModule.provideUnauthOkHttpClient(logging)

        assertThat(unauthClient.authenticator)
            .isNotInstanceOf(FirebaseTokenAuthenticator::class.java)
    }

    @Test
    public fun `logging interceptor level is BODY in debug or NONE in release`() {
        val logging = NetworkModule.provideLoggingInterceptor()

        assertThat(logging.level).isIn(
            HttpLoggingInterceptor.Level.BODY,
            HttpLoggingInterceptor.Level.NONE,
        )
    }
}
