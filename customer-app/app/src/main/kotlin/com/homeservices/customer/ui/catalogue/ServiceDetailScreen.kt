package com.homeservices.customer.ui.catalogue

import androidx.annotation.DrawableRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.customer.ui.shared.TrustDossierCard
import com.homeservices.customer.ui.shared.TrustDossierUiState
import com.homeservices.customer.ui.shared.TrustDossierViewModel
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.theme.LocalHomeservicesExtendedColors

// ── Brand tokens (keep only those not in design-system token mapping) ─────────
private val MetricNeutralBg = Color(0xFFF5F4F0)
private val SkeletonLine = Color(0xFFEDE7DD)
private val PillShape = RoundedCornerShape(percent = 50)
private val CardShape = RoundedCornerShape(12.dp)

@Composable
internal fun ServiceDetailScreen(
    viewModel: ServiceDetailViewModel,
    trustDossierViewModel: TrustDossierViewModel = hiltViewModel(),
    onBookNow: (serviceId: String, categoryId: String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val confidenceScoreState by viewModel.confidenceScoreState.collectAsStateWithLifecycle()
    val trustDossierUiState by trustDossierViewModel.uiState.collectAsStateWithLifecycle()
    val recommendedTechnicianId by viewModel.recommendedTechnicianId.collectAsStateWithLifecycle()

    LaunchedEffect(recommendedTechnicianId) {
        if (recommendedTechnicianId != null) {
            trustDossierViewModel.loadProfile(checkNotNull(recommendedTechnicianId))
        }
    }

    Scaffold(containerColor = MaterialTheme.colorScheme.background) { innerPadding ->
        ServiceDetailContent(
            uiState = uiState,
            confidenceScoreState = confidenceScoreState,
            trustDossierUiState = trustDossierUiState,
            onBookNow = onBookNow,
            onBack = onBack,
            modifier = Modifier.padding(innerPadding),
        )
    }
}

@Composable
internal fun ServiceDetailContent(
    uiState: ServiceDetailUiState,
    confidenceScoreState: ConfidenceScoreUiState,
    onBookNow: (serviceId: String, categoryId: String) -> Unit,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    trustDossierUiState: TrustDossierUiState = TrustDossierUiState.Unavailable,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (uiState) {
            is ServiceDetailUiState.Loading -> ServiceDetailSkeleton()
            is ServiceDetailUiState.Error -> ServiceDetailError()
            is ServiceDetailUiState.Success -> {
                ServiceDetailBody(
                    service = uiState.service,
                    confidenceScoreState = confidenceScoreState,
                    trustDossierUiState = trustDossierUiState,
                    onBookNow = { onBookNow(uiState.service.id, uiState.service.categoryId) },
                    onBack = onBack,
                )
            }
        }
    }
}

@Composable
private fun ServiceDetailBody(
    service: Service,
    confidenceScoreState: ConfidenceScoreUiState,
    trustDossierUiState: TrustDossierUiState,
    onBookNow: () -> Unit,
    onBack: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            ServiceHero(service = service, onBack = onBack, modifier = Modifier.fillMaxWidth())
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                ServiceMetricRow(service = service)
                TrustDossierCard(
                    uiState = trustDossierUiState,
                    compact = false,
                    modifier = Modifier.fillMaxWidth(),
                )
                ConfidenceScoreRow(
                    uiState = confidenceScoreState,
                    modifier = Modifier.fillMaxWidth(),
                )
                ServiceQualityPanel()
                ServiceSection(
                    title = stringResource(R.string.includes_label),
                    subtitle = stringResource(R.string.service_detail_includes_subtitle),
                ) {
                    service.includes.forEach { item -> ServiceCheckRow(text = item) }
                }
                if (service.addOns.isNotEmpty()) {
                    ServiceSection(
                        title = stringResource(R.string.addons_label),
                        subtitle = stringResource(R.string.service_detail_addons_subtitle),
                    ) {
                        service.addOns.forEach { addOn ->
                            AddOnRow(name = addOn.name, price = formatPrice(addOn.price))
                        }
                    }
                }
                Spacer(Modifier.height(80.dp))
            }
        }
        ServiceBookingBar(service = service, onBookNow = onBookNow)
    }
}

@Composable
private fun ServiceHero(
    service: Service,
    onBack: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.aspectRatio(1.18f)) {
        val localHeroRes = serviceHeroImageRes(service.id)
        when {
            localHeroRes != null -> {
                Image(
                    painter = painterResource(id = localHeroRes),
                    contentDescription = stringResource(R.string.service_image_desc, service.name),
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            }
            service.imageUrl.isNotBlank() -> {
                AsyncImage(
                    model = service.imageUrl,
                    contentDescription = stringResource(R.string.service_image_desc, service.name),
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            }
            else -> {
                Box(
                    modifier =
                        Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(
                                        LocalHomeservicesExtendedColors.current.brandPrimaryHover,
                                        MaterialTheme.colorScheme.primary,
                                    ),
                                ),
                            ),
                )
            }
        }

        // Bottom gradient scrim for legibility
        Box(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .align(Alignment.BottomCenter)
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.72f)),
                        ),
                    ),
        )

        // Back button — white icon on translucent dark circle
        onBack?.let { back ->
            Surface(
                modifier =
                    Modifier
                        .align(Alignment.TopStart)
                        .statusBarsPadding()
                        .padding(12.dp),
                shape = CircleShape,
                color = Color.Black.copy(alpha = 0.40f),
            ) {
                IconButton(onClick = back, modifier = Modifier.size(40.dp)) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = stringResource(R.string.service_detail_back_desc),
                        tint = MaterialTheme.colorScheme.onPrimary,
                    )
                }
            }
        }

        // Title card overlaid on bottom of hero
        Column(
            modifier =
                Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = stringResource(R.string.service_detail_eyebrow),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.80f),
                fontWeight = FontWeight.SemiBold,
            )
            HsScreenTitle(
                text = service.name,
                color = MaterialTheme.colorScheme.onPrimary,
            )
            Text(
                text = service.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.80f),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@DrawableRes
