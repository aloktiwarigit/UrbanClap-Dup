package com.homeservices.customer.domain.auth.gateway

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import kotlinx.coroutines.flow.SharedFlow

public interface TruecallerGateway {
    public val resultFlow: SharedFlow<TruecallerAuthResult>

    public fun init(context: Context)

    public fun isAvailable(): Boolean

    public fun launch(activity: FragmentActivity)
}
