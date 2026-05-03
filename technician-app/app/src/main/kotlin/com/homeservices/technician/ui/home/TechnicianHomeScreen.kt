package com.homeservices.technician.ui.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.R
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import com.homeservices.technician.domain.jobs.model.TechnicianBooking
import com.homeservices.technician.domain.jobs.model.TechnicianBookingStatus
import com.homeservices.technician.ui.earnings.EarningsUiState
import com.homeservices.technician.ui.earnings.EarningsViewModel
import kotlinx.coroutines.launch

private val WorkBackground = Color(0xFFFBF7EF)
private val Ink = Color(0xFF18231F)
private val Muted = Color(0xFF5F6C66)
private val DeepGreen = Color(0xFF0B3D2E)
private val SoftGreen = Color(0xFFE8F1EC)
private val Warning = Color(0xFFB68A2C)
private val WarningSoft = Color(0xFFF2E7CF)
private val Line = Color(0xFFDED8CD)

@Composable
internal fun TechnicianHomeScreen(
    authState: AuthState,
    onOpenJob: (String) -> Unit,
    onViewRatings: () -> Unit,
    onPayoutSettings: () -> Unit,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TechnicianHomeViewModel = hiltViewModel(),
    earningsViewModel: EarningsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val earningsState by earningsViewModel.uiState.collectAsStateWithLifecycle()
    var selectedTab by rememberSaveable { mutableStateOf(TechTab.Today) }
    var isOnline by rememberSaveable { mutableStateOf(true) }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        modifier = modifier,
        containerColor = WorkBackground,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            TechnicianBottomBar(
                selected = selectedTab,
                onSelected = { selectedTab = it },
            )
        },
    ) { padding ->
        Box(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(padding),
        ) {
            when (selectedTab) {
                TechTab.Today ->
                    TodayScreen(
                        authState = authState,
                        uiState = uiState,
                        earningsState = earningsState,
                        isOnline = isOnline,
                        onOnlineChange = {
                            isOnline = it
                            scope.launch {
                                snackbarHostState.showSnackbar(
                                    if (it) {
                                        "You are online for new jobs"
                                    } else {
                                        "You are offline"
                                    },
                                )
                            }
                        },
                        onOpenJob = onOpenJob,
                        onRefresh = viewModel::refresh,
                    )
                TechTab.Jobs ->
                    JobsScreen(
                        uiState = uiState,
                        onOpenJob = onOpenJob,
                        onRefresh = viewModel::refresh,
                    )
                TechTab.Earnings ->
                    EarningsTabScreen(
                        uiState = earningsState,
                        onRetry = earningsViewModel::refresh,
                        onViewRatings = onViewRatings,
                        onPayoutSettings = onPayoutSettings,
                    )
                TechTab.Availability ->
                    AvailabilityScreen(
                        isOnline = isOnline,
                        onOnlineChange = {
                            isOnline = it
                            scope.launch {
                                snackbarHostState.showSnackbar("Availability updated on this device")
                            }
                        },
                    )
                TechTab.Profile ->
                    ProfileScreen(
                        authState = authState,
                        onViewRatings = onViewRatings,
                        onPayoutSettings = onPayoutSettings,
                        onSignOut = onSignOut,
                    )
            }
        }
    }
}

private enum class TechTab(
    val label: String,
    val icon: ImageVector,
) {
    Today("Today", Icons.Default.Home),
    Jobs("Jobs", Icons.Default.Work),
    Earnings("Pay", Icons.Default.Payments),
    Availability("Slots", Icons.Default.Tune),
    Profile("Profile", Icons.Default.Person),
}

@Composable
private fun TechnicianBottomBar(
    selected: TechTab,
    onSelected: (TechTab) -> Unit,
) {
    Surface(
        modifier =
            Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
        shape = RoundedCornerShape(28.dp),
        color = Color.White.copy(alpha = 0.94f),
        tonalElevation = 10.dp,
        shadowElevation = 16.dp,
    ) {
        NavigationBar(
            containerColor = Color.Transparent,
            tonalElevation = 0.dp,
        ) {
            TechTab.entries.forEach { tab ->
                NavigationBarItem(
                    selected = selected == tab,
                    onClick = { onSelected(tab) },
                    icon = {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.label,
                        )
                    },
                    label = { Text(tab.label, maxLines = 1) },
                    colors =
                        NavigationBarItemDefaults.colors(
                            selectedIconColor = DeepGreen,
                            selectedTextColor = Ink,
                            indicatorColor = SoftGreen,
                            unselectedIconColor = Muted,
                            unselectedTextColor = Muted,
                        ),
                )
            }
        }
    }
}

