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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
import com.homeservices.designsystem.components.HsInfoRow
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsSkeletonBlock
import com.razorpay.Checkout
import org.json.JSONObject

private const val PAISE_PER_RUPEE = 100L

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun BookingSummaryScreen(
    viewModel: BookingViewModel,
    serviceId: String,
    categoryId: String,
    onConfirmed: (bookingId: String, appliedCredit: Int) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val walletBalanceInPaise by viewModel.walletBalanceInPaise.collectAsStateWithLifecycle()
    val applyCreditToggle by viewModel.applyCreditToggle.collectAsStateWithLifecycle()
    val showWomenSafeToggle by viewModel.showWomenSafeToggle.collectAsStateWithLifecycle()
    val preferFemaleTechnician by viewModel.preferFemaleTechnician.collectAsStateWithLifecycle()
    val activity = LocalContext.current as? Activity
    val snackbarHostState = remember { SnackbarHostState() }

    // Debug-only guard: warn developer if RAZORPAY_KEY_ID is blank.
    // Release builds are protected at assemble time via the Gradle guard in build.gradle.kts.
    if (BuildConfig.DEBUG) {
        LaunchedEffect(Unit) {
            if (BuildConfig.RAZORPAY_KEY_ID.isBlank()) {
                snackbarHostState.showSnackbar(
                    "RAZORPAY_KEY_ID env var is blank — payment will fail. Set it in local.properties or env.",
                )
            }
        }
    }

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
            val confirmed = uiState as BookingUiState.BookingConfirmed
            onConfirmed(confirmed.bookingId, confirmed.appliedCreditAmount)
        }
    }

    BookingSummaryContent(
        uiState = uiState,
        walletBalanceInPaise = walletBalanceInPaise,
        applyCreditToggle = applyCreditToggle,
        onApplyCreditChanged = viewModel::setApplyCreditToggle,
        showWomenSafeToggle = showWomenSafeToggle,
        preferFemaleTechnician = preferFemaleTechnician,
        onPreferFemaleChange = viewModel::setPreferFemaleTechnician,
        snackbarHostState = snackbarHostState,
        onCreateBooking = { paymentMethod -> viewModel.startBooking(serviceId, categoryId, paymentMethod) },
        onRetryPayment = viewModel::retryPayment,
        onCancelPaymentFailed = viewModel::cancelPaymentFailed,
        onRetryNetworkError = viewModel::retryNetworkError,
        onBack = onBack,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun BookingSummaryContent(
    uiState: BookingUiState,
    onCreateBooking: (BookingPaymentMethod) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    walletBalanceInPaise: Long = 0L,
    applyCreditToggle: Boolean = false,
    onApplyCreditChanged: (Boolean) -> Unit = {},
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    onRetryPayment: () -> Unit = {},
    onCancelPaymentFailed: () -> Unit = {},
    showWomenSafeToggle: Boolean = false,
    preferFemaleTechnician: Boolean = false,
    onPreferFemaleChange: (Boolean) -> Unit = {},
    onRetryNetworkError: () -> Unit = {},
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
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier,
    ) { innerPadding ->
        Box(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
        ) {
            when (val state = uiState) {
                is BookingUiState.Ready ->
                    ReadySummary(
                        state = state,
                        onCreateBooking = { onCreateBooking(BookingPaymentMethod.CASH_ON_SERVICE) },
                        walletBalanceInPaise = walletBalanceInPaise,
                        applyCreditToggle = applyCreditToggle,
                        onApplyCreditChanged = onApplyCreditChanged,
                        showWomenSafeToggle = showWomenSafeToggle,
                        preferFemaleTechnician = preferFemaleTechnician,
                        onPreferFemaleChange = onPreferFemaleChange,
                    )
                is BookingUiState.CreatingBooking,
                is BookingUiState.AwaitingPayment,
                is BookingUiState.ConfirmingPayment,
                -> BookingProgress()
                is BookingUiState.PaymentFailed ->
                    PaymentFailedCard(
                        state = state,
                        onRetry = onRetryPayment,
                        onCancel = onCancelPaymentFailed,
                    )
                is BookingUiState.NetworkError ->
                    NetworkErrorCard(message = state.message, onRetry = onRetryNetworkError)
                is BookingUiState.Error -> BookingError(message = state.message)
                else -> Unit
            }
        }
    }
}

