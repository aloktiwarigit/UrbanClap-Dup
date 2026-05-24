package com.homeservices.customer.ui.catalogue

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Plumbing
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Water
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.ui.booking.PendingBookingResumeBanner
import com.homeservices.customer.ui.bookings.CustomerBookingsScreen
import com.homeservices.customer.ui.util.formatInr
import com.homeservices.customer.ui.wallet.WalletBalanceChip
import com.homeservices.designsystem.components.HsScreenTitle
import kotlinx.coroutines.delay

// ── Promo banners ─────────────────────────────────────────────────────────────
// To activate real photos: place banner_1.jpg / banner_2.jpg / banner_3.jpg in
// app/src/main/assets/ and replace null with "banner_1.jpg" etc.
private data class PromoBanner(
    val gradientStart: Color,
    val gradientEnd: Color,
    @StringRes val titleRes: Int,
    @StringRes val subtitleRes: Int,
    @StringRes val ctaRes: Int,
    @DrawableRes val imageRes: Int? = null,
)

private val promoBanners =
    listOf(
        PromoBanner(
            Color(0xFF5A4A2D),
            Color(0xFF3E3324),
            R.string.promo_ac_title,
            R.string.promo_ac_subtitle,
            R.string.promo_ac_cta,
            imageRes = com.homeservices.customer.R.drawable.banner_image_1,
        ),
        PromoBanner(
            Color(0xFF0B3D2E),
            Color(0xFF062A20),
            R.string.promo_pro_title,
            R.string.promo_pro_subtitle,
            R.string.promo_pro_cta,
            imageRes = com.homeservices.customer.R.drawable.banner_image_2,
        ),
        PromoBanner(
            Color(0xFFB68A2C),
            Color(0xFF6B4C12),
            R.string.promo_discount_title,
            R.string.promo_discount_subtitle,
            R.string.promo_discount_cta,
            imageRes = com.homeservices.customer.R.drawable.banner_image_3,
        ),
    )

// ── Category styles ───────────────────────────────────────────────────────────
private data class CategoryStyle(
    val iconBackground: Color,
    val iconTint: Color,
    val icon: ImageVector,
)

@Suppress("MagicNumber") // hardcoded palette entries in a category-style lookup table
private fun categoryStyle(id: String): CategoryStyle =
    when (id) {
        "ac-repair" -> CategoryStyle(Color(0xFFEAF4F7), Color(0xFF246174), Icons.Default.AcUnit)
        "water-pump" -> CategoryStyle(Color(0xFFEAF1F8), Color(0xFF355F8A), Icons.Default.Water)
        "plumbing" -> CategoryStyle(Color(0xFFEAF4EE), Color(0xFF2E6B4F), Icons.Default.Plumbing)
        "electrical" -> CategoryStyle(Color(0xFFF5EFE4), Color(0xFF80622F), Icons.Default.ElectricBolt)
        "water-purifier" -> CategoryStyle(Color(0xFFEAF4EE), Color(0xFF2E6B4F), Icons.Default.FilterAlt)
        else -> CategoryStyle(Color(0xFFE8F1EC), Color(0xFF0B3D2E), Icons.Default.Build)
    }

// formatPrice removed — price label is now built at the call site using stringResource
// so the localized "from %s" prefix is included (FIX Codex P2: restore starting-price label).

// ── Nav items ─────────────────────────────────────────────────────────────────
private data class NavItem(
    @StringRes val labelRes: Int,
    val icon: ImageVector,
)

private val navItems =
    listOf(
        NavItem(R.string.nav_home, Icons.Default.Home),
        NavItem(R.string.nav_bookings, Icons.Default.Book),
        NavItem(R.string.nav_support, Icons.Default.SupportAgent),
        NavItem(R.string.nav_profile, Icons.Default.Person),
    )

