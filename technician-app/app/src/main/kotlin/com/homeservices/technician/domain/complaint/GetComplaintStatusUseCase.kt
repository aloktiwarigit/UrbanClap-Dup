package com.homeservices.technician.domain.complaint

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetComplaintStatusUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> = repo.getComplaintsForBooking(bookingId)
    }
