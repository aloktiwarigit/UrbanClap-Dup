package com.homeservices.customer.domain.technician

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import kotlinx.coroutines.flow.Flow

public interface TechnicianProfileRepository {
    public fun getProfile(technicianId: String): Flow<Result<TechnicianProfile>>
}
