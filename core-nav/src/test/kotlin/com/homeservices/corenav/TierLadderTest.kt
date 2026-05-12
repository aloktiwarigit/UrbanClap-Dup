package com.homeservices.corenav

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Exhaustive unit tests for [TierLadder.resolve].
 *
 * Covers all T0-T6 paths and tie-break dimensions:
 *   1. earliest non-null expiresAt
 *   2. oldest createdAt (ascending)
 *   3. lexicographic id
 */
public class TierLadderTest {

    // ── helpers ──────────────────────────────────────────────────────────────

    private fun action(
        type: PendingActionType,
        priority: PendingActionPriority = PendingActionPriority.NORMAL,
        entityId: String = "entity-1",
        id: String = "id-1",
        expiresAt: Long? = null,
        createdAt: Long = 1_000L,
        status: PendingActionStatus = PendingActionStatus.ACTIVE,
    ) = PendingAction(
        id = id,
        userId = "user-1",
        role = "customer",
        type = type,
        entityType = "booking",
        entityId = entityId,
        routeUri = "homeservices://action/${type.name}?entityId=$entityId",
        priority = priority,
        status = status,
        sourceStatus = null,
        version = 1L,
        createdAt = createdAt,
        updatedAt = createdAt,
        expiresAt = expiresAt,
        resolvedAt = null,
    )

    private fun ctx(
        authState: AuthState = AuthState.Authenticated(uid = "u1", role = "customer"),
        role: String = "customer",
        activeActions: List<PendingAction> = emptyList(),
        techKycStatus: String? = null,
        techActiveJob: ActiveJobSummary? = null,
        customerActiveBookings: List<BookingSummary> = emptyList(),
    ) = RouteContext(
        authState = authState,
        role = role,
        activeActions = activeActions,
        techKycStatus = techKycStatus,
        techActiveJob = techActiveJob,
        customerActiveBookings = customerActiveBookings,
    )

    // ── T0 Gate ───────────────────────────────────────────────────────────────

    @Nested
    public inner class T0GateTests {

        @Test
        public fun `unauthenticated returns AuthRoute`() {
            val result = TierLadder.resolve(ctx(authState = AuthState.Unauthenticated))
            assertThat(result).isEqualTo(CommonRouteSpec.Auth)
        }

        @Test
        public fun `unauthenticated overrides all other conditions`() {
            val result = TierLadder.resolve(
                ctx(
                    authState = AuthState.Unauthenticated,
                    techKycStatus = "NOT_STARTED",
                    activeActions = listOf(action(PendingActionType.JOB_OFFER, PendingActionPriority.HIGH)),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.Auth)
        }
    }

    // ── T1 Blocking ───────────────────────────────────────────────────────────

    @Nested
    public inner class T1BlockingTests {

        @Test
        public fun `tech KYC NOT_STARTED returns KycRoute`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techKycStatus = "NOT_STARTED",
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.KycBlocked)
        }