@Composable
private fun TodayScreen(
    authState: AuthState,
    uiState: TechnicianHomeUiState,
    earningsState: EarningsUiState,
    isOnline: Boolean,
    onOnlineChange: (Boolean) -> Unit,
    onOpenJob: (String) -> Unit,
    onRefresh: () -> Unit,
) {
    val bookings = (uiState as? TechnicianHomeUiState.Ready)?.bookings.orEmpty()
    val activeJob = bookings.firstOrNull { it.status.isActive() }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 18.dp, top = 18.dp, end = 18.dp, bottom = 118.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            PartnerHeader(
                authState = authState,
                isOnline = isOnline,
                onOnlineChange = onOnlineChange,
            )
        }
        item {
            NextJobHero(
                job = activeJob,
                isOnline = isOnline,
                onOpenJob = onOpenJob,
            )
        }
        item {
            QuickStatsRow(
                earningsState = earningsState,
                jobsToday = bookings.count { it.slotDate == todayIsoDate() },
                isOnline = isOnline,
            )
        }
        item {
            SectionHeader(
                title = "Today's queue",
                action = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh jobs")
                    }
                },
            )
        }
        item {
            JobsPreview(
                uiState = uiState,
                onOpenJob = onOpenJob,
                onRefresh = onRefresh,
                maxItems = 3,
            )
        }
    }
}

@Composable
private fun PartnerHeader(
    authState: AuthState,
    isOnline: Boolean,
    onOnlineChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "HomeHeroo Partner",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.ExtraBold,
                color = Ink,
            )
            Text(
                text = displayName(authState),
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
        }
        StatusPill(
            label = if (isOnline) "Online" else "Offline",
            active = isOnline,
        )
        Spacer(Modifier.width(8.dp))
        FieldSwitch(checked = isOnline, onCheckedChange = onOnlineChange)
    }
}

@Composable
private fun NextJobHero(
    job: TechnicianBooking?,
    isOnline: Boolean,
    onOpenJob: (String) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = Color.White,
        tonalElevation = 2.dp,
    ) {
        Box {
            Box(
                modifier =
                    Modifier
                        .matchParentSize()
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFFFFFFFF), Color(0xFFF0ECE2)),
                            ),
                        ),
            )
            Row(
                modifier = Modifier.padding(18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Next job",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = DeepGreen,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = job?.serviceName ?: "No active job",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text =
                            job?.let { "${it.slotDate}  ${it.slotWindow}" }
                                ?: if (isOnline) {
                                    "New offers will appear here automatically."
                                } else {
                                    "Go online when you are ready for requests."
                                },
                        style = MaterialTheme.typography.bodyMedium,
                        color = Muted,
                    )
                    Spacer(Modifier.height(14.dp))
                    if (job != null) {
                        Button(
                            onClick = { onOpenJob(job.bookingId) },
                            colors = ButtonDefaults.buttonColors(containerColor = DeepGreen),
                        ) {
                            Icon(Icons.Default.Route, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Open job")
                        }
                    } else {
                        StatusPill(
                            label = if (isOnline) "Ready for requests" else "Not accepting jobs",
                            active = isOnline,
                        )
                    }
                }
                Image(
                    painter = painterResource(R.drawable.tech_field_ac_service),
                    contentDescription = null,
                    modifier =
                        Modifier
                            .width(126.dp)
                            .aspectRatio(0.78f)
                            .clip(RoundedCornerShape(22.dp)),
                    contentScale = ContentScale.Crop,
                )
            }
        }
    }
}

