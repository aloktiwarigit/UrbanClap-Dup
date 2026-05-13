package com.homeservices.technician.data.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.corenav.NotificationRouter
import com.homeservices.technician.MainActivity
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.notification.PendingActionIngestor
import com.homeservices.technician.ui.jobOffer.JobOfferFullScreenActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

/**
 * Firebase Cloud Messaging service — technician-app.
 *
 * Refactored in E11-S01b-1 to delegate pending-action FCM types to
 * [PendingActionIngestor] via [NotificationRouter] parsing. Legacy in-process
 * event bus routing (JOB_OFFER, RATING_PROMPT_TECHNICIAN, EARNINGS_UPDATE,
 * RATING_RECEIVED) is preserved for backward-compatibility until E11-S01b-2.
 *
 * Notification channels (registered in [HomeservicesTechnicianApplication.onCreate]):
 *   - offers (high importance + bypassDnd) — dispatch job offers
 *   - bookings (high) — booking assignments and status
 *   - payouts (default) — earnings and payout updates
 *   - system (low) — misc/token rotation
 */
@AndroidEntryPoint
public class HomeservicesFcmService : FirebaseMessagingService() {
    public companion object {
        public const val CHANNEL_OFFERS: String = "offers"
        public const val CHANNEL_BOOKINGS: String = "bookings"
        public const val CHANNEL_PAYOUTS: String = "payouts"
        public const val CHANNEL_SYSTEM: String = "system"

        // Preserved for backward compat — maps to CHANNEL_OFFERS
        public const val CHANNEL_DISPATCH_OFFERS: String = "dispatch_offers"

        private const val REQUEST_CODE_RATING = 1001
        private const val REQUEST_CODE_JOB_OFFER = 1002
        private const val NOTIFICATION_ID_JOB_OFFER = 3001

        /** Register all 4 notification channels. Call from Application.onCreate.
         *  Notification channels are an Oreo+ API; the project's minSdk is 26 so the
         *  pre-Oreo guard is unnecessary (lint flags it as ObsoleteSdkInt). */
        public fun registerChannels(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannels(
                listOf(
                    NotificationChannel(
                        CHANNEL_OFFERS,
                        "Job Offers",
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply {
                        description = "Incoming job offers"
                        setBypassDnd(true)
                    },
                    // Keep legacy dispatch_offers channel to avoid breaking existing notifications
                    NotificationChannel(
                        CHANNEL_DISPATCH_OFFERS,
                        "Dispatch Offers",
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply {
                        description = "Incoming job offers for technicians"
                        setBypassDnd(true)
                    },
                    NotificationChannel(
                        CHANNEL_BOOKINGS,
                        "Bookings",
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply { description = "Booking assignments and status" },
                    NotificationChannel(
                        CHANNEL_PAYOUTS,
                        "Payouts & earnings",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ).apply { description = "Earnings updates and payout notifications" },
                    NotificationChannel(
                        CHANNEL_SYSTEM,
                        "System",
                        NotificationManager.IMPORTANCE_LOW,
                    ).apply { description = "System messages" },
                ),
            )
        }
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

    @Inject
    public lateinit var router: NotificationRouter

    @Inject
    public lateinit var ingestor: PendingActionIngestor

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onMessageReceived(message: RemoteMessage): Unit {
        handleMessageData(message.data)
    }

    /**
     * Extracted for testability — processes the FCM data payload without
     * requiring a live [RemoteMessage].
     *
     * Routing strategy (E11-S01b-1):
     *   1. Parse via [NotificationRouter] → if recognised, delegate to [PendingActionIngestor]
     *      and show a tray notification with deep-link PendingIntent.
     *   2. JOB_OFFER additionally triggers the in-process [JobOfferEventBus] for the
     *      full-screen offer UI (EventBus removal deferred to E11-S01b-2).
     *   3. Legacy event-bus types not yet in core-nav schema fall through to the existing switch.
     */
    public fun handleMessageData(data: Map<String, String>) {
        // Attempt to ingest via NotificationRouter (pending-action types)
        val intent = router.parseFcmData(data)
        if (intent != null) {
            val action = buildPendingActionFromIntent(intent, data)
            if (action != null) {
                serviceScope.launch {
                    ingestor.ingest(action)
                }
            }
        }

        // Legacy in-process routing (preserved; removed in E11-S01b-2)
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
            NotificationCompat
                .Builder(this, CHANNEL_DISPATCH_OFFERS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("नया काम आया! ₹$amountRs")
                .setContentText("${offer.serviceName} — ${offer.addressText}")
                .setContentIntent(tapPi)
                .setFullScreenIntent(fullScreenPi, true)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .build()

        nm.notify(NOTIFICATION_ID_JOB_OFFER, notification)
    }

    private fun showAppealDecisionNotification(
        decision: String,
        ownerNote: String,
    ) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
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
            NotificationCompat
                .Builder(this, CHANNEL_PAYOUTS)
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
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("navigate_to", "ratings_transparency")
        val pi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_RATING,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val truncatedComment = if (comment.length > 100) comment.take(97) + "…" else comment
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_PAYOUTS)
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

    // ── PendingAction builder ─────────────────────────────────────────────────

    private fun buildPendingActionFromIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ): com.homeservices.corenav.PendingAction? {
        val userId = data["userId"] ?: return null
        val actionId =
            data["actionId"]
                ?: "${intent.type.name}:technician:$userId:${intent.type.name.lowercase()}:${intent.entityId}"
        val version = data["version"]?.toLongOrNull() ?: 1L
        val priority =
            runCatching {
                com.homeservices.corenav.PendingActionPriority
                    .valueOf(data["priority"] ?: "NORMAL")
            }.getOrDefault(com.homeservices.corenav.PendingActionPriority.NORMAL)
        val entityType = data["entityType"] ?: intent.type.name.lowercase()
        val nowMs = System.currentTimeMillis()
        val createdAt = data["createdAt"]?.toLongOrNull() ?: nowMs
        val updatedAt = data["updatedAt"]?.toLongOrNull() ?: nowMs
        val expiresAt =
            data["expiresAt"]?.let {
                runCatching { Instant.parse(it).toEpochMilli() }.getOrNull()
                    ?: it.toLongOrNull()
            }
        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)

        return com.homeservices.corenav.PendingAction(
            id = actionId,
            userId = userId,
            role = "technician",
            type = intent.type,
            entityType = entityType,
            entityId = intent.entityId,
            routeUri = deepLinkUri,
            priority = priority,
            status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
            sourceStatus = data["sourceStatus"],
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = null,
        )
    }
}
