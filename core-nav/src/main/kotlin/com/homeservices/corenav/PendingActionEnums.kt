package com.homeservices.corenav

/**
 * Action types that can appear in the `pending_actions` collection.
 *
 * Two sub-classes of types live in this enum:
 *
 * 1. **Server-originated (FCM-driven)** — names mirror the FCM wire types defined in:
 *      - `api/src/services/fcm.service.ts`
 *      - `customer-app/.../firebase/CustomerFirebaseMessagingService.kt`
 *      - `technician-app/.../data/fcm/HomeservicesFcmService.kt`
 *    Per E11 spec §9.2: "Do not invent new type names." for this sub-class.
 *
 * 2. **Local-only retry-queue** — durable hooks the client-side persists when an
 *    offline-tolerant action is interrupted (e.g. photo upload, state transition).
 *    These never appear in an FCM payload; they are written by the app itself
 *    and cleared once the queued action succeeds. Introduced in E11-S05a.
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

    /**
     * Local-only (E11-S05a): a job-evidence photo upload failed and is queued for retry.
     * Surfaced as a banner on the technician-app active-job screen.
     * Cleared when the upload succeeds.
     */
    PHOTO_UPLOAD_PENDING,

    /**
     * Local-only (E11-S05a): a job state transition (EN_ROUTE/REACHED/IN_PROGRESS/COMPLETED)
     * was attempted but failed to reach the server. Existing offline-queue mechanism in
     * [ActiveJobRepository] persists the transition itself; this row exists only so the
     * router knows a job has outstanding work and can avoid duplicate prompts.
     */
    STATE_TRANSITION_PENDING,

    /**
     * Local-only (E11-S05a): reserved for future durability of the completion-confirm
     * dialog. Currently the awaiting-confirm state is held in [ActiveJobUiState] only;
     * this enum value is reserved so existing on-device DBs need not migrate when the
     * persistence step lands.
     */
    COMPLETION_CONFIRMATION_PENDING,
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
