package com.homeservices.customer.data.wallet.remote.dto

import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.LedgerEntryType
import com.homeservices.customer.domain.wallet.model.WalletBalance
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class WalletBalanceResponseDto(
    val balanceInPaise: Long,
    val lastUpdatedAt: String,
) {
    public fun toDomain(): WalletBalance = WalletBalance(balanceInPaise = balanceInPaise, lastUpdatedAt = lastUpdatedAt)
}

@JsonClass(generateAdapter = true)
public data class WalletLedgerResponseDto(
    val entries: List<LedgerEntryDto>,
    val total: Int,
    val page: Int,
    val limit: Int,
)

@JsonClass(generateAdapter = true)
public data class LedgerEntryDto(
    val id: String,
    val type: String,
    val amountInPaise: Long,
    val bookingId: String?,
    val reason: String,
    val createdAt: String,
) {
    public fun toDomain(): LedgerEntry =
        LedgerEntry(
            id = id,
            type =
                runCatching { LedgerEntryType.valueOf(type) }
                    .getOrDefault(LedgerEntryType.CREDIT_ISSUED),
            amountInPaise = amountInPaise,
            bookingId = bookingId,
            reason = reason,
            createdAt = createdAt,
        )
}
