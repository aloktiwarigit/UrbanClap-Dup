package com.homeservices.corenav

/**
 * Pure parser interface for incoming notification data.
 *
 * Implementations live in each app's Android layer (they depend on FCM SDK types).
 * This interface is in core-nav so [TierLadder] and business logic can refer to
 * the shared [NotificationIntent] type without touching Android.
 *
 * Per E11 spec §2.8: NotificationRouter is a pure parser — no persistence, no network.
 */
public interface NotificationRouter {
    /**
     * Parse raw FCM data message key-value pairs into a [NotificationIntent].
     * Returns null if the data does not represent a known notification type.
     */
    public fun parseFcmData(data: Map<String, String>): NotificationIntent?

    /**
     * Parse a deep-link URI string (e.g. `homeservices://action/JOB_OFFER?entityId=xyz`)
     * into a [NotificationIntent]. Returns null if the URI is malformed or unknown.
     */
    public fun parseDeepLink(uri: String): NotificationIntent?
}
