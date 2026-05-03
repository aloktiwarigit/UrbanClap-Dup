package com.homeservices.customer.ui.bookings

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
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
                        text = "Bookings",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                    )
                    Text(
                        text = "Upcoming and completed service visits",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Muted,
                    )
                }
                IconButton(onClick = onRefresh) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh bookings")
                }
            }
        }

        when (uiState) {
            CustomerBookingsUiState.Loading -> item { LoadingCard() }
            CustomerBookingsUiState.Error -> item { ErrorCard(onRefresh = onRefresh) }
            is CustomerBookingsUiState.Ready ->
                if (uiState.bookings.isEmpty()) {
                    item { EmptyBookingsCard() }
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
                StatusPill(label = booking.status.label(), active = booking.status.isTrackable())
                Spacer(Modifier.weight(1f))
                Text(
                    text = formatRupees(booking.amountPaise),
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
            InfoLine(icon = Icons.Default.Payments, text = booking.paymentMethod.label())
            if (booking.status.canOpenTracking()) {
                HsPrimaryButton(
                    text = if (booking.status.isLiveTracking()) "Track technician" else "View status",
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
                text = "Could not refresh bookings",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            Text(
                text = "Your latest booking is still saved. Retry when the network is stable.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            HsSecondaryButton(text = "Retry", onClick = onRefresh, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
private fun EmptyBookingsCard() {
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
            Icon(Icons.Default.BookOnline, contentDescription = null, tint = DeepGreen)
            Text(
                text = "No bookings yet",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            Text(
                text = "Confirmed bookings will appear here with service date, status, and tracking access.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
        }
    }
}

private fun CustomerBookingStatus.label(): String =
    when (this) {
        CustomerBookingStatus.PENDING_PAYMENT -> "Payment pending"
        CustomerBookingStatus.PAID -> "Confirmed"
        CustomerBookingStatus.SEARCHING -> "Finding technician"
        CustomerBookingStatus.ASSIGNED -> "Technician assigned"
        CustomerBookingStatus.EN_ROUTE -> "En route"
        CustomerBookingStatus.REACHED -> "Arrived"
        CustomerBookingStatus.IN_PROGRESS -> "In progress"
        CustomerBookingStatus.AWAITING_PRICE_APPROVAL -> "Price approval"
        CustomerBookingStatus.COMPLETED -> "Completed"
        CustomerBookingStatus.CLOSED -> "Closed"
        CustomerBookingStatus.UNFULFILLED -> "Unfulfilled"
        CustomerBookingStatus.CUSTOMER_CANCELLED -> "Cancelled"
        CustomerBookingStatus.NO_SHOW_REDISPATCH -> "Reassigning"
        CustomerBookingStatus.UNKNOWN -> "Updated"
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

private fun BookingPaymentMethod.label(): String =
    when (this) {
        BookingPaymentMethod.RAZORPAY -> "Paid online"
        BookingPaymentMethod.CASH_ON_SERVICE -> "Cash on service"
    }

private fun formatRupees(paise: Long): String = "Rs %,.0f".format(paise / 100.0)
