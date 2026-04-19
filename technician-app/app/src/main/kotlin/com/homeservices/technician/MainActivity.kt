package com.homeservices.technician

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.di.BuildInfoProvider
import com.homeservices.technician.ui.SmokeScreen
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : ComponentActivity() {
    @Inject
    public lateinit var buildInfo: BuildInfoProvider

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesTheme {
                SmokeScreen(buildInfo = buildInfo)
            }
        }
    }
}