@Composable
private fun QuickStatsRow(
    earningsState: EarningsUiState,
    jobsToday: Int,
    isOnline: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        StatTile(
            label = "Today",
            value =
                (earningsState as? EarningsUiState.Success)
                    ?.summary
                    ?.today
                    ?.techAmountPaise
                    ?.let(::formatRupees)
                    ?: "--",
            icon = Icons.Default.AccountBalanceWallet,
            modifier = Modifier.weight(1f),
        )
        StatTile(
            label = "Jobs",
            value = jobsToday.toString(),
            icon = Icons.Default.CalendarToday,
            modifier = Modifier.weight(1f),
        )
        StatTile(
            label = "Status",
            value = if (isOnline) "Live" else "Off",
            icon = Icons.Default.Verified,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun StatTile(
    label: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.height(94.dp),
        shape = RoundedCornerShape(18.dp),
        color = Color.White,
        tonalElevation = 1.dp,
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Icon(icon, contentDescription = null, tint = DeepGreen, modifier = Modifier.size(20.dp))
            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                    maxLines = 1,
                )
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    color = Muted,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun EarningsTabScreen(
    uiState: EarningsUiState,
    onRetry: () -> Unit,
    onViewRatings: () -> Unit,
    onPayoutSettings: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 18.dp, top = 18.dp, end = 18.dp, bottom = 118.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeader(
                title = "Pay",
                subtitle = "Earnings, held balance and payout timing",
            )
        }
        when (uiState) {
            is EarningsUiState.Loading -> item { LoadingCard() }
            is EarningsUiState.Error -> item { EarningsErrorCard(onRetry = onRetry) }
            is EarningsUiState.Success -> {
                item { PayHero(summary = uiState.summary) }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        StatTile(
                            label = "This week",
                            value = formatRupees(uiState.summary.week.techAmountPaise),
                            icon = Icons.Default.CalendarToday,
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            label = "Held",
                            value = formatRupees(uiState.summary.pendingHeldPaise),
                            icon = Icons.Default.AccountBalanceWallet,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
                item {
                    SettingCard(
                        icon = Icons.Default.Star,
                        title = "Ratings impact",
                        subtitle = "See score, trend and appeal options",
                        onClick = onViewRatings,
                    )
                }
                item {
                    SettingCard(
                        icon = Icons.Default.Payments,
                        title = "Payout settings",
                        subtitle = "Choose weekly, next-day or instant payout",
                        onClick = onPayoutSettings,
                    )
                }
            }
        }
    }
}

@Composable
private fun PayHero(summary: EarningsSummary) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color.White,
        tonalElevation = 2.dp,
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "Today's earnings",
                style = MaterialTheme.typography.labelLarge,
                color = DeepGreen,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = formatRupees(summary.today.techAmountPaise),
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.ExtraBold,
                color = Ink,
            )
            Text(
                text =
                    if (summary.today.count == 0) {
                        "No completed jobs today yet."
                    } else {
                        "${summary.today.count} completed jobs today"
                    },
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
        }
    }
}

@Composable
private fun EarningsErrorCard(onRetry: () -> Unit) {
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
                text = "Could not load pay details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            Text(
                text = "Completed jobs still count. Retry when the API is reachable.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            OutlinedButton(onClick = onRetry) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Retry")
            }
        }
    }
}

@Composable
private fun JobsScreen(
    uiState: TechnicianHomeUiState,
    onOpenJob: (String) -> Unit,
    onRefresh: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 18.dp, top = 18.dp, end = 18.dp, bottom = 118.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeader(
                title = "Jobs",
                subtitle = "Assigned and in-progress work",
                action = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh jobs")
                    }
                },
            )
        }
        when (uiState) {
            is TechnicianHomeUiState.Loading ->
                item {
                    LoadingCard()
                }
            is TechnicianHomeUiState.Error ->
                item {
                    ErrorCard(onRefresh = onRefresh)
                }
            is TechnicianHomeUiState.Ready ->
                if (uiState.bookings.isEmpty()) {
                    item { EmptyJobsCard() }
                } else {
                    items(uiState.bookings, key = { it.bookingId }) { booking ->
                        JobCard(job = booking, onOpenJob = onOpenJob)
                    }
                }
        }
    }
}

