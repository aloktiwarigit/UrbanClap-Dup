package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.gateway.TruecallerGateway
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import kotlinx.coroutines.flow.SharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TruecallerLoginUseCase
    @Inject
    constructor(
        private val gateway: TruecallerGateway,
    ) {
        public val resultFlow: SharedFlow<TruecallerAuthResult> get() = gateway.resultFlow

        public fun init(context: Context): Unit = gateway.init(context)

        public fun isAvailable(): Boolean = gateway.isAvailable()

        public fun launch(activity: FragmentActivity): Unit = gateway.launch(activity)
    }
