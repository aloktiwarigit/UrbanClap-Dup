package com.homeservices.customer.firebase

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.data.tracking.TrackingEvent
import com.homeservices.customer.data.tracking.TrackingEventBus
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class CustomerFirebaseMessagingService : FirebaseMessagingService() {
    @Inject public lateinit var priceApprovalEventBus: PriceApprovalEventBus

    @Inject public lateinit var trackingEventBus: TrackingEventBus

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        when (data["type"]) {
            "ADDON_APPROVAL_REQUESTED" -> {
                val bookingId = data["bookingId"] ?: return
                priceApprovalEventBus.post(bookingId)
            }
            "LOCATION_UPDATE" -> {
                val bookingId = data["bookingId"] ?: return
                val lat = data["lat"]?.toDoubleOrNull() ?: return
                val lng = data["lng"]?.toDoubleOrNull() ?: return
                val eta = data["etaMinutes"]?.toIntOrNull() ?: 0
                trackingEventBus.post(
                    TrackingEvent.LocationUpdate(
                        bookingId = bookingId,
                        lat = lat,
                        lng = lng,
                        etaMinutes = eta,
                        techName = data["techName"] ?: "",
                        techPhotoUrl = data["techPhotoUrl"] ?: "",
                    ),
                )
            }
            "BOOKING_STATUS_UPDATE" -> {
                val bookingId = data["bookingId"] ?: return
                val status = data["status"] ?: return
                trackingEventBus.post(
                    TrackingEvent.StatusUpdate(bookingId = bookingId, status = status),
                )
            }
        }
    }

    // Token rotation handled via FCM topic subscription — no server-side storage needed.
    override fun onNewToken(token: String): Unit = Unit
}
