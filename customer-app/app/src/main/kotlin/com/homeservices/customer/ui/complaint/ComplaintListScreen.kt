package com.homeservices.customer.ui.complaint

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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.SentimentDissatisfied
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.designsystem.components.HsPrimaryButton

private const val STATUS_CHIP_CORNER_RADIUS = 50
private const val STATUS_CHIP_H_PADDING_DP = 10
private const val STATUS_CHIP_V_PADDING_DP = 4

private val StatusOpen = Color(0xFF1565C0)
private val StatusOpenBg = Color(0xFFE3F2FD)
private val StatusAcknowledged = Color(0xFFE65100)
private val StatusAcknowledgedBg = Color(0xFFFFF3E0)
private val StatusResolved = Color(0xFF2E7D32)
private val StatusResolvedBg = Color(0xFFE8F5E9)
private val StatusReopened = Color(0xFF6A1B9A)
private val StatusReopenedBg = Color(0xFFF3E5F5)
private val StatusDefault = Color(0xFF37474F)
private val StatusDefaultBg = Color(0xFFECEFF1)

@Composable
public fun ComplaintListScreen(
    onComplaintClick: (bookingId: String) -> Unit,
    onBack: () -> Unit,
    viewModel: ComplaintListViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurface,
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.complaint_list_title),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )
            }

            when (uiState) {
                is ComplaintListUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }

                is ComplaintListUiState.Empty -> {
                    EmptyState()
                }

                is ComplaintListUiState.Error -> {
                    ErrorState(
                        message = (uiState as ComplaintListUiState.Error).message,
                        onRetry = viewModel::retry,
                    )
                }

                is ComplaintListUiState.Ready -> {
                    val ready = uiState as ComplaintListUiState.Ready
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(ready.complaints) { complaint ->
                            ComplaintCard(
                                complaint = complaint,
                                onComplaintClick = { onComplaintClick(complaint.id) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ComplaintCard(
    complaint: ComplaintResponseDto,
    onComplaintClick: () -> Unit,
) {
    val (statusColor, statusBg, statusLabel) = statusTokens(complaint.status)

    Surface(
        onClick = onComplaintClick,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = complaint.reasonCode ?: stringResource(R.string.complaint_list_title),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                )
                Surface(
                    shape = RoundedCornerShape(STATUS_CHIP_CORNER_RADIUS),
                    color = statusBg,
                ) {
                    Text(
                        text = statusLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        modifier =
                            Modifier.padding(
                                horizontal = STATUS_CHIP_H_PADDING_DP.dp,
                                vertical = STATUS_CHIP_V_PADDING_DP.dp,
                            ),
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = complaint.createdAt,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Default.SentimentDissatisfied,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(64.dp),
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.complaint_list_empty_title),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.complaint_list_empty_body),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.error,
        )
        Spacer(Modifier.height(16.dp))
        HsPrimaryButton(text = stringResource(R.string.complaint_retry), onClick = onRetry)
    }
}

@Composable
private fun statusTokens(status: String?): Triple<Color, Color, String> =
    when (status) {
        "OPEN" ->
            Triple(
                StatusOpen,
                StatusOpenBg,
                stringResource(R.string.complaint_list_status_open),
            )
        "ACKNOWLEDGED" ->
            Triple(
                StatusAcknowledged,
                StatusAcknowledgedBg,
                stringResource(R.string.complaint_list_status_acknowledged),
            )
        "RESOLVED" ->
            Triple(
                StatusResolved,
                StatusResolvedBg,
                stringResource(R.string.complaint_list_status_resolved),
            )
        "REOPENED" ->
            Triple(
                StatusReopened,
                StatusReopenedBg,
                stringResource(R.string.complaint_list_status_reopened),
            )
        else ->
            Triple(
                StatusDefault,
                StatusDefaultBg,
                status ?: stringResource(R.string.complaint_list_status_open),
            )
    }