// ── Entry ─────────────────────────────────────────────────────────────────────
@Composable
internal fun CatalogueHomeScreen(
    viewModel: CatalogueHomeViewModel,
    customerHomeViewModel: CustomerHomeViewModel,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
    onProfileLanguageClick: () -> Unit,
    onTrackBooking: (String) -> Unit,
    onRateBooking: (String) -> Unit = {},
    onComplainBooking: (String) -> Unit = {},
    showWalletChip: Boolean = false,
    walletBalanceInPaise: Long = 0L,
    onWalletClick: () -> Unit = {},
    photoFirstCatalogueEnabled: Boolean = false,
    onPendingActionRoute: (String) -> Unit = {},
    onPriceApproval: (String) -> Unit = {},
    onManageConsentClick: () -> Unit = {},
    onResumePayment: (bookingId: String, orderId: String, amount: Int) -> Unit = { _, _, _ -> },
    onCancelPendingBooking: (bookingId: String) -> Unit = {},
    onPrivacyAndDataClick: () -> Unit = {},
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val homeUiState by customerHomeViewModel.homeUiState.collectAsStateWithLifecycle()
    CatalogueHomeContent(
        uiState = uiState,
        homeUiState = homeUiState,
        onCategoryClick = onCategoryClick,
        onSettingsClick = onSettingsClick,
        onProfileLanguageClick = onProfileLanguageClick,
        onTrackBooking = onTrackBooking,
        onRateBooking = onRateBooking,
        onComplainBooking = onComplainBooking,
        showWalletChip = showWalletChip,
        walletBalanceInPaise = walletBalanceInPaise,
        onWalletClick = onWalletClick,
        photoFirstCatalogueEnabled = photoFirstCatalogueEnabled,
        onPendingActionRoute = onPendingActionRoute,
        onPriceApproval = onPriceApproval,
        onManageConsentClick = onManageConsentClick,
        onResumePayment = onResumePayment,
        onCancelPendingBooking = { id ->
            customerHomeViewModel.cancelPendingBooking(id)
            onCancelPendingBooking(id)
        },
        onPrivacyAndDataClick = onPrivacyAndDataClick,
    )
}

@Composable
internal fun CatalogueHomeContent(
    uiState: CatalogueHomeUiState,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
    onProfileLanguageClick: () -> Unit,
    onTrackBooking: (String) -> Unit,
    onRateBooking: (String) -> Unit = {},
    onComplainBooking: (String) -> Unit = {},
    showWalletChip: Boolean = false,
    walletBalanceInPaise: Long = 0L,
    onWalletClick: () -> Unit = {},
    photoFirstCatalogueEnabled: Boolean = false,
    homeUiState: CustomerHomeUiState = CustomerHomeUiState.Loading,
    onPendingActionRoute: (String) -> Unit = {},
    onPriceApproval: (String) -> Unit = {},
    onManageConsentClick: () -> Unit = {},
    onResumePayment: (bookingId: String, orderId: String, amount: Int) -> Unit = { _, _, _ -> },
    onCancelPendingBooking: (bookingId: String) -> Unit = {},
    onPrivacyAndDataClick: () -> Unit = {},
) {
    var selectedNav by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            when (selectedNav) {
                0 ->
                    StickyHero(
                        onSettingsClick = onSettingsClick,
                        showWalletChip = showWalletChip,
                        walletBalanceInPaise = walletBalanceInPaise,
                        onWalletClick = onWalletClick,
                    )
                1, 2 -> CompactTabBar(title = stringResource(navItems[selectedNav].labelRes))
                else -> Unit
            }
        },
        bottomBar = { HomeBottomNav(selected = selectedNav, onSelect = { selectedNav = it }) },
    ) { scaffoldPadding ->
        HomeTabs(
            selectedNav = selectedNav,
            uiState = uiState,
            homeUiState = homeUiState,
            onCategoryClick = onCategoryClick,
            onTrackBooking = onTrackBooking,
            onRateBooking = onRateBooking,
            onComplainBooking = onComplainBooking,
            onProfileLanguageClick = onProfileLanguageClick,
            onSelectNav = { selectedNav = it },
            scaffoldPadding = scaffoldPadding,
            photoFirstCatalogueEnabled = photoFirstCatalogueEnabled,
            onPendingActionRoute = onPendingActionRoute,
            onPriceApproval = onPriceApproval,
            onManageConsentClick = onManageConsentClick,
            onResumePayment = onResumePayment,
            onCancelPendingBooking = onCancelPendingBooking,
            onPrivacyAndDataClick = onPrivacyAndDataClick,
        )
    }
}

