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
import com.homeservices.technician.data.activeJob.BookingStatusEvent
import com.homeservices.technician.data.activeJob.BookingStatusEventBus
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.kyc.KycStatusEvent
import com.homeservices.technician.data.kyc.KycStatusEventBus
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.observability.analytics.AnalyticsTracker
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
@Suppress("TooManyFunctions") // FCM message types dispatch to dedicated handlers; extraction would obscure routing
public class HomeservicesFcmService :
    FirebaseMessagingService() {
    public companion object {
        public const val CHANNEL_OFFERS: String = "offers"
        public const val CHANNEL_BOOKINGS: String = "bookings"
        public const val CHANNEL_PAYOUTS: String = "payouts"
        public const val CHANNEL_SYSTEM: String = "system"

        // Preserved for backward compat — maps to CHANNEL_OFFERS
        public const val CHANNEL_DISPATCH_OFFERS: String = "dispatch_offers"
        public const val CHANNEL_APPEAL_DECISION: String = "appeal_decision"
        public const val CHANNEL_RATING_RECEIVED: String = "rating_received"
        public const val CHANNEL_ERASURE_NOTICES: String = "erasure_notices"
        private const val REQUEST_CODE_RATING = 1001
        private const val REQUEST_CODE_JOB_OFFER = 1002
        private const val REQUEST_CODE_ERASURE = 1003
        private const val REQUEST_CODE_EARNINGS = 1004
        private const val REQUEST_CODE_RATING_PROMPT = 1005
        private const val NOTIFICATION_ID_JOB_OFFER = 3001
        private const val NOTIFICATION_ID_ERASURE_NOTICE = 3002
        private const val NOTIFICATION_ID_EARNINGS_UPDATE = 3003
        private const val NOTIFICATION_ID_RATING_PROMPT = 3004
        private const val NOTIFICATION_ID_KYC_STATUS = 3005
        private const val NOTIFICATION_ID_ONBOARDING_REMINDER = 3006
        private const val REQUEST_CODE_KYC_STATUS = 1006
        private const val REQUEST_CODE_ONBOARDING_REMINDER = 1007

        /** Register all notification channels. Call from Application.onCreate.
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
                    NotificationChannel(
                        CHANNEL_APPEAL_DECISION,
                        "Appeal Decisions",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ).apply { description = "Rating appeal outcomes" },
                    NotificationChannel(
                        CHANNEL_RATING_RECEIVED,
                        "Rating Notifications",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ).apply { description = "Customer ratings for completed jobs" },
                    NotificationChannel(
                        CHANNEL_ERASURE_NOTICES,
                        "Data Erasure Notices",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ).apply { description = "GDPR/DPDP erasure final notices" },
                ),
            )
        }
    }

    @Inject
    public lateinit var eventBus: JobOfferEventBus

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

    @Inject
    public lateinit var bookingStatusEventBus: BookingStatusEventBus

    @Inject
    public lateinit var kycStatusEventBus: KycStatusEventBus

    @Inject
    public lateinit var pendingActionStore: PendingActionStore

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onMessageReceived(message: RemoteMessage): Unit {
        handleMessageData(message.data, message.sentTime)
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
     *
     * Detekt suppressions: this is an FCM type dispatcher; each branch is a distinct message
     * type so extraction would obscure intent. LongMethod / ReturnCount grow linearly with the
     * number of supported types and each branch needs 1–2 guard-clause returns.
     */
    public fun handleMessageData(data: Map<String, String>) {
        handleMessageData(data, sentTimeMs = 0L)
    }

    @Suppress("CyclomaticComplexMethod", "LongMethod", "ReturnCount")
    internal fun handleMessageData(
        data: Map<String, String>,
        sentTimeMs: Long,
    ) {
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
            "BOOKING_STATUS_UPDATE" -> {
                val bookingId = data["bookingId"] ?: return
                // Canonical wire key is `status` (api/src/services/fcm.service.ts +
                // CustomerFirebaseMessagingService.handleBookingStatusUpdate). `newStatus`
                // accepted as a fallback for forward-compat with future producers.
                val newStatus = data["status"] ?: data["newStatus"] ?: return
                val priceApprovedPaise = data["priceApprovedPaise"]?.toLongOrNull()
                bookingStatusEventBus.post(
                    BookingStatusEvent(
                        bookingId = bookingId,
                        newStatus = newStatus,
                        priceApprovedPaise = priceApprovedPaise,
                    ),
                )
                showBookingStatusNotification(bookingId, newStatus, data["title"], data["body"])
            }
            "CUSTOMER_PRICE_APPROVED" -> {
                val bookingId = data["bookingId"] ?: return
                val paise = data["amountPaise"]?.toLongOrNull() ?: 0L
                bookingStatusEventBus.post(
                    BookingStatusEvent(
                        bookingId = bookingId,
                        newStatus = "PRICE_APPROVED",
                        priceApprovedPaise = paise,
                    ),
                )
                showBookingStatusNotification(bookingId, "PRICE_APPROVED", data["title"], data["body"])
            }
            "CUSTOMER_PRICE_REJECTED" -> {
                val bookingId = data["bookingId"] ?: return
                bookingStatusEventBus.post(
                    BookingStatusEvent(bookingId = bookingId, newStatus = "PRICE_REJECTED"),
                )
                showBookingStatusNotification(bookingId, "PRICE_REJECTED", data["title"], data["body"])
            }
            "KYC_VERIFIED" -> {
                val techId = data["techId"] ?: return
                resolveKycPendingRows(techId)
                kycStatusEventBus.post(
                    KycStatusEvent(technicianId = techId, verified = true, rejectionReason = null),
                )
                showKycStatusNotification(verified = true, title = data["title"], body = data["body"])
            }
            "KYC_REJECTED" -> {
                val techId = data["techId"] ?: return
                val reason = data["reason"]
                resolveKycPendingRows(techId)
                kycStatusEventBus.post(
                    KycStatusEvent(technicianId = techId, verified = false, rejectionReason = reason),
                )
                showKycStatusNotification(verified = false, title = data["title"], body = data["body"])
            }
            "ONBOARDING_REMINDER" -> {
                showOnboardingReminderNotification(title = data["title"], body = data["body"])
            }
            "JOB_OFFER" -> {
                val offer = parseJobOffer(data, sentTimeMs) ?: return
                eventBus.tryEmit(offer)
                AnalyticsTracker.capture(
                    "job_offer_received",
                    mapOf("bookingId" to offer.bookingId, "serviceId" to offer.serviceId),
                )
                showJobOfferNotification(offer)
            }
            "RATING_PROMPT_TECHNICIAN" -> {
                val bookingId = data["bookingId"] ?: return
                ratingPromptEventBus.post(bookingId)
                showRatingPromptNotification(bookingId)
            }
            "EARNINGS_UPDATE" -> {
                earningsUpdateEventBus.notifyEarningsUpdate()
                showEarningsUpdateNotification()
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
            "ERASURE_FINAL_NOTICE" -> {
                val daysRemaining = data["daysRemaining"]?.toIntOrNull() ?: 0
                showErasureFinalNoticeNotification(daysRemaining)
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
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
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
                .Builder(this, CHANNEL_APPEAL_DECISION)
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
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
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
                .Builder(this, CHANNEL_RATING_RECEIVED)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("रेटिंग प्राप्त हुई")
                .setContentText("आपको $overall★ मिले। टिप्पणी: $truncatedComment")
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun showErasureFinalNoticeNotification(daysRemaining: Int) {
        val channelId = CHANNEL_ERASURE_NOTICES
        val nm = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        // Channel registered eagerly by registerChannels at app start; guard is defense-in-depth.
        if (nm.getNotificationChannel(channelId) == null) {
            nm.createNotificationChannel(
                android.app
                    .NotificationChannel(
                        channelId,
                        "Account Erasure Notices",
                        android.app.NotificationManager.IMPORTANCE_HIGH,
                    ).apply { setBypassDnd(true) },
            )
        }
        val intent =
            android.content
                .Intent(this, com.homeservices.technician.MainActivity::class.java)
                .addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            android.app.PendingIntent.getActivity(
                this,
                REQUEST_CODE_ERASURE,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
            )
        val title = "खाता हटाने की अंतिम चेतावनी"
        val body =
            if (daysRemaining > 0) {
                "आपका खाता $daysRemaining दिनों में स्थायी रूप से हटाया जाएगा। यदि यह गलती से हो रहा है, तुरंत सहायता से संपर्क करें।"
            } else {
                "आपके खाते को स्थायी रूप से हटाया जा रहा है। तुरंत सहायता से संपर्क करें।"
            }
        val notification =
            androidx.core.app.NotificationCompat
                .Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(
                    androidx.core.app.NotificationCompat
                        .BigTextStyle()
                        .bigText(body),
                ).setContentIntent(pi)
                .setAutoCancel(true)
                .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                .build()
        nm.notify(NOTIFICATION_ID_ERASURE_NOTICE, notification)
    }

    private fun showEarningsUpdateNotification() {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("navigate_to", "payout_settings")
        val pi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_EARNINGS,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_PAYOUTS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(getString(com.homeservices.technician.R.string.fcm_earnings_update_title))
                .setContentText(getString(com.homeservices.technician.R.string.fcm_earnings_update_body))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(NOTIFICATION_ID_EARNINGS_UPDATE, notification)
    }

    private fun showBookingStatusNotification(
        bookingId: String,
        @Suppress("UNUSED_PARAMETER") status: String,
        title: String?,
        body: String?,
    ) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        // Tap simply re-opens MainActivity. The in-process BookingStatusEventBus already
        // refreshes an open ActiveJobScreen; on cold start the user lands on the dashboard
        // and taps the booking from there. Wiring a typed deep-link to activeJob/{bookingId}
        // requires a PendingNavigationStore + HomeGraph collector — deferred (see follow-up).
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            PendingIntent.getActivity(
                this,
                bookingId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_BOOKINGS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title ?: getString(com.homeservices.technician.R.string.booking_status_notification_title))
                .setContentText(body ?: getString(com.homeservices.technician.R.string.booking_status_notification_body_default))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(bookingId.hashCode(), notification)
    }

    private fun showRatingPromptNotification(bookingId: String) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("navigate_to", "rating/$bookingId")
        val pi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_RATING_PROMPT,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_BOOKINGS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(getString(com.homeservices.technician.R.string.fcm_rating_prompt_title))
                .setContentText(
                    getString(com.homeservices.technician.R.string.fcm_rating_prompt_body, bookingId),
                ).setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(NOTIFICATION_ID_RATING_PROMPT, notification)
    }

    /**
     * Durably tombstone the technician's KYC retry / submit-pending / resume rows
     * on a final server verdict. Runs in [serviceScope] (`SupervisorJob`) so the
     * writes survive the screen being torn down or the app being backgrounded.
     *
     * Without this, the in-process [KycStatusEventBus] post would be the only
     * cleanup signal — and `SharedFlow(replay = 0)` drops the event if no
     * collector is active when the FCM arrives.
     */
    private fun resolveKycPendingRows(techId: String) {
        if (techId.isBlank()) return
        serviceScope.launch {
            val now = System.currentTimeMillis()
            runCatching { pendingActionStore.clearPhotoRetry(techId = techId, now = now) }
            runCatching { pendingActionStore.clearKycSubmitPending(techId = techId, now = now) }
            runCatching { pendingActionStore.clearKycResume(techId = techId, now = now) }
        }
    }

    private fun showKycStatusNotification(
        verified: Boolean,
        title: String?,
        body: String?,
    ) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_KYC_STATUS,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val defaultTitle =
            getString(
                if (verified) {
                    com.homeservices.technician.R.string.kyc_verified_notification_title
                } else {
                    com.homeservices.technician.R.string.kyc_rejected_notification_title
                },
            )
        val defaultBody =
            getString(
                if (verified) {
                    com.homeservices.technician.R.string.kyc_verified_notification_body
                } else {
                    com.homeservices.technician.R.string.kyc_rejected_notification_body
                },
            )
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_SYSTEM)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title ?: defaultTitle)
                .setContentText(body ?: defaultBody)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(NOTIFICATION_ID_KYC_STATUS, notification)
    }

    private fun showOnboardingReminderNotification(
        title: String?,
        body: String?,
    ) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_ONBOARDING_REMINDER,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val defaultTitle = getString(com.homeservices.technician.R.string.onboarding_reminder_notification_title)
        val defaultBody = getString(com.homeservices.technician.R.string.onboarding_reminder_notification_body)
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_SYSTEM)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title ?: defaultTitle)
                .setContentText(body ?: defaultBody)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(NOTIFICATION_ID_ONBOARDING_REMINDER, notification)
    }

    override fun onNewToken(token: String): Unit {
        val data = androidx.work.workDataOf(FcmTokenRegisterWorker.KEY_FCM_TOKEN to token)
        val request =
            androidx.work.OneTimeWorkRequestBuilder<FcmTokenRegisterWorker>()
                .setInputData(data)
                .setConstraints(
                    androidx.work.Constraints.Builder()
                        .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                        .build(),
                ).setBackoffCriteria(
                    androidx.work.BackoffPolicy.EXPONENTIAL,
                    androidx.work.WorkRequest.MIN_BACKOFF_MILLIS,
                    java.util.concurrent.TimeUnit.MILLISECONDS,
                ).build()
        androidx.work.WorkManager.getInstance(applicationContext).enqueueUniqueWork(
            "fcm_token_register",
            androidx.work.ExistingWorkPolicy.REPLACE,
            request,
        )
    }

    public override fun onDestroy(): Unit {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun parseJobOffer(
        data: Map<String, String>,
        sentTimeMs: Long = 0L,
    ): JobOffer? {
        return try {
            val receivedAtMs = System.currentTimeMillis()
            val serverClockOffsetMs =
                if (sentTimeMs > 0L) {
                    sentTimeMs - receivedAtMs
                } else {
                    0L
                }
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
                serverClockOffsetMs = serverClockOffsetMs,
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
