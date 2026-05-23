package com.homeservices.customer.data.wallet

import com.homeservices.customer.data.wallet.remote.WalletApiService
import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.WalletBalance
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class WalletRepositoryImpl
    @Inject
    constructor(
        private val api: WalletApiService,
    ) : WalletRepository {
        override fun getBalance(): Flow<Result<WalletBalance>> =
            flow {
                emit(runCatching { api.getBalance().toDomain() })
            }

        override fun getLedger(
            page: Int,
            limit: Int,
        ): Flow<Result<List<LedgerEntry>>> =
            flow {
                emit(runCatching { api.getLedger(page, limit).entries.map { it.toDomain() } })
            }
    }
