package com.homeservices.customer.domain.technician

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetTechnicianProfileUseCase @Inject constructor(
    private val repository: TechnicianProfileRepository,
) {
    public operator fun invoke(technicianId: String): Flow<Result<TechnicianProfile>> =
        repository.getProfile(technicianId)
}
