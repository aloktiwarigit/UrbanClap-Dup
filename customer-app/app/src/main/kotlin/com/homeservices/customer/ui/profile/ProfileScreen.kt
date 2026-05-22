package com.homeservices.customer.ui.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.BookOnline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Headset
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.domain.auth.model.AuthState

// ── Brand tokens (aligned with rest of design system) ────────────────────────
private val DangerRed = Color(0xFFDC2626)
private val CardShape = RoundedCornerShape(12.dp)

@Composable
internal fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    modifier: Modifier = Modifier,
    onLanguageClick: () -> Unit = {},
    onBookingsClick: () -> Unit = {},
) {
    val authState by viewModel.authState.collectAsStateWithLifecycle()
    val user = authState as? AuthState.Authenticated
    var showSignOutDialog by remember { mutableStateOf(false) }
    var showNameDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var draftName by remember(user?.displayName) { mutableStateOf(user?.displayName.orEmpty()) }
    val uriHandler = LocalUriHandler.current

    if (showSignOutDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutDialog = false },
            title = { Text("साइन आउट करें?") },
            text = { Text("क्या आप वाकई साइन आउट करना चाहते हैं?") },
            confirmButton = {
                TextButton(onClick = {
                    showSignOutDialog = false
                    viewModel.signOut()
                }) {
                    Text("हाँ, साइन आउट", color = DangerRed, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showSignOutDialog = false }) {
                    Text("रद्द करें", color = MaterialTheme.colorScheme.primary)
                }
            },
        )
    }

    if (showNameDialog) {
        AlertDialog(
            onDismissRequest = { showNameDialog = false },
            title = { Text("नाम संपादित करें") },
            text = {
                OutlinedTextField(
                    value = draftName,
                    onValueChange = { draftName = it.take(80) },
                    label = { Text("पूरा नाम") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.updateDisplayName(draftName)
                        showNameDialog = false
                    },
                    enabled = draftName.trim().isNotEmpty(),
                ) {
                    Text("सेव करें", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showNameDialog = false }) {
                    Text("रद्द करें", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
        )
    }

    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("गोपनीयता नीति") },
            text = {
                Text(
                    "आपका नाम, फ़ोन, पता और बुकिंग जानकारी सेवा देने, तकनीशियन असाइन करने, सपोर्ट और सुरक्षा समीक्षा के लिए इस्तेमाल होती है। पता केवल असाइन किए गए तकनीशियन और Owner support के साथ साझा किया जाता है।",
                )
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyDialog = false }) {
                    Text("ठीक है", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                }
            },
        )
    }

    LazyColumn(
        modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
    ) {
        // ── Avatar + name card ──────────────────────────────────────────────
        item { ProfileHeader(user = user) }

        // ── Account section ─────────────────────────────────────────────────
        item { Spacer(Modifier.height(16.dp)) }
        item {
            SectionCard(title = "अकाउंट") {
                MenuRow(
                    icon = Icons.Default.Edit,
                    label = "नाम संपादित करें",
                    sublabel = user?.displayName ?: "अभी तक सेट नहीं",
                    onClick = {
                        draftName = user?.displayName.orEmpty()
                        showNameDialog = true
                    },
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outline, thickness = 0.5.dp)
                MenuRow(
                    icon = Icons.Default.Language,
                    label = "भाषा",
                    sublabel = "हिंदी",
                    onClick = onLanguageClick,
                )
            }
        }

        // ── Bookings section ────────────────────────────────────────────────
        item { Spacer(Modifier.height(12.dp)) }
        item {
            SectionCard(title = "मेरी बुकिंग") {
                MenuRow(
                    icon = Icons.Default.BookOnline,
                    label = "बुकिंग इतिहास",
                    sublabel = "ट्रैकिंग, शिकायत और रेटिंग देखें",
                    onClick = onBookingsClick,
                )
            }
        }

        // ── Support section ─────────────────────────────────────────────────
        item { Spacer(Modifier.height(12.dp)) }
        item {
            SectionCard(title = "सहायता") {
                MenuRow(
                    icon = Icons.Default.Headset,
                    label = "ग्राहक सेवा",
                    sublabel = "1800-123-456",
                    onClick = { uriHandler.openUri("tel:1800123456") },
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outline, thickness = 0.5.dp)
                MenuRow(
                    icon = Icons.Default.Shield,
                    label = "गोपनीयता नीति",
                    sublabel = null,
                    onClick = { showPrivacyDialog = true },
                )
            }
        }

        // ── Sign out ────────────────────────────────────────────────────────
        item { Spacer(Modifier.height(12.dp)) }
        item {
            Surface(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                shape = CardShape,
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, DangerRed.copy(alpha = 0.20f)),
                onClick = { showSignOutDialog = true },
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Logout,
                        contentDescription = null,
                        tint = DangerRed,
                        modifier = Modifier.size(20.dp),
                    )
                    Text(
                        text = "साइन आउट",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = DangerRed,
                    )
                }
            }
        }
        item { Spacer(Modifier.height(80.dp)) }
    }
}

@Composable
private fun ProfileHeader(user: AuthState.Authenticated?) {
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .statusBarsPadding()
                .padding(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 18.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)) {
                Box(
                    modifier = Modifier.size(64.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = avatarInitials(user),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = user?.displayName ?: "मेहमान",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (user?.phoneLastFour != null) {
                    Text(
                        text = "+91 xxxxxx${user.phoneLastFour}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (user?.email != null) {
                    Text(
                        text = user.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    content: @Composable () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 8.dp, start = 4.dp),
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = CardShape,
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        ) {
            Column { content() }
        }
    }
}

@Composable
private fun MenuRow(
    icon: ImageVector,
    label: String,
    sublabel: String?,
    disabled: Boolean = false,
    onClick: (() -> Unit)? = null,
) {
    val contentAlpha = if (disabled) 0.45f else 1f
    val enabled = !disabled && onClick != null
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .then(if (enabled) Modifier.clickable(onClick = onClick ?: {}) else Modifier)
                .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Surface(shape = RoundedCornerShape(8.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f * contentAlpha)) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary.copy(alpha = contentAlpha),
                modifier = Modifier.padding(8.dp).size(18.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = contentAlpha),
            )
            if (sublabel != null) {
                Text(
                    text = sublabel,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = contentAlpha),
                )
            }
        }
        if (enabled) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}

private fun avatarInitials(user: AuthState.Authenticated?): String {
    val name = user?.displayName ?: return "?"
    val parts = name.trim().split(" ")
    return if (parts.size >= 2) {
        "${parts[0].first()}${parts[1].first()}".uppercase()
    } else {
        name.take(2).uppercase()
    }
}
