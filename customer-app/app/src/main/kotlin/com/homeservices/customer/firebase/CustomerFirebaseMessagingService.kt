package com.homeservices.customer.firebase

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.corenav.NotificationRouter
import com.homeservices.customer.MainActivity
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.data.rating.RatingPromptEventBus
import com.homeservices.customer.data.tracking.TrackingEvent
import com.homeservices.customer.data.tracking.TrackingEventBus
import com.homeservices.customer.notification.PendingActionIngestor
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Firebase Cloud Messaging service — customer-app.
 *
 * Refactored in E11-S01b-1 to delegate pending-action FCM types to
 * [PendingActionIngestor]. Legacy in-process event bus messages (LOCATION_UPDATE,
 * BOOKING_STATUS_UPDATE, ADDON_APPROVAL_REQUESTED, RATING_PROMPT_CUSTOMER) are
 * preserved for backward-compatibility until the event-bus removal pass in E11-S01b-2.
 *
 * Notification channels (registered in [HomeservicesCustomerApplication.onCreate]):
 *   - bookings (high importance) — booking status changes
 *   - offers (high) — price approvals, add-ons
 *   - complaints (default) — complaint updates, support follow-ups
 *   - credits (default) — wallet credits
 *   - system (low) — FCM token rotation, misc
 *
 * Deep-link PendingIntent strategy: tapping a notification opens
 * [MainActivity] with `homeservices://action/<actionId>` as a data URI.
 * MainActivity + AppNavigation handle route resolution via TierLadder.
 */
@Suppress("TooManyFunctions") // P1 fix (E11-S01b-2): dataWithAuthUid is the 12th function needed for the projector-userId fallback
@AndroidEntryPoint
public class CustomerFirebaseMessagingService : FirebaseMessagingService() {
    @Inject public lateinit var priceApprovalEventBus: PriceApprovalEventBus

    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    @Inject public lateinit var trackingEventBus: TrackingEventBus

    @Inject public lateinit var router: NotificationRouter

    @Inject public lateinit var ingestor: PendingActionIngestor

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data

