package com.homeservices.corenav

/**
 * Action types that can appear in the `pending_actions` collection.
 *
 * Names match the existing FCM wire types defined in:
 *   - `api/src/services/fcm.service.ts`
 *   - `customer-app/.../firebase/CustomerFirebaseMessagingService.kt`
 *   - `technician-app/.../data/fcm/HomeservicesFcmService.kt`
 *
 * DO NOT add new names here without first adding them to the FCM service in the API.
 * Per E11 spec §9.2: "Do not invent new type names."
 */
public enum class PendingActionType {
    /** Customer must approve an add-on request. Maps to existing FCM type. */
    ADDON_APPROVAL_REQUESTED,

    /** Customer is prompted to rate a completed booking. Maps to existing FCM type. */
    RATING_PROMPT_CUSTOMER,

    /** Technician is prompted to rate a completed booking. Maps to existing FCM type. */
    RATING_PROMPT_TECHNICIAN,

    /** Technician has received a rating from a customer. Maps to existing FCM type. */
    RATING_RECEIVED,

    /** Technician has received an earnings update. Maps to existing FCM type. */
    EARNINGS_UPDATE,

    /** Technician has received a job offer. Maps to existing FCM type. */
    JOB_OFFER,

    /** Technician must resume incomplete KYC. New type introduced in E11. */
    KYC_RESUME,

    /** A complaint has been updated. New type introduced in E11. Applies to both roles. */
    COMPLAINT_UPDATE,

    /** A support follow-up is available. New type introduced in E11. Applies to both roles. */
    SUPPORT_FOLLOWUP,

    /** Future: SOS audio follow-up. Reserved per E11 spec. */
    SAFETY_SOS_FOLLOWUP,
}

/** Lifecycle status of a pending action row, both local and server-side. */
public enum class PendingActionStatus {
    /** Action is live and surfaced to the user. */
    ACTIVE,

    /**
     * Action has been resolved by the server (e.g., booking moved to next state).
     * Tombstone rows are kept locally for 30 days to prevent stale-FCM resurrection.
     */
    RESOLVED,

    /** Action's TTL has passed (e.g., JOB_OFFER not accepted in time). */
    EXPIRED,
}

/**
 * Routing priority of a pending action.
 *
 * Maps directly to the T-tier in [TierLadder]:
 *   HIGH   → T3
 *   NORMAL → T4
 *   LOW    → T5
 */
public enum class PendingActionPriority {
    HIGH,
    NORMAL,
    LOW,
}
