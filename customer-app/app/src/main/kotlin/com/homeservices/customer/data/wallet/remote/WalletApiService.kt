package com.homeservices.customer.data.wallet.remote

import com.homeservices.customer.data.wallet.remote.dto.WalletBalanceResponseDto
import com.homeservices.customer.data.wallet.remote.dto.WalletLedgerResponseDto
import retrofit2.http.GET
import retrofit2.http.Query

public interface WalletApiService {
    @GET("v1/wallet/balance")
    public suspend fun getBalance(): WalletBalanceResponseDto

    @GET("v1/wallet/ledger")
    public suspend fun getLedger(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
    ): WalletLedgerResponseDto
}
