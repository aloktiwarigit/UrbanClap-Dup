package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service

// ── Colour tokens (shared with ServiceListScreen) ─────────────────────────────
private val PhotoServiceBrandGreen = Color(0xFF0B3D2E)
private val PhotoServiceTitle = Color(0xFF18231F)
private val PhotoServiceDescription = Color(0xFF5F6C66)
private val PhotoServiceCardBorder = Color(0xFFDED8CD)
private val PhotoServiceDurationBg = Color(0xFFE8F1EC)
private val PhotoServiceCardShape = RoundedCornerShape(12.dp)
private val PhotoServicePillShape = RoundedCornerShape(percent = 50)
private val PhotoServicePlaceholderBg = Color(0xFFEDE7DD)

/**
 * Photo-first service card (E16-S03, AC-2).
 *
 * Renders a tall card with a hero [AsyncImage] at the top loaded from [Service.imageUrl].
 * Below the hero: service name, short description, duration chip, price, and book button —
 * preserving the same layout tokens as the existing [ServiceCard] in ServiceListScreen.
 *
 * Fallback: initials placeholder tile when [Service.imageUrl] is blank or the CDN load fails.
 *
 * Gated behind `customer.photo-first-catalogue.enabled` (caller responsible for the gate).
 */
@Composable
internal fun PhotoFirstServiceCard(
    service: Service,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = PhotoServiceCardShape,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = BorderStroke(1.dp, PhotoServiceCardBorder),
    ) {
        Column {
            PhotoServiceHeroImage(service = service)
            PhotoServiceInfoBlock(service = service, onClick = onClick)
        }
    }
}

@Composable
private fun PhotoServiceHeroImage(service: Service) {
    var imageLoadFailed by remember { mutableStateOf(false) }
    val showImage = shouldRenderCdnImage(service.imageUrl) && !imageLoadFailed

    if (showImage) {
        AsyncImage(
            model = service.imageUrl,
            contentDescription = stringResource(R.string.service_image_desc, service.name),
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxWidth().height(164.dp),
            onState = { state ->
                if (state is AsyncImagePainter.State.Error) {
                    imageLoadFailed = true
                }
            },
        )
    } else {
        PhotoServiceFallbackHero(name = service.name)
    }
}

@Composable
private fun PhotoServiceFallbackHero(name: String) {
    Surface(
        modifier = Modifier.fillMaxWidth().height(164.dp),
        color = PhotoServicePlaceholderBg,
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxSize().padding(12.dp),
        ) {
            Text(
                text = name.take(2).uppercase(),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = PhotoServiceBrandGreen.copy(alpha = 0.40f),
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun PhotoServiceInfoBlock(
    service: Service,
    onClick: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Text(
            text = service.name,
            color = PhotoServiceTitle,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = service.description,
            color = PhotoServiceDescription,
            fontSize = 13.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(10.dp))
        PhotoServiceActionRow(
            durationMinutes = service.durationMinutes,
            basePrice = service.basePrice,
            onClick = onClick,
        )
    }
}

@Composable
private fun PhotoServiceActionRow(
    durationMinutes: Int,
    basePrice: Int,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        PhotoServiceDurationChip(
            durationMinutes = durationMinutes,
            modifier = Modifier.weight(1f),
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = formatServicePrice(basePrice),
            color = PhotoServiceBrandGreen,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
        Spacer(Modifier.width(10.dp))
        Button(
            onClick = onClick,
            modifier = Modifier.height(36.dp),
            shape = PhotoServicePillShape,
            colors =
                ButtonDefaults.buttonColors(
                    containerColor = PhotoServiceBrandGreen,
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
private fun PhotoServiceDurationChip(
    durationMinutes: Int,
    modifier: Modifier = Modifier,
) {
    Surface(
        shape = PhotoServicePillShape,
        color = PhotoServiceDurationBg,
        modifier = modifier,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Filled.Build,
                contentDescription = null,
                tint = PhotoServiceBrandGreen,
                modifier = Modifier.size(14.dp),
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = stringResource(R.string.service_duration_label, durationMinutes),
                color = PhotoServiceBrandGreen,
                fontSize = 12.sp,
                maxLines = 1,
            )
        }
    }
}

private const val PAISE_PER_RUPEE = 100

private fun formatServicePrice(pricePaise: Int): String = "₹${pricePaise / PAISE_PER_RUPEE}"
