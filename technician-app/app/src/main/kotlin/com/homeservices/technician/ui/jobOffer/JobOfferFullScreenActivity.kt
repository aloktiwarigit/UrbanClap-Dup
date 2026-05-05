package com.homeservices.technician.ui.jobOffer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.homeservices.designsystem.theme.HomeservicesTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Full-screen Activity shown when a JOB_OFFER FCM arrives while the device is locked.
 * Declared with showWhenLocked + turnScreenOn in the manifest so it surfaces over
 * the lock screen without requiring the user to unlock first.
 *
 * Wraps the existing [JobOfferScreen] composable so all accept/decline logic
 * is shared with the in-app flow.
 */
@AndroidEntryPoint
public class JobOfferFullScreenActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesTheme {
                JobOfferScreen()
            }
        }
    }
}
