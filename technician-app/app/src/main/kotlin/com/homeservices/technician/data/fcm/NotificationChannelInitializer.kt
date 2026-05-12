package com.homeservices.technician.data.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

/**
 * Registers every FCM notification channel at app start.
 *
 * Why eager registration: Android (Oreo+) silently drops notifications targeting an
 * unregistered channel. With lazy per-message registration, the first FCM after install
 * or after process kill could fire before the channel exists and never reach the
 * technician — particularly bad for [HomeservicesFcmService.CHANNEL_DISPATCH_OFFERS]
 * which carries time-sensitive job offers, and for [CHANNEL_ERASURE_NOTICES] which
 * carries DPDP/GDPR compliance warnings.
 *
 * Channels are created idempotently (no-op if already registered) so calling this
 * from [com.homeservices.technician.HomeservicesTechnicianApplication.onCreate] is
 * always safe. [HomeservicesFcmService] still keeps lazy guards as defense-in-depth.
 */
public object NotificationChannelInitializer {
    public fun initializeChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        registerIfMissing(
            nm = nm,
            id = HomeservicesFcmService.CHANNEL_DISPATCH_OFFERS,
            name = "Dispatch Offers",
            description = "Incoming job offers for technicians",
            importance = NotificationManager.IMPORTANCE_HIGH,
            bypassDnd = true,
        )
        registerIfMissing(
            nm = nm,
            id = HomeservicesFcmService.CHANNEL_APPEAL_DECISION,
            name = "Appeal Decisions",
            description = "Outcome of submitted rating appeals",
            importance = NotificationManager.IMPORTANCE_DEFAULT,
            bypassDnd = false,
        )
        registerIfMissing(
            nm = nm,
            id = HomeservicesFcmService.CHANNEL_RATING_RECEIVED,
            name = "Rating Notifications",
            description = "Customer ratings received after a job",
            importance = NotificationManager.IMPORTANCE_DEFAULT,
            bypassDnd = false,
        )
        registerIfMissing(
            nm = nm,
            id = HomeservicesFcmService.CHANNEL_ERASURE_NOTICES,
            name = "Account Erasure Notices",
            description = "Compliance warnings about account deletion (DPDP/GDPR)",
            importance = NotificationManager.IMPORTANCE_HIGH,
            bypassDnd = true,
        )
    }

    private fun registerIfMissing(
        nm: NotificationManager,
        id: String,
        name: String,
        description: String,
        importance: Int,
        bypassDnd: Boolean,
    ) {
        if (nm.getNotificationChannel(id) != null) return
        val channel =
            NotificationChannel(id, name, importance).apply {
                this.description = description
                if (bypassDnd) setBypassDnd(true)
            }
        nm.createNotificationChannel(channel)
    }
}
