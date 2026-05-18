/**
 * Admin Web — FCM Web Push device registration.
 *
 * Registers the owner's browser with FCM so they receive SOS / shield alerts
 * even when the admin tab is in the background.
 *
 * All failures are best-effort: a push registration error must NEVER break the
 * auth flow.
 */

import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { getFirebaseApp } from './auth/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const DEVICE_REGISTER_PATH = '/admin-api/v1/devices/register';

/**
 * Register this browser tab as an FCM push target.
 * Call on successful admin login, passing the fresh Firebase ID token.
 */
export async function registerAdminPushToken(idToken: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (!VAPID_KEY) {
    console.warn('[push] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping push registration');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Wait until the service worker is active so postMessage reaches it.
    const sw = await waitForActiveServiceWorker(registration);
    sw.postMessage({ type: 'FIREBASE_CONFIG', config: getFirebaseApp().options });

    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    await fetch(DEVICE_REGISTER_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ deviceToken: token, platform: 'web' }),
    });
  } catch (err: unknown) {
    console.warn('[push] device registration failed:', err);
  }
}

/**
 * De-register this browser's FCM token.
 * Call before admin logout so the device stops receiving alerts after sign-out.
 */
export async function unregisterAdminPushToken(idToken: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!VAPID_KEY) return;

  try {
    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);
    if (!token) return;

    await Promise.all([
      deleteToken(messaging),
      fetch(`/admin-api/v1/devices/${encodeURIComponent(token)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      }),
    ]);
  } catch (err: unknown) {
    console.warn('[push] device unregister failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the active ServiceWorker, waiting for it to activate if needed.
 * Resolves immediately if the SW is already active.
 */
function waitForActiveServiceWorker(
  registration: ServiceWorkerRegistration,
): Promise<ServiceWorker> {
  return new Promise((resolve) => {
    const sw = registration.active ?? registration.installing ?? registration.waiting;
    if (registration.active) {
      resolve(registration.active);
      return;
    }
    const candidate = sw;
    if (!candidate) {
      // No service worker at all — resolve with a no-op stub to avoid hanging.
      resolve({ postMessage: () => undefined } as unknown as ServiceWorker);
      return;
    }
    candidate.addEventListener('statechange', function onStateChange() {
      if (candidate.state === 'activated') {
        candidate.removeEventListener('statechange', onStateChange);
        // registration.active is now set after the statechange
        resolve(registration.active ?? candidate);
      }
    });
  });
}
