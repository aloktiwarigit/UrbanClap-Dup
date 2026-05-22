package com.homeservices.customer.data.network.di

import com.homeservices.customer.data.auth.remote.di.AuthApiModule
import com.homeservices.customer.data.booking.di.BookingModule
import com.homeservices.customer.data.catalogue.di.CatalogueModule
import com.homeservices.customer.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.homeservices.customer.data.technician.di.TechnicianModule
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class OkHttpTimeoutTest {
    @Test
    public fun `AuthOkHttpClient has correct timeouts`() {
        val idTokenCache = mockk<IdTokenCache>()
        val authenticator = mockk<FirebaseTokenAuthenticator>(relaxed = true)
        val client = BookingModule.provideAuthOkHttpClient(idTokenCache, authenticator)

        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
        assertThat(client.retryOnConnectionFailure).isTrue()
    }

    @Test
    public fun `CatalogueOkHttpClient has correct timeouts`() {
        val client = CatalogueModule.provideOkHttpClient()

        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
        assertThat(client.retryOnConnectionFailure).isTrue()
    }

    @Test
    public fun `PublicOkHttpClient has correct timeouts`() {
        val client = AuthApiModule.providePublicOkHttpClient()

        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
        assertThat(client.retryOnConnectionFailure).isTrue()
    }

    @Test
    public fun `TechnicianOkHttpClient has correct timeouts`() {
        val client = TechnicianModule.provideTechnicianOkHttpClient()

        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
        assertThat(client.retryOnConnectionFailure).isTrue()
    }
}
