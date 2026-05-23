package com.homeservices.technician

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.homeservices.technician.data.activeJob.ActiveJobLocationObserver
import com.homeservices.technician.data.fcm.HomeservicesFcmService
import com.homeservices.technician.data.locale.LocaleRepositoryImpl
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

    @Inject
    public lateinit var activeJobLocationObserver: ActiveJobLocationObserver

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
        activeJobLocationObserver.start()

        // Best-effort async flag refresh — non-blocking, fire-and-forget.
        // Uses a SupervisorJob so a failure here never propagates to sibling coroutines.
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            EntryPointAccessors
                .fromApplication(this@HomeservicesTechnicianApplication, FeatureFlagsEntryPoint::class.java)
                .growthBookFeatureFlags()
                .refreshAsync()
        }

        // Apply locale synchronously from SharedPreferences mirror so the first Compose frame uses
        // the correct language with no race. The mirror is written on every SetAppLocaleUseCase call.
        // Fall back to DEFAULT_LOCALE on first install (no mirror yet).
        val syncTag =
            LocaleRepositoryImpl.readMirrorLocale(this)
                ?: AppCompatDelegate
                    .getApplicationLocales()
                    .toLanguageTags()
                    .split(",")
                    .firstOrNull()
                    ?.substringBefore("-")
                    ?.takeIf { it == "en" || it == "hi" }
                ?: LocaleRepositoryImpl.DEFAULT_LOCALE
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(syncTag))

        // Async reconciliation: DataStore may have a newer tag (e.g. if mirror write failed).
        val localeEp = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
        CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate).launch {
            val tag = localeEp.localeRepository().currentLocale.first()
            if (tag != syncTag) {
                AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
            }
        }
    }

    override val workManagerConfiguration: Configuration
        get() =
            Configuration
                .Builder()
                .setWorkerFactory(workerFactory)
                .build()
}
