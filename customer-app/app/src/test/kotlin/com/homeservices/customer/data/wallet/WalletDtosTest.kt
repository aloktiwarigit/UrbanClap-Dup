package com.homeservices.customer.data.wallet

import com.homeservices.customer.data.wallet.remote.dto.LedgerEntryDto
import com.homeservices.customer.domain.wallet.model.LedgerEntryType
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class WalletDtosTest {
    @Test
    public fun `LedgerEntryDto toDomain maps known type correctly`() {
        val dto =
            LedgerEntryDto(
                id = "le-1",
                type = "CREDIT_ISSUED",
                amountInPaise = 50000L,
                bookingId = null,
                reason = "Welcome bonus",
                createdAt = "2026-05-13T10:00:00Z",
            )
        val domain = dto.toDomain()

        assertThat(domain.id).isEqualTo("le-1")
        assertThat(domain.type).isEqualTo(LedgerEntryType.CREDIT_ISSUED)
        assertThat(domain.amountInPaise).isEqualTo(50000L)
        assertThat(domain.bookingId).isNull()
        assertThat(domain.reason).isEqualTo("Welcome bonus")
        assertThat(domain.createdAt).isEqualTo("2026-05-13T10:00:00Z")
    }

    @Test
    public fun `LedgerEntryDto toDomain maps CREDIT_APPLIED correctly`() {
        val dto =
            LedgerEntryDto(
                id = "le-2",
                type = "CREDIT_APPLIED",
                amountInPaise = 10000L,
                bookingId = "bk-1",
                reason = "Applied to booking",
                createdAt = "2026-05-13T12:00:00Z",
            )
        val domain = dto.toDomain()

        assertThat(domain.type).isEqualTo(LedgerEntryType.CREDIT_APPLIED)
        assertThat(domain.bookingId).isEqualTo("bk-1")
    }

    @Test
    public fun `LedgerEntryDto toDomain falls back to CREDIT_ISSUED for unknown type`() {
        val dto =
            LedgerEntryDto(
                id = "le-3",
                type = "UNKNOWN_FUTURE_TYPE",
                amountInPaise = 500L,
                bookingId = null,
                reason = "Unknown",
                createdAt = "2026-05-14T00:00:00Z",
            )
        val domain = dto.toDomain()

        assertThat(domain.type).isEqualTo(LedgerEntryType.CREDIT_ISSUED)
    }
}
