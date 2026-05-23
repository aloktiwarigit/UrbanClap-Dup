package com.homeservices.customer.data.auth.di

import com.homeservices.customer.data.auth.gateway.AndroidBiometricGateway
import com.homeservices.customer.data.auth.gateway.CredentialManagerGoogleProvider
import com.homeservices.customer.data.auth.gateway.FirebasePhoneOtpSender
import com.homeservices.customer.data.auth.gateway.TruecallerSdkGateway
import com.homeservices.customer.domain.auth.gateway.BiometricGateway
import com.homeservices.customer.domain.auth.gateway.GoogleCredentialProvider
import com.homeservices.customer.domain.auth.gateway.OtpSender
import com.homeservices.customer.domain.auth.gateway.TruecallerGateway
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class GatewayModule {
    @Binds
    @Singleton
    public abstract fun bindBiometricGateway(impl: AndroidBiometricGateway): BiometricGateway

    @Binds
    @Singleton
    public abstract fun bindOtpSender(impl: FirebasePhoneOtpSender): OtpSender

    @Binds
    @Singleton
    public abstract fun bindTruecallerGateway(impl: TruecallerSdkGateway): TruecallerGateway

    @Binds
    @Singleton
    public abstract fun bindGoogleCredentialProvider(impl: CredentialManagerGoogleProvider): GoogleCredentialProvider
}
