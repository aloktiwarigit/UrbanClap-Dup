# Privacy Policy — HomeHeroo Technician App

**Last updated:** 21 May 2026  
**Effective date:** 21 May 2026  
**App:** HomeHeroo Technician (`in.homeheroo.technician`)  
**Data controller:** Alok Tiwari, HomeHeroo  
**Contact:** aloktiwari49@gmail.com

---

## 1. Who we are

HomeHeroo is a home-services platform connecting customers with skilled technicians across Uttar Pradesh (pilot: Ayodhya). The **HomeHeroo Technician** app is the partner-side app used by service professionals to accept jobs, navigate to customers, and manage their earnings.

This policy describes what personal information we collect, why, how long we keep it, who we share it with, and how you can exercise your rights.

---

## 2. Data we collect

### 2.1 Identity and contact information

| Data | Why | Source |
|---|---|---|
| Full name | Account creation, displayed to customers | You (during sign-up) |
| Mobile phone number | Authentication (OTP / Truecaller), job dispatch | You (during sign-up) |
| Email address | Account notifications, support contact | You (during sign-up) |

### 2.2 Government identity (KYC)

| Data | Why | Source |
|---|---|---|
| Aadhaar number (partial — last 4 digits displayed after consent) | Identity verification (KYC) | DigiLocker consent flow (Government of India API) |
| PAN card photo | KYC identity verification | You (uploaded in-app) |

Aadhaar data is processed under a one-time DigiLocker consent and is not stored beyond what is required for verification. The full Aadhaar number is never stored by HomeHeroo; only the verification status and partial identifier are retained.

### 2.3 Financial information

| Data | Why | Source |
|---|---|---|
| Bank account / UPI ID hint (last 4 digits or UPI handle) | Payout preference and cadence | You (in Settings → Payout) |
| Payout cadence preference (daily / weekly) | Scheduling payouts | You (in Settings → Payout) |

Full bank account details are never stored by HomeHeroo. Payment processing is handled by Razorpay.

### 2.4 Location data

| Data | Why | Source |
|---|---|---|
| Precise GPS location (foreground) | Job dispatch matching, navigation | Device GPS (on app start) |
| Precise GPS location (background) | Real-time location sharing with customer during an active job | Device GPS (active-job foreground service) |
| Coarse location | Service area matching | Device network/GPS |

Background location is collected **only during an active booking** via a foreground service with a persistent notification. It stops automatically when the job is marked complete and is not retained after the booking ends.

### 2.5 Media

| Data | Why | Source |
|---|---|---|
| Photos captured in-app | Job evidence (arrival, work start, completion proof) | Device camera |
| KYC document photos | Identity verification | Device camera / gallery |

Photos are uploaded to Firebase Storage and are accessible to the platform owner and the assigned customer. They are not shared with any other third party.

### 2.6 Device identifiers

| Data | Why | Source |
|---|---|---|
| Firebase Installation ID | Push notification targeting (FCM), analytics | Automatically generated |
| Android device ID | Analytics, crash correlation | Device OS |
| FCM token | Job offer push notifications | Firebase Cloud Messaging SDK |

### 2.7 Crash logs and diagnostics

| Data | Why | Source |
|---|---|---|
| Crash stack traces, exception details | App stability and debugging | Sentry (crash reporter), Firebase Crashlytics |
| App version, device model, OS version | Crash context | Automatically collected |
| User identifier in crash context | Associate crash with account for support | Set on session start |

### 2.8 In-app behaviour (analytics)

| Data | Why | Source |
|---|---|---|
| Screen views, button taps, funnel events | Product analytics, improving the app experience | PostHog (analytics SDK) |
| Feature flag assignments | A/B test group | GrowthBook (OSS feature flags, client-side only) |
| Session duration and frequency | Understanding usage patterns | PostHog |

GrowthBook operates client-side only and does not transmit PII to any external server.

---

## 3. How we use your data

We use the data listed above for the following purposes:

1. **Authentication** — verifying your identity via OTP, Truecaller, or biometric to sign you in.
2. **Job dispatch and matching** — matching you with customer bookings based on location and service profile.
3. **Active job coordination** — sharing your real-time location with the assigned customer during a job.
4. **Proof of work** — capturing and storing photo evidence at each job stage.
5. **Payments** — routing earnings to your registered payout method via Razorpay.
6. **KYC compliance** — verifying your identity before you receive bookings, per applicable regulations.
7. **Customer support** — resolving disputes, investigating complaints, and contacting you about account issues.
8. **App improvement** — analysing anonymised usage patterns to improve features and reliability.
9. **Crash diagnostics** — identifying and fixing software errors that affect your experience.

We do **not** use your data for advertising, sell it to data brokers, or share it for purposes beyond those listed above.

---

## 4. Legal basis for processing

| Processing activity | Legal basis |
|---|---|
| Authentication, account creation | Performance of contract (providing the HomeHeroo service) |
| KYC identity verification | Legal obligation (applicable financial regulations) |
| Location sharing during active job | Performance of contract (service delivery) |
| Crash diagnostics, analytics | Legitimate interest (improving app reliability and experience) |
| Aadhaar consent via DigiLocker | Consent (explicit DigiLocker consent flow) |

