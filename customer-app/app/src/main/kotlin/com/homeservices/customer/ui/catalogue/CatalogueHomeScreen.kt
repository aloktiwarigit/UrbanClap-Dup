package com.homeservices.customer.ui.catalogue

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import androidx.compose.foundation.border
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
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Category
import kotlinx.coroutines.delay

// ── Colour tokens (Codex-refined) ────────────────────────────────────────────
private val HeroStart = Color(0xFF064A3D)
private val HeroEnd = Color(0xFF0B6B58)
private val BrandGreen = Color(0xFF0E4F47)
private val WarmIvory = Color(0xFFFFFBF5)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF6B7280)

// ── Promo banners ─────────────────────────────────────────────────────────────
// To activate real photos: place banner_1.jpg / banner_2.jpg / banner_3.jpg in
// app/src/main/assets/ and replace null with "banner_1.jpg" etc.
private data class PromoBanner(
    val gradientStart: Color,
    val gradientEnd: Color,
    val emoji: String,
    val title: String,
    val subtitle: String,
    val cta: String,
    val imageAsset: String? = null,
)

private val promoBanners =
    listOf(
        PromoBanner(Color(0xFFF59E0B), Color(0xFFB45309), "🌡️", "गर्मी से पहले AC सर्विस", "से ₹599 · आज की स्लॉट उपलब्ध", "अभी बुक करें", imageAsset = "banner-image-1.png"),
        PromoBanner(
            Color(0xFF0E4F47),
            Color(0xFF064E3B),
            "🛡️",
            "आधार सत्यापित प्रोफेशनल",
            "हर तकनीशियन बैकग्राउंड चेक्ड · 30 दिन गारंटी",
            "और जानें",
            imageAsset = "banner-image-2.png",
        ),
        PromoBanner(Color(0xFF6D28D9), Color(0xFF4C1D95), "🎁", "पहली बुकिंग पर 10% छूट", "कूपन: PEHLI · सभी सेवाओं पर लागू", "कूपन लगाएं", imageAsset = "banner-image-3.png"),
    )

// ── Category styles ───────────────────────────────────────────────────────────
private data class CategoryStyle(
    val gradientStart: Color,
    val gradientEnd: Color,
    val icon: ImageVector,
)

private fun categoryStyle(id: String): CategoryStyle =
    when (id) {
        "ac-repair" -> CategoryStyle(Color(0xFF0284C7), Color(0xFF0369A1), Icons.Default.AcUnit)
        "water-pump" -> CategoryStyle(Color(0xFF2563EB), Color(0xFF1E40AF), Icons.Default.Water)
        "plumbing" -> CategoryStyle(Color(0xFF059669), Color(0xFF065F46), Icons.Default.Plumbing)
        "electrical" -> CategoryStyle(Color(0xFFD97706), Color(0xFF92400E), Icons.Default.ElectricBolt)
        "water-purifier" -> CategoryStyle(Color(0xFF16A34A), Color(0xFF14532D), Icons.Default.FilterAlt)
        else -> CategoryStyle(Color(0xFF7C3AED), Color(0xFF4C1D95), Icons.Default.Build)
    }

private fun formatPrice(paise: Int): String = if (paise > 0) "से ₹${paise / 100}" else ""

// ── Nav items ─────────────────────────────────────────────────────────────────
private data class NavItem(
    val label: String,
    val icon: ImageVector,
)

private val navItems =
    listOf(
        NavItem("होम", Icons.Default.Home),
        NavItem("बुकिंग", Icons.Default.Book),
        NavItem("सहायता", Icons.Default.SupportAgent),
        NavItem("प्रोफ़ाइल", Icons.Default.Person),
    )

// ── Entry ─────────────────────────────────────────────────────────────────────
@Composable
internal fun CatalogueHomeScreen(
    viewModel: CatalogueHomeViewModel,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    CatalogueHomeContent(uiState = uiState, onCategoryClick = onCategoryClick, onSettingsClick = onSettingsClick)
}

