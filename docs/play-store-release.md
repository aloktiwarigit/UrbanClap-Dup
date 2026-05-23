# Play Store Release Runbook

Last updated: 2026-05-06

This runbook covers the two Android apps in this repository:

| App | Package ID | Gradle project | First version |
|---|---|---|---|
| Customer | `in.homeheroo.customer` | `customer-app` | `versionCode = 1`, `versionName = "0.1.0"` |
| Technician | `in.homeheroo.technician` | `technician-app` | `versionCode = 2`, `versionName = "0.1.1"` |

Both apps currently use `compileSdk = 35` and `targetSdk = 35`, which is the required target level for new Google Play mobile app submissions after August 31, 2025.

## 1. One-Time Play Console Setup

Create two apps in Play Console:

- Customer app: package name `in.homeheroo.customer`
- Technician app: package name `in.homeheroo.technician`

For each app, complete:

- Play App Signing enrollment
- Store listing: name, short description, full description, screenshots, icon, feature graphic
- Privacy policy URL
- Data safety form
- App access credentials for review, if login is required
- Content rating questionnaire
- Target audience and ads declarations
- Countries and regions, including India for launch
- App category and contact details

The technician app needs extra attention in App content because it declares `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE_LOCATION`, `CAMERA`, and notification-related behavior. Prepare the background-location declaration, foreground-service declaration, in-app disclosure wording, and short review videos before production submission.

## 2. Generate Upload Keystores

Generate one upload keystore per app and keep both files/passwords backed up outside the repo.

From the repo root in PowerShell:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore customer-app\release-upload.jks `
  -storetype JKS `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -alias customer-upload

& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore technician-app\release-upload.jks `
  -storetype JKS `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -alias technician-upload
```

The `*.jks` files are ignored by Git.

## 3. Configure Local Signing

Add these values to `customer-app/local.properties`:

```properties
RELEASE_STORE_FILE=release-upload.jks
RELEASE_STORE_PASSWORD=<customer-keystore-password>
RELEASE_KEY_ALIAS=customer-upload
RELEASE_KEY_PASSWORD=<customer-key-password>
```

Add these values to `technician-app/local.properties`:

```properties
RELEASE_STORE_FILE=release-upload.jks
RELEASE_STORE_PASSWORD=<technician-keystore-password>
RELEASE_KEY_ALIAS=technician-upload
RELEASE_KEY_PASSWORD=<technician-key-password>
```

CI or scripted environments may use environment variables instead. App-specific names take precedence:

- `CUSTOMER_RELEASE_STORE_FILE`, `CUSTOMER_RELEASE_STORE_PASSWORD`, `CUSTOMER_RELEASE_KEY_ALIAS`, `CUSTOMER_RELEASE_KEY_PASSWORD`
- `TECHNICIAN_RELEASE_STORE_FILE`, `TECHNICIAN_RELEASE_STORE_PASSWORD`, `TECHNICIAN_RELEASE_KEY_ALIAS`, `TECHNICIAN_RELEASE_KEY_PASSWORD`

## 4. Build Signed App Bundles

From the repo root:

```powershell
.\tools\build-play-bundles.ps1 -Clean
```

Expected outputs:

- `customer-app\app\build\outputs\bundle\release\app-release.aab`
- `technician-app\app\build\outputs\bundle\release\app-release.aab`

Before uploading, export each upload certificate and add SHA-1/SHA-256 fingerprints wherever these apps are registered, especially Firebase Auth and Google Cloud API key restrictions:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -export -rfc `
  -keystore customer-app\release-upload.jks `
  -alias customer-upload `
  -file customer-app\customer-upload-certificate.pem

& "$env:JAVA_HOME\bin\keytool.exe" -export -rfc `
  -keystore technician-app\release-upload.jks `
  -alias technician-upload `
  -file technician-app\technician-upload-certificate.pem

& "$env:JAVA_HOME\bin\keytool.exe" -list -v `
  -keystore customer-app\release-upload.jks `
  -alias customer-upload

& "$env:JAVA_HOME\bin\keytool.exe" -list -v `
  -keystore technician-app\release-upload.jks `
  -alias technician-upload
```

The exported `*.pem` certificate files are ignored by Git.

## 5. Upload And Release

For each Play Console app:

1. Go to the release track, usually Internal testing first.
2. Create a new release.
3. Upload that app's `.aab`.
4. Confirm Play App Signing status.
5. Complete any App content alerts that appear after bundle upload.
6. Send the release for review.
7. Smoke test with internal testers.
8. Promote to Closed testing, Open testing, or Production when ready.

If the Play developer account is a newly created personal account, production access requires a closed test with at least 12 opted-in testers for 14 continuous days before applying for production access.

For production rollout, use a staged rollout first, for example 10%, monitor Sentry/API health/payment flow, then promote to 100%.

## 6. Versioning Rule

Every Play upload for the same package must use a higher `versionCode` than the previous upload.

For the first upload, `versionCode = 1` is valid. For the next release:

```kotlin
versionCode = 2
versionName = "0.1.1"
```

Update each app independently.
