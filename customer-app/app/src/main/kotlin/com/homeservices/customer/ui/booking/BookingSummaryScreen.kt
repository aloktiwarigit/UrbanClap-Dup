package com.homeservices.customer.ui.booking

import android.app.Activity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsInfoRow
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsSkeletonBlock
import com.razorpay.Checkout
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun BookingSummaryScreen(
    viewModel: BookingViewModel,
    serviceId: String,
    categoryId: String,
    onConfirmed: (bookingId: String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val activity = LocalContext.current as? Activity

    LaunchedEffect(uiState) {
        if (uiState is BookingUiState.AwaitingPayment && activity != null) {
            val state = uiState as BookingUiState.AwaitingPayment
            val checkout = Checkout()
            checkout.setKeyID(BuildConfig.RAZORPAY_KEY_ID)
            val options =
                JSONObject().apply {
                    put("order_id", state.razorpayOrderId)
                    put("amount", state.amount)
                    put("currency", "INR")
                }
            checkout.open(activity, options)
        }
        if (uiState is BookingUiState.BookingConfirmed) {
            onConfirmed((uiState as BookingUiState.BookingConfirmed).bookingId)
        }
    }

    BookingSummaryContent(
        uiState = uiState,
        onPayNow = { viewModel.startPayment(serviceId, categoryId) },
        onBack = onBack,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun BookingSummaryContent(
    uiState: BookingUiState,
    onPayNow: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.booking_summary_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.service_detail_back_desc),
                        )
                    }
                },
            )
        },
        modifier = modifier,
    ) { innerPadding ->
        Box(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
        ) {
            when (val state = uiState) {
                is BookingUiState.Ready -> ReadySummary(state = state, onPayNow = onPayNow)
                is BookingUiState.CreatingBooking,
                is BookingUiState.AwaitingPayment,
                is BookingUiState.ConfirmingPayment,
                -> BookingProgress()
                is BookingUiState.Error -> BookingError(message = state.message)
                else -> Unit
            }
        }
    }
}

@Composable
private fun ReadySummary(
    state: BookingUiState.Ready,
    onPayNow: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            text = stringResource(R.string.booking_summary_heading),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = stringResource(R.string.booking_summary_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(18.dp))
        HsSectionCard {
            SummaryRow(
                label = stringResource(R.string.booking_summary_slot_label),
                value = "${state.slot.date} ${state.slot.window}",
            )
            SummaryRow(
                label = stringResource(R.string.booking_summary_address_label),
                value = state.addressText,
            )
        }
        Spacer(Modifier.height(12.dp))
        HsSectionCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = MaterialTheme.colorScheme.primaryContainer,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Lock,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(8.dp),
                    )
                }
                Column(modifier = Modifier.padding(start = 12.dp)) {
                    Text(
                        text = stringResource(R.string.booking_payment_secure_title),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = stringResource(R.string.booking_payment_secure_body),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        Spacer(Modifier.weight(1f))
        HsPrimaryButton(
            text = stringResource(R.string.booking_summary_pay_now),
            onClick = onPayNow,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .height(56.dp),
        )
    }
}

@Composable
private fun SummaryRow(
    label: String,
    value: String,
) {
    HsInfoRow(label = label, value = value)
}

@Composable
private fun BookingProgress() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        HsSkeletonBlock(widthFraction = 0.72f, height = 28.dp)
        HsSkeletonBlock(widthFraction = 0.9f, height = 16.dp)
        repeat(3) {
            Surface(
                modifier = Modifier.fillMaxWidth().height(92.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant,
            ) {}
        }
    }
}

@Composable
private fun BookingError(message: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.booking_error_title),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
