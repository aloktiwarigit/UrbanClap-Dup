package com.homeservices.customer.ui.booking

import android.app.Activity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.R
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
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp),
        ) {
            when (val state = uiState) {
                is BookingUiState.Ready -> {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row {
                                Text(
                                    text = stringResource(R.string.booking_summary_slot_label) + ": ",
                                    style = MaterialTheme.typography.labelMedium,
                                )
                                Text(text = "${state.slot.date} ${state.slot.window}")
                            }
                            Spacer(Modifier.height(8.dp))
                            Row {
                                Text(
                                    text = stringResource(R.string.booking_summary_address_label) + ": ",
                                    style = MaterialTheme.typography.labelMedium,
                                )
                                Text(text = state.addressText)
                            }
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    Button(
                        onClick = onPayNow,
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                    ) {
                        Text(stringResource(R.string.booking_summary_pay_now))
                    }
                }
                is BookingUiState.CreatingBooking, is BookingUiState.AwaitingPayment,
                is BookingUiState.ConfirmingPayment,
                -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Spacer(Modifier.weight(1f))
                        CircularProgressIndicator()
                        Spacer(Modifier.weight(1f))
                    }
                }
                is BookingUiState.Error -> {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
                else -> Unit
            }
        }
    }
}
