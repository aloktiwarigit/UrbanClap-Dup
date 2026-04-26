package com.homeservices.technician.data.complaint

import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow

public interface ComplaintRepository {
    public fun createComplaint(
        bookingId: String,
        reasonCode: String,
        description: String,
        photoStoragePath: String?,
    ): Flow<Result<ComplaintResponseDto>>

    public fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>>
}
