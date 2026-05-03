package com.homeservices.customer.ui.catalogue

import androidx.annotation.DrawableRes
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
import androidx.compose.ui.res.painterResource
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
private val BrandGreen = Color(0xFF0B3D2E)
private val WarmIvory = Color(0xFFFBF7EF)
private val SurfaceWhite = Color(0xFFFFFFFF)
private val MutedGreen = Color(0xFFE8F1EC)
private val CardBorder = Color(0xFFDED8CD)
private val TextPrimary = Color(0xFF18231F)
private val TextSecondary = Color(0xFF5F6C66)

// ── Promo banners ─────────────────────────────────────────────────────────────
// To activate real photos: place banner_1.jpg / banner_2.jpg / banner_3.jpg in
// app/src/main/assets/ and replace null with "banner_1.jpg" etc.
private data class PromoBanner(
    val gradientStart: Color,
    val gradientEnd: Color,
    val title: String,
    val subtitle: String,
    val cta: String,
    @DrawableRes val imageRes: Int? = null,
)

private val promoBanners =
    listOf(
        PromoBanner(
            Color(0xFF5A4A2D),
            Color(0xFF3E3324),
            "गर्मी से पहले AC सर्विस",
            "से ₹599 · आज की स्लॉट उपलब्ध",
            "अभी बुक करें",
            imageRes = com.homeservices.customer.R.drawable.banner_image_1,
        ),
        PromoBanner(
            Color(0xFF0B3D2E),
            Color(0xFF062A20),
            "आधार सत्यापित प्रोफेशनल",
            "हर तकनीशियन बैकग्राउंड चेक्ड · 30 दिन गारंटी",
            "और जानें",
            imageRes = com.homeservices.customer.R.drawable.banner_image_2,
        ),
        PromoBanner(
            Color(0xFFB68A2C),
            Color(0xFF6B4C12),
            "पहली बुकिंग पर 10% छूट",
            "कूपन: PEHLI · सभी सेवाओं पर लागू",
            "कूपन लगाएं",
            imageRes = com.homeservices.customer.R.drawable.banner_image_3,
        ),
    )

// ── Category styles ───────────────────────────────────────────────────────────
private data class CategoryStyle(
    val iconBackground: Color,
    val iconTint: Color,
    val icon: ImageVector,
)

private fun categoryStyle(id: String): CategoryStyle =
    when (id) {
        "ac-repair" -> CategoryStyle(Color(0xFFEAF4F7), Color(0xFF246174), Icons.Default.AcUnit)
        "water-pump" -> CategoryStyle(Color(0xFFEAF1F8), Color(0xFF355F8A), Icons.Default.Water)
        "plumbing" -> CategoryStyle(Color(0xFFEAF4EE), Color(0xFF2E6B4F), Icons.Default.Plumbing)
        "electrical" -> CategoryStyle(Color(0xFFF5EFE4), Color(0xFF80622F), Icons.Default.ElectricBolt)
        "water-purifier" -> CategoryStyle(Color(0xFFEAF4EE), Color(0xFF2E6B4F), Icons.Default.FilterAlt)
        else -> CategoryStyle(MutedGreen, BrandGreen, Icons.Default.Build)
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
    onProfileLanguageClick: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    CatalogueHomeContent(
        uiState = uiState,
        onCategoryClick = onCategoryClick,
        onSettingsClick = onSettingsClick,
        onProfileLanguageClick = onProfileLanguageClick,
    )
}

@Composable
internal fun CatalogueHomeContent(
    uiState: CatalogueHomeUiState,
    onCategoryClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
    onProfileLanguageClick: () -> Unit,
) {
    var selectedNav by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = WarmIvory,
        topBar = {
            when (selectedNav) {
                0 -> StickyHero(onSettingsClick = onSettingsClick)
                1, 2 -> CompactTabBar(title = navItems[selectedNav].label)
                else -> Unit
            }
        },
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
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, fontSize = 19.sp),
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
                    onLanguageClick = onProfileLanguageClick,
                )
        }
    }
}

// ── Home header ───────────────────────────────────────────────────────────────
@Composable
private fun StickyHero(onSettingsClick: () -> Unit) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(WarmIvory)
                .statusBarsPadding()
                .padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "HomeHeroo",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 22.sp),
                    color = BrandGreen,
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = "अयोध्या, उत्तर प्रदेश",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
                        color = TextSecondary,
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
                        .background(SurfaceWhite)
                        .border(1.dp, CardBorder, CircleShape),
            ) {
                Icon(Icons.Default.Settings, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(21.dp))
            }
        }

        Spacer(Modifier.height(10.dp))

        var query by remember { mutableStateOf("") }
        TextField(
            value = query,
            onValueChange = { query = it },
            placeholder = {
                Text(
                    "AC, प्लंबर, इलेक्ट्रीशियन खोजें...",
                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp),
                    color = TextSecondary,
                )
            },
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(23.dp))
            },
            singleLine = true,
            shape = RoundedCornerShape(18.dp),
            colors =
                TextFieldDefaults.colors(
                    focusedContainerColor = SurfaceWhite,
                    unfocusedContainerColor = SurfaceWhite,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    disabledIndicatorColor = Color.Transparent,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                ),
            modifier =
                Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
        )
    }
}

@Composable
private fun CompactTabBar(title: String) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .background(WarmIvory)
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = TextPrimary,
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
                                            Color(0xFF000000).copy(alpha = 0.62f),
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
                            b.title,
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 24.sp),
                            color = Color.White,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(5.dp))
                        Text(
                            b.subtitle,
                            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                            color = Color.White.copy(alpha = 0.85f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "${b.cta} →",
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
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 2.dp),
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
                .background(SurfaceWhite)
                .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.SemiBold),
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
                .height(126.dp)
                .scale(scale)
                .clip(RoundedCornerShape(16.dp))
                .background(SurfaceWhite)
                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
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
                    tint = TextSecondary.copy(alpha = 0.55f),
                    modifier = Modifier.size(16.dp),
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = category.name,
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 18.sp),
                color = TextPrimary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (category.minPricePaise > 0) {
                Spacer(Modifier.height(3.dp))
                Text(
                    text = formatPrice(category.minPricePaise),
                    style =
                        MaterialTheme.typography.labelLarge.copy(
                            fontSize = 13.sp,
                            lineHeight = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        ),
                    color = BrandGreen,
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
                    .background(Color.White.copy(alpha = 0.74f))
                    .border(1.dp, Color.White.copy(alpha = 0.86f), RoundedCornerShape(28.dp))
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
    val itemColor = if (selected) BrandGreen else TextSecondary
    Column(
        modifier =
            modifier
                .height(52.dp)
                .clip(RoundedCornerShape(22.dp))
                .background(if (selected) MutedGreen.copy(alpha = 0.95f) else Color.Transparent)
                .clickable(onClick = onClick)
                .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(item.icon, contentDescription = item.label, tint = itemColor, modifier = Modifier.size(22.dp))
        Spacer(Modifier.height(2.dp))
        Text(
            item.label,
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
