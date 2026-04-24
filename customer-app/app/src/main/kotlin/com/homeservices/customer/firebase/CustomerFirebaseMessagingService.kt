package com.homeservices.customer.firebase

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class CustomerFirebaseMessagingService : FirebaseMessagingService() {
    @Inject public lateinit var priceApprovalEventBus: PriceApprovalEventBus

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        if (data["type"] == "ADDON_APPROVAL_REQUESTED") {
            val bookingId = data["bookingId"] ?: return
            priceApprovalEventBus.post(bookingId)
        }
    }

    // Token rotation handled via FCM topic subscription — no server-side storage needed.
    override fun onNewToken(token: String): Unit = Unit
}
