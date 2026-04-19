package com.homeservices.technician

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.homeservices.technician.di.BuildInfoProvider
import com.homeservices.technician.ui.SmokeScreen
import com.homeservices.technician.ui.theme.HomeservicesTechnicianTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : ComponentActivity() {
    @Inject
    public lateinit var buildInfo: BuildInfoProvider

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesTechnicianTheme {
                SmokeScreen(buildInfo = buildInfo)
            }
        }
    }
}