@Composable
private fun JobsPreview(
    uiState: TechnicianHomeUiState,
    onOpenJob: (String) -> Unit,
    onRefresh: () -> Unit,
    maxItems: Int,
) {
    when (uiState) {
        is TechnicianHomeUiState.Loading -> LoadingCard()
        is TechnicianHomeUiState.Error -> ErrorCard(onRefresh = onRefresh)
        is TechnicianHomeUiState.Ready -> {
            val jobs = uiState.bookings.take(maxItems)
            if (jobs.isEmpty()) {
                EmptyJobsCard()
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    jobs.forEach { JobCard(job = it, onOpenJob = onOpenJob) }
                }
            }
        }
    }
}

@Composable
private fun JobCard(
    job: TechnicianBooking,
    onOpenJob: (String) -> Unit,
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
                StatusPill(label = job.status.label(), active = job.status.isActive())
                Spacer(Modifier.weight(1f))
                Text(
                    text = formatRupees(job.amountPaise),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
            }
            Text(
                text = job.serviceName,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Ink,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            InfoLine(icon = Icons.Default.Schedule, text = "${job.slotDate}  ${job.slotWindow}")
            InfoLine(icon = Icons.Default.Route, text = job.addressText)
            if (job.status.isActive()) {
                Button(
                    onClick = { onOpenJob(job.bookingId) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = DeepGreen),
                ) {
                    Text("Continue job")
                }
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
private fun AvailabilityScreen(
    isOnline: Boolean,
    onOnlineChange: (Boolean) -> Unit,
) {
    var morning by rememberSaveable { mutableStateOf(true) }
    var afternoon by rememberSaveable { mutableStateOf(true) }
    var evening by rememberSaveable { mutableStateOf(false) }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 18.dp, top = 18.dp, end = 18.dp, bottom = 118.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeader(
                title = "Availability",
                subtitle = "Control when new jobs can reach you",
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.Verified,
                title = "Accepting jobs",
                subtitle = if (isOnline) "Online for nearby requests" else "Offline until you switch on",
                trailing = { FieldSwitch(checked = isOnline, onCheckedChange = onOnlineChange) },
            )
        }
        item {
            Text(
                text = "Work windows",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.Schedule,
                title = "Morning",
                subtitle = "08:00 - 12:00",
                trailing = { FieldSwitch(checked = morning, onCheckedChange = { morning = it }) },
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.Schedule,
                title = "Afternoon",
                subtitle = "12:00 - 17:00",
                trailing = { FieldSwitch(checked = afternoon, onCheckedChange = { afternoon = it }) },
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.Schedule,
                title = "Evening",
                subtitle = "17:00 - 21:00",
                trailing = { FieldSwitch(checked = evening, onCheckedChange = { evening = it }) },
            )
        }
        item {
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = SoftGreen,
            ) {
                Text(
                    text = "Availability is kept on this phone until profile sync is enabled.",
                    modifier = Modifier.padding(14.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    color = DeepGreen,
                )
            }
        }
    }
}

@Composable
private fun ProfileScreen(
    authState: AuthState,
    onViewRatings: () -> Unit,
    onPayoutSettings: () -> Unit,
    onSignOut: () -> Unit,
) {
    val context = LocalContext.current
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 18.dp, top = 18.dp, end = 18.dp, bottom = 118.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeader(
                title = "Profile",
                subtitle = "Account, trust and support",
            )
        }
        item {
            ProfileHero(authState = authState)
        }
        item {
            SettingCard(
                icon = Icons.Default.Star,
                title = "Ratings",
                subtitle = "Review score, trend and appeals",
                onClick = onViewRatings,
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.AccountBalanceWallet,
                title = "Payout settings",
                subtitle = "Choose weekly, next-day or instant payout",
                onClick = onPayoutSettings,
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.SupportAgent,
                title = "Call partner support",
                subtitle = "+91 98765 43210",
                onClick = {
                    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:+919876543210")))
                },
            )
        }
        item {
            SettingCard(
                icon = Icons.Default.Email,
                title = "Email support",
                subtitle = "partners@homeheroo.in",
                onClick = {
                    context.startActivity(
                        Intent(
                            Intent.ACTION_SENDTO,
                            Uri.parse("mailto:partners@homeheroo.in"),
                        ),
                    )
                },
            )
        }
        item {
            SettingCard(
                icon = Icons.AutoMirrored.Filled.Logout,
                title = "Sign out",
                subtitle = "Remove this device session",
                onClick = onSignOut,
                destructive = true,
            )
        }
    }
}

