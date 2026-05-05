package com.homeservices.technician

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.homeservices.technician.observability.SentryInitializer
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
public class HomeservicesTechnicianApplication :
    Application(),
    Configuration.Provider {
    @Inject
    public lateinit var workerFactory: HiltWorkerFactory

    override fun onCreate() {
        super.onCreate()
        SentryInitializer.init(this)
    }

    override val workManagerConfiguration: Configuration
        get() =
            Configuration
                .Builder()
                .setWorkerFactory(workerFactory)
                .build()
}
