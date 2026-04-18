package com.homeservices.customer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.customer.ui.SmokeScreen
import com.homeservices.customer.ui.theme.HomeservicesCustomerTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : ComponentActivity() {

    @Inject
    public lateinit var buildInfo: BuildInfoProvider

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesCustomerTheme {
                SmokeScreen(buildInfo = buildInfo)
            }
        }
    }
}
