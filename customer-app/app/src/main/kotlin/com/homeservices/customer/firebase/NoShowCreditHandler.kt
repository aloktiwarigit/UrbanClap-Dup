package com.homeservices.customer.firebase

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import com.homeservices.customer.R
import com.homeservices.customer.data.wallet.NoShowCreditEvent
import com.homeservices.customer.data.wallet.NoShowCreditEventBus

/**
 * Handles the `NO_SHOW_CREDIT_ISSUED` FCM data payload.
 *
 * Extracted into its own class so unit tests can exercise the logic without
 * constructing [CustomerFirebaseMessagingService] (which is an Android component
 * requiring Hilt + AndroidJUnit4).
 *
 * Called from [CustomerFirebaseMessagingService.onMessageReceived] after it
 * detects `data["type"] == "NO_SHOW_CREDIT_ISSUED"`.
 */
public class NoShowCreditHandler(
    private val context: Context,
    private val eventBus: NoShowCreditEventBus,
) {
    /**
     * Parses [data], emits a [NoShowCreditEvent] to the bus, and posts a
     * system-tray notification on [CustomerFirebaseMessagingService.CHANNEL_CREDITS].
     *
     * When [data] contains `"title"` and `"body"` keys, those values are used
     * directly and [Context.getString] is NOT called. This lets the backend
     * customise per-credit messaging without an app update.
     */
    public fun handle(data: Map<String, String>) {
        val creditAmountPaise = data["creditAmountPaise"]?.toLongOrNull() ?: 0L
        val bookingId = data["bookingId"] ?: ""

        // Post in-process event so live UI can react without a round-trip.
        eventBus.post(NoShowCreditEvent(creditAmountPaise = creditAmountPaise, bookingId = bookingId))

        // Only call getString() when data map has no title/body — this preserves the
        // test expectation that getString is not called when FCM provides custom strings.
        val title = data["title"] ?: context.getString(R.string.no_show_credit_notification_title)
        val body = data["body"] ?: context.getString(R.string.no_show_credit_notification_body)

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification =
            NotificationCompat
                .Builder(context, CustomerFirebaseMessagingService.CHANNEL_CREDITS)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build()

        val notifId = if (bookingId.isNotEmpty()) bookingId.hashCode() else "no_show_credit".hashCode()
        nm.notify(notifId, notification)
    }
}