@Composable
private fun ProfileHero(authState: AuthState) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color.White,
        tonalElevation = 2.dp,
    ) {
        Row(
            modifier = Modifier.padding(18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier =
                    Modifier
                        .size(58.dp)
                        .clip(CircleShape)
                        .background(DeepGreen),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = displayName(authState).take(1).uppercase(),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = displayName(authState),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
                Text(
                    text = accountSubtitle(authState),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            StatusPill(label = "Verified", active = true)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    destructive: Boolean = false,
    trailing: @Composable (() -> Unit)? = null,
    onClick: (() -> Unit)? = null,
) {
    Surface(
        onClick = onClick ?: {},
        enabled = onClick != null,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = Color.White,
        tonalElevation = 1.dp,
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier =
                    Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (destructive) Color(0xFFFBEAEA) else SoftGreen),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = if (destructive) MaterialTheme.colorScheme.error else DeepGreen,
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (destructive) MaterialTheme.colorScheme.error else Ink,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            trailing?.invoke()
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    action: @Composable (() -> Unit)? = null,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                )
            }
        }
        action?.invoke()
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
private fun FieldSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        colors =
            SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = DeepGreen,
                checkedBorderColor = DeepGreen,
                uncheckedThumbColor = Color.White,
                uncheckedTrackColor = Line,
                uncheckedBorderColor = Line,
            ),
    )
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
                    color = Line,
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
                text = "Could not refresh jobs",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            Text(
                text = "Your active offer popups still work. Retry when the network is stable.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            OutlinedButton(onClick = onRefresh) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Retry")
            }
        }
    }
}

@Composable
private fun EmptyJobsCard() {
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
            Icon(Icons.Default.Badge, contentDescription = null, tint = DeepGreen)
            Text(
                text = "No assigned jobs right now",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
            Text(
                text = "New requests arrive as full-screen offers with accept and decline actions.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
        }
    }
}

private fun TechnicianBookingStatus.isActive(): Boolean =
    this in
        setOf(
            TechnicianBookingStatus.ASSIGNED,
            TechnicianBookingStatus.EN_ROUTE,
            TechnicianBookingStatus.REACHED,
            TechnicianBookingStatus.IN_PROGRESS,
            TechnicianBookingStatus.AWAITING_PRICE_APPROVAL,
        )

private fun TechnicianBookingStatus.label(): String =
    when (this) {
        TechnicianBookingStatus.ASSIGNED -> "Assigned"
        TechnicianBookingStatus.EN_ROUTE -> "En route"
        TechnicianBookingStatus.REACHED -> "Arrived"
        TechnicianBookingStatus.IN_PROGRESS -> "Working"
        TechnicianBookingStatus.AWAITING_PRICE_APPROVAL -> "Approval"
        TechnicianBookingStatus.COMPLETED -> "Complete"
        TechnicianBookingStatus.PAID -> "Paid"
        TechnicianBookingStatus.CLOSED -> "Closed"
        TechnicianBookingStatus.UNKNOWN -> "Updated"
    }

private fun displayName(authState: AuthState): String =
    when (authState) {
        is AuthState.Authenticated ->
            authState.displayName
                ?: authState.phoneLastFour?.let { "Partner $it" }
                ?: "Technician"
        AuthState.Unauthenticated -> "Technician"
    }

private fun accountSubtitle(authState: AuthState): String =
    when (authState) {
        is AuthState.Authenticated ->
            authState.email
                ?: authState.phoneLastFour?.let { "Phone ending $it" }
                ?: authState.uid
        AuthState.Unauthenticated -> "Signed out"
    }

private fun todayIsoDate(): String =
    java.time.LocalDate
        .now(java.time.ZoneId.of("Asia/Kolkata"))
        .toString()

private fun formatRupees(paise: Long): String = "Rs %,.0f".format(paise / 100.0)