@Composable
private fun HomeTabs(
    selectedNav: Int,
    uiState: CatalogueHomeUiState,
    onCategoryClick: (String) -> Unit,
    onTrackBooking: (String) -> Unit,
    onRateBooking: (String) -> Unit,
    onComplainBooking: (String) -> Unit,
    onProfileLanguageClick: () -> Unit,
    onSelectNav: (Int) -> Unit,
    scaffoldPadding: PaddingValues,
    photoFirstCatalogueEnabled: Boolean = false,
    homeUiState: CustomerHomeUiState = CustomerHomeUiState.Loading,
    onPendingActionRoute: (String) -> Unit = {},
    onPriceApproval: (String) -> Unit = {},
    onManageConsentClick: () -> Unit = {},
    onResumePayment: (bookingId: String, orderId: String, amount: Int) -> Unit = { _, _, _ -> },
    onCancelPendingBooking: (bookingId: String) -> Unit = {},
    onPrivacyAndDataClick: () -> Unit = {},
) {
    when (selectedNav) {
        0 ->
            CatalogueTab(
                uiState = uiState,
                homeUiState = homeUiState,
                scaffoldPadding = scaffoldPadding,
                photoFirstCatalogueEnabled = photoFirstCatalogueEnabled,
                onCategoryClick = onCategoryClick,
                onPendingActionRoute = onPendingActionRoute,
                onTrackBooking = onTrackBooking,
                onPriceApproval = onPriceApproval,
                onRateBooking = onRateBooking,
                onComplainBooking = onComplainBooking,
                onResumePayment = onResumePayment,
                onCancelPendingBooking = onCancelPendingBooking,
            )
        1 ->
            CustomerBookingsScreen(
                onTrackBooking = onTrackBooking,
                onRateBooking = onRateBooking,
                onComplainBooking = onComplainBooking,
                modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
            )
        2 ->
            SupportTab(
                onOpenBookings = { onSelectNav(1) },
                onOpenProfile = { onSelectNav(3) },
                modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
            )
        3 ->
            com.homeservices.customer.ui.profile.ProfileScreen(
                modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
                onLanguageClick = onProfileLanguageClick,
                onBookingsClick = { onSelectNav(1) },
                onManageConsentClick = onManageConsentClick,
                onPrivacyAndDataClick = onPrivacyAndDataClick,
            )
    }
}

