package com.homeservices.technician.data.activeJob

import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.PendingTransitionEntity
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.location.CurrentLocationProvider
import com.homeservices.technician.domain.location.LocationFidelity
import com.homeservices.technician.domain.location.LocationWithFidelity
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
public class ActiveJobRepositoryImplTest {
    private lateinit var api: ActiveJobApiService
    private lateinit var dao: ActiveJobDao
    private lateinit var currentLocationProvider: CurrentLocationProvider
    private lateinit var repo: ActiveJobRepositoryImpl

    private fun aResponse(status: String = "ASSIGNED") =
        ActiveJobResponse(
            bookingId = "bk-1",
            customerId = "c-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main St",
            addressLatLng = LatLngDto(lat = 12.9, lng = 77.6),
            status = status,
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
        )

    @BeforeEach
    public fun setUp() {
        api = mockk(relaxed = true)
        dao = mockk(relaxed = true)
        currentLocationProvider = mockk()

        every { dao.getPendingFlow() } returns emptyFlow()
        coEvery { currentLocationProvider.currentLocation() } returns null
        repo = ActiveJobRepositoryImpl(api, dao, currentLocationProvider)
    }

    @Test
    public fun `transitionStatus success path — does NOT write PendingTransitionEntity`(): Unit =
        runTest {
            coEvery { api.transitionStatus(any(), any(), any()) } returns Response.success(aResponse("EN_ROUTE"))

            val result = repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            assertThat(result.isSuccess).isTrue()
            coVerify(exactly = 0) { dao.insert(any()) }
        }

    @Test
    public fun `transitionStatus includes current GPS when available`(): Unit =
        runTest {
            coEvery { currentLocationProvider.currentLocation() } returns
                LocationWithFidelity(
                    latLng = LatLng(26.8, 82.2),
                    fidelity = LocationFidelity(isMock = false, accuracyMetres = 10f),
                )
            coEvery { api.transitionStatus(any(), any(), any()) } returns Response.success(aResponse("EN_ROUTE"))

            repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            coVerify {
                api.transitionStatus(
                    "bk-1",
                    TransitionRequest(
                        targetStatus = "EN_ROUTE",
                        currentLocation = LatLngDto(lat = 26.8, lng = 82.2),
                        attestation = LocationAttestationDto(isMock = false, gpsAccuracyM = 10f),
                    ),
                    integrityToken = null,
                )
            }
        }

    @Test
    public fun `transitionStatus includes mock attestation on spoof`(): Unit =
        runTest {
            coEvery { currentLocationProvider.currentLocation() } returns
                LocationWithFidelity(
                    latLng = LatLng(26.8, 82.2),
                    fidelity = LocationFidelity(isMock = true, accuracyMetres = 1f),
                )
            coEvery { api.transitionStatus(any(), any(), any()) } returns Response.success(aResponse("REACHED"))

            repo.transitionStatus("bk-1", ActiveJobStatus.REACHED)

            coVerify {
                api.transitionStatus(
                    "bk-1",
                    TransitionRequest(
                        targetStatus = "REACHED",
                        currentLocation = LatLngDto(lat = 26.8, lng = 82.2),
                        attestation = LocationAttestationDto(isMock = true, gpsAccuracyM = 1f),
                    ),
                    integrityToken = null,
                )
            }
        }

    @Test
    public fun `transitionStatus network failure — writes PendingTransitionEntity to Room`(): Unit =
        runTest {
            coEvery { api.transitionStatus(any(), any(), any()) } throws RuntimeException("network error")

            val result = repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            assertThat(result.isFailure).isTrue()
            coVerify(exactly = 1) { dao.insert(match { it.bookingId == "bk-1" && it.targetStatus == "EN_ROUTE" }) }
        }

    @Test
    public fun `syncPendingTransitions retries queued entries in createdAt order`(): Unit =
        runTest {
            val entries =
                listOf(
                    PendingTransitionEntity("id-1", "bk-1", "EN_ROUTE", createdAt = 1000L),
                    PendingTransitionEntity("id-2", "bk-1", "REACHED", createdAt = 2000L),
                )
            coEvery { dao.getPending() } returns entries
            coEvery { api.transitionStatus(any(), any(), any()) } returns Response.success(aResponse("EN_ROUTE"))

            repo.syncPendingTransitions()

            val deleted = mutableListOf<String>()
            coVerify(exactly = 2) { dao.delete(capture(deleted)) }
            assertThat(deleted).containsExactly("id-1", "id-2")
        }

    @Test
    public fun `syncPendingTransitions deletes entry on 409 — stale transition`(): Unit =
        runTest {
            val entry = PendingTransitionEntity("id-1", "bk-1", "IN_PROGRESS", createdAt = 1000L)
            coEvery { dao.getPending() } returns listOf(entry)
            coEvery { api.transitionStatus(any(), any(), any()) } returns
                Response.error(409, "".toResponseBody(null))

            repo.syncPendingTransitions()

            coVerify(exactly = 1) { dao.delete("id-1") }
        }

