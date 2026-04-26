package com.homeservices.technician.domain.shield

import com.homeservices.technician.domain.shield.model.ShieldReportResult
import javax.inject.Inject

public class FileShieldReportUseCase
    @Inject
    constructor(
        private val repository: ShieldRepository,
    ) {
        public suspend fun invoke(
            bookingId: String,
            description: String?,
        ): Result<ShieldReportResult> = repository.fileShieldReport(bookingId, description)
    }
