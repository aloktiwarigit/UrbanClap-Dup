package com.homeservices.customer.ui.waitlist

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsScreenTitle

/**
 * Waitlist entry-point composable.
 *
 * Coordinates the ViewModel with user-entered [lat]/[lng]/[serviceId] so the
 * submission request carries the correct location context.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaitlistScreen(
    lat: Double,
    lng: Double,
    serviceId: String,
    onBack: () -> Unit,
    viewModel: WaitlistViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Derive current phone from Form state; preserve last typed value across other states.
    val phone = (uiState as? WaitlistUiState.Form)?.phone ?: ""

    Scaffold(
        topBar = {
            TopAppBar(
                title = { HsScreenTitle(text = stringResource(R.string.waitlist_title)) },
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
    ) { paddingValues ->
        WaitlistScreenContent(
            uiState = uiState,
            phone = phone,
            onPhoneChange = viewModel::onPhoneChange,
            onSubmit = { viewModel.onSubmit(lat = lat, lng = lng, serviceId = serviceId) },
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
        )
    }
}
