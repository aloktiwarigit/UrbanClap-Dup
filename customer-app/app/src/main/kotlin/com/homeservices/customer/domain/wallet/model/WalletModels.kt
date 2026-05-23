package com.homeservices.customer.domain.wallet.model

/** Domain model for wallet balance. */
public data class WalletBalance(
    val balanceInPaise: Long,
    val lastUpdatedAt: String,
)

/** Ledger entry type as returned by the backend. */
public enum class LedgerEntryType {
    CREDIT_ISSUED,
    CREDIT_APPLIED,
    REFUND,
}

/** Domain model for a single wallet ledger entry. */
public data class LedgerEntry(
    val id: String,
    val type: LedgerEntryType,
    val amountInPaise: Long,
    val bookingId: String?,
    val reason: String,
    val createdAt: String,
)
