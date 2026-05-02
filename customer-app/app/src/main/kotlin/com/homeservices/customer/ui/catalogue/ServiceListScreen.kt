package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service

private val WarmIvory = Color(0xFFFFFBF5)
private val AppBarStart = Color(0xFF064A3D)
private val AppBarEnd = Color(0xFF0B6B58)
private val BrandGreen = Color(0xFF0E4F47)
private val ServiceTitle = Color(0xFF1A1A2E)
private val ServiceDescription = Color(0xFF6B7280)
private val ServiceCardBorder = Color(0xFFE8E2D8)
private val DurationChipBackground = Color(0xFFF0FDF4)
private val SkeletonLine = Color(0xFFEDE7DD)
private val ServiceCardShape = RoundedCornerShape(12.dp)
private val PillShape = RoundedCornerShape(percent = 50)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ServiceListScreen(
    viewModel: ServiceListViewModel,
    onServiceClick: (String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        containerColor = WarmIvory,
        topBar = {
            TopAppBar(
                modifier =
                    Modifier.background(
                        Brush.horizontalGradient(listOf(AppBarStart, AppBarEnd)),
                    ),
                title = {
                    Text(
                        text = stringResource(R.string.service_list_title),
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.service_detail_back_desc),
                            tint = Color.White,
                        )
                    }
                },
                colors =
                    TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        scrolledContainerColor = Color.Transparent,
                        navigationIconContentColor = Color.White,
                        titleContentColor = Color.White,
                    ),
            )
        },
    ) { innerPadding ->
        ServiceListContent(
            uiState = uiState,
            onServiceClick = onServiceClick,
            modifier = Modifier.padding(innerPadding),
        )
    }
}

@Composable
internal fun ServiceListContent(
    uiState: ServiceListUiState,
    onServiceClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = WarmIvory) {
        when (uiState) {
            is ServiceListUiState.Loading -> ServiceListSkeleton()
            is ServiceListUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = stringResource(R.string.catalogue_error),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(24.dp),
                    )
                }
            }
            is ServiceListUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(vertical = 16.dp),
                ) {
                    item {
                        Text(
                            text = stringResource(R.string.service_list_subtitle),
                            style = MaterialTheme.typography.bodyMedium,
                            color = ServiceDescription,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                        )
                    }
                    items(uiState.services, key = { it.id }) { service ->
                        ServiceCard(service = service, onClick = { onServiceClick(service.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun ServiceCard(
    service: Service,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = ServiceCardShape,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = BorderStroke(1.dp, ServiceCardBorder),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ServiceInfoColumn(
                service = service,
                modifier = Modifier.weight(1f).padding(end = 12.dp),
            )
            ServiceActionColumn(service = service, onClick = onClick)
        }
    }
}

@Composable
private fun ServiceInfoColumn(
    service: Service,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        Text(
            text = service.name,
            color = ServiceTitle,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = service.description,
            color = ServiceDescription,
            fontSize = 13.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(10.dp))
        ServiceDurationChip(durationMinutes = service.durationMinutes)
    }
}

@Composable
private fun ServiceActionColumn(
    service: Service,
    onClick: () -> Unit,
) {
    Column(horizontalAlignment = Alignment.End) {
        Text(
            text = formatPrice(service.basePrice),
            color = BrandGreen,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = onClick,
            modifier = Modifier.height(36.dp),
            shape = PillShape,
            colors =
                ButtonDefaults.buttonColors(
                    containerColor = BrandGreen,
                    contentColor = Color.White,
                ),
            elevation =
                ButtonDefaults.buttonElevation(
                    defaultElevation = 0.dp,
                    pressedElevation = 0.dp,
                ),
            contentPadding = PaddingValues(horizontal = 16.dp),
        ) {
            Text(
                text = stringResource(R.string.book_now),
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun ServiceDurationChip(durationMinutes: Int) {
    Surface(
        shape = PillShape,
        color = DurationChipBackground,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Filled.Build,
                contentDescription = null,
                tint = BrandGreen,
                modifier = Modifier.size(14.dp),
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = stringResource(R.string.service_duration_label, durationMinutes),
                color = BrandGreen,
                fontSize = 12.sp,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun ServiceImageFallback(
    name: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().padding(12.dp)) {
            Text(
                text = name.take(2).uppercase(),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun ServiceListSkeleton(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 16.dp),
    ) {
        items(3) {
            Surface(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .height(128.dp),
                shape = ServiceCardShape,
                color = Color.White,
                tonalElevation = 0.dp,
                shadowElevation = 2.dp,
                border = BorderStroke(1.dp, ServiceCardBorder),
            ) {
                Row(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 16.dp)) {
                        PlaceholderLine(widthFraction = 0.72f, height = 18.dp)
                        Spacer(Modifier.height(12.dp))
                        PlaceholderLine(widthFraction = 0.92f, height = 12.dp)
                        Spacer(Modifier.height(8.dp))
                        PlaceholderLine(widthFraction = 0.78f, height = 12.dp)
                        Spacer(Modifier.height(14.dp))
                        PlaceholderLine(widthFraction = 0.34f, height = 22.dp)
                    }
                    Column(modifier = Modifier.width(88.dp), horizontalAlignment = Alignment.End) {
                        PlaceholderLine(widthFraction = 0.78f, height = 24.dp)
                        Spacer(Modifier.height(14.dp))
                        PlaceholderLine(widthFraction = 1f, height = 36.dp)
                    }
                }
            }
        }
    }
}

@Composable
private fun PlaceholderLine(
    widthFraction: Float,
    height: androidx.compose.ui.unit.Dp,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(widthFraction).height(height),
        shape = PillShape,
        color = SkeletonLine,
    ) {}
}

private fun formatPrice(pricePaise: Int): String = "\u20B9${pricePaise / 100}"
