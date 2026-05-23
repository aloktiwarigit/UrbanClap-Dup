package com.homeservices.technician.observability

import android.app.Application
import com.google.firebase.crashlytics.FirebaseCrashlytics

public object CrashlyticsInitializer {
    public fun init(application: Application) {
        FirebaseCrashlytics.getInstance().apply {
            setCrashlyticsCollectionEnabled(true)
            // Tag app build for symbol-mapping in crash reports.
            setCustomKey("app_id", application.packageName)
        }
    }
}
