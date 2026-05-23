package com.homeservices.technician.ui.deleteaccount

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.homeservices.technician.R
import com.homeservices.technician.data.auth.SessionManager
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
public fun AccountDeletedScreen(
    scheduledAt: String,
    sessionManager: SessionManager,
) {
    val scope = rememberCoroutineScope()
    val formattedDate = rememberFormattedDate(scheduledAt)

    AccountDeletedScreenContent(
        formattedDate = formattedDate,
        deletionRequestUrl = stringResource(R.string.deletion_request_url),
        // clearSession() triggers AuthState.Unauthenticated; AppNavigation observer
        // navigates to "auth" and pops the back stack automatically.
        onDone = { scope.launch { sessionManager.clearSession() } },
    )
}

@Composable
internal fun AccountDeletedScreenContent(
    formattedDate: String,
    deletionRequestUrl: String,
    onDone: () -> Unit,
) {
    val context = LocalContext.current

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Default.DeleteForever,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(64.dp),
        )
        Spacer(Modifier.height(24.dp))
        Text(
            text = stringResource(R.string.account_deleted_title),
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.account_deleted_body, formattedDate),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(16.dp))
        Card(
            colors =
                CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                ),
        ) {
            Text(
                text = stringResource(R.string.account_deleted_revocation_hint, formattedDate),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(16.dp),
                textAlign = TextAlign.Center,
            )
        }
        Spacer(Modifier.height(16.dp))
        TextButton(
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse(deletionRequestUrl)),
                )
            },
        ) {
            Text(stringResource(R.string.account_deleted_web_form_label))
        }
        Spacer(Modifier.height(32.dp))
        Button(onClick = onDone) {
            Text(stringResource(R.string.account_deleted_done))
        }
    }
}

@Composable
private fun rememberFormattedDate(isoTimestamp: String): String =
    try {
        val instant = Instant.parse(isoTimestamp)
        val formatter =
            DateTimeFormatter
                .ofLocalizedDate(FormatStyle.LONG)
                .withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (_: Exception) {
        isoTimestamp
    }
