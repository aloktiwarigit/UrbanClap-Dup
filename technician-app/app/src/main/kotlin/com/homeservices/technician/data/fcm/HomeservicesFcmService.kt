package com.homeservices.technician.data.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.os.Build
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.ui.jobOffer.JobOfferFullScreenActivity
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
    public companion object {
        public const val CHANNEL_DISPATCH_OFFERS: String = "dispatch_offers"
        private const val REQUEST_CODE_RATING = 1001
        private const val REQUEST_CODE_JOB_OFFER = 1002
        private const val NOTIFICATION_ID_JOB_OFFER = 3001
    }

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
        handleMessageData(message.data)
    }

    /**
     * Extracted for testability — processes the FCM data payload without
     * requiring a live [RemoteMessage].
     */
    public fun handleMessageData(data: Map<String, String>) {
        when (data["type"]) {
            "JOB_OFFER" -> {
                val offer = parseJobOffer(data) ?: return
                eventBus.tryEmit(offer)
                showJobOfferNotification(offer)
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
            "APPEAL_DECISION" -> {
                val decision = data["decision"] ?: "UPHELD"
                val ownerNote = data["ownerNote"] ?: ""
                ratingReceivedEventBus.post()
                showAppealDecisionNotification(decision, ownerNote)
            }
        }
    }

    private fun showJobOfferNotification(offer: JobOffer) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        createDispatchOffersChannel(nm)

        val fullScreenIntent = JobOfferFullScreenActivity.intentFor(this, offer)
        val fullScreenPi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_JOB_OFFER,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        val tapIntent = JobOfferFullScreenActivity.intentFor(this, offer)
        val tapPi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_JOB_OFFER + 1,
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        val amountRs = offer.amountPaise / 100
        val notification =
            androidx.core.app.NotificationCompat
                .Builder(this, CHANNEL_DISPATCH_OFFERS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("नया काम आया! ₹$amountRs")
                .setContentText("${offer.serviceName} — ${offer.addressText}")
                .setContentIntent(tapPi)
                .setFullScreenIntent(fullScreenPi, true)
                .setAutoCancel(true)
                .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                .setCategory(androidx.core.app.NotificationCompat.CATEGORY_CALL)
                .build()

        nm.notify(NOTIFICATION_ID_JOB_OFFER, notification)
    }

    private fun createDispatchOffersChannel(nm: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = nm.getNotificationChannel(CHANNEL_DISPATCH_OFFERS)
            if (existing != null) return
            val channel =
                NotificationChannel(
                    CHANNEL_DISPATCH_OFFERS,
                    "Dispatch Offers",
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = "Incoming job offers for technicians"
                    setBypassDnd(true)
                }
            nm.createNotificationChannel(channel)
        }
    }

    private fun showAppealDecisionNotification(
        decision: String,
        ownerNote: String,
    ) {
        val channelId = "appeal_decision"
        val nm = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                android.app.NotificationChannel(
                    channelId,
                    "Appeal Decisions",
                    android.app.NotificationManager.IMPORTANCE_DEFAULT,
                ),
            )
        }
        val intent =
            android.content
                .Intent(this, com.homeservices.technician.MainActivity::class.java)
                .addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            android.app.PendingIntent.getActivity(
                this,
                0,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
            )
        val baseBody =
            when (decision) {
                "APPEAL_REMOVED" -> "रेटिंग हटा दी गई।"
                "APPEAL_PARTIAL_REMOVE" -> "रेटिंग विवादित चिह्नित की गई।"
                else -> "आपकी रेटिंग यथावत रहेगी।"
            }
        val noteSnippet =
            if (ownerNote.isNotBlank()) {
                val truncated = if (ownerNote.length > 80) ownerNote.take(77) + "…" else ownerNote
                " $truncated"
            } else {
                ""
            }
        val notification =
            androidx.core.app.NotificationCompat
                .Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("अपील का फैसला आया")
                .setContentText("$baseBody$noteSnippet")
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun showRatingReceivedNotification(
        overall: Int,
        comment: String,
    ) {
        val channelId = "rating_received"
        val nm = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                android.app.NotificationChannel(
                    channelId,
                    "Rating Notifications",
                    android.app.NotificationManager.IMPORTANCE_DEFAULT,
                ),
            )
        }
        val intent =
            android.content
                .Intent(this, com.homeservices.technician.MainActivity::class.java)
                .addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("navigate_to", "ratings_transparency")
        val pi =
            android.app.PendingIntent.getActivity(
                this,
                REQUEST_CODE_RATING,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
            )
        val truncatedComment = if (comment.length > 100) comment.take(97) + "…" else comment
        val notification =
            androidx.core.app.NotificationCompat
                .Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("रेटिंग प्राप्त हुई")
                .setContentText("आपको $overall★ मिले। टिप्पणी: $truncatedComment")
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
