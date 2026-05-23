package com.homeservices.technician.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTimelineStep
import com.homeservices.designsystem.theme.HomeservicesColors
import com.homeservices.technician.R

private val OnboardingHeroStart = HomeservicesColors.Brand.primaryHover
private val OnboardingHeroEnd = HomeservicesColors.Brand.primary
private const val ONBOARDING_HERO_FRACTION = 0.38f
private const val ONBOARDING_FORM_FRACTION = 0.65f

@Composable
internal fun OnboardingScreen(
    modifier: Modifier = Modifier,
    onContinue: () -> Unit = {},
    viewModel: OnboardingViewModel = hiltViewModel(),
) {
    val kycQueued by viewModel.kycSubmitQueued.collectAsStateWithLifecycle()
    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(OnboardingHeroEnd)
                .statusBarsPadding(),
    ) {
        // Hero zone — gradient + decorative circles via single drawBehind
        Box(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(ONBOARDING_HERO_FRACTION)
                    .drawBehind {
                        drawRect(
                            brush = Brush.verticalGradient(listOf(OnboardingHeroStart, OnboardingHeroEnd)),
                            size = size,
                        )
                        drawCircle(
                            color = Color.White.copy(alpha = 0.06f),
                            radius = 140.dp.toPx(),
                            center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                        )
                        drawCircle(
                            color = Color.White.copy(alpha = 0.09f),
                            radius = 70.dp.toPx(),
                            center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                        )
                    },
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(
                modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 36.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "HomeHeroo Partner",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                )
                Text(
                    text = "कमाई शुरू करें",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.82f),
                )
                Text(
                    text = "Quick setup · 3 steps",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.65f),
                )
            }
        }

        // Form card — NON-scrollable: Spacer(weight(1f)) anchors the button to bottom
        Surface(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .fillMaxHeight(ONBOARDING_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = MaterialTheme.colorScheme.background,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                HsSectionCard(title = "Setup checklist") {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        HsTimelineStep("Verify identity", "Finish Aadhaar and PAN checks securely.")
                        HsTimelineStep("Go online", "Receive nearby fixed-price service jobs.")
                        HsTimelineStep("Track earnings", "Review daily payouts, ratings, and support cases.")
                    }
                }
                if (kycQueued) {
                    Text(
                        text = stringResource(R.string.onboarding_kyc_queued_offline),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 4.dp),
                    )
                }
                Spacer(Modifier.weight(1f))
                HsPrimaryButton(
                    text = "Continue setup",
                    onClick = onContinue,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(4.dp))
            }
        }
    }
}
