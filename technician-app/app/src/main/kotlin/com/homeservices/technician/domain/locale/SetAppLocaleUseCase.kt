package com.homeservices.technician.domain.locale

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import javax.inject.Inject

public class SetAppLocaleUseCase
    @Inject
    constructor(private val repo: LocaleRepository) {
        public suspend operator fun invoke(tag: String) {
            // NOTE: technician-app has no first-launch language picker.
            // LocaleRepository intentionally omits firstLaunchPending / markFirstLaunchCompleted.
            // Persist before applying — setApplicationLocales() triggers Activity recreation on
            // API <33, which would cancel viewModelScope and leave DataStore writes incomplete.
            repo.setLocale(tag)
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
        }
    }
