package com.homeservices.customer.domain.locale

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetCurrentLocaleUseCase
    @Inject
    constructor(
        private val repo: LocaleRepository,
    ) {
        public operator fun invoke(): Flow<String> = repo.currentLocale
    }
