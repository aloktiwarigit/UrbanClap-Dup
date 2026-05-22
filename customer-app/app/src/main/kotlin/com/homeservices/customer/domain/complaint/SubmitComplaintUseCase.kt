package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject

public class SubmitComplaintUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            reason: ComplaintReason,
            description: String,
            photoStoragePath: String?,
        ): Flow<Result<ComplaintResponseDto>> {
            val idempotencyKey = UUID.randomUUID().toString()
            return repo.createComplaint(bookingId, reason.code, description, photoStoragePath, idempotencyKey)
        }
    }