@Composable
internal fun CatalogueHomeContent(
    uiState: CatalogueHomeUiState,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
) {
    var selectedNav by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = WarmIvory,
        // ── Sticky brand hero ──────────────────────────────────────────────
        topBar = { StickyHero(onSettingsClick = onSettingsClick) },
        bottomBar = { HomeBottomNav(selected = selectedNav, onSelect = { selectedNav = it }) },
    ) { scaffoldPadding ->
        when (selectedNav) {
            0 ->
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
                    contentPadding = PaddingValues(bottom = 16.dp),
                ) {
                    item { PromoSlider() }
                    item { TrustStrip() }
                    when (uiState) {
                        is CatalogueHomeUiState.Loading -> item { LoadingState() }
                        is CatalogueHomeUiState.Error -> item { ErrorState() }
                        is CatalogueHomeUiState.Success -> {
                            item {
                                Text(
                                    text = "हमारी सेवाएं",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = TextPrimary,
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
                                        CategoryCard(category = cat, onClick = { onCategoryClick(cat.id) }, modifier = Modifier.weight(1f))
                                    }
                                    if (row.size == 1) Spacer(Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            1 ->
                ComingSoonTab(
                    icon = Icons.Default.Book,
                    title = "आपकी बुकिंग",
                    subtitle = "बुकिंग करने के बाद यहाँ दिखेगी",
                    modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
                )
            2 ->
                ComingSoonTab(
                    icon = Icons.Default.SupportAgent,
                    title = "सहायता",
                    subtitle = "जल्द ही उपलब्ध — समस्या के लिए कॉल करें: 1800-XXX-XXXX",
                    modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
                )
            3 ->
                com.homeservices.customer.ui.profile.ProfileScreen(
                    modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
                )
        }
    }
}

// ── Sticky hero (Codex spec: height 300dp, gradient #064A3D→#0B6B58) ──────────
@Composable
private fun StickyHero(onSettingsClick: () -> Unit) {
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(HeroStart, HeroEnd)))
                .statusBarsPadding()
                .padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 20.dp),
    ) {
        Column {
            // Brand row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column {
                    Text(
                        text = "HomeHeroo",
                        style =
                            MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 26.sp,
                                letterSpacing = (-0.5).sp,
                            ),
                        color = Color.White,
                    )
                    Text(
                        text = "घर की हर ज़रूरत, एक जगह",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.72f),
                    )
                }
                IconButton(onClick = onSettingsClick) {
                    Icon(Icons.Default.Settings, contentDescription = null, tint = Color.White.copy(alpha = 0.8f))
                }
            }

            Spacer(Modifier.height(10.dp))

            // Location chip
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier =
                    Modifier
                        .background(Color.White.copy(alpha = 0.15f), RoundedCornerShape(999.dp))
                        .padding(horizontal = 12.dp, vertical = 5.dp),
            ) {
                Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFFFCD34D), modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "अयोध्या, उत्तर प्रदेश",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = Color.White,
                )
            }

            Spacer(Modifier.height(14.dp))

            // Search bar (Codex: height 56dp, radius 18dp, white bg)
            var query by remember { mutableStateOf("") }
            TextField(
                value = query,
                onValueChange = { query = it },
                placeholder = {
                    Text(
                        "AC, प्लंबर, इलेक्ट्रीशियन खोजें…",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 16.sp),
                        color = TextSecondary,
                    )
                },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(24.dp))
                },
                singleLine = true,
                shape = RoundedCornerShape(18.dp),
                colors =
                    TextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        disabledIndicatorColor = Color.Transparent,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                    ),
                modifier = Modifier.fillMaxWidth().height(56.dp),
            )
        }
    }
}

// ── Promo slider (Codex: height 132dp, radius 24dp) ──────────────────────────
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
    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        HorizontalPager(
            state = pagerState,
            contentPadding = PaddingValues(horizontal = 20.dp),
            pageSpacing = 12.dp,
        ) { page ->
            val b = promoBanners[page]
            Box(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(132.dp)
                        .clip(RoundedCornerShape(24.dp)),
            ) {
                if (b.imageAsset != null) {
                    AsyncImage(
                        model = "file:///android_asset/${b.imageAsset}",
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                    Box(
                        modifier =
                            Modifier
                                .fillMaxSize()
                                .background(Color(0xFF000000).copy(alpha = 0.45f)),
                    )
                } else {
                    Box(
                        modifier =
                            Modifier
                                .fillMaxSize()
                                .background(Brush.horizontalGradient(listOf(b.gradientStart, b.gradientEnd))),
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 14.dp),
                ) {
                    Text(b.emoji, fontSize = 38.sp)
                    Spacer(Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            b.title,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold, fontSize = 20.sp),
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            b.subtitle,
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 15.sp),
                            color = Color.White.copy(alpha = 0.85f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "${b.cta} →",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, fontSize = 15.sp),
                            color = Color.White,
                        )
                    }
                }
            }
        }
        // Dot indicators
        Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.Center) {
            repeat(promoBanners.size) { i ->
                val sel = pagerState.currentPage == i
                Box(
                    modifier =
                        Modifier
                            .padding(horizontal = 3.dp)
                            .size(if (sel) 20.dp else 6.dp, 6.dp)
                            .clip(if (sel) RoundedCornerShape(3.dp) else CircleShape)
                            .background(if (sel) BrandGreen else Color(0xFFD1D5DB)),
                )
            }
        }
    }
}

