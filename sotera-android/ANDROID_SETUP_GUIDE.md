# SOTERA Android Setup Guide

## Project locations

- Web source copy: `D:\Project coding Perancangan aplikasi Real\sotera-android`
- Static Android web assets: `D:\Project coding Perancangan aplikasi Real\sotera-android\www`
- Native Android project: `D:\Project coding Perancangan aplikasi Real\sotera-android\android`

The original project at `D:\Project coding Perancangan aplikasi Real\sotera` was not modified.

## Requirements

- Node.js and npm
- Android Studio
- Android SDK Platform 36
- Android SDK Build-Tools 36 or a compatible installed version
- Android SDK Platform-Tools
- JDK 21 or the JDK bundled with Android Studio

Install or verify these components in Android Studio under **SDK Manager** before building.

## Configure SDK

1. Open Android Studio.
2. Open **SDK Manager**.
3. Install **Android 16/API 36** SDK Platform.
4. In **SDK Tools**, install Android SDK Platform-Tools and Android SDK Build-Tools.
5. Set `ANDROID_HOME` or `ANDROID_SDK_ROOT` to the SDK directory, normally `%LOCALAPPDATA%\Android\Sdk`.
6. Restart the terminal or VS Code.

If the SDK is installed elsewhere, create or update `android\local.properties`:

```properties
sdk.dir=C:\\Path\\To\\Android\\Sdk
```

Use the JDK bundled with Android Studio if Gradle reports a Java compatibility issue.

## Run and sync

From `D:\Project coding Perancangan aplikasi Real\sotera-android`:

```powershell
npm install
npm run sync
npm run open:android
```

`npm run sync` copies `www` into the native project and updates Capacitor plugins.

## Build debug APK

After SDK configuration:

```powershell
cd android
.\gradlew.bat assembleDebug
```

The expected debug APK location is:

`android\app\build\outputs\apk\debug\app-debug.apk`

Do not use the APK location until the file exists and is verified.

## Open in Android Studio

Open `D:\Project coding Perancangan aplikasi Real\sotera-android\android` as the Android project folder.

## Application identity

- App name: SOTERA
- Application ID: `com.sotera.app`
- Minimum SDK: 24
- Target and compile SDK: 36

## Secure backend setup

1. Install PostgreSQL and create a database for SOTERA.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Set a random `SESSION_SECRET` of at least 32 characters.
4. Set `API_ALLOWED_ORIGINS` to the HTTPS origins that may call the API.
5. Run `npm run migrate`.
6. Start development with `npm start`.
7. In production, set `NODE_ENV=production`, `TLS_CERT_PATH`, and `TLS_KEY_PATH`.

The backend provides:

- Argon2-compatible strength via bcrypt password hashes in PostgreSQL
- Password signup and login with server-side validation
- HTTP-only, signed session cookies
- CSRF double-protection
- Parameterized PostgreSQL queries
- Helmet security headers and CSP
- Role-based authorization for `admin`, `mahasiswa`, and `tamu`
- Audit logging
- Daily and weekly backup schedules

For Android, set `window.SOTERA_API_URL` to your deployed HTTPS API origin before bundling or configure it in the WebView bootstrap. Do not configure the application to use plain HTTP in production.