@Composable
private fun CatalogueTab(
    uiState: CatalogueHomeUiState,
    scaffoldPadding: PaddingValues,
    photoFirstCatalogueEnabled: Boolean,
    onCategoryClick: (String) -> Unit,
    homeUiState: CustomerHomeUiState = CustomerHomeUiState.Loading,
    onPendingActionRoute: (String) -> Unit = {},
    onTrackBooking: (String) -> Unit = {},
    onPriceApproval: (String) -> Unit = {},
    onRateBooking: (String) -> Unit = {},
    onComplainBooking: (String) -> Unit = {},
    onResumePayment: (bookingId: String, orderId: String, amount: Int) -> Unit = { _, _, _ -> },
    onCancelPendingBooking: (bookingId: String) -> Unit = {},
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
        contentPadding = PaddingValues(bottom = 16.dp),
    ) {
        item {
            CustomerHomeTabContent(
                homeState = homeUiState,
                onPendingActionClick = onPendingActionRoute,
                onTrackBooking = onTrackBooking,
                onPriceApproval = onPriceApproval,
                onRateBooking = onRateBooking,
                onComplainBooking = onComplainBooking,
            )
        }
        val pendingPaymentBooking = (homeUiState as? CustomerHomeUiState.Ready)?.pendingPaymentBooking
        if (pendingPaymentBooking != null) {
            item {
                val orderId = pendingPaymentBooking.razorpayOrderId
                if (orderId != null) {
                    PendingBookingResumeBanner(
                        serviceName = pendingPaymentBooking.serviceName,
                        amountPaise = pendingPaymentBooking.amountPaise,
                        onResumePayment = {
                            onResumePayment(
                                pendingPaymentBooking.bookingId,
                                orderId,
                                pendingPaymentBooking.amountPaise.toInt(),
                            )
                        },
                        onCancel = { onCancelPendingBooking(pendingPaymentBooking.bookingId) },
                    )
                }
            }
        }
        item { PromoSlider() }
        item { TrustStrip() }
        when (uiState) {
            is CatalogueHomeUiState.Loading -> item { LoadingState() }
            is CatalogueHomeUiState.Error -> item { ErrorState() }
            is CatalogueHomeUiState.Success -> {
                item {
                    Text(
                        text = stringResource(R.string.catalogue_our_services),
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, fontSize = 19.sp),
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                    )
                }
                val rows = uiState.categories.chunked(2)
                items(rows) { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        row.forEach { cat ->
                            if (photoFirstCatalogueEnabled) {
                                PhotoFirstCategoryCard(
                                    category = cat,
                                    onClick = { onCategoryClick(cat.id) },
                                    modifier = Modifier.weight(1f),
                                )
                            } else {
                                CategoryCard(category = cat, onClick = { onCategoryClick(cat.id) }, modifier = Modifier.weight(1f))
                            }
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

// ── Home header ───────────────────────────────────────────────────────────────
@Composable
private fun StickyHero(
    onSettingsClick: () -> Unit,
    showWalletChip: Boolean = false,
    walletBalanceInPaise: Long = 0L,
    onWalletClick: () -> Unit = {},
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.background)
                .statusBarsPadding()
                .padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 10.dp),
    ) {
        HeroTopRow(onSettingsClick = onSettingsClick)
        Spacer(Modifier.height(10.dp))
        HeroSearchBar()
        if (showWalletChip && walletBalanceInPaise > 0L) {
            Spacer(Modifier.height(8.dp))
            WalletBalanceChip(
                balanceInPaise = walletBalanceInPaise,
                onClick = onWalletClick,
            )
        }
    }
}

@Composable
private fun HeroTopRow(onSettingsClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            HsScreenTitle(
                text = "HomeHeroo",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 22.sp),
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(15.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = stringResource(R.string.catalogue_location_display),
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        IconButton(
            onClick = onSettingsClick,
            modifier =
                Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape),
        ) {
            Icon(
                Icons.Default.Settings,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(21.dp),
            )
        }
    }
}

@Composable
private fun HeroSearchBar() {
    var query by remember { mutableStateOf("") }
    TextField(
        value = query,
        onValueChange = { query = it },
        placeholder = {
            Text(
                stringResource(R.string.catalogue_search_hint),
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        },
        leadingIcon = {
            Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(23.dp))
        },
        singleLine = true,
        shape = RoundedCornerShape(18.dp),
        colors =
            TextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
            ),
        modifier =
            Modifier
                .fillMaxWidth()
                .height(52.dp)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(18.dp)),
    )
}

@Composable
private fun CompactTabBar(title: String) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.background)
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

