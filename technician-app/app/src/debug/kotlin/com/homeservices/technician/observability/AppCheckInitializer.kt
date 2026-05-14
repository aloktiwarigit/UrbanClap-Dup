package com.homeservices.technician.observability

import android.app.Application
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory

public object AppCheckInitializer {
    public fun init(
        @Suppress("UNUSED_PARAMETER") application: Application,
    ) {
        // Debug builds use the debug provider so App Check tokens can be generated
        // without a real device. Register the debug token in the Firebase Console.
        FirebaseAppCheck.getInstance().installAppCheckProviderFactory(
            DebugAppCheckProviderFactory.getInstance(),
        )
    }
}
