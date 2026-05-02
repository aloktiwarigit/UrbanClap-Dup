package com.homeservices.customer.domain.locale

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class IsFirstLaunchUseCase
    @Inject
    constructor(
        private val repo: LocaleRepository,
    ) {
        public operator fun invoke(): Flow<Boolean> = repo.firstLaunchPending
    }
