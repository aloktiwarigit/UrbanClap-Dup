package com.homeservices.technician.data.activeJob

import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.PendingTransitionEntity
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.location.CurrentLocationProvider
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class ActiveJobRepositoryImpl
    @Inject
    internal constructor(
        private val api: ActiveJobApiService,
        private val dao: ActiveJobDao,
        private val currentLocationProvider: CurrentLocationProvider,
    ) : ActiveJobRepository {
        private val _activeJobState = MutableStateFlow<ActiveJob?>(null)

        override val activeJobState: StateFlow<ActiveJob?> = _activeJobState.asStateFlow()

        /**
         * Returns a flow that emits each non-null value from [activeJobState].
         * Calling [startObserving] before collecting ensures an initial fetch is performed.
         */
        override fun getActiveJob(bookingId: String): Flow<ActiveJob> =
            _activeJobState
                .filterNotNull()
                .filter { it.bookingId == bookingId }

        /** One-shot HTTP fetch to prime [activeJobState]. Called by the foreground service on start. */
        override suspend fun startObserving(bookingId: String) {
            val response = api.getActiveJob(bookingId)
            if (response.isSuccessful) {
                response.body()?.let { _activeJobState.value = it.toDomain() }
            }
        }

        /** Updates the in-memory state from an FCM JOB_UPDATE payload. */
        override fun updateFromFcm(job: ActiveJob) {
            _activeJobState.value = job
        }

        override val hasPendingTransitions: Flow<Boolean> =
            dao.getPendingFlow().map { it.isNotEmpty() }

        override suspend fun transitionStatus(
            bookingId: String,
            targetStatus: ActiveJobStatus,
            integrityToken: String?,
        ): Result<ActiveJob> =
            try {
                val locationWithFidelity =
                    runCatching { currentLocationProvider.currentLocation() }.getOrNull()
                val response =
                    api.transitionStatus(
                        bookingId,
                        TransitionRequest(
                            targetStatus = targetStatus.name,
                            currentLocation = locationWithFidelity?.latLng?.toDto(),
                            attestation =
                                locationWithFidelity?.fidelity?.let {
                                    LocationAttestationDto(
                                        isMock = it.isMock,
                                        gpsAccuracyM = it.accuracyMetres,
                                    )
                                },
                        ),
                        integrityToken = integrityToken,
                    )
                if (response.isSuccessful) {
                    response.body()?.let { body ->
                        val job = body.toDomain()
                        _activeJobState.value = job
                        Result.success(job)
                    } ?: Result.failure(
                        IllegalStateException("Empty body on successful transition for $bookingId"),
                    )
                } else {
                    Result.failure(RuntimeException("Transition failed: HTTP ${response.code()}"))
                }
            } catch (e: Exception) {
                dao.insert(
                    PendingTransitionEntity(
                        id = UUID.randomUUID().toString(),
                        bookingId = bookingId,
                        targetStatus = targetStatus.name,
                        createdAt = System.currentTimeMillis(),
                    ),
                )
                Result.failure(e)
            }

        override suspend fun syncPendingTransitions() {
            val pending = dao.getPending()
            for (entry in pending) {
                try {
                    val response =
                        api.transitionStatus(
                            entry.bookingId,
                            TransitionRequest(entry.targetStatus),
                        )
                    if (response.isSuccessful || response.code() == 409) {
                        dao.delete(entry.id)
                    }
                } catch (_: Exception) {
                    // leave for next reconnect
                }
            }
        }

        private fun ActiveJobResponse.toDomain(): ActiveJob =
            ActiveJob(
                bookingId = bookingId,
                customerId = customerId,
                serviceId = serviceId,
                serviceName = serviceName,
                addressText = addressText,
                addressLatLng = LatLng(addressLatLng.lat, addressLatLng.lng),
                status = ActiveJobStatus.valueOf(status),
                slotDate = slotDate,
                slotWindow = slotWindow,
            )

        private fun LatLng.toDto(): LatLngDto = LatLngDto(lat = lat, lng = lng)
    }
