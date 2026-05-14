package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class ReopenComplaintUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(complaintId: String): Flow<Result<ComplaintResponseDto>> = repo.reopenComplaint(complaintId)
    }