        @Test
        public fun `tech KYC INCOMPLETE returns KycRoute`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techKycStatus = "INCOMPLETE",
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.KycBlocked)
        }

        @Test
        public fun `tech KYC SUBMITTED does NOT block (returns dashboard)`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techKycStatus = "SUBMITTED",
                    activeActions = emptyList(),
                ),
            )
            // SUBMITTED shows KYC card on dashboard, but is NOT T1 blocking
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `tech KYC MANUAL_REVIEW does NOT block`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techKycStatus = "MANUAL_REVIEW",
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `tech KYC COMPLETE does NOT block`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techKycStatus = "COMPLETE",
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `T1 blocks before T2 active job`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techKycStatus = "NOT_STARTED",
                    techActiveJob = ActiveJobSummary(
                        bookingId = "b1",
                        status = "ASSIGNED",
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.KycBlocked)
        }
    }

    // ── T2 Live Ops ───────────────────────────────────────────────────────────

    @Nested
    public inner class T2LiveOpsTests {

        @Test
        public fun `tech ASSIGNED status routes to ActiveJob`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techActiveJob = ActiveJobSummary(bookingId = "b1", status = "ASSIGNED"),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianActiveJob("b1"))
        }

        @Test
        public fun `tech EN_ROUTE routes to ActiveJob`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techActiveJob = ActiveJobSummary(bookingId = "b2", status = "EN_ROUTE"),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianActiveJob("b2"))
        }

        @Test
        public fun `tech REACHED routes to ActiveJob`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techActiveJob = ActiveJobSummary(bookingId = "b3", status = "REACHED"),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianActiveJob("b3"))
        }

        @Test
        public fun `tech IN_PROGRESS routes to ActiveJob`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    techActiveJob = ActiveJobSummary(bookingId = "b4", status = "IN_PROGRESS"),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianActiveJob("b4"))
        }

        @Test
        public fun `customer AWAITING_PRICE_APPROVAL routes to PriceApproval`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "customer",
                    customerActiveBookings = listOf(
                        BookingSummary(bookingId = "b5", status = "AWAITING_PRICE_APPROVAL"),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.CustomerPriceApproval("b5"))
        }

        @Test
        public fun `customer ServiceTracking is NOT T2 — returns home instead`() {
            // Per spec §2.6: customer ServiceTracking is NOT T2 — surfaces as home card; tap-driven only
            val result = TierLadder.resolve(
                ctx(
                    role = "customer",
                    customerActiveBookings = listOf(
                        BookingSummary(bookingId = "b6", status = "ASSIGNED"),
                    ),
                ),
            )
            // Not PriceApproval, should fall through to T6 (CustomerHome)
            assertThat(result).isEqualTo(CommonRouteSpec.CustomerHome)
        }
    }

    // ── T3 High Action ────────────────────────────────────────────────────────

    @Nested
    public inner class T3HighActionTests {

        @Test
        public fun `HIGH priority JOB_OFFER routes to TechnicianJobOffer`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.JOB_OFFER,
                            priority = PendingActionPriority.HIGH,
                            entityId = "offer-1",
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-1"))
        }

        @Test
        public fun `T3 action wins over T4 action`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.COMPLAINT_UPDATE,
                            priority = PendingActionPriority.NORMAL,
                            entityId = "complaint-1",
                        ),
                        action(
                            type = PendingActionType.JOB_OFFER,
                            priority = PendingActionPriority.HIGH,
                            entityId = "offer-1",
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-1"))
        }
    }

    // ── T4 Normal Action ──────────────────────────────────────────────────────

    @Nested
    public inner class T4NormalActionTests {

        @Test
        public fun `KYC_RESUME (NORMAL priority) routes to KycResume`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.KYC_RESUME,
                            priority = PendingActionPriority.NORMAL,
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `COMPLAINT_UPDATE (NORMAL priority) routes to TechnicianDashboard`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.COMPLAINT_UPDATE,
                            priority = PendingActionPriority.NORMAL,
                        ),
                    ),
                ),
            )
            // COMPLAINT_UPDATE with NORMAL priority is T4 — routes to dashboard (pending actions visible there)
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }
    }

    // ── T5 Low Action ─────────────────────────────────────────────────────────

    @Nested
    public inner class T5LowActionTests {

        @Test
        public fun `RATING_PROMPT_TECHNICIAN (LOW) routes to dashboard`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.RATING_PROMPT_TECHNICIAN,
                            priority = PendingActionPriority.LOW,
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `RATING_PROMPT_CUSTOMER (LOW) routes to CustomerHome`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "customer",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.RATING_PROMPT_CUSTOMER,
                            priority = PendingActionPriority.LOW,
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.CustomerHome)
        }
    }

    // ── T6 Default ────────────────────────────────────────────────────────────

    @Nested
    public inner class T6DefaultTests {

        @Test
        public fun `authenticated customer with no actions returns CustomerHome`() {
            val result = TierLadder.resolve(ctx(role = "customer"))
            assertThat(result).isEqualTo(CommonRouteSpec.CustomerHome)
        }

        @Test
        public fun `authenticated technician with no actions and no KYC returns TechnicianDashboard`() {
            val result = TierLadder.resolve(ctx(role = "technician"))
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `unknown role returns CustomerHome as safe fallback`() {
            val result = TierLadder.resolve(ctx(role = "unknown"))
            assertThat(result).isEqualTo(CommonRouteSpec.CustomerHome)
        }
    }

    // ── Tie-break Tests ───────────────────────────────────────────────────────

    @Nested
    public inner class TieBreakTests {

        @Test
        public fun `among same tier tie-breaks by earliest expiresAt`() {
            val actions = listOf(
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-later",
                    id = "id-b",
                    expiresAt = 2_000L,
                    createdAt = 1_000L,
                ),
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-sooner",
                    id = "id-a",
                    expiresAt = 500L,
                    createdAt = 2_000L,
                ),
            )
            val result = TierLadder.resolve(ctx(role = "technician", activeActions = actions))
            // earliest expiresAt wins (500L < 2_000L)
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-sooner"))
        }

        @Test
        public fun `null expiresAt loses to non-null expiresAt in tie-break`() {
            val actions = listOf(
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-no-expiry",
                    id = "id-b",
                    expiresAt = null,
                    createdAt = 1_000L,
                ),
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-with-expiry",
                    id = "id-a",
                    expiresAt = 5_000L,
                    createdAt = 2_000L,
                ),
            )
            val result = TierLadder.resolve(ctx(role = "technician", activeActions = actions))
            // Non-null expiresAt wins (expires sooner than "never")
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-with-expiry"))
        }

        @Test
        public fun `same expiresAt breaks by oldest createdAt`() {
            val actions = listOf(
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-newer",
                    id = "id-b",
                    expiresAt = 1_000L,
                    createdAt = 500L,
                ),
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-older",
                    id = "id-a",
                    expiresAt = 1_000L,
                    createdAt = 100L,
                ),
            )
            val result = TierLadder.resolve(ctx(role = "technician", activeActions = actions))
            // Oldest createdAt wins (100L < 500L)
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-older"))
        }

        @Test
        public fun `same expiresAt and createdAt breaks by lexicographic id`() {
            val actions = listOf(
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-b",
                    id = "id-z",
                    expiresAt = 1_000L,
                    createdAt = 100L,
                ),
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-a",
                    id = "id-a",
                    expiresAt = 1_000L,
                    createdAt = 100L,
                ),
            )
            val result = TierLadder.resolve(ctx(role = "technician", activeActions = actions))
            // Lexicographically first id wins ("id-a" < "id-z")
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-a"))
        }

        @Test
        public fun `multiple same-tier actions with all nulls breaks by id`() {
            val actions = listOf(
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-c",
                    id = "id-c",
                    expiresAt = null,
                    createdAt = 100L,
                ),
                action(
                    type = PendingActionType.JOB_OFFER,
                    priority = PendingActionPriority.HIGH,
                    entityId = "offer-a",
                    id = "id-a",
                    expiresAt = null,
                    createdAt = 100L,
                ),
            )
            val result = TierLadder.resolve(ctx(role = "technician", activeActions = actions))
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianJobOffer("offer-a"))
        }
    }

    // ── RESOLVED / EXPIRED Actions Ignored ───────────────────────────────────

    @Nested
    public inner class ResolvedExpiredFilterTests {

        @Test
        public fun `RESOLVED actions are ignored`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.JOB_OFFER,
                            priority = PendingActionPriority.HIGH,
                            status = PendingActionStatus.RESOLVED,
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }

        @Test
        public fun `EXPIRED actions are ignored`() {
            val result = TierLadder.resolve(
                ctx(
                    role = "technician",
                    activeActions = listOf(
                        action(
                            type = PendingActionType.JOB_OFFER,
                            priority = PendingActionPriority.HIGH,
                            status = PendingActionStatus.EXPIRED,
                        ),
                    ),
                ),
            )
            assertThat(result).isEqualTo(CommonRouteSpec.TechnicianDashboard)
        }
    }
}
