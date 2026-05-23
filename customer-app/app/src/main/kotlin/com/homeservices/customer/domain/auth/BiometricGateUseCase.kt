package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.gateway.BiometricGateway
import com.homeservices.customer.domain.auth.model.BiometricResult
import javax.inject.Inject

public class BiometricGateUseCase
    @Inject
    constructor(
        private val gateway: BiometricGateway,
    ) {
        public fun canUseBiometric(context: Context): Boolean = gateway.canAuthenticate(context)

        public suspend fun requestAuth(
            activity: FragmentActivity,
            title: String,
            subtitle: String,
        ): BiometricResult = gateway.requestAuth(activity, title, subtitle)
    }
