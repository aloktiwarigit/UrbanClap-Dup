package com.homeservices.technician.data.fcm

import android.content.Context
import android.content.SharedPreferences
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.atomic.AtomicInteger
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Tracks the technician_{uid} topic that the app is currently subscribed to,
 * persisting the last-subscribed uid in a dedicated SharedPreferences file
 * (separate from auth prefs, which SessionManager.clearPrefs() wipes on
 * logout).
 *
 * subscribe(new) only runs after unsubscribe(old) succeeds, and persistence
 * of the new uid only happens after Firebase confirms — a transient failure
 * leaves prefs pointing at the old uid so the next launch retries.
 *
 * A generation counter invalidates in-flight callbacks when the auth state
 * changes mid-flight: if subscribeTechnician(A) is in flight and the user
 * logs out (or switches to B) before Firebase resolves, A's success listener
 * will find that generation has advanced and refuse to mutate prefs.
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
        private val generation = AtomicInteger(0)

        public fun subscribeTechnician(uid: String) {
            val previous = prefs.getString(KEY_SUBSCRIBED_TECH_UID, null)
            if (previous == uid) return

            val myGen = generation.incrementAndGet()

            val subscribeNew = {
                FirebaseMessaging
                    .getInstance()
                    .subscribeToTopic("technician_$uid")
                    .addOnSuccessListener {
                        if (generation.get() == myGen) {
                            prefs.edit().putString(KEY_SUBSCRIBED_TECH_UID, uid).apply()
                        }
                        // else: a subsequent auth transition has invalidated this
                        // operation. Do not write stale state to prefs.
                    }
            }

            if (previous != null) {
                // Only subscribe(new) when unsubscribe(old) succeeds AND no auth
                // transition has happened since this call started. On failure or
                // invalidation, prefs still points at the old uid and the next
                // launch retries — preferable to leaving the installation subscribed
                // to two technicians' topics simultaneously.
                FirebaseMessaging
                    .getInstance()
                    .unsubscribeFromTopic("technician_$previous")
                    .addOnSuccessListener {
                        if (generation.get() == myGen) subscribeNew()
                    }
            } else {
                subscribeNew()
            }
        }

        public fun unsubscribeTechnician() {
            val myGen = generation.incrementAndGet()
            val previous = prefs.getString(KEY_SUBSCRIBED_TECH_UID, null) ?: return
            FirebaseMessaging
                .getInstance()
                .unsubscribeFromTopic("technician_$previous")
                .addOnSuccessListener {
                    if (generation.get() == myGen) {
                        prefs.edit().remove(KEY_SUBSCRIBED_TECH_UID).apply()
                    }
                }
        }
    }
