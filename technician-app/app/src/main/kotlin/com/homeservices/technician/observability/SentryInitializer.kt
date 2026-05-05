package com.homeservices.technician.observability

import android.app.Application
import com.homeservices.technician.BuildConfig
import io.sentry.android.core.SentryAndroid

public object SentryInitializer {
    private const val TRACES_SAMPLE_RATE: Double = 0.1

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
            // Strip PII from every event before transmission (ADR-0018).
            options.beforeSend = io.sentry.SentryOptions.BeforeSendCallback { event, _ ->
                PiiRedactor.scrub(event)
                event
            }
        }
    }
}
