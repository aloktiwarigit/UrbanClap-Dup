package com.homeservices.customer.observability

import android.app.Application
import com.homeservices.customer.BuildConfig
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
        }
        // TODO(E01-Sxx observability): wire OpenTelemetry once exporter is chosen
    }
}
