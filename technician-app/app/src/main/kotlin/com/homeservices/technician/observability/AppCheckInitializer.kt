package com.homeservices.technician.observability

import android.app.Application
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.homeservices.technician.BuildConfig

public object AppCheckInitializer {
    public fun init(
        @Suppress("UNUSED_PARAMETER") application: Application,
    ) {
        val factory =
            if (BuildConfig.DEBUG) {
                // Debug provider allows App Check token generation without a real device.
                // Requires the debug token to be registered in the Firebase console.
                com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory.getInstance()
            } else {
                PlayIntegrityAppCheckProviderFactory.getInstance()
            }
        FirebaseAppCheck.getInstance().installAppCheckProviderFactory(factory)
    }
}
