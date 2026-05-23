package com.homeservices.customer.data.auth.di

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.MasterKey
import androidx.test.core.app.ApplicationProvider
import io.mockk.every
import io.mockk.mockkConstructor
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import io.sentry.Sentry
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException
import java.security.GeneralSecurityException

/**
 * Tests for [AuthModule.provideAuthPrefs] crash-guard behaviour (SEC-03).
 *
 * Contract:
 * - When MasterKey/EncryptedSharedPreferences setup throws GeneralSecurityException
 *   or IOException (Android 12+ KeyStore corruption, StrongBox provisioning failures),
 *   the provider returns a cleartext fallback SharedPreferences named
 *   "auth_session_fallback" (MODE_PRIVATE) instead of crashing Hilt at startup.
 * - Failures are reported to Sentry via captureException + addBreadcrumb in BOTH catch blocks.
 *
 * Robolectric is used because EncryptedSharedPreferences/MasterKey touch Android framework
 * classes. mockkConstructor intercepts MasterKey.Builder so build() throws on demand.
 */
@RunWith(RobolectricTestRunner::class)
public class AuthModuleTest {
    private lateinit var context: Context

    @Before
    public fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        mockkStatic(Sentry::class)
        every { Sentry.captureException(any<Throwable>()) } returns io.sentry.protocol.SentryId.EMPTY_ID
        every { Sentry.addBreadcrumb(any<String>()) } returns Unit
    }

    @After
    public fun tearDown() {
        unmockkAll()
        context
            .getSharedPreferences("auth_session_fallback", Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
    }

    @Test
    public fun `provideAuthPrefs falls back to cleartext SharedPreferences when MasterKey creation throws GeneralSecurityException`() {
        mockkConstructor(MasterKey.Builder::class)
        every {
            anyConstructed<MasterKey.Builder>().build()
        } throws GeneralSecurityException("KeyStore corruption simulated")

        val prefs: SharedPreferences = AuthModule.provideAuthPrefs(context)

        assertThat(prefs).isNotNull
        // Sanity: fallback prefs is usable for reads/writes (empty file forces re-login).
        assertThat(prefs.getString("uid", null)).isNull()
        verify(exactly = 1) { Sentry.captureException(any<GeneralSecurityException>()) }
        verify(atLeast = 1) { Sentry.addBreadcrumb(any<String>()) }
    }

    @Test
    public fun `provideAuthPrefs falls back when MasterKey creation throws IOException`() {
        mockkConstructor(MasterKey.Builder::class)
        every {
            anyConstructed<MasterKey.Builder>().build()
        } throws IOException("StrongBox provisioning failure simulated")

        val prefs: SharedPreferences = AuthModule.provideAuthPrefs(context)

        assertThat(prefs).isNotNull
        assertThat(prefs.getString("uid", null)).isNull()
        verify(exactly = 1) { Sentry.captureException(any<IOException>()) }
        verify(atLeast = 1) { Sentry.addBreadcrumb(any<String>()) }
    }
}
