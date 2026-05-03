package com.homeservices.technician.data.activeJob

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.PendingTransitionEntity
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class ActiveJobRepositoryImpl
    @Inject
    internal constructor(
        private val api: ActiveJobApiService,
        private val dao: ActiveJobDao,
        private val firebaseAuth: FirebaseAuth,
    ) : ActiveJobRepository {
        override fun getActiveJob(bookingId: String): Flow<ActiveJob> =
            flow {
                while (true) {
                    val token =
                        firebaseAuth.currentUser
                            ?.getIdToken(false)
                            ?.await()
                            ?.token ?: break
                    val response = api.getActiveJob("Bearer $token", bookingId)
                    if (response.isSuccessful) {
                        response.body()?.let { emit(it.toDomain()) }
                    }
                    delay(5_000L)
                }
            }

        override val hasPendingTransitions: Flow<Boolean> =
            dao.getPendingFlow().map { it.isNotEmpty() }

        override suspend fun transitionStatus(
            bookingId: String,
            targetStatus: ActiveJobStatus,
        ): Result<ActiveJob> {
            return try {
                val token =
                    firebaseAuth.currentUser
                        ?.getIdToken(false)
                        ?.await()
                        ?.token
                        ?: return Result.failure(IllegalStateException("Not authenticated"))
                val response =
                    api.transitionStatus(
                        "Bearer $token",
                        bookingId,
                        TransitionRequest(targetStatus.name),
                    )
                if (response.isSuccessful) {
                    Result.success(response.body()!!.toDomain())
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
        }

        override suspend fun syncPendingTransitions() {
            val token =
                firebaseAuth.currentUser
                    ?.getIdToken(false)
                    ?.await()
                    ?.token ?: return
            val pending = dao.getPending()
            for (entry in pending) {
                try {
                    val response =
                        api.transitionStatus(
                            "Bearer $token",
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
    }
