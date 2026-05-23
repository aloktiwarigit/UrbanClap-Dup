// FCM Web Push service worker for admin-web.
// Served from /firebase-messaging-sw.js (Next.js public/ directory).
//
// Firebase config is injected at runtime via a postMessage from the main thread
// so no build-time secrets are needed here.  The config is also persisted to
// CacheStorage so that background pushes arriving after a SW restart (with no
// page open) can still initialise Firebase and register onBackgroundMessage.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const CONFIG_CACHE = 'firebase-sw-config-v1';
const CONFIG_KEY = 'config';

async function getPersistedConfig() {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    const resp = await cache.match(CONFIG_KEY);
    if (!resp) return null;
    return resp.json();
  } catch {
    return null;
  }
}

async function persistConfig(config) {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    await cache.put(
      CONFIG_KEY,
      new Response(JSON.stringify(config), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  } catch { /* best-effort */ }
}

let messaging = null;

async function initMessaging(config) {
  if (messaging) return; // already initialised — avoid duplicate listeners
  try {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    messaging = firebase.messaging(app);
    messaging.onBackgroundMessage((payload) => {
      const { type, ...data } = payload.data ?? {};
      const title = getTitle(type) ?? 'Alert';
      self.registration.showNotification(title, {
        body: getBody(data),
        icon: '/favicon.ico',
        // Use bookingId (or type) as the notification tag so duplicates collapse.
        tag: data.bookingId ?? type ?? 'admin-alert',
      });
    });
  } catch (err) {
    console.error('[SW] Firebase init failed:', err);
  }
}

// On activate: restore config from CacheStorage so background pushes work even
// when no page is open (the postMessage path is unavailable after a SW restart).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    getPersistedConfig().then((config) => {
      if (config) return initMessaging(config);
    }),
  );
});

// On message from main thread: initialise Firebase and persist config for future
// SW restarts.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    persistConfig(config);
    initMessaging(config);
  }
});

function getTitle(type) {
  const titles = {
    SOS_ALERT: 'SOS Alert',
    OWNER_RATING_SHIELD_ALERT: 'Rating Shield Alert',
    ABUSIVE_SHIELD_ALERT: 'Abusive Shield Alert',
    APPEAL_FILED_ALERT: 'New Appeal Filed',
    OWNER_COMPLAINT_FILED: 'Complaint Filed',
    OWNER_COMPLAINT_SLA_BREACH: 'Complaint SLA Breach',
    RECON_MISMATCH_ALERT: 'Reconciliation Alert',
  };
  return titles[type] ?? type;
}

function getBody(data) {
  const parts = [];
  if (data.bookingId) parts.push(`Booking: ${data.bookingId}`);
  if (data.incidentId) parts.push(`Incident: ${data.incidentId}`);
  if (data.appealId) parts.push(`Appeal: ${data.appealId}`);
  if (data.complaintId) parts.push(`Complaint: ${data.complaintId}`);
  return parts.join(' | ') || 'See dashboard for details';
}
