package com.homeservices.customer.data.consent.remote

import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

public interface ConsentAuditApiService {
    @POST("v1/users/me/consent-audit")
    public suspend fun postConsentAudit(
        @Body body: ConsentAuditRequestDto,
    ): Response<Unit>
}
