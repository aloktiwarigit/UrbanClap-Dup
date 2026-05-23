package com.homeservices.customer.data.wallet

import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.WalletBalance
import kotlinx.coroutines.flow.Flow

public interface WalletRepository {
    public fun getBalance(): Flow<Result<WalletBalance>>

    public fun getLedger(
        page: Int,
        limit: Int,
    ): Flow<Result<List<LedgerEntry>>>
}
