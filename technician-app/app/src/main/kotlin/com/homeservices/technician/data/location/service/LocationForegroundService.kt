package com.homeservices.technician.data.location.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import com.homeservices.technician.data.activeJob.ActiveJobApiService
import com.homeservices.technician.data.activeJob.LocationAttestationDto
import com.homeservices.technician.data.activeJob.dto.PostLocationRequest
import com.homeservices.technician.data.location.LocationPermissionHelper
import dagger.hilt.android.AndroidEntryPoint
import io.sentry.Sentry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
public class LocationForegroundService : Service() {
    @Inject
    internal lateinit var api: ActiveJobApiService

    @Inject
    public lateinit var locationProvider: FusedLocationProviderClient

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var currentBookingId: String? = null
    private var callback: LocationCallback? = null

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int,
    ): Int {
        val bookingId = intent?.getStringExtra(EXTRA_BOOKING_ID)
        if (bookingId == null || currentBookingId == bookingId) {
            return if (bookingId == null) START_NOT_STICKY else START_STICKY
        }
        currentBookingId = bookingId
        createNotificationChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildNotification(bookingId), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, buildNotification(bookingId))
        }
        startLocationUpdates(bookingId)
        return START_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates(bookingId: String) {
        val request =
            LocationRequest
                .Builder(LOCATION_UPDATE_INTERVAL_MS)
                .setPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY)
                .setMinUpdateDistanceMeters(MIN_UPDATE_DISTANCE_METERS)
                .build()
        val cb =
            object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    val loc = result.lastLocation ?: return
                    serviceScope.launch { pushLocation(bookingId, loc) }
                }
            }
        callback = cb
        runCatching {
            locationProvider.requestLocationUpdates(request, cb, Looper.getMainLooper())
        }
    }

    private suspend fun pushLocation(
        bookingId: String,
        loc: Location,
    ) {
        val isMock =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                loc.isMock
            } else {
                @Suppress("DEPRECATION")
                loc.isFromMockProvider
            }
        runCatching {
            api.postActiveJobLocation(
                bookingId,
                PostLocationRequest(
                    lat = loc.latitude,
                    lng = loc.longitude,
                    accuracyMeters = loc.accuracy.toDouble(),
                    capturedAt = loc.time,
                    attestation =
                        LocationAttestationDto(
                            isMock = isMock,
                            gpsAccuracyM = loc.accuracy,
                        ),
                ),
            )
        }.onFailure { Sentry.captureException(it) }
    }

    public override fun onDestroy() {
        callback?.let { locationProvider.removeLocationUpdates(it) }
        callback = null
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel =
            NotificationChannel(
                CHANNEL_ID,
                "Active job location",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Shares your location with the customer during an active booking"
                setSound(null, null)
                enableVibration(false)
            }
        nm.createNotificationChannel(channel)
    }

    private fun buildNotification(bookingId: String): Notification {
        val deepLinkUri = "homeservices://action/active-job/$bookingId"
        val tapIntent =
            Intent(Intent.ACTION_VIEW).apply {
                data = android.net.Uri.parse(deepLinkUri)
                setClass(this@LocationForegroundService, com.homeservices.technician.MainActivity::class.java)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
        val tapPi =
            PendingIntent.getActivity(
                this,
                deepLinkUri.hashCode(),
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        return NotificationCompat
            .Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle(getString(com.homeservices.technician.R.string.active_job_location_notification_title))
            .setContentText(getString(com.homeservices.technician.R.string.active_job_location_notification_body))
            .setContentIntent(tapPi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    public companion object {
        public const val CHANNEL_ID: String = "active_job_location"
        public const val EXTRA_BOOKING_ID: String = "bookingId"
        private const val NOTIFICATION_ID: Int = 2002
        private const val LOCATION_UPDATE_INTERVAL_MS: Long = 30_000L
        private const val MIN_UPDATE_DISTANCE_METERS: Float = 15f

        public fun startIfNeeded(
            context: Context,
            bookingId: String,
        ) {
            if (!LocationPermissionHelper.hasForegroundLocation(context)) return
            val intent =
                Intent(context, LocationForegroundService::class.java)
                    .putExtra(EXTRA_BOOKING_ID, bookingId)
            ContextCompat.startForegroundService(context, intent)
        }

        public fun stop(context: Context) {
            context.stopService(Intent(context, LocationForegroundService::class.java))
        }
    }
}
