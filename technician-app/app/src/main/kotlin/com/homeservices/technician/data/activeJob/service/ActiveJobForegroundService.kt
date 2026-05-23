package com.homeservices.technician.data.activeJob.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.homeservices.technician.MainActivity
import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.data.sync.OutboxSyncWorker
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Foreground service that keeps the active-job flow alive while a technician
 * is on a job. Responsibilities:
 *  - Posts a persistent "on the job" notification via startForeground()
 *  - Enqueues [OutboxSyncWorker] whenever network becomes available
 *  - Cancels its coroutine scope on destroy
 */
@AndroidEntryPoint
public class ActiveJobForegroundService : Service() {
    @Inject
    public lateinit var repository: ActiveJobRepository

    @Inject
    public lateinit var connectivityObserver: ConnectivityObserver

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    public override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int,
    ): Int {
        createNotificationChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, buildNotification())
        }
        observeConnectivity()
        return START_STICKY
    }

    private fun observeConnectivity() {
        serviceScope.launch {
            connectivityObserver.isAvailable.collect { available ->
                if (available) enqueueOutboxSync()
            }
        }
    }

    private fun enqueueOutboxSync() {
        val request = OneTimeWorkRequestBuilder<OutboxSyncWorker>().build()
        WorkManager
            .getInstance(applicationContext)
            .enqueueUniqueWork(OutboxSyncWorker.WORK_NAME, ExistingWorkPolicy.KEEP, request)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel =
                NotificationChannel(
                    CHANNEL_ID,
                    "Active Job",
                    NotificationManager.IMPORTANCE_LOW,
                ).apply {
                    description = "Shows while a technician is on an active job"
                }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): android.app.Notification {
        val intent =
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        return NotificationCompat
            .Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentTitle("काम जारी है")
            .setContentText("आपकी जॉब चल रही है")
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }

    public override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    public companion object {
        public const val CHANNEL_ID: String = "active_job_service"
        private const val NOTIFICATION_ID: Int = 2001

        public fun start(context: Context) {
            val intent = Intent(context, ActiveJobForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        public fun stop(context: Context) {
            context.stopService(Intent(context, ActiveJobForegroundService::class.java))
        }
    }
}