    @Test
    public fun `hasPendingTransitions emits false when queue is empty`(): Unit =
        runTest {
            every { dao.getPendingFlow() } returns flowOf(emptyList())
            val repo2 = ActiveJobRepositoryImpl(api, dao, currentLocationProvider)

            val hasPending = repo2.hasPendingTransitions.first()

            assertThat(hasPending).isFalse()
        }

    @Test
    public fun `hasPendingTransitions emits true when queue has entries`(): Unit =
        runTest {
            every { dao.getPendingFlow() } returns
                flowOf(
                    listOf(PendingTransitionEntity("id-1", "bk-1", "EN_ROUTE", 1000L)),
                )
            val repo2 = ActiveJobRepositoryImpl(api, dao, currentLocationProvider)

            val hasPending = repo2.hasPendingTransitions.first()

            assertThat(hasPending).isTrue()
        }

    @Test
    public fun `transitionStatus HTTP error (non-exception) — returns failure without Room write`(): Unit =
        runTest {
            coEvery { api.transitionStatus(any(), any(), any()) } returns
                Response.error(400, "".toResponseBody(null))

            val result = repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            assertThat(result.isFailure).isTrue()
            coVerify(exactly = 0) { dao.insert(any()) }
        }

    @Test
    public fun `transitionStatus 2xx null body fails without outbox write`(): Unit =
        runTest {
            // Server contract violation: 2xx response with empty body. Pre-fix this NPE'd inside
            // the try block, was caught, and incorrectly enqueued a PendingTransitionEntity —
            // corrupting the offline outbox and triggering duplicate-replay storms.
            val emptyBodyResponse = mockk<Response<ActiveJobResponse>>()
            every { emptyBodyResponse.isSuccessful } returns true
            every { emptyBodyResponse.body() } returns null
            coEvery { api.transitionStatus(any(), any(), any()) } returns emptyBodyResponse

            val result = repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            assertThat(result.isFailure).isTrue()
            coVerify(exactly = 0) { dao.insert(any()) }
        }

    @Test
    public fun `syncPendingTransitions API failure — leaves entry in queue`(): Unit =
        runTest {
            val entry = PendingTransitionEntity("id-1", "bk-1", "EN_ROUTE", createdAt = 1000L)
            coEvery { dao.getPending() } returns listOf(entry)
            coEvery { api.transitionStatus(any(), any(), any()) } throws RuntimeException("network")

            repo.syncPendingTransitions()

            coVerify(exactly = 0) { dao.delete(any()) }
        }

    @Test
    public fun `syncPendingTransitions 500 error — does NOT delete entry`(): Unit =
        runTest {
            val entry = PendingTransitionEntity("id-1", "bk-1", "EN_ROUTE", createdAt = 1000L)
            coEvery { dao.getPending() } returns listOf(entry)
            coEvery { api.transitionStatus(any(), any(), any()) } returns
                Response.error(500, "".toResponseBody(null))

            repo.syncPendingTransitions()

            coVerify(exactly = 0) { dao.delete(any()) }
        }

    @Test
    public fun `startObserving primes activeJobState via one-shot fetch`(): Unit =
        runTest {
            coEvery { api.getActiveJob("bk-1") } returns Response.success(aResponse("ASSIGNED"))

            repo.startObserving("bk-1")

            assertThat(repo.activeJobState.value?.bookingId).isEqualTo("bk-1")
            assertThat(repo.activeJobState.value?.status).isEqualTo(ActiveJobStatus.ASSIGNED)
        }

    @Test
    public fun `updateFromFcm — updates activeJobState immediately`(): Unit =
        runTest {
            val job =
                ActiveJob(
                    bookingId = "bk-1",
                    customerId = "c-1",
                    serviceId = "svc-1",
                    serviceName = "AC Repair",
                    addressText = "12 Main St",
                    addressLatLng = LatLng(12.9, 77.6),
                    status = ActiveJobStatus.EN_ROUTE,
                    slotDate = "2026-05-01",
                    slotWindow = "10:00-12:00",
                )

            repo.updateFromFcm(job)

            assertThat(repo.activeJobState.value).isEqualTo(job)
        }

    @Test
    public fun `getActiveJob emits from activeJobState after updateFromFcm`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val job =
                ActiveJob(
                    bookingId = "bk-1",
                    customerId = "c-1",
                    serviceId = "svc-1",
                    serviceName = "AC Repair",
                    addressText = "12 Main St",
                    addressLatLng = LatLng(12.9, 77.6),
                    status = ActiveJobStatus.EN_ROUTE,
                    slotDate = "2026-05-01",
                    slotWindow = "10:00-12:00",
                )

            var emitted: ActiveJob? = null
            val collectJob = launch { repo.getActiveJob("bk-1").first { true }.also { emitted = it } }

            repo.updateFromFcm(job)
            collectJob.join()

            assertThat(emitted).isEqualTo(job)
        }

    @Test
    public fun `transitionStatus success — updates activeJobState`(): Unit =
        runTest {
            coEvery { api.transitionStatus(any(), any(), any()) } returns Response.success(aResponse("EN_ROUTE"))

            repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            assertThat(repo.activeJobState.value?.status).isEqualTo(ActiveJobStatus.EN_ROUTE)
        }
}
