package com.homeservices.customer

import android.app.Application
import com.homeservices.customer.observability.SentryInitializer
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
public class HomeservicesCustomerApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        SentryInitializer.init(this)
    }
}
