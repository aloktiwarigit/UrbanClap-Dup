package com.homeservices.customer.observability

import java.security.MessageDigest

/**
 * Sentry identity helpers (E18-S06).
 *
 * Provides a one-way, deterministic identifier for use in Sentry user-context.
 * The raw Firebase UID is NEVER sent to Sentry; only the first 16 hex characters
 * of its SHA-256 digest are used. This satisfies the PII constraint from ADR-0018:
 * enough entropy to correlate Sentry issues to a specific account (via internal
 * lookup by the engineering team) without exposing the raw identifier to Sentry.
 *
 * Security note: SHA-256 is used here for determinism and collision resistance,
 * NOT as a cryptographic key derivation function. The output is intentionally
 * truncated to 16 hex chars (64 bits) — sufficient for Sentry correlation and
 * shorter than the full digest to further reduce re-identification surface.
 */
public object SentryIdentity {
    /** Length of the truncated SHA-256 hex prefix sent to Sentry as user identifier.
     *  64 bits (16 hex chars) is sufficient for Sentry correlation while reducing
     *  re-identification surface vs the full 256-bit digest. */
    private const val SENTRY_USER_ID_HEX_LENGTH = 16

    /**
     * Returns the first 16 hex characters of SHA-256(uid).
     *
     * Never returns the raw [uid]. Safe to send to Sentry.
     *
     * @param uid Firebase UID or any stable user identifier.
     * @return 16-character lowercase hex string.
     */
    public fun sentryUserId(uid: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(uid.toByteArray(Charsets.UTF_8))
        return hashBytes.joinToString("") { "%02x".format(it) }.take(SENTRY_USER_ID_HEX_LENGTH)
    }
}
