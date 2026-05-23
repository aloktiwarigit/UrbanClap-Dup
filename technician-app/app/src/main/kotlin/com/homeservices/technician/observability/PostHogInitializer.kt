package com.homeservices.technician.observability

import android.app.Application
import com.homeservices.technician.BuildConfig
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig

public object PostHogInitializer {
    public fun init(
        application: Application,
        apiKey: String = BuildConfig.POSTHOG_API_KEY,
        host: String = BuildConfig.POSTHOG_HOST,
    ) {
        if (apiKey.isBlank()) return
        val config =
            PostHogAndroidConfig(apiKey = apiKey, host = host).apply {
                captureApplicationLifecycleEvents = true
                captureScreenViews = false
                captureDeepLinks = false
            }
        PostHogAndroid.setup(application, config)
    }
}
