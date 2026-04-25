package com.homeservices.technician.data.fcm

import android.content.Context
import android.content.SharedPreferences
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Tracks the technician_{uid} topic that the app is currently subscribed to,
 * persisting the last-subscribed uid in a dedicated SharedPreferences file
 * (separate from the auth prefs, which SessionManager.clearPrefs() wipes on
 * logout — using auth prefs would make unsubscribeTechnician() a no-op on
 * the logout path, leaving the previous tech's topic subscribed forever).
 *
 * subscribe(new) is gated on the success of unsubscribe(old): a transient
 * Firebase failure leaves prefs pointing at the old uid so the next launch
 * retries the unsubscribe rather than leaving the installation subscribed
 * to both topics. Likewise, persistence of the new uid is gated on
 * subscribe success — the early-return on equality won't suppress retries
 * after a transient failure.
 */
@Singleton
public class FcmTopicSubscriber
    @Inject
    constructor(
        @ApplicationContext context: Context,
    ) {
        private companion object {
            const val PREFS_NAME = "fcm_topic_state"
            const val KEY_SUBSCRIBED_TECH_UID = "subscribed_tech_uid"
        }

        private val prefs: SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        public fun subscribeTechnician(uid: String) {
            val previous = prefs.getString(KEY_SUBSCRIBED_TECH_UID, null)
            if (previous == uid) return

            val subscribeNew = {
                FirebaseMessaging
                    .getInstance()
                    .subscribeToTopic("technician_$uid")
                    .addOnSuccessListener {
                        prefs.edit().putString(KEY_SUBSCRIBED_TECH_UID, uid).apply()
                    }
            }

            if (previous != null) {
                // Only subscribe(new) when unsubscribe(old) succeeds. If unsub fails
                // (offline/token error), prefs still points at the old uid and the
                // next launch will retry the unsubscribe — preferable to silently
                // leaving the installation subscribed to both technicians' topics.
                FirebaseMessaging
                    .getInstance()
                    .unsubscribeFromTopic("technician_$previous")
                    .addOnSuccessListener { subscribeNew() }
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
