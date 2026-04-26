package com.homeservices.technician.data.fcm

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

@AndroidEntryPoint
public class HomeservicesFcmService : FirebaseMessagingService() {
    @Inject
    public lateinit var eventBus: JobOfferEventBus

    @Inject
    public lateinit var fcmTokenSyncUseCase: FcmTokenSyncUseCase

    @Inject
    public lateinit var ratingPromptEventBus: RatingPromptEventBus

    @Inject
    public lateinit var earningsUpdateEventBus: EarningsUpdateEventBus

    @Inject
    public lateinit var ratingReceivedEventBus: RatingReceivedEventBus

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onMessageReceived(message: RemoteMessage): Unit {
        val data = message.data
        when (data["type"]) {
            "JOB_OFFER" -> {
                val offer = parseJobOffer(data) ?: return
                eventBus.tryEmit(offer)
            }
            "RATING_PROMPT_TECHNICIAN" -> {
                val bookingId = data["bookingId"] ?: return
                ratingPromptEventBus.post(bookingId)
            }
            "EARNINGS_UPDATE" -> {
                earningsUpdateEventBus.notifyEarningsUpdate()
            }
            "RATING_RECEIVED" -> {
                val overall = data["overall"]?.toIntOrNull() ?: 1
                val comment = data["comment"] ?: ""
                ratingReceivedEventBus.post()
                showRatingReceivedNotification(overall, comment)
            }
        }
    }

    private fun showRatingReceivedNotification(overall: Int, comment: String) {
        val channelId = "rating_received"
        val nm = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                android.app.NotificationChannel(
                    channelId,
                    "Rating Notifications",
                    android.app.NotificationManager.IMPORTANCE_DEFAULT,
                )
            )
        }
        val intent = android.content.Intent(this, com.homeservices.technician.MainActivity::class.java)
            .addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi = android.app.PendingIntent.getActivity(
            this, 0, intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
        )
        val truncatedComment = if (comment.length > 100) comment.take(97) + "…" else comment
        val notification = androidx.core.app.NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("रेटिंग प्राप्त हुई")
            .setContentText("आपको ${overall}★ मिले। टिप्पणी: $truncatedComment")
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()
        nm.notify(System.currentTimeMillis().toInt(), notification)
    }

    override fun onNewToken(token: String): Unit {
        serviceScope.launch {
            fcmTokenSyncUseCase.invokeWithFcmToken(token)
        }
    }

    public override fun onDestroy(): Unit {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun parseJobOffer(data: Map<String, String>): JobOffer? {
        return try {
            val expiresAtMs = Instant.parse(data["expiresAt"] ?: return null).toEpochMilli()
            JobOffer(
                bookingId = data["bookingId"] ?: return null,
                serviceId = data["serviceId"] ?: return null,
                serviceName = data["serviceName"] ?: return null,
                addressText = data["addressText"] ?: return null,
                slotDate = data["slotDate"] ?: return null,
                slotWindow = data["slotWindow"] ?: return null,
                amountPaise = data["amount"]?.toLongOrNull() ?: return null,
                distanceKm = data["distanceKm"]?.toDoubleOrNull() ?: return null,
                expiresAtMs = expiresAtMs,
            )
        } catch (_: Exception) {
            null
        }
    }
}
