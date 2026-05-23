package com.homeservices.customer.domain.auth.gateway

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.model.BiometricResult

public interface BiometricGateway {
    public fun canAuthenticate(context: Context): Boolean

    public suspend fun requestAuth(
        activity: FragmentActivity,
        title: String,
        subtitle: String,
    ): BiometricResult
}