@Suppress("LongMethod")
@Composable
private fun ReadySummary(
    state: BookingUiState.Ready,
    onCreateBooking: () -> Unit,
    walletBalanceInPaise: Long = 0L,
    applyCreditToggle: Boolean = false,
    onApplyCreditChanged: (Boolean) -> Unit = {},
    showWomenSafeToggle: Boolean = false,
    preferFemaleTechnician: Boolean = false,
    onPreferFemaleChange: (Boolean) -> Unit = {},
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Column(
            modifier =
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
        ) {
            HsScreenTitle(
                text = stringResource(R.string.booking_summary_heading),
                style = MaterialTheme.typography.headlineSmall,
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
            if (walletBalanceInPaise > 0L) {
                Spacer(Modifier.height(12.dp))
                CreditToggleRow(
                    walletBalanceInPaise = walletBalanceInPaise,
                    applyCreditToggle = applyCreditToggle,
                    onApplyCreditChanged = onApplyCreditChanged,
                )
            }
            if (showWomenSafeToggle) {
                Spacer(Modifier.height(12.dp))
                WomenSafeFilterToggle(
                    checked = preferFemaleTechnician,
                    onCheckedChange = onPreferFemaleChange,
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
                            text = stringResource(R.string.booking_payment_cash_note_title),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = stringResource(R.string.booking_payment_cash_note_body),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }
        Spacer(Modifier.height(14.dp))
        HsPrimaryButton(
            text = stringResource(R.string.booking_summary_book_cash),
            onClick = onCreateBooking,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .height(56.dp),
        )
    }
}

@Composable
private fun CreditToggleRow(
    walletBalanceInPaise: Long,
    applyCreditToggle: Boolean,
    onApplyCreditChanged: (Boolean) -> Unit,
) {
    // Display balance as rounded rupees (paise / PAISE_PER_RUPEE)
    val rupees = walletBalanceInPaise / PAISE_PER_RUPEE
    HsSectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = stringResource(R.string.wallet_apply_credit_toggle, rupees),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                )
                Switch(
                    checked = applyCreditToggle,
                    onCheckedChange = onApplyCreditChanged,
                )
            }
            if (applyCreditToggle) {
                // Display only — actual total is server-authoritative via response.amount
                Text(
                    text = stringResource(R.string.wallet_credit_original_price, rupees),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textDecoration = TextDecoration.LineThrough,
                )
            }
        }
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
private fun paymentErrorStringRes(errorCode: String): Int =
    when (errorCode) {
        RazorpayErrorCode.PAYMENT_CANCELLED -> R.string.payment_error_payment_cancelled
        RazorpayErrorCode.NETWORK_ERROR -> R.string.payment_error_network_error
        RazorpayErrorCode.BAD_REQUEST_ERROR -> R.string.payment_error_bad_request_error
        else -> R.string.payment_error_default
    }

@Composable
private fun PaymentFailedCard(
    state: BookingUiState.PaymentFailed,
    onRetry: () -> Unit,
    onCancel: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Surface(
            shape = MaterialTheme.shapes.medium,
            color = MaterialTheme.colorScheme.errorContainer,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Warning,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onErrorContainer,
                )
                Text(
                    text = stringResource(R.string.payment_failed_title),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                )
                Text(
                    text = stringResource(paymentErrorStringRes(state.errorCode)),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                )
            }
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) {
            Text(stringResource(R.string.payment_failed_retry))
        }
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = onCancel,
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) {
            Text(stringResource(R.string.payment_failed_cancel))
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

@Composable
private fun NetworkErrorCard(
    message: String,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.booking_network_error_title),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(20.dp))
        HsPrimaryButton(
            text = stringResource(R.string.booking_network_error_retry),
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
