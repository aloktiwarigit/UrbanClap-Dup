package com.homeservices.customer.domain.wallet

import com.homeservices.customer.data.wallet.WalletRepository
import com.homeservices.customer.domain.wallet.model.WalletBalance
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetWalletBalanceUseCase
    @Inject
    public constructor(
        private val repository: WalletRepository,
    ) {
        public operator fun invoke(): Flow<Result<WalletBalance>> = repository.getBalance()
    }
