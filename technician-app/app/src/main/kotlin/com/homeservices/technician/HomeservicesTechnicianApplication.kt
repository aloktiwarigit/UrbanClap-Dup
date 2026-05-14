package com.homeservices.technician

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.homeservices.technician.data.fcm.HomeservicesFcmService
import com.homeservices.technician.domain.flags.GrowthBookFeatureFlags
import com.homeservices.technician.domain.locale.LocaleRepository
import com.homeservices.technician.observability.AppCheckInitializer
import com.homeservices.technician.observability.CrashlyticsInitializer
import com.homeservices.technician.observability.PostHogInitializer
import com.homeservices.technician.observability.SentryInitializer
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
import javax.inject.Inject

@HiltAndroidApp
public class HomeservicesTechnicianApplication :
    Application(),
    Configuration.Provider {
    @Inject
    public lateinit var workerFactory: HiltWorkerFactory

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    public interface FeatureFlagsEntryPoint {
        public fun growthBookFeatureFlags(): GrowthBookFeatureFlags
    }

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    public interface LocaleEntryPoint {
        public fun localeRepository(): LocaleRepository
    }

    override fun onCreate() {
        super.onCreate()
        SentryInitializer.init(this)
        CrashlyticsInitializer.init(this)
        AppCheckInitializer.init(this)
        PostHogInitializer.init(this)
        HomeservicesFcmService.registerChannels(this)

        // Best-effort async flag refresh — non-blocking, fire-and-forget.
        // Uses a SupervisorJob so a failure here never propagates to sibling coroutines.
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            EntryPointAccessors
                .fromApplication(this@HomeservicesTechnicianApplication, FeatureFlagsEntryPoint::class.java)
                .growthBookFeatureFlags()
                .refreshAsync()
        }

        // Apply persisted locale BEFORE first Activity onCreate so the initial frame uses correct strings.
        val localeEp = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
        CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate).launch {
            val tag = localeEp.localeRepository().currentLocale.first()
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
        }
    }

    override val workManagerConfiguration: Configuration
        get() =
            Configuration
                .Builder()
                .setWorkerFactory(workerFactory)
                .build()
}
