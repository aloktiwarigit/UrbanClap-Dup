// FCM Web Push service worker for admin-web.
// Served from /firebase-messaging-sw.js (Next.js public/ directory).
// Firebase config is injected at runtime via a postMessage from the main thread
// so no build-time secrets are needed here.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

let messaging;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    const app = firebase.initializeApp(event.data.config);
    messaging = firebase.messaging(app);
    messaging.onBackgroundMessage((payload) => {
      const data = payload.data ?? {};
      const { type, ...rest } = data;
      const title = getAlertTitle(type) ?? 'Alert';
      self.registration.showNotification(title, {
        body: Object.keys(rest).length ? JSON.stringify(rest) : undefined,
        icon: '/favicon.ico',
        // Use bookingId (or type) as the notification tag so duplicates collapse.
        tag: data.bookingId ?? type ?? 'admin-alert',
      });
    });
  }
});

/**
 * Map FCM notification type codes to human-readable titles.
 * @param {string | undefined} type
 * @returns {string | undefined}
 */
function getAlertTitle(type) {
  const titles = {
    SOS_ALERT: 'SOS Alert',
    OWNER_RATING_SHIELD_ALERT: 'Rating Shield Alert',
    ABUSIVE_SHIELD_ALERT: 'Abusive Shield Alert',
    APPEAL_FILED_ALERT: 'New Appeal Filed',
    OWNER_COMPLAINT_FILED: 'Complaint Filed',
    OWNER_COMPLAINT_SLA_BREACH: 'Complaint SLA Breach',
    RECON_MISMATCH_ALERT: 'Reconciliation Alert',
  };
  return titles[type];
}
