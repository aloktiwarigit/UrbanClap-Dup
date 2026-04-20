package com.homeservices.customer.domain.booking

import android.app.Activity
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.razorpay.Checkout
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject
import javax.inject.Inject

public class RazorpayPaymentUseCase @Inject constructor(
    private val bus: PaymentResultBus,
) {
    public fun resultFlow(): Flow<PaymentResult> = bus.results

    public fun open(
        activity: Activity,
        orderId: String,
        amount: Int,
        customerPhone: String,
    ): Flow<PaymentResult> = callbackFlow {
        val job = launch { bus.results.first().also { trySend(it); close() } }
        val checkout = Checkout()
        checkout.setKeyID(BuildConfig.RAZORPAY_KEY_ID)
        val options = JSONObject().apply {
            put("order_id", orderId)
            put("amount", amount)
            put("currency", "INR")
            put("prefill", JSONObject().apply {
                put("contact", customerPhone)
            })
        }
        checkout.open(activity, options)
        awaitClose { job.cancel() }
    }
}
