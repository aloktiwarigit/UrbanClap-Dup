package com.homeservices.customer.ui.catalogue

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus

// ── Colour tokens (non-design-system — keep as raw values) ───────────────────
private val ActiveAccentSoft = Color(0xFFF5EFE4)
private val HighPriorityRed = Color(0xFFB5271B)
private val HighPriorityRedSoft = Color(0xFFFAECEB)

private const val SHIMMER_WIDTH_PX = 400f

/**
 * The three durable-hook sections rendered inside [CatalogueHomeScreen]'s tab-0 LazyColumn,
 * above the PromoSlider.
 *
 * Sections are hidden when empty (zero pending actions / null active booking / zero recent
 * bookings) — no placeholder text is shown (the catalogue grid fills the space naturally).
 *
 * This composable is extracted so Paparazzi can snapshot it in isolation (E11-S03 §AC-8).
 *
 * @param homeState Current durable-hooks state; pass [CustomerHomeUiState.Loading] to show
 *   skeleton placeholders, [CustomerHomeUiState.Ready] to show real content.
 * @param onPendingActionClick Called with the [PendingAction.routeUri] when a pending action
 *   card is tapped. The NavController handles the URI in [AppNavigation].
 * @param onTrackBooking  Called with [CustomerBooking.bookingId] to navigate to LiveTracking.
 * @param onPriceApproval Called with [CustomerBooking.bookingId] to navigate to PriceApproval.
 * @param onRateBooking   Called with [CustomerBooking.bookingId] to navigate to Rating.
 * @param onComplainBooking Called with [CustomerBooking.bookingId] to navigate to Complaint.
 * @param backgroundColor Background colour of the surrounding screen (used by shimmer gradient).
 */
@Composable
public fun CustomerHomeTabContent(
    homeState: CustomerHomeUiState,
    onPendingActionClick: (routeUri: String) -> Unit,
    onTrackBooking: (bookingId: String) -> Unit,
    onPriceApproval: (bookingId: String) -> Unit,
    onRateBooking: (bookingId: String) -> Unit,
    onComplainBooking: (bookingId: String) -> Unit,
    modifier: Modifier = Modifier,
    backgroundColor: Color = Color.Unspecified,
) {
    val resolvedBg = if (backgroundColor == Color.Unspecified) MaterialTheme.colorScheme.background else backgroundColor
    when (homeState) {
        is CustomerHomeUiState.Loading ->
            DurableHooksSkeleton(modifier = modifier, backgroundColor = resolvedBg)

        is CustomerHomeUiState.Ready ->
            DurableHooksReady(
                state = homeState,
                onPendingActionClick = onPendingActionClick,
                onTrackBooking = onTrackBooking,
                onPriceApproval = onPriceApproval,
                onRateBooking = onRateBooking,
                onComplainBooking = onComplainBooking,
                modifier = modifier,
            )
    }
}

// ── Ready state ────────────────────────────────────────────────────────────────

@Composable
private fun DurableHooksReady(
    state: CustomerHomeUiState.Ready,
    onPendingActionClick: (String) -> Unit,
    onTrackBooking: (String) -> Unit,
    onPriceApproval: (String) -> Unit,
    onRateBooking: (String) -> Unit,
    onComplainBooking: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        if (state.pendingActions.isNotEmpty()) {
            PendingActionsSection(
                actions = state.pendingActions,
                onActionClick = onPendingActionClick,
            )
        }
        if (state.activeBooking != null) {
            ActiveBookingSection(
                booking = state.activeBooking,
                onTrackBooking = onTrackBooking,
                onPriceApproval = onPriceApproval,
            )
        }
        if (state.recentBookings.isNotEmpty()) {
            RecentBookingsSection(
                bookings = state.recentBookings,
                onRateBooking = onRateBooking,
                onComplainBooking = onComplainBooking,
            )
        }
    }
}

// ── Section: Pending Actions ───────────────────────────────────────────────────

@Composable
private fun PendingActionsSection(
    actions: List<PendingAction>,
    onActionClick: (String) -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        SectionLabel(text = stringResource(R.string.home_pending_actions_label))
        actions.forEach { action ->
            PendingActionCard(action = action, onClick = { onActionClick(action.routeUri) })
        }
    }
}

