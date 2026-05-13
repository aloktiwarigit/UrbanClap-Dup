package com.homeservices.customer.ui.dataexport

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val WarmIvory = Color(0xFFFBF7EF)
private val BrandGreen = Color(0xFF0B3D2E)
private val MutedGreen = Color(0xFFE8F1EC)
private val CardBorder = Color(0xFFDED8CD)
private val TextPrimary = Color(0xFF18231F)
private val TextSecondary = Color(0xFF5F6C66)
private val ErrorRed = Color(0xFFB00020)

private const val ERROR_SURFACE_COLOR = 0xFFFFF0F0
private const val ERROR_BORDER_COLOR = 0xFFFFCDD2

/**
 * Entry-point composable wired into the nav graph.
 *
 * Hosts the [DataExportViewModel], launches the SAF picker when the export is
 * [DataExportUiState.Ready], and shows a Snackbar on successful write.
 */
@Composable
public fun DataExportScreen(
    onBack: () -> Unit,
    viewModel: DataExportViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    val successMessage = stringResource(R.string.data_export_success_toast)
    val filenamePrefix = stringResource(R.string.data_export_filename_prefix)

    // SAF launcher — opens only when state is Ready.
    // Cancel path: uri == null → call onSaveCancelled() so the screen returns to Idle
    //              and the user can tap "Download" again instead of seeing a stuck spinner.
    // Write path:  delegate to viewModel.saveToUri() which runs on Dispatchers.IO and
    //              handles null output stream (permission revoked) and write failures.
    val safLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri: Uri? ->
            if (uri == null) {
                viewModel.onSaveCancelled()
                return@rememberLauncherForActivityResult
            }
            val bytes = (uiState as? DataExportUiState.Ready)?.jsonBytes ?: return@rememberLauncherForActivityResult
            viewModel.saveToUri(context, uri, bytes)
        }

    // Show snackbar when SAF write succeeds, then reset to Idle.
    LaunchedEffect(uiState) {
        if (uiState is DataExportUiState.Saved) {
            snackbarHostState.showSnackbar(successMessage)
            viewModel.onSaved()
        }
    }

    // When state becomes Ready, auto-launch the SAF picker
    LaunchedEffect(uiState) {
        if (uiState is DataExportUiState.Ready) {
            val timestamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
            safLauncher.launch("$filenamePrefix-$timestamp.json")
        }
    }

    Scaffold(
        containerColor = WarmIvory,
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { innerPadding ->
        DataExportContent(
            state = uiState,
            onDownloadClick = viewModel::requestExport,
            onRetry = viewModel::onRetry,
            modifier = Modifier.padding(innerPadding),
            onBack = onBack,
        )
    }
}

/**
 * Stateless content composable — usable in Paparazzi snapshot tests.
 *
 * [onBack] is optional so Paparazzi tests without back-navigation don't require it.
 */
@Composable
public fun DataExportContent(
    state: DataExportUiState,
    onDownloadClick: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
) {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        DataExportHeader(onBack = onBack)
        Spacer(Modifier.weight(1f))
        DataExportStateArea(state = state, onDownloadClick = onDownloadClick, onRetry = onRetry)
        Spacer(Modifier.height(16.dp))
    }
}

/** Top bar, hero info card, and privacy note — stateless. */
@Composable
private fun DataExportHeader(onBack: (() -> Unit)?) {
    // Top bar
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (onBack != null) {
            IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = null,
                    tint = TextPrimary,
                )
            }
            Spacer(Modifier.width(8.dp))
        }
        Text(
            text = stringResource(R.string.data_export_title),
            style =
                MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                ),
            color = TextPrimary,
        )
    }
    DataExportHeroCard()
    DataExportPrivacyNote()
}

@Composable
private fun DataExportHeroCard() {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        border = BorderStroke(1.dp, CardBorder),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(14.dp), color = MutedGreen) {
                    Box(modifier = Modifier.size(52.dp), contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.CloudDownload,
                            contentDescription = null,
                            tint = BrandGreen,
                        )
                    }
                }
                Spacer(Modifier.width(14.dp))
                Text(
                    text = stringResource(R.string.data_export_title),
                    style =
                        MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                        ),
                    color = TextPrimary,
                )
            }
            Text(
                text = stringResource(R.string.data_export_description),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
            )
        }
    }
}

@Composable
private fun DataExportPrivacyNote() {
    HsSectionCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(
                Icons.Default.Lock,
                contentDescription = null,
                tint = BrandGreen,
                modifier = Modifier.size(20.dp),
            )
            Text(
                text = stringResource(R.string.data_export_privacy_note),
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
            )
        }
    }
}

/** State-specific bottom area — CTA button, loading spinner, or error panel. */
@Composable
private fun DataExportStateArea(
    state: DataExportUiState,
    onDownloadClick: () -> Unit,
    onRetry: () -> Unit,
) {
    when (state) {
        is DataExportUiState.Idle -> {
            HsPrimaryButton(
                text = stringResource(R.string.data_export_button),
                onClick = onDownloadClick,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        is DataExportUiState.Loading -> {
            DataExportLoadingIndicator()
        }

        is DataExportUiState.Ready -> {
            // SAF picker is launched via LaunchedEffect in DataExportScreen.
            // This state is transient; show a loading indicator while the picker opens.
            DataExportLoadingIndicator()
        }

        is DataExportUiState.Saved -> {
            // Transient: DataExportScreen's LaunchedEffect shows a snackbar then calls
            // onSaved() to reset to Idle. Show the same loading indicator during the
            // brief window while the snackbar is being displayed.
            DataExportLoadingIndicator()
        }

        is DataExportUiState.Error -> {
            DataExportErrorPanel(onRetry = onRetry)
        }
    }
}

@Composable
private fun DataExportLoadingIndicator() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CircularProgressIndicator(color = BrandGreen)
        Text(
            text = stringResource(R.string.data_export_loading),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )
    }
}

@Composable
private fun DataExportErrorPanel(onRetry: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color(ERROR_SURFACE_COLOR),
        border = BorderStroke(1.dp, Color(ERROR_BORDER_COLOR)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(
                Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = ErrorRed,
                modifier = Modifier.size(20.dp),
            )
            Text(
                text = stringResource(R.string.data_export_error_unknown),
                style = MaterialTheme.typography.bodyMedium,
                color = ErrorRed,
                modifier = Modifier.weight(1f),
            )
        }
    }
    Spacer(Modifier.height(12.dp))
    HsSecondaryButton(
        text = stringResource(R.string.data_export_retry),
        onClick = onRetry,
        modifier = Modifier.fillMaxWidth(),
    )
}
