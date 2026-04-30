package com.homeservices.technician.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTimelineStep

@Composable
internal fun OnboardingScreen(
    modifier: Modifier = Modifier,
    onContinue: () -> Unit = {},
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Start earning with HomeServices", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text(
                "Complete verification, set your availability, and accept jobs matched to your skills and location.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            HsSectionCard(title = "Setup checklist") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    HsTimelineStep("Verify identity", "Finish Aadhaar and PAN checks securely.")
                    HsTimelineStep("Go online", "Receive nearby fixed-price service jobs.")
                    HsTimelineStep("Track earnings", "Review daily payouts, ratings, and support cases.")
                }
            }
            Spacer(Modifier.weight(1f))
            HsPrimaryButton(text = "Continue setup", onClick = onContinue, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(4.dp))
        }
    }
}
