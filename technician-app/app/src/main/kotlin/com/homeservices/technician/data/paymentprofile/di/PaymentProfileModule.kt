package com.homeservices.technician.data.paymentprofile.di

import com.homeservices.technician.data.paymentprofile.PaymentProfileApiService
import com.homeservices.technician.data.paymentprofile.PaymentProfileRepositoryImpl
import com.homeservices.technician.domain.paymentprofile.PaymentProfileRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class PaymentProfileModule {
    @Binds
    abstract fun bindPaymentProfileRepository(impl: PaymentProfileRepositoryImpl): PaymentProfileRepository

    companion object {
        @Provides
        @Singleton
        fun providePaymentProfileApiService(retrofit: Retrofit): PaymentProfileApiService =
            retrofit.create(PaymentProfileApiService::class.java)
    }
}
