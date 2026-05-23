package com.homeservices.technician.observability

import android.app.Application
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory

public object AppCheckInitializer {
    public fun init(
        @Suppress("UNUSED_PARAMETER") application: Application,
    ) {
        FirebaseAppCheck.getInstance().installAppCheckProviderFactory(
            PlayIntegrityAppCheckProviderFactory.getInstance(),
        )
    }
}