        // Delegate pending-action types to Ingestor — parsed via NotificationRouter.
        //
        // P1 fix (E11-S01b-2 Codex): AppNavigation no longer observes legacy event buses.
        // When the backend FCM payload lacks `userId` (projector gap), use the authenticated
        // Firebase UID so buildPendingActionFromIntent can succeed and Room emits for nav.
        // If FirebaseAuth is also null (signed-out), the legacy path fires instead.
        val intent = router.parseFcmData(data)
        val action = intent?.let { buildPendingActionFromIntent(it, dataWithAuthUid(data)) }
        if (action != null) {
            serviceScope.launch { ingestor.ingest(action) }
            showNotificationForIntent(intent!!, data)
            val bookingId = data["bookingId"]
            when (data["type"]) {
                "ADDON_APPROVAL_REQUESTED" -> if (bookingId != null) priceApprovalEventBus.post(bookingId)
                "RATING_PROMPT_CUSTOMER" -> if (bookingId != null) ratingPromptEventBus.post(bookingId)
            }
            return
        }
        // Legacy in-process routing — reached when the new path could not build a
        // PendingAction: intent null, or signed-out (FirebaseAuth returned null).
        // LOCATION_UPDATE/BOOKING_STATUS_UPDATE always arrive here.
        val bookingId = data["bookingId"] ?: return
        when (data["type"]) {
            "ADDON_APPROVAL_REQUESTED" -> priceApprovalEventBus.post(bookingId)
            "RATING_PROMPT_CUSTOMER" -> ratingPromptEventBus.post(bookingId)
            "LOCATION_UPDATE" -> handleLocationUpdate(data, bookingId)
            "BOOKING_STATUS_UPDATE" -> handleBookingStatusUpdate(data, bookingId)
        }
    }

    /**
     * Returns a copy of [data] with a `userId` entry, using the FCM-supplied value if
     * present, otherwise substituting [FirebaseAuth.currentUser] uid.
     *
     * P1 fix: Backend projector FCM payloads for ADDON_APPROVAL_REQUESTED and
     * RATING_PROMPT_CUSTOMER omit `userId`. Without a userId, [buildPendingActionFromIntent]
     * returns null and Room never persists the action, silently breaking foreground nav.
     * If FirebaseAuth also returns null (signed-out), the original map is returned
     * unchanged — [buildPendingActionFromIntent] will still return null, and the
     * legacy event-bus path fires as a final fallback.
     */
    private fun dataWithAuthUid(data: Map<String, String>): Map<String, String> {
        val authUid = if (data.containsKey("userId")) null else FirebaseAuth.getInstance().currentUser?.uid
        return if (authUid != null) data.toMutableMap().also { it["userId"] = authUid } else data
    }

    // Token rotation handled via FCM topic subscription — no server-side storage needed.
    override fun onNewToken(token: String): Unit = Unit

    public override fun onDestroy(): Unit {
        super.onDestroy()
        serviceScope.cancel()
    }

    // ── Notification tray builder ─────────────────────────────────────────────

    private fun showNotificationForIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = channelIdFor(intent.type)

        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)
        val tapIntent =
            Intent(Intent.ACTION_VIEW).apply {
                setData(android.net.Uri.parse(deepLinkUri))
                setClass(this@CustomerFirebaseMessagingService, MainActivity::class.java)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
        val tapPi =
            PendingIntent.getActivity(
                this,
                deepLinkUri.hashCode(),
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        val title = data["title"] ?: notificationTitle(intent.type)
        val body = data["body"] ?: notificationBody(intent.type)

        val notification =
            NotificationCompat
                .Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setContentIntent(tapPi)
                .setAutoCancel(true)
                .setPriority(priorityFor(channelId))
                .build()

        nm.notify(deepLinkUri.hashCode(), notification)
    }

    // ── Channel mapping ───────────────────────────────────────────────────────

    private fun channelIdFor(type: com.homeservices.corenav.PendingActionType): String =
        when (type) {
            com.homeservices.corenav.PendingActionType.ADDON_APPROVAL_REQUESTED ->
                CHANNEL_OFFERS
            com.homeservices.corenav.PendingActionType.RATING_PROMPT_CUSTOMER ->
                CHANNEL_BOOKINGS
            com.homeservices.corenav.PendingActionType.COMPLAINT_UPDATE,
            com.homeservices.corenav.PendingActionType.SUPPORT_FOLLOWUP,
            ->
                CHANNEL_COMPLAINTS
            else -> CHANNEL_SYSTEM
        }

    private fun priorityFor(channelId: String): Int =
        when (channelId) {
            CHANNEL_BOOKINGS, CHANNEL_OFFERS -> NotificationCompat.PRIORITY_HIGH
            else -> NotificationCompat.PRIORITY_DEFAULT
        }

    private fun notificationTitle(type: com.homeservices.corenav.PendingActionType): String =
        when (type) {
            com.homeservices.corenav.PendingActionType.ADDON_APPROVAL_REQUESTED ->
                "Add-on requested"
            com.homeservices.corenav.PendingActionType.RATING_PROMPT_CUSTOMER ->
                "Rate your service"
            com.homeservices.corenav.PendingActionType.COMPLAINT_UPDATE ->
                "Complaint update"
            com.homeservices.corenav.PendingActionType.SUPPORT_FOLLOWUP ->
                "Support update"
            else -> "Notification"
        }

    private fun notificationBody(type: com.homeservices.corenav.PendingActionType): String =
        when (type) {
            com.homeservices.corenav.PendingActionType.ADDON_APPROVAL_REQUESTED ->
                "Your technician has requested an add-on. Tap to approve."
            com.homeservices.corenav.PendingActionType.RATING_PROMPT_CUSTOMER ->
                "How was your experience? Take a moment to rate your service."
            com.homeservices.corenav.PendingActionType.COMPLAINT_UPDATE ->
                "There's an update on your complaint. Tap to view."
            com.homeservices.corenav.PendingActionType.SUPPORT_FOLLOWUP ->
                "Your support ticket has been updated. Tap to view."
            else -> "Tap to open the app."
        }

    // ── Legacy in-process routing (to be removed in E11-S01b-2) ─────────────

    private fun handleLocationUpdate(
        data: Map<String, String>,
        bookingId: String,
    ) {
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

    private fun handleBookingStatusUpdate(
        data: Map<String, String>,
        bookingId: String,
    ) {
        val status = data["status"] ?: return
        trackingEventBus.post(
            TrackingEvent.StatusUpdate(bookingId = bookingId, status = status),
        )
    }

    // ── PendingAction builder ─────────────────────────────────────────────────

    /**
     * Build a [com.homeservices.corenav.PendingAction] from a parsed [NotificationIntent]
     * and the raw FCM data payload.
     *
     * The action ID follows the deterministic compound format:
     * `<TYPE>:<role>:<userId>:<entityType>:<entityId>`
     *
     * This method returns null if the userId is absent (unauthenticated context).
     */
    private fun buildPendingActionFromIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ): com.homeservices.corenav.PendingAction? {
        val userId = data["userId"] ?: return null
        val actionId =
            data["actionId"]
                ?: "${intent.type.name}:customer:$userId:${intent.type.name.lowercase()}:${intent.entityId}"
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
        val expiresAt = data["expiresAt"]?.toLongOrNull()
        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)

        return com.homeservices.corenav.PendingAction(
            id = actionId,
            userId = userId,
            role = "customer",
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

    public companion object {
        public const val CHANNEL_BOOKINGS: String = "bookings"
        public const val CHANNEL_OFFERS: String = "offers"
        public const val CHANNEL_COMPLAINTS: String = "complaints"
        public const val CHANNEL_CREDITS: String = "credits"
        public const val CHANNEL_SYSTEM: String = "system"

        /** Register all 5 notification channels. Call from Application.onCreate.
         *  Notification channels are an Oreo+ API; the project's minSdk is 26 so the
         *  pre-Oreo guard is unnecessary (lint flags it as ObsoleteSdkInt). */
        public fun registerChannels(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannels(
                listOf(
                    NotificationChannel(
                        CHANNEL_BOOKINGS,
                        "Bookings",
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply { description = "Booking status updates" },
                    NotificationChannel(
                        CHANNEL_OFFERS,
                        "Offers & approvals",
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply { description = "Add-on requests and price approvals" },
                    NotificationChannel(
                        CHANNEL_COMPLAINTS,
                        "Complaints & support",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ).apply { description = "Updates on complaints and support tickets" },
                    NotificationChannel(
                        CHANNEL_CREDITS,
                        "Credits & wallet",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ).apply { description = "Wallet credits and no-show compensation" },
                    NotificationChannel(
                        CHANNEL_SYSTEM,
                        "System",
                        NotificationManager.IMPORTANCE_LOW,
                    ).apply { description = "System messages" },
                ),
            )
        }
    }
}