@Composable
private fun PendingActionCard(
    action: PendingAction,
    onClick: () -> Unit,
) {
    val isHigh = action.priority == PendingActionPriority.HIGH
    val cardBg = if (isHigh) HighPriorityRedSoft else MaterialTheme.colorScheme.surface
    val accentColor = if (isHigh) HighPriorityRed else MaterialTheme.colorScheme.primary
    val borderColor = if (isHigh) HighPriorityRed.copy(alpha = 0.25f) else MaterialTheme.colorScheme.outline
    // HighPriorityRedSoft is a fixed light background — use dark foregrounds so cards stay readable
    // in dark mode (MaterialTheme.colorScheme.onSurface resolves to a light colour in dark theme).
    val titleColor = if (isHigh) Color(0xFF18231F) else MaterialTheme.colorScheme.onSurface
    val subtitleColor = if (isHigh) Color(0xFF5F6C66) else MaterialTheme.colorScheme.onSurfaceVariant

    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(cardBg)
                .border(1.dp, borderColor, RoundedCornerShape(14.dp))
                .clickable(onClick = onClick)
                .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier =
                Modifier
                    .size(36.dp)
                    .background(accentColor.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
        ) {
            Icon(
                imageVector = Icons.Default.Notifications,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(20.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = pendingActionTitle(action),
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
                color = titleColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = stringResource(R.string.home_pending_action_tap_hint),
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                color = subtitleColor,
                maxLines = 1,
            )
        }
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            tint = accentColor.copy(alpha = 0.7f),
            modifier = Modifier.size(16.dp),
        )
    }
}

@Composable
private fun pendingActionTitle(action: PendingAction): String =
    when (action.type) {
        PendingActionType.RATING_PROMPT_CUSTOMER ->
            stringResource(R.string.home_action_rate_booking)
        PendingActionType.ADDON_APPROVAL_REQUESTED ->
            stringResource(R.string.home_action_approve_addon)
        PendingActionType.COMPLAINT_UPDATE ->
            stringResource(R.string.home_action_complaint_update)
        PendingActionType.SUPPORT_FOLLOWUP ->
            stringResource(R.string.home_action_support_followup)
        else ->
            action.type.name
                .replace('_', ' ')
                .lowercase()
                .replaceFirstChar { it.uppercase() }
    }

// ── Section: Active Booking ────────────────────────────────────────────────────

private val PRICE_APPROVAL_STATUSES =
    setOf(CustomerBookingStatus.AWAITING_PRICE_APPROVAL)

@Suppress("LongMethod")
@Composable
private fun ActiveBookingSection(
    booking: CustomerBooking,
    onTrackBooking: (String) -> Unit,
    onPriceApproval: (String) -> Unit,
) {
    val isPriceApproval = booking.status in PRICE_APPROVAL_STATUSES
    val cardBg = if (isPriceApproval) ActiveAccentSoft else MaterialTheme.colorScheme.surfaceVariant
    val accentColor = if (isPriceApproval) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
    val borderColor = accentColor.copy(alpha = 0.3f)
    val statusLabel = activeBookingStatusLabel(booking.status)
    val ctaLabel =
        if (isPriceApproval) {
            stringResource(R.string.home_active_booking_approve_cta)
        } else {
            stringResource(R.string.home_active_booking_track_cta)
        }
    val onClick: () -> Unit =
        if (isPriceApproval) {
            { onPriceApproval(booking.bookingId) }
        } else {
            { onTrackBooking(booking.bookingId) }
        }

    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(cardBg)
                .border(1.dp, borderColor, RoundedCornerShape(16.dp))
                .clickable(onClick = onClick)
                .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.Default.TrackChanges,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(18.dp),
            )
            Text(
                text = stringResource(R.string.home_active_booking_label),
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, fontSize = 12.sp),
                color = accentColor,
            )
        }
        Text(
            text = booking.serviceName,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 15.sp),
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = statusLabel,
                style = MaterialTheme.typography.labelMedium.copy(fontSize = 12.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = ctaLabel,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, fontSize = 13.sp),
                    color = accentColor,
                )
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(14.dp),
                )
            }
        }
    }
}

