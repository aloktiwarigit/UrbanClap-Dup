package com.homeservices.customer

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.google.android.libraries.places.api.Places
import com.homeservices.customer.domain.consent.ConsentRepository
import com.homeservices.customer.domain.consent.ConsentState
import com.homeservices.customer.domain.flags.GrowthBookFeatureFlags
import com.homeservices.customer.domain.locale.LocaleRepository
import com.homeservices.customer.firebase.CustomerFirebaseMessagingService
import com.homeservices.customer.observability.SentryInitializer
import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@HiltAndroidApp
public class HomeservicesCustomerApplication : Application() {
    @EntryPoint
    @InstallIn(SingletonComponent::class)
    public interface LocaleEntryPoint {
        public fun localeRepository(): LocaleRepository
    }

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    public interface FeatureFlagsEntryPoint {
        public fun growthBookFeatureFlags(): GrowthBookFeatureFlags
    }

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    public interface AnalyticsEntryPoint {
        public fun postHogAnalyticsFacade(): PostHogAnalyticsFacade

        public fun consentRepository(): ConsentRepository
    }

    override fun onCreate() {
        super.onCreate()
        SentryInitializer.init(this)
        CustomerFirebaseMessagingService.registerChannels(this)
        if (BuildConfig.MAPS_API_KEY.isNotBlank()) {
            Places.initializeWithNewPlacesApiEnabled(this, BuildConfig.MAPS_API_KEY)
        }

        // Best-effort async flag refresh — non-blocking, fire-and-forget.
        // Uses a SupervisorJob so a failure here never propagates to sibling coroutines.
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            EntryPointAccessors
                .fromApplication(this@HomeservicesCustomerApplication, FeatureFlagsEntryPoint::class.java)
                .growthBookFeatureFlags()
                .refreshAsync()
        }

        // Apply persisted locale BEFORE first Activity onCreate so the initial frame uses correct strings.
        // EntryPoint pattern is used because Application is not @AndroidEntryPoint and cannot @Inject directly.
        val entryPoint = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
        scope.launch {
            val tag = entryPoint.localeRepository().currentLocale.first()
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
        }

        // Gate PostHog init on user's analytics consent (DPDP Act 2023 / NFR-C-5).
        // Fire-and-forget: failures here must never propagate to sibling coroutines.
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            val analyticsEntryPoint =
                EntryPointAccessors
                    .fromApplication(this@HomeservicesCustomerApplication, AnalyticsEntryPoint::class.java)
            val analyticsOptIn =
                analyticsEntryPoint.consentRepository().consentState.first()
                    .let { it is ConsentState.Granted && it.analyticsOptIn }
            analyticsEntryPoint.postHogAnalyticsFacade().initIfConsented(analyticsOptIn)
        }
    }
}