private fun serviceHeroImageRes(serviceId: String): Int? =
    when (serviceId) {
        "ac-deep-clean" -> R.drawable.service_hero_ac_deep_clean
        "ac-gas-refill" -> R.drawable.service_hero_ac_gas_refill
        "ac-installation" -> R.drawable.service_hero_ac_installation
        "water-pump-repair" -> R.drawable.service_hero_water_pump_repair
        "borewell-servicing" -> R.drawable.service_hero_borewell_servicing
        "plumbing-leak-fix" -> R.drawable.service_hero_plumbing_leak_fix
        "plumbing-tap-install" -> R.drawable.service_hero_plumbing_tap_install
        "plumbing-pipe-repair" -> R.drawable.service_hero_plumbing_pipe_repair
        "electrical-fan-install" -> R.drawable.service_hero_electrical_fan_install
        "electrical-switchboard-fix" -> R.drawable.service_hero_electrical_switchboard_fix
        "electrical-wiring" -> R.drawable.service_hero_electrical_wiring
        "ro-installation" -> R.drawable.service_hero_ro_installation
        "ro-service-amc" -> R.drawable.service_hero_ro_service_amc
        else -> null
    }

@Composable
private fun ServiceMetricRow(service: Service) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ServiceMetricTile(
            label = stringResource(R.string.service_price_label),
            value = formatPrice(service.basePrice),
            emphasized = true,
            modifier = Modifier.weight(1f),
        )
        ServiceMetricTile(
            label = stringResource(R.string.service_detail_duration_caption),
            value = stringResource(R.string.service_duration_label, service.durationMinutes),
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun ServiceMetricTile(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    emphasized: Boolean = false,
) {
    Surface(
        modifier = modifier,
        shape = CardShape,
        color = if (emphasized) MaterialTheme.colorScheme.surfaceVariant else MetricNeutralBg,
        border =
            BorderStroke(
                1.dp,
                if (emphasized) MaterialTheme.colorScheme.primary.copy(alpha = 0.20f) else MaterialTheme.colorScheme.outline,
            ),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = value,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = if (emphasized) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun ServiceQualityPanel() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = stringResource(R.string.service_detail_quality_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = stringResource(R.string.service_detail_quality_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ServiceSection(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            content()
        }
    }
}

@Composable
private fun ServiceCheckRow(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(
            imageVector = Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(top = 2.dp).size(16.dp),
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun AddOnRow(
    name: String,
    price: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
        )
        Surface(
            shape = PillShape,
            color = MaterialTheme.colorScheme.surfaceVariant,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.20f)),
        ) {
            Text(
                text = "+$price",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            )
        }
    }
}

@Composable
private fun ServiceBookingBar(
    service: Service,
    onBookNow: () -> Unit,
) {
    Surface(
        shadowElevation = 12.dp,
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.service_price_label),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = formatPrice(service.basePrice),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(
                    text = stringResource(R.string.service_detail_cta_support),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.width(16.dp))
            Button(
                onClick = onBookNow,
                modifier = Modifier.height(52.dp),
                shape = PillShape,
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary,
                    ),
            ) {
                Text(
                    text = stringResource(R.string.book_now),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun ServiceDetailError() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Surface(
            modifier = Modifier.padding(24.dp),
            shape = CardShape,
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = stringResource(R.string.catalogue_error_title),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = stringResource(R.string.catalogue_error),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun ServiceDetailSkeleton(modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize()) {
        Surface(
            modifier = Modifier.fillMaxWidth().aspectRatio(1.18f),
            color = SkeletonLine,
        ) {}
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            PlaceholderLine(widthFraction = 0.36f, height = 14.dp)
            PlaceholderLine(widthFraction = 0.78f, height = 30.dp)
            PlaceholderLine(widthFraction = 0.94f, height = 16.dp)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                PlaceholderBlock(height = 72.dp, modifier = Modifier.weight(1f))
                PlaceholderBlock(height = 72.dp, modifier = Modifier.weight(1f))
            }
            repeat(3) { PlaceholderBlock(height = 112.dp) }
        }
    }
}

@Composable
private fun PlaceholderLine(
    widthFraction: Float,
    height: Dp,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(widthFraction).height(height),
        shape = PillShape,
        color = SkeletonLine,
    ) {}
}

@Composable
private fun PlaceholderBlock(
    height: Dp,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth().height(height),
        shape = CardShape,
        color = SkeletonLine,
    ) {}
}

private fun formatPrice(pricePaise: Int): String = "₹${pricePaise / 100}"
