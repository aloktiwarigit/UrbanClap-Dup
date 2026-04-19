package com.homeservices.technician

import android.app.Application
import com.homeservices.technician.observability.SentryInitializer
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
public class HomeservicesTechnicianApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SentryInitializer.init(this)
    }
}
