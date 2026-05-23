package com.homeservices.customer.observability

import android.app.Application
import com.homeservices.customer.BuildConfig
import io.sentry.android.core.SentryAndroid

public object SentryInitializer {
    private const val TRACES_SAMPLE_RATE: Double = 0.1

    /**
     * Whether the user has consented to crash reporting (DPDP Act 2023 / NFR-C-5).
     *
     * Defaults to `false` so that Sentry captures nothing until the user explicitly grants
     * crash consent. The Application-level consent observer ([HomeservicesCustomerApplication])
     * calls [applyCrashConsent] on every [ConsentState] emission — including the initial one
     * after the user accepts on the DPDP screen.
     *
     * Marked `@Volatile` because it is written from the IO-dispatcher consent coroutine and
     * read from the `beforeSend` callback (which runs on the Sentry internal thread).
     */
    @Volatile
    internal var crashReportingEnabled: Boolean = false

    /**
     * Called by the Application-level consent observer whenever the crash-consent toggle changes.
     * Thread-safe: [crashReportingEnabled] is `@Volatile`.
     */
    public fun applyCrashConsent(enabled: Boolean) {
        crashReportingEnabled = enabled
    }

    public fun init(
        application: Application,
        dsn: String = BuildConfig.SENTRY_DSN,
    ): Unit {
        if (dsn.isBlank()) return
        SentryAndroid.init(application) { options ->
            options.dsn = dsn
            options.tracesSampleRate = TRACES_SAMPLE_RATE
            // Release tag: "<applicationId>@<versionName>+<gitSha>" — enables
            // Sentry release tracking and sourcemap/ProGuard mapping uploads.
            options.release = "${BuildConfig.APPLICATION_ID}@${BuildConfig.VERSION_NAME}+${BuildConfig.GIT_SHA}"
            // Gate all events on user crash-consent (DPDP Act 2023 / NFR-C-5).
            // Returns null (drops the event) until the user explicitly consents to crash reporting.
            // Also strips PII from every transmitted event (ADR-0018).
            options.beforeSend =
                io.sentry.SentryOptions.BeforeSendCallback { event, _ ->
                    if (!crashReportingEnabled) return@BeforeSendCallback null
                    PiiRedactor.scrub(event)
                    event
                }
        }
    }
}
