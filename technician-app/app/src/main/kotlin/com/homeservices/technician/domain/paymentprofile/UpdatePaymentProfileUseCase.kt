package com.homeservices.technician.domain.paymentprofile

import javax.inject.Inject

public class UpdatePaymentProfileUseCase
    @Inject
    constructor(
        private val repository: PaymentProfileRepository,
    ) {
        public suspend fun invoke(upiVpa: String): Result<PaymentProfileResult> =
            repository.updatePaymentProfile(upiVpa)
    }
