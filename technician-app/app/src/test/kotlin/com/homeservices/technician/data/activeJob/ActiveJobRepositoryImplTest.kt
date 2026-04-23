package com.homeservices.technician.data.activeJob

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.PendingTransitionEntity
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response

public class ActiveJobRepositoryImplTest {
    private lateinit var api: ActiveJobApiService
    private lateinit var dao: ActiveJobDao
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var repo: ActiveJobRepositoryImpl

    private fun aResponse(status: String = "ASSIGNED") =
        ActiveJobResponse(
            id = "bk-1",
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
        firebaseAuth = mockk()

        val user = mockk<FirebaseUser>()
        val tokenResult = mockk<GetTokenResult>()
        every { firebaseAuth.currentUser } returns user
        every { tokenResult.token } returns "test-token"
        every { user.getIdToken(false) } returns Tasks.forResult(tokenResult)

        every { dao.getPendingFlow() } returns emptyFlow()
        repo = ActiveJobRepositoryImpl(api, dao, firebaseAuth)
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
            val repo2 = ActiveJobRepositoryImpl(api, dao, firebaseAuth)

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
            val repo2 = ActiveJobRepositoryImpl(api, dao, firebaseAuth)

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
    public fun `transitionStatus no authenticated user — returns failure`(): Unit =
        runTest {
            every { firebaseAuth.currentUser } returns null

            val result = repo.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE)

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `syncPendingTransitions no authenticated user — skips without processing`(): Unit =
        runTest {
            every { firebaseAuth.currentUser } returns null

            repo.syncPendingTransitions()

            coVerify(exactly = 0) { api.transitionStatus(any(), any(), any()) }
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
}
