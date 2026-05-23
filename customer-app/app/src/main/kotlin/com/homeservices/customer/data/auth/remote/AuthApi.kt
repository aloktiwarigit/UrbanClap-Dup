package com.homeservices.customer.data.auth.remote

import com.homeservices.customer.data.auth.remote.dto.TruecallerVerifyRequest
import com.homeservices.customer.data.auth.remote.dto.TruecallerVerifyResponse
import retrofit2.http.Body
import retrofit2.http.POST

public interface AuthApi {
    @POST("v1/auth/truecaller/verify")
    public suspend fun verifyTruecaller(
        @Body body: TruecallerVerifyRequest,
    ): TruecallerVerifyResponse
}
