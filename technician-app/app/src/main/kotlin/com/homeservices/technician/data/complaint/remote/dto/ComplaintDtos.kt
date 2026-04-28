package com.homeservices.technician.data.complaint.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CreateComplaintRequestDto(
    val bookingId: String,
    val reasonCode: String,
    val description: String,
    val photoStoragePath: String?,
)

@JsonClass(generateAdapter = true)
public data class ComplaintResponseDto(
    val id: String,
    val status: String,
    val acknowledgeDeadlineAt: String?,
    val slaDeadlineAt: String,
    val reasonCode: String?,
    val filedBy: String?,
    val createdAt: String,
)

@JsonClass(generateAdapter = true)
public data class ComplaintListResponseDto(
    val complaints: List<ComplaintResponseDto>,
)
