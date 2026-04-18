package com.homeservices.customer.di

import com.homeservices.customer.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object AppModule {
    @Provides
    @Singleton
    public fun provideBuildInfoProvider(): BuildInfoProvider =
        BuildInfoProvider(
            version = BuildConfig.VERSION_NAME,
            gitSha = BuildConfig.GIT_SHA,
        )
}