@Composable
private fun activeBookingStatusLabel(status: CustomerBookingStatus): String =
    when (status) {
        CustomerBookingStatus.SEARCHING -> stringResource(R.string.status_finding_technician)
        CustomerBookingStatus.ASSIGNED -> stringResource(R.string.status_technician_assigned)
        CustomerBookingStatus.EN_ROUTE -> stringResource(R.string.status_technician_on_way)
        CustomerBookingStatus.REACHED -> stringResource(R.string.status_technician_arrived)
        CustomerBookingStatus.IN_PROGRESS -> stringResource(R.string.status_work_in_progress)
        CustomerBookingStatus.AWAITING_PRICE_APPROVAL -> stringResource(R.string.status_price_approval_needed)
        else -> stringResource(R.string.status_unavailable)
    }

// ── Section: Recent Bookings ───────────────────────────────────────────────────

@Composable
private fun RecentBookingsSection(
    bookings: List<CustomerBooking>,
    onRateBooking: (String) -> Unit,
    onComplainBooking: (String) -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        SectionLabel(text = stringResource(R.string.home_recent_bookings_label))
        bookings.forEach { booking ->
            RecentBookingCard(
                booking = booking,
                onRateBooking = { onRateBooking(booking.bookingId) },
                onComplainBooking = { onComplainBooking(booking.bookingId) },
            )
        }
    }
}

@Suppress("LongMethod")
@Composable
private fun RecentBookingCard(
    booking: CustomerBooking,
    onRateBooking: () -> Unit,
    onComplainBooking: () -> Unit,
) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier =
                Modifier
                    .size(36.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(10.dp)),
        ) {
            Icon(
                imageVector = Icons.Default.BookmarkBorder,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = booking.serviceName,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(11.dp),
                )
                Text(
                    text = booking.slotDate,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (!booking.ratingSubmitted) {
            Text(
                text = stringResource(R.string.home_recent_booking_rate),
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 11.sp),
                color = MaterialTheme.colorScheme.primary,
                modifier =
                    Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .clickable(onClick = onRateBooking)
                        .padding(horizontal = 8.dp, vertical = 4.dp),
            )
        } else {
            Text(
                text = stringResource(R.string.home_recent_booking_complain),
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 11.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier =
                    Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
                        .clickable(onClick = onComplainBooking)
                        .padding(horizontal = 8.dp, vertical = 4.dp),
            )
        }
    }
}

// ── Section label ──────────────────────────────────────────────────────────────

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, fontSize = 13.sp),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(horizontal = 2.dp),
    )
}

// ── Skeleton loading ───────────────────────────────────────────────────────────

@Composable
private fun DurableHooksSkeleton(
    modifier: Modifier = Modifier,
    backgroundColor: Color = Color.Unspecified,
) {
    val resolvedBg = if (backgroundColor == Color.Unspecified) MaterialTheme.colorScheme.background else backgroundColor
    val transition = rememberInfiniteTransition(label = "shimmer")
    val shimmerOffset by transition.animateFloat(
        initialValue = -1f,
        targetValue = 2f,
        animationSpec =
            infiniteRepeatable(
                animation = tween(durationMillis = 1_200, easing = LinearEasing),
                repeatMode = RepeatMode.Restart,
            ),
        label = "shimmer_offset",
    )

    @Composable
    fun shimmerBrush(): Brush {
        val shimmerColors =
            listOf(
                resolvedBg,
                MaterialTheme.colorScheme.outline.copy(alpha = 0.55f),
                resolvedBg,
            )
        return Brush.linearGradient(
            colors = shimmerColors,
            start = Offset(shimmerOffset * SHIMMER_WIDTH_PX, 0f),
            end = Offset((shimmerOffset + 1f) * SHIMMER_WIDTH_PX, 0f),
        )
    }

    Column(modifier = modifier.padding(horizontal = 16.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Skeleton pending action strip
        Box(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(shimmerBrush()),
        )
        // Skeleton active booking strip
        Box(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .height(76.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(shimmerBrush()),
        )
        // Skeleton recent booking strip × 2
        repeat(2) {
            Box(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(shimmerBrush()),
            )
        }
        Spacer(Modifier.height(4.dp))
    }
}
