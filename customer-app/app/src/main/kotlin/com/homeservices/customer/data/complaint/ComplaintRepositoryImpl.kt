package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class ComplaintRepositoryImpl
    @Inject
    constructor(
        private val api: ComplaintApiService,
    ) : ComplaintRepository {
        override fun createComplaint(
            bookingId: String,
            reasonCode: String,
            description: String,
            photoStoragePath: String?,
        ): Flow<Result<ComplaintResponseDto>> =
            flow {
                emit(
                    runCatching {
                        api.createComplaint(
                            CreateComplaintRequestDto(
                                bookingId = bookingId,
                                reasonCode = reasonCode,
                                description = description,
                                photoStoragePath = photoStoragePath,
                            ),
                        )
                    },
                )
            }

        override fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
            flow {
                emit(runCatching { api.getComplaintsForBooking(bookingId).complaints })
            }
    }
