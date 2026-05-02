package com.homeservices.customer.domain.locale

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import javax.inject.Inject

public class SetAppLocaleUseCase
    @Inject
    constructor(
        private val repo: LocaleRepository,
    ) {
        public suspend operator fun invoke(tag: String) {
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
            repo.setLocale(tag)
            repo.markFirstLaunchCompleted()
        }
    }
