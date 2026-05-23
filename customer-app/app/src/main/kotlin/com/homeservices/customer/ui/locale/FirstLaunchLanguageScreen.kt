package com.homeservices.customer.ui.locale

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard
import com.homeservices.designsystem.theme.LocalHomeservicesExtendedColors

private const val LANG_HERO_FRACTION = 0.30f
private const val LANG_FORM_FRACTION = 0.72f

@Composable
private fun LangHeroZone() {
    val heroStart = LocalHomeservicesExtendedColors.current.brandPrimaryHover
    val heroEnd = MaterialTheme.colorScheme.primary
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .fillMaxHeight(LANG_HERO_FRACTION)
                .drawBehind {
                    drawRect(brush = Brush.verticalGradient(listOf(heroStart, heroEnd)), size = size)
                    drawCircle(
                        color = Color.White.copy(alpha = 0.06f),
                        radius = 140.dp.toPx(),
                        center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.09f),
                        radius = 70.dp.toPx(),
                        center =
                            Offset(
                                40.dp.toPx(),
                                size.height - 20.dp.toPx(),
                            ),
                    )
                },
        contentAlignment = Alignment.BottomStart,
    ) {
        Column(modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            HsScreenTitle(text = "HomeHeroo", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.onPrimary)
            Text(
                text = "भाषा चुनें",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.82f),
            )
        }
    }
}

@Composable
public fun FirstLaunchLanguageScreen(
    onConfirmed: () -> Unit,
    viewModel: FirstLaunchLanguageViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val confirmed by viewModel.confirmedFlow.collectAsStateWithLifecycle()

    LaunchedEffect(confirmed) {
        if (confirmed) {
            viewModel.confirmedFlow.value = false
            onConfirmed()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primary).statusBarsPadding()) {
        LangHeroZone()
        Surface(
            modifier = Modifier.fillMaxWidth().align(Alignment.BottomCenter).fillMaxHeight(LANG_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = MaterialTheme.colorScheme.background,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp).padding(top = 28.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "Choose your language",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    text = "Language can be changed anytime from Settings.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                LanguagePickerCard(options = DefaultLanguageOptions, selectedTag = selected, onSelect = viewModel::onSelect)
                Spacer(modifier = Modifier.weight(1f))
                HsPrimaryButton(text = "Continue", onClick = viewModel::onConfirm, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}