// ── Promo slider ──────────────────────────────────────────────────────────────
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun PromoSlider() {
    val pagerState = rememberPagerState(pageCount = { promoBanners.size })
    LaunchedEffect(Unit) {
        while (true) {
            delay(4_000)
            pagerState.animateScrollToPage(
                (pagerState.currentPage + 1) % promoBanners.size,
                animationSpec = tween(600),
            )
        }
    }
    Column(modifier = Modifier.padding(top = 6.dp, bottom = 12.dp)) {
        HorizontalPager(
            state = pagerState,
            contentPadding = PaddingValues(horizontal = 16.dp),
            pageSpacing = 12.dp,
        ) { page ->
            val b = promoBanners[page]
            Box(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(196.dp)
                        .shadow(10.dp, RoundedCornerShape(24.dp), clip = false)
                        .clip(RoundedCornerShape(24.dp)),
            ) {
                if (b.imageRes != null) {
                    Image(
                        painter = painterResource(id = b.imageRes),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                    Box(
                        modifier =
                            Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        listOf(
                                            Color.Transparent,
                                            Color.Black.copy(alpha = 0.62f),
                                        ),
                                    ),
                                ),
                    )
                } else {
                    Box(
                        modifier =
                            Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.horizontalGradient(listOf(b.gradientStart, b.gradientEnd)),
                                ),
                    )
                }
                Row(
                    verticalAlignment = Alignment.Bottom,
                    modifier = Modifier.fillMaxSize().padding(horizontal = 22.dp, vertical = 20.dp),
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            stringResource(b.titleRes),
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 24.sp),
                            // Promo banners sit over photos with a fixed dark scrim — use Color.White
                            // so text is readable in both light and dark mode (onPrimary is dark in dark theme).
                            color = Color.White,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(5.dp))
                        Text(
                            stringResource(b.subtitleRes),
                            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                            color = Color.White.copy(alpha = 0.85f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(10.dp))
                        Text(
                            stringResource(R.string.promo_cta_with_arrow, stringResource(b.ctaRes)),
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold, fontSize = 15.sp),
                            color = Color.White,
                        )
                    }
                }
            }
        }
        // Dot indicators
        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.Center) {
            repeat(promoBanners.size) { i ->
                val sel = pagerState.currentPage == i
                Box(
                    modifier =
                        Modifier
                            .padding(horizontal = 3.dp)
                            .size(if (sel) 18.dp else 5.dp, 5.dp)
                            .clip(if (sel) RoundedCornerShape(3.dp) else CircleShape)
                            .background(if (sel) MaterialTheme.colorScheme.primary else Color(0xFFD1D5DB)),
                )
            }
        }
    }
}

// ── Trust strip (Codex: white cards, border, 44dp height) ────────────────────
@Composable
private fun TrustStrip() {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 2.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        TrustChip(icon = Icons.Default.VerifiedUser, label = stringResource(R.string.trust_skill_match), modifier = Modifier.weight(1f))
        TrustChip(icon = Icons.Default.Star, label = stringResource(R.string.trust_rating), modifier = Modifier.weight(1f))
        TrustChip(icon = Icons.Default.Shield, label = stringResource(R.string.trust_guarantee), modifier = Modifier.weight(1f))
    }
    Spacer(Modifier.height(4.dp))
}

