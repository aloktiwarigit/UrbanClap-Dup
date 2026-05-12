package com.homeservices.customer.ui.bookings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BookOnline
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import com.homeservices.customer.ui.util.formatInr
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton

private val Ink = Color(0xFF18231F)
private val Muted = Color(0xFF5F6C66)
private val DeepGreen = Color(0xFF0B3D2E)
private val SoftGreen = Color(0xFFE8F1EC)
private val Warning = Color(0xFFB68A2C)
private val WarningSoft = Color(0xFFF2E7CF)

@Composable
internal fun CustomerBookingsScreen(
    onTrackBooking: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: CustomerBookingsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current

    LaunchedEffect(viewModel) {
        viewModel.refresh()
    }
    DisposableEffect(lifecycleOwner, viewModel) {
        val observer =
            LifecycleEventObserver { _, event ->
                if (event == Lifecycle.Event.ON_RESUME) {
                    viewModel.refresh()
                }
            }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    CustomerBookingsContent(
        uiState = uiState,
        onTrackBooking = onTrackBooking,
        onRefresh = viewModel::refresh,
        modifier = modifier,
    )
}

@Composable
internal fun CustomerBookingsContent(
    uiState: CustomerBookingsUiState,
    onTrackBooking: (String) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 18.dp, top = 18.dp, end = 18.dp, bottom = 118.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stringResource(R.string.bookings_title),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                    )
                    Text(
                        text = stringResource(R.string.bookings_subtitle),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Muted,
                    )
                }
                IconButton(onClick = onRefresh) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = stringResource(R.string.bookings_refresh_desc),
                    )
                }
            }
        }

        when (uiState) {
            CustomerBookingsUiState.Loading -> item { LoadingCard() }
            CustomerBookingsUiState.Error -> item { ErrorCard(onRefresh = onRefresh) }
            is CustomerBookingsUiState.Ready ->
                if (uiState.bookings.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier.fillParentMaxSize(),
                            contentAlignment = Alignment.Center,
                        ) {
                            EmptyBookingsCard()
                        }
                    }
                } else {
                    items(uiState.bookings, key = { it.bookingId }) { booking ->
                        BookingCard(booking = booking, onTrackBooking = onTrackBooking)
                    }
                }
        }
    }
}

@Composable
private fun BookingCard(
    booking: CustomerBooking,
    onTrackBooking: (String) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        tonalElevation = 1.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StatusPill(label = booking.status.labelRes(), active = booking.status.isTrackable())
                Spacer(Modifier.weight(1f))
                Text(
                    text = formatInr(booking.amountPaise),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
            }
            Text(
                text = booking.serviceName,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Ink,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            InfoLine(icon = Icons.Default.CalendarToday, text = booking.slotDate)
            InfoLine(icon = Icons.Default.Schedule, text = booking.slotWindow)
            InfoLine(icon = Icons.Default.LocationOn, text = booking.addressText)
            InfoLine(icon = Icons.Default.Payments, text = booking.paymentMethod.labelRes())
            if (booking.status.canOpenTracking()) {
                HsPrimaryButton(
                    text =
                        if (booking.status.isLiveTracking()) {
                            stringResource(R.string.bookings_track_technician)
                        } else {
                            stringResource(R.string.bookings_view_status)
                        },
                    onClick = { onTrackBooking(booking.bookingId) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun InfoLine(
    icon: ImageVector,
    text: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Muted, modifier = Modifier.size(18.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun StatusPill(
    label: String,
    active: Boolean,
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = if (active) SoftGreen else WarningSoft,
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = if (active) DeepGreen else Warning,
        )
    }
}

@Composable
private fun LoadingCard() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            repeat(3) {
                Surface(
                    modifier = Modifier.fillMaxWidth().height(18.dp),
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                ) {}
            }
        }
    }
}

@Composable
private fun ErrorCard(onRefresh: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        tonalElevation = 1.dp,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = stringResource(R.string.bookings_error_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            Text(
                text = stringResource(R.string.bookings_error_body),
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            HsSecondaryButton(
                text = stringResource(R.string.bookings_retry),
                onClick = onRefresh,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun EmptyBookingsCard() {
    Column(
        modifier = Modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier =
                Modifier
                    .size(56.dp)
                    .background(SoftGreen, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.BookOnline,
                contentDescription = null,
                tint = DeepGreen,
                modifier = Modifier.size(28.dp),
            )
        }
        Text(
            text = stringResource(R.string.bookings_no_bookings),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = Ink,
        )
        Text(
            text = stringResource(R.string.bookings_no_bookings_body),
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun CustomerBookingStatus.labelRes(): String =
    when (this) {
        CustomerBookingStatus.PENDING_PAYMENT -> stringResource(R.string.booking_status_pending_payment)
        CustomerBookingStatus.PAID -> stringResource(R.string.booking_status_paid)
        CustomerBookingStatus.SEARCHING -> stringResource(R.string.booking_status_searching)
        CustomerBookingStatus.ASSIGNED -> stringResource(R.string.booking_status_assigned)
        CustomerBookingStatus.EN_ROUTE -> stringResource(R.string.booking_status_en_route)
        CustomerBookingStatus.REACHED -> stringResource(R.string.booking_status_reached)
        CustomerBookingStatus.IN_PROGRESS -> stringResource(R.string.booking_status_in_progress)
        CustomerBookingStatus.AWAITING_PRICE_APPROVAL -> stringResource(R.string.booking_status_awaiting_price_approval)
        CustomerBookingStatus.COMPLETED -> stringResource(R.string.booking_status_completed)
        CustomerBookingStatus.CLOSED -> stringResource(R.string.booking_status_closed)
        CustomerBookingStatus.UNFULFILLED -> stringResource(R.string.booking_status_unfulfilled)
        CustomerBookingStatus.CUSTOMER_CANCELLED -> stringResource(R.string.booking_status_cancelled)
        CustomerBookingStatus.NO_SHOW_REDISPATCH -> stringResource(R.string.booking_status_reassigning)
        CustomerBookingStatus.UNKNOWN -> stringResource(R.string.booking_status_updated)
    }

private fun CustomerBookingStatus.canOpenTracking(): Boolean =
    this in
        setOf(
            CustomerBookingStatus.PAID,
            CustomerBookingStatus.SEARCHING,
            CustomerBookingStatus.ASSIGNED,
            CustomerBookingStatus.EN_ROUTE,
            CustomerBookingStatus.REACHED,
            CustomerBookingStatus.IN_PROGRESS,
            CustomerBookingStatus.AWAITING_PRICE_APPROVAL,
            CustomerBookingStatus.NO_SHOW_REDISPATCH,
        )

private fun CustomerBookingStatus.isTrackable(): Boolean =
    this in
        setOf(
            CustomerBookingStatus.ASSIGNED,
            CustomerBookingStatus.EN_ROUTE,
            CustomerBookingStatus.REACHED,
            CustomerBookingStatus.IN_PROGRESS,
            CustomerBookingStatus.AWAITING_PRICE_APPROVAL,
        )

private fun CustomerBookingStatus.isLiveTracking(): Boolean =
    this in
        setOf(
            CustomerBookingStatus.EN_ROUTE,
            CustomerBookingStatus.REACHED,
            CustomerBookingStatus.IN_PROGRESS,
        )

@Composable
private fun BookingPaymentMethod.labelRes(): String =
    when (this) {
        BookingPaymentMethod.RAZORPAY -> stringResource(R.string.payment_method_online)
        BookingPaymentMethod.CASH_ON_SERVICE -> stringResource(R.string.payment_method_cash)
    }
