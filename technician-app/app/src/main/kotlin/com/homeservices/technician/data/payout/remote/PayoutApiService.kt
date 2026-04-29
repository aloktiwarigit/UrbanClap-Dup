package com.homeservices.technician.data.payout.remote

import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceRequestDto
import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceResponseDto
import retrofit2.http.Body
import retrofit2.http.PATCH

public interface PayoutApiService {
    @PATCH("v1/technicians/me/payout-cadence")
    public suspend fun updatePayoutCadence(
        @Body body: UpdatePayoutCadenceRequestDto,
    ): UpdatePayoutCadenceResponseDto
}
