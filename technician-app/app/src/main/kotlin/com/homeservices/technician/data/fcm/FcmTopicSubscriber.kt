package com.homeservices.technician.data.fcm

import android.content.SharedPreferences
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.technician.data.auth.di.AuthPrefs
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Tracks the technician_{uid} topic that the app is currently subscribed to,
 * persisting the last-subscribed uid in SharedPreferences so it survives
 * process death.
 *
 * Without this, a logout → login-as-different-tech sequence (within or across
 * process lifetimes) leaves the previous tech's topic subscribed on Firebase's
 * side, so the new tech's app receives pushes intended for the previous tech.
 */
@Singleton
public class FcmTopicSubscriber
    @Inject
    constructor(
        @AuthPrefs private val prefs: SharedPreferences,
    ) {
        private companion object {
            const val KEY_SUBSCRIBED_TECH_UID = "fcm_subscribed_tech_uid"
        }

        public fun subscribeTechnician(uid: String) {
            val previous = prefs.getString(KEY_SUBSCRIBED_TECH_UID, null)
            if (previous == uid) return
            if (previous != null) {
                FirebaseMessaging.getInstance().unsubscribeFromTopic("technician_$previous")
            }
            FirebaseMessaging.getInstance().subscribeToTopic("technician_$uid")
            prefs.edit().putString(KEY_SUBSCRIBED_TECH_UID, uid).apply()
        }

        public fun unsubscribeTechnician() {
            val previous = prefs.getString(KEY_SUBSCRIBED_TECH_UID, null) ?: return
            FirebaseMessaging.getInstance().unsubscribeFromTopic("technician_$previous")
            prefs.edit().remove(KEY_SUBSCRIBED_TECH_UID).apply()
        }
    }
