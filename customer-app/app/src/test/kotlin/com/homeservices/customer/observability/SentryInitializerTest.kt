package com.homeservices.customer.observability

import android.app.Application
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkStatic
import io.mockk.verify
import io.sentry.android.core.SentryAndroid
import io.sentry.android.core.SentryAndroidOptions
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class SentryInitializerTest {
    private lateinit var application: Application

    @BeforeEach
    public fun setUp(): Unit {
        application = mockk(relaxed = true)
        mockkStatic(SentryAndroid::class)
        every {
            SentryAndroid.init(
                any<Application>(),
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        } returns Unit
    }

    @AfterEach
    public fun tearDown(): Unit {
        unmockkStatic(SentryAndroid::class)
    }

    @Test
    public fun `init does nothing when DSN is blank`(): Unit {
        SentryInitializer.init(application = application, dsn = "")

        verify(exactly = 0) {
            SentryAndroid.init(
                any<Application>(),
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        }
    }

    @Test
    public fun `init does nothing when DSN is whitespace`(): Unit {
        SentryInitializer.init(application = application, dsn = "   ")

        verify(exactly = 0) {
            SentryAndroid.init(
                any<Application>(),
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        }
    }

    @Test
    public fun `init calls Sentry once with tracesSampleRate when DSN set`(): Unit {
        val configSlot = slot<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>()
        every {
            SentryAndroid.init(any<Application>(), capture(configSlot))
        } returns Unit

        SentryInitializer.init(application = application, dsn = "https://key@o0.ingest.sentry.io/0")

        verify(exactly = 1) {
            SentryAndroid.init(
                application,
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        }

        val capturedOptions = SentryAndroidOptions()
        configSlot.captured.configure(capturedOptions)
        assertThat(capturedOptions.dsn).isEqualTo("https://key@o0.ingest.sentry.io/0")
        assertThat(capturedOptions.tracesSampleRate).isEqualTo(0.1)
    }
}