@Composable
private fun TrustChip(
    icon: ImageVector,
    label: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier =
            modifier
                .height(44.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.primary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

// ── Category card (Codex: 148dp, radius 20dp, icon tile 56dp, 17sp title) ────
@Composable
private fun CategoryCard(
    category: Category,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val style = categoryStyle(category.id)
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "card_scale",
    )

    Box(
        modifier =
            modifier
                .height(126.dp)
                .scale(scale)
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            pressed = true
                            tryAwaitRelease()
                            pressed = false
                        },
                        onTap = { onClick() },
                    )
                },
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier =
                        Modifier
                            .size(36.dp)
                            .background(style.iconBackground, RoundedCornerShape(12.dp)),
                ) {
                    Icon(style.icon, contentDescription = null, tint = style.iconTint, modifier = Modifier.size(21.dp))
                }
                Spacer(Modifier.weight(1f))
                Icon(
                    Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.55f),
                    modifier = Modifier.size(16.dp),
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = category.name,
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 18.sp),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (category.minPricePaise > 0) {
                Spacer(Modifier.height(3.dp))
                Text(
                    text =
                        stringResource(
                            R.string.catalogue_starting_price,
                            formatInr(category.minPricePaise.toLong()),
                        ),
                    style =
                        MaterialTheme.typography.labelLarge.copy(
                            fontSize = 13.sp,
                            lineHeight = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        ),
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

// ── Bottom nav ─────────────────────────────────────────────────────────────────
@Composable
private fun HomeBottomNav(
    selected: Int,
    onSelect: (Int) -> Unit,
) {
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(start = 18.dp, end = 18.dp, top = 8.dp, bottom = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .height(68.dp)
                    .shadow(24.dp, RoundedCornerShape(28.dp), clip = false)
                    .clip(RoundedCornerShape(28.dp))
                    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.74f))
                    .border(1.dp, MaterialTheme.colorScheme.surface.copy(alpha = 0.86f), RoundedCornerShape(28.dp))
                    .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            navItems.forEachIndexed { i, item ->
                GlassNavItem(
                    item = item,
                    selected = selected == i,
                    onClick = { onSelect(i) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun GlassNavItem(
    item: NavItem,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val itemColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
    val label = stringResource(item.labelRes)
    Column(
        modifier =
            modifier
                .height(52.dp)
                .clip(RoundedCornerShape(22.dp))
                .background(if (selected) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.95f) else Color.Transparent)
                .clickable(onClick = onClick)
                .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(item.icon, contentDescription = label, tint = itemColor, modifier = Modifier.size(22.dp))
        Spacer(Modifier.height(2.dp))
        Text(
            label,
            style =
                MaterialTheme.typography.labelSmall.copy(
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                    fontSize = 10.sp,
                ),
            color = itemColor,
            maxLines = 1,
        )
    }
}

// ── Loading / Error ────────────────────────────────────────────────────────────
@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
private fun ErrorState() {
    Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                stringResource(R.string.catalogue_error_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                stringResource(R.string.catalogue_error),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SupportTab(
    onOpenBookings: () -> Unit,
    onOpenProfile: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uriHandler = LocalUriHandler.current
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 20.dp, top = 16.dp, end = 20.dp, bottom = 108.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { SupportHero() }
        item {
            SupportActionCard(
                icon = Icons.Default.SupportAgent,
                title = stringResource(R.string.support_call_title),
                subtitle = stringResource(R.string.support_call_subtitle),
                onClick = { uriHandler.openUri("tel:1800123456") },
            )
        }
        item {
            SupportActionCard(
                icon = Icons.Default.Book,
                title = stringResource(R.string.support_my_bookings_title),
                subtitle = stringResource(R.string.support_my_bookings_subtitle),
                onClick = onOpenBookings,
            )
        }
        item {
            SupportInfoCard(
                icon = Icons.Default.Shield,
                title = stringResource(R.string.support_safety_title),
                subtitle = stringResource(R.string.support_safety_subtitle),
            )
        }
        item {
            SupportActionCard(
                icon = Icons.Default.Person,
                title = stringResource(R.string.support_profile_language_title),
                subtitle = stringResource(R.string.support_profile_language_subtitle),
                onClick = onOpenProfile,
            )
        }
    }
}

@Composable
private fun SupportHero() {
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Brush.horizontalGradient(listOf(MaterialTheme.colorScheme.primary, Color(0xFF123B32))))
                .padding(18.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(
                contentAlignment = Alignment.Center,
                modifier =
                    Modifier
                        .size(
                            46.dp,
                        ).background(MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.16f), RoundedCornerShape(16.dp)),
            ) {
                Icon(
                    Icons.Default.SupportAgent,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(26.dp),
                )
            }
            Text(
                text = stringResource(R.string.support_hero_title),
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                color = MaterialTheme.colorScheme.onPrimary,
            )
            Text(
                text = stringResource(R.string.support_hero_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.84f),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SupportPill(stringResource(R.string.support_guarantee_pill))
                SupportPill(stringResource(R.string.support_skilled_technicians_pill))
            }
        }
    }
}

@Composable
private fun SupportPill(label: String) {
    Text(
        text = label,
        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
        color = MaterialTheme.colorScheme.onPrimary,
        modifier =
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.14f))
                .padding(horizontal = 10.dp, vertical = 6.dp),
        maxLines = 1,
    )
}

@Composable
private fun SupportActionCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
) {
    SupportCardFrame(modifier = Modifier.clickable(onClick = onClick)) {
        SupportCardContent(icon = icon, title = title, subtitle = subtitle, trailing = true)
    }
}

@Composable
private fun SupportInfoCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
) {
    SupportCardFrame {
        SupportCardContent(icon = icon, title = title, subtitle = subtitle, trailing = false)
    }
}

@Composable
private fun SupportCardFrame(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(
        modifier =
            modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(18.dp))
                .padding(16.dp),
    ) {
        content()
    }
}

@Composable
private fun SupportCardContent(
    icon: ImageVector,
    title: String,
    subtitle: String,
    trailing: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(44.dp).background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(15.dp)),
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (trailing) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.64f),
                modifier = Modifier.size(18.dp),
            )
        }
    }
}
