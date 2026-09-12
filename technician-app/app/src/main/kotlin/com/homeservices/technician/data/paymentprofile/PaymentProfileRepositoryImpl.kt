package com.homeservices.technician.data.paymentprofile

import com.homeservices.technician.domain.paymentprofile.PaymentProfileRepository
import com.homeservices.technician.domain.paymentprofile.PaymentProfileResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class PaymentProfileRepositoryImpl
    @Inject
    internal constructor(
        private val api: PaymentProfileApiService,
    ) : PaymentProfileRepository {
        public override suspend fun updatePaymentProfile(upiVpa: String): Result<PaymentProfileResult> =
            runCatching {
                val dto = api.updatePaymentProfile(UpdatePaymentProfileRequestDto(upiVpa = upiVpa))
                PaymentProfileResult(upiVpa = dto.upiVpa, upiUpdatedAt = dto.upiUpdatedAt)
            }
    }
