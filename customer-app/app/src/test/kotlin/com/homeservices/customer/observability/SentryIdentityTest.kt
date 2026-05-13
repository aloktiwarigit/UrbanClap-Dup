package com.homeservices.customer.observability

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * TDD (E18-S06) — SentryIdentity: sha256 hash helper.
 *
 * Validates:
 * 1. Hash output is deterministic — same UID → same hash every call.
 * 2. Hash output is exactly 16 hex characters (take(16) of sha256 hex string).
 * 3. Different UIDs produce different hashes (collision resistance at scale).
 * 4. Raw UID is not present in the output (PII safety gate).
 */
public class SentryIdentityTest {
    // mirrors SentryIdentity.SENTRY_USER_ID_HEX_LENGTH
    private companion object {
        const val EXPECTED_HASH_LENGTH = 16
    }

    @Test
    public fun `sentryUserId is deterministic for same uid`() {
        val uid = "firebase-uid-abc123XYZ"
        val first = SentryIdentity.sentryUserId(uid)
        val second = SentryIdentity.sentryUserId(uid)
        assertThat(first).isEqualTo(second)
    }

    @Test
    public fun `sentryUserId returns exactly 16 characters`() {
        val uid = "some-user-id"
        val result = SentryIdentity.sentryUserId(uid)
        assertThat(result).hasSize(EXPECTED_HASH_LENGTH)
    }

    @Test
    public fun `sentryUserId returns only hex characters`() {
        val uid = "test-uid-for-hex-check"
        val result = SentryIdentity.sentryUserId(uid)
        assertThat(result).matches("[0-9a-f]{$EXPECTED_HASH_LENGTH}")
    }

    @Test
    public fun `sentryUserId produces different output for different uids`() {
        val id1 = SentryIdentity.sentryUserId("user-alpha")
        val id2 = SentryIdentity.sentryUserId("user-beta")
        assertThat(id1).isNotEqualTo(id2)
    }

    @Test
    public fun `sentryUserId does not contain raw uid`() {
        val uid = "very-recognisable-uid-12345"
        val result = SentryIdentity.sentryUserId(uid)
        // The hashed prefix must not be the uid itself (PII gate).
        assertThat(result).doesNotContain(uid)
        // Also must not be a substring of the raw uid.
        assertThat(uid).doesNotContain(result)
    }

    @Test
    public fun `sentryUserId handles empty string without throwing`() {
        val result = SentryIdentity.sentryUserId("")
        assertThat(result).hasSize(EXPECTED_HASH_LENGTH)
        assertThat(result).matches("[0-9a-f]{$EXPECTED_HASH_LENGTH}")
    }
}
