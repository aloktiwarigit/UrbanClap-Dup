package com.homeservices.customer.ui.locale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class FirstLaunchLanguageScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun englishSelected_light() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                StaticFirstLaunchLayout(selectedTag = "en")
            }
        }
    }

    @Test
    public fun hindiSelected_light() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                StaticFirstLaunchLayout(selectedTag = "hi")
            }
        }
    }
}

@Composable
private fun StaticFirstLaunchLayout(selectedTag: String) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Choose your language\nभाषा चुनें",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selectedTag,
                onSelect = {},
            )
            Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                Text(text = "Continue / जारी रखें")
            }
        }
    }
}
