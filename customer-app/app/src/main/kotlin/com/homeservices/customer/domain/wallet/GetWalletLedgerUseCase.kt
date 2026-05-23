package com.homeservices.customer.domain.wallet

import com.homeservices.customer.data.wallet.WalletRepository
import com.homeservices.customer.domain.wallet.model.LedgerEntry
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetWalletLedgerUseCase
    @Inject
    public constructor(
        private val repository: WalletRepository,
    ) {
        public operator fun invoke(
            page: Int = 1,
            limit: Int = 20,
        ): Flow<Result<List<LedgerEntry>>> = repository.getLedger(page, limit)
    }
