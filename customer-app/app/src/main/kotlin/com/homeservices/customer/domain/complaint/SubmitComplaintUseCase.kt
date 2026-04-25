package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
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
        ): Flow<Result<ComplaintResponseDto>> = repo.createComplaint(bookingId, reason.code, description, photoStoragePath)
    }
