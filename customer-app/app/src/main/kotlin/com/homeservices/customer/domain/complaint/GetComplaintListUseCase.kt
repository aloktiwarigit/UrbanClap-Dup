package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetComplaintListUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(
            page: Int = 1,
            limit: Int = 20,
        ): Flow<Result<List<ComplaintResponseDto>>> = repo.getComplaints(page = page, limit = limit)
    }
