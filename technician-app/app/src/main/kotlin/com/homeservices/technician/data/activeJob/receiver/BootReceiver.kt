package com.homeservices.technician.data.activeJob.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.homeservices.technician.data.activeJob.service.ActiveJobForegroundService
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Restarts [ActiveJobForegroundService] after device reboot if there are pending
 * status transitions queued in Room (indicating a job was active when the device
 * was powered off).
 */
@AndroidEntryPoint
public class BootReceiver : BroadcastReceiver() {
    @Inject
    public lateinit var repository: ActiveJobRepository

    override fun onReceive(
        context: Context,
        intent: Intent,
    ) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val hasPending = repository.hasPendingTransitions.first()
                if (hasPending) {
                    ActiveJobForegroundService.start(context)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
