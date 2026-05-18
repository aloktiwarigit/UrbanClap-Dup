package com.homeservices.customer.di

import javax.inject.Qualifier

/** Qualifier for [kotlinx.coroutines.Dispatchers.Default] — used by ViewModels doing CPU work. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class DefaultDispatcher