// ── Trust strip (Codex: white cards, border, 44dp height) ────────────────────
@Composable
private fun TrustStrip() {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        TrustChip(icon = Icons.Default.VerifiedUser, label = "आधार सत्यापित", modifier = Modifier.weight(1f))
        TrustChip(icon = Icons.Default.Star, label = "4.8★ रेटिंग", modifier = Modifier.weight(1f))
        TrustChip(icon = Icons.Default.Shield, label = "30 दिन गारंटी", modifier = Modifier.weight(1f))
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
                .background(Color.White)
                .border(1.dp, Color(0xFFDDE7E3), RoundedCornerShape(14.dp))
                .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp, fontWeight = FontWeight.SemiBold),
            color = BrandGreen,
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
                .height(148.dp)
                .scale(scale)
                .clip(RoundedCornerShape(20.dp))
                .background(Brush.verticalGradient(listOf(style.gradientStart, style.gradientEnd)))
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
        // Ghost icon
        Icon(
            style.icon,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.08f),
            modifier = Modifier.size(110.dp).align(Alignment.BottomEnd).padding(6.dp),
        )
        Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
            // Icon tile (Codex: 56dp)
            Box(
                contentAlignment = Alignment.Center,
                modifier =
                    Modifier
                        .size(56.dp)
                        .background(Color.White.copy(alpha = 0.18f), RoundedCornerShape(14.dp)),
            ) {
                Icon(style.icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(30.dp))
            }
            Spacer(Modifier.weight(1f))
            // Title (Codex: 17sp Bold)
            Text(
                text = category.name,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, fontSize = 17.sp),
                color = Color.White,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            // Price (Codex: 15sp Semibold)
            if (category.minPricePaise > 0) {
                Text(
                    text = formatPrice(category.minPricePaise),
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                    color = Color.White.copy(alpha = 0.88f),
                )
            }
        }
        Icon(
            Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.55f),
            modifier = Modifier.size(16.dp).align(Alignment.TopEnd).padding(top = 12.dp, end = 12.dp),
        )
    }
}

// ── Bottom nav ─────────────────────────────────────────────────────────────────
@Composable
private fun HomeBottomNav(
    selected: Int,
    onSelect: (Int) -> Unit,
) {
    NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
        navItems.forEachIndexed { i, item ->
            NavigationBarItem(
                selected = selected == i,
                onClick = { onSelect(i) },
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label, style = MaterialTheme.typography.labelSmall, maxLines = 1) },
                colors =
                    NavigationBarItemDefaults.colors(
                        selectedIconColor = BrandGreen,
                        selectedTextColor = BrandGreen,
                        indicatorColor = BrandGreen.copy(alpha = 0.12f),
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                    ),
            )
        }
    }
}

// ── Loading / Error ────────────────────────────────────────────────────────────
@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = BrandGreen)
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
                color = TextPrimary,
            )
            Spacer(Modifier.height(6.dp))
            Text(stringResource(R.string.catalogue_error), style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
    }
}

@Composable
private fun ComingSoonTab(
    icon: ImageVector,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
            Box(
                contentAlignment = Alignment.Center,
                modifier =
                    Modifier
                        .size(72.dp)
                        .background(BrandGreen.copy(alpha = 0.1f), RoundedCornerShape(20.dp)),
            ) {
                Icon(icon, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(36.dp))
            }
            Spacer(Modifier.height(20.dp))
            Text(title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = TextPrimary)
            Spacer(Modifier.height(8.dp))
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                modifier = Modifier.padding(horizontal = 16.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }
}