---

## 5. Data retention

| Data type | Retention period |
|---|---|
| Account data (name, phone, email) | Until account deletion, then 30-day soft-delete window, then permanent erasure |
| KYC documents (Aadhaar reference, PAN photo) | Until account deletion, then purged within 30 days |
| Job photos | 90 days after job completion, then purged |
| Location data | Not retained after booking ends; ephemeral only |
| Financial (payout hint) | Until account deletion |
| Crash logs and diagnostics | 90 days (Sentry retention) |
| Analytics events | 12 months (PostHog retention) |
| FCM tokens | Until account deletion or token rotation |

**Deletion policy:** When you request account deletion (see §7), we begin a **30-day soft-delete window** during which your account is deactivated but data is retained to handle any pending disputes or payment obligations. After 30 days, all personal data is permanently erased from our systems, including Firestore documents, Firebase Storage files, and authentication records. Data held by third-party processors is subject to their own retention policies.

---

## 6. Third parties with access to your data

We share data with the following third parties, each subject to their own privacy policies:

| Third party | Purpose | Data shared | Region |
|---|---|---|---|
| **Firebase (Google)** | Authentication, push notifications, crash reporting, photo storage, app configuration | Phone number, FCM token, crash logs, photos, user ID | US (Google servers) |
| **Sentry** | Crash and error reporting | Stack traces, device info, user ID | US |
| **PostHog** | Product analytics | Screen events, session data, device info | EU (PostHog Cloud EU region) |
| **GrowthBook** | Feature flags (client-side only) | Feature flag assignments (no PII transmitted externally) | OSS / local |
| **Truecaller** | Phone number verification | Mobile phone number sent to Truecaller servers for verification | India / Sweden |
| **Razorpay** | Payout processing | Bank / UPI account hint, job earnings amount | India |
| **Google Maps Platform** | Navigation, location rendering | Location coordinates during active job | US (Google servers) |
| **DigiLocker (Government of India)** | Aadhaar consent and KYC | Aadhaar consent callback, verified status | India (NIC servers) |

**Cross-border transfers:** Firebase (Google), Sentry, and PostHog process data on servers outside India. These transfers are made on the basis of standard contractual clauses or the providers' participation in recognised adequacy frameworks.

---

## 7. Your rights and choices

You have the following rights regarding your personal data:

- **Access:** Request a copy of the data we hold about you.
- **Correction:** Ask us to correct inaccurate data.
- **Deletion:** Request deletion of your account and associated data.
- **Withdrawal of consent:** Withdraw consent for Aadhaar KYC processing at any time (this will deactivate your ability to receive bookings).
- **Portability:** Request your data in a machine-readable format.
- **Objection:** Object to processing based on legitimate interest.

### How to request account deletion

**In-app (preferred):** Go to Settings → Delete my account (available from app version 0.2.0 onwards — see §8 for current workaround).

**By email:** Send a deletion request to aloktiwari49@gmail.com with subject line: `[HomeHeroo] Account deletion request — <your registered phone number>`. We will acknowledge within 48 hours and complete erasure within 30 days.

**Web form:** Submit a deletion request at: `https://aloktiwarigit.github.io/homeheroo-privacy/technician/delete-request/`

---

## 8. In-app account deletion (current status)

A dedicated in-app "Delete my account" flow is planned for app version 0.2.0. Until that version is live, account deletion is available via the email and web form process described in §7. We commit to actioning all deletion requests within 30 days.

---

## 9. Security

We implement the following security measures:

- **Encryption in transit:** All communication between the app and our servers uses HTTPS/TLS. `android:usesCleartextTraffic="false"` is enforced in the app manifest.
- **Encryption at rest:** Authentication tokens and sensitive preferences are stored using Android `EncryptedSharedPreferences` (AES-256 via Android Keystore). Firestore data is encrypted at rest by Firebase by default.
- **Access control:** Firestore Security Rules restrict data access so each technician can only access their own records.
- **Credential management:** Firebase App Check is enabled to prevent unauthorised API access.

Despite these measures, no system is perfectly secure. If you believe your account has been compromised, contact us immediately at aloktiwari49@gmail.com.

---

## 10. Children

The HomeHeroo Technician app is intended for use by adult service professionals only. We do not knowingly collect personal data from anyone under 18 years of age. If you believe a minor has created an account, please contact us and we will delete it promptly.

---

## 11. Changes to this policy

We may update this policy from time to time. When we do, we will update the "Last updated" date at the top of this page and notify registered technicians via push notification or email if the changes are material. Continued use of the app after notification constitutes acceptance of the revised policy.

---

## 12. Contact us

For any privacy-related questions, requests, or complaints:

**Email:** aloktiwari49@gmail.com  
**Response time:** Within 48 hours for general queries; within 30 days for formal data requests.

If you are not satisfied with our response, you may lodge a complaint with the relevant data protection authority in your jurisdiction.

---

*This policy applies to the HomeHeroo Technician Android app (`in.homeheroo.technician`) only. A separate policy covers the HomeHeroo Customer app.*
