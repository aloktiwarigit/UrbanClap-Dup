package com.homeservices.technician.domain.locale

import kotlinx.coroutines.flow.Flow

public interface LocaleRepository {
    public val currentLocale: Flow<String>
    public suspend fun setLocale(tag: String)
}
