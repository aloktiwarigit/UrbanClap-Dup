package com.homeservices.customer.domain.locale

import kotlinx.coroutines.flow.Flow

public interface LocaleRepository {
    public val currentLocale: Flow<String>

    public val firstLaunchPending: Flow<Boolean>

    public suspend fun setLocale(tag: String)

    public suspend fun markFirstLaunchCompleted()
}
