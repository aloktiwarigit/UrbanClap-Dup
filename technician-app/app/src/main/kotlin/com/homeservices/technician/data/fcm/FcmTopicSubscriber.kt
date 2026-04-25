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

            val subscribeNew = {
                // Persist the new uid only after Firebase confirms. Without this gate,
                // a transient network/token failure would leave prefs claiming we are
                // subscribed when Firebase has no record, and the early-return at the
                // top would silently suppress retries on subsequent launches.
                FirebaseMessaging
                    .getInstance()
                    .subscribeToTopic("technician_$uid")
                    .addOnSuccessListener {
                        prefs.edit().putString(KEY_SUBSCRIBED_TECH_UID, uid).apply()
                    }
            }

            if (previous != null) {
                // Serialise unsubscribe(old) → subscribe(new) so the two callbacks
                // can't race. addOnCompleteListener fires regardless of unsubscribe
                // success — the new tech's topic still needs to be subscribed even if
                // we couldn't cleanly remove the old one (Firebase will eventually
                // reconcile via the per-installation token).
                FirebaseMessaging
                    .getInstance()
                    .unsubscribeFromTopic("technician_$previous")
                    .addOnCompleteListener { subscribeNew() }
            } else {
                subscribeNew()
            }
        }

        public fun unsubscribeTechnician() {
            val previous = prefs.getString(KEY_SUBSCRIBED_TECH_UID, null) ?: return
            FirebaseMessaging
                .getInstance()
                .unsubscribeFromTopic("technician_$previous")
                .addOnSuccessListener {
                    prefs.edit().remove(KEY_SUBSCRIBED_TECH_UID).apply()
                }
        }
    }
