package com.homeservices.customer.di

import android.content.Context
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.net.PlacesClient
import com.homeservices.customer.data.places.AndroidReverseGeocoder
import com.homeservices.customer.data.places.DefaultPlacesClientGateway
import com.homeservices.customer.domain.places.PlacesClientGateway
import com.homeservices.customer.domain.places.ReverseGeocoder
import com.homeservices.customer.domain.serviceArea.LocalServiceAreaCheck
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object PlacesModule {

    @Provides
    @Singleton
    public fun providePlacesClient(
        @ApplicationContext ctx: Context,
    ): PlacesClient = Places.createClient(ctx)

    @Provides
    @Singleton
    public fun provideLocalServiceAreaCheck(
        @ApplicationContext ctx: Context,
    ): LocalServiceAreaCheck = LocalServiceAreaCheck(ctx)
}

@Module
@InstallIn(SingletonComponent::class)
public abstract class PlacesBindingsModule {

    @Binds
    public abstract fun bindReverseGeocoder(impl: AndroidReverseGeocoder): ReverseGeocoder

    @Binds
    public abstract fun bindPlacesClientGateway(impl: DefaultPlacesClientGateway): PlacesClientGateway
}
