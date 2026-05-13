package com.homeservices.customer.firebase

/**
 * Pure-function helpers for the FCM legacy-fallback routing logic in
 * [CustomerFirebaseMessagingService].
 *
 * Extracted so the decision logic can be JVM unit-tested without a live
 * [FirebaseMessagingService] context.
 *
 * Background (E11-S01b-1 fix): the backend projector FCM payload does not yet
 * include `userId` at the top level, so [CustomerFirebaseMessagingService]
 * cannot build a [PendingAction] for ADDON_APPROVAL_REQUESTED and
 * RATING_PROMPT_CUSTOMER. Rather than silently dropping those notifications, the
 * service falls through to the legacy event-bus path.
 *
 * TODO(E11-S01b-3): Once api/src/services/pending-action-projector.ts adds `userId`
 * to the FCM data payload (field name: "userId"), [shouldPostLegacyEvent] will always
 * return false when [actionBuiltSuccessfully] is true. At that point:
 *   1. Remove FcmLegacyFallback.kt.
 *   2. Delete the legacy event-bus injection (@Inject priceApprovalEventBus,
 *      ratingPromptEventBus) from CustomerFirebaseMessagingService.
 *   3. Delete PriceApprovalEventBus and RatingPromptEventBus classes.
 * AppNavigation already uses Room observation (E11-S01b-2) and is unaffected.
 *
 * @param fcmType the raw `type` string from the FCM data payload, or null if absent.
 * @param actionBuiltSuccessfully true if the new router/ingestor path succeeded
 *   (PendingAction was constructed and handed to [PendingActionIngestor]).
 * @return true if the legacy event-bus post for [fcmType] should be triggered.
 *
 * Conditions for returning true:
 *   - The FCM type is one that the legacy event-bus observes
 *     (ADDON_APPROVAL_REQUESTED or RATING_PROMPT_CUSTOMER).
 *   - The new router/ingestor path did NOT complete successfully (i.e.,
 *     [actionBuiltSuccessfully] is false), meaning the backend payload is
 *     missing `userId` and the PendingAction could not be constructed.
 *
 * When both the new path AND the legacy path run (actionBuiltSuccessfully=true),
 * the caller is responsible for also posting the legacy event if desired to keep
 * foreground UI in sync (see [CustomerFirebaseMessagingService.onMessageReceived]).
 */
internal fun shouldPostLegacyEvent(
    fcmType: String?,
    actionBuiltSuccessfully: Boolean,
): Boolean {
    if (fcmType != "ADDON_APPROVAL_REQUESTED" && fcmType != "RATING_PROMPT_CUSTOMER") {
        return false
    }
    return !actionBuiltSuccessfully
}
// PR #210 CI re-trigger marker — safe to remove
