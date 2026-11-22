# SOTERA Android Test Report

Audit date: 2026-11-19

## Completed checks

- Confirmed the original project is a plain HTML/CSS/JavaScript application.
- Confirmed no npm package manifest existed in the original project.
- Created a separate Android conversion copy.
- Verified copied source files; no original project files were modified.
- Created a Capacitor 8.6.2 project.
- Configured application name `SOTERA`.
- Configured application ID `com.sotera.app`.
- Configured static web asset directory `www`.
- Created the native Android project.
- Synchronized web assets successfully.
- Confirmed Android INTERNET permission is present.
- Confirmed app name strings are `SOTERA`.
- Added PostgreSQL-backed signup, login, logout, and session endpoints.
- Added bcrypt password hashing with cost factor 12.
- Added CSRF token validation and signed HTTP-only session cookies.
- Added server-side `admin`, `mahasiswa`, and `tamu` role definitions.
- Added parameterized PostgreSQL queries.
- Added Helmet, CSP, HTTPS configuration, and Android cleartext protection.
- Added daily and weekly backup schedules with optional AES-256-CBC encryption.

## Build attempt

The Gradle debug build was started.

Result: the build stopped before compilation because no Android SDK location was configured.

Error:

> SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in the project's local properties file.

No debug APK exists yet. No APK location is claimed as verified.

## Not executed

- Emulator or physical-device launch
- Splash screen visual validation
- Login and signup validation
- Hash-route navigation validation
- External browser-link validation
- Offline/network handling validation
- Android keyboard behavior
- Android back-button behavior
- Safe-area validation
- Launcher icon visual validation
- Debug APK installation

These items require the Android SDK and a configured emulator or physical Android device.

## Remaining blocker

Install Android SDK Platform 36, Platform-Tools, and Build-Tools in Android Studio, then rerun:

```powershell
cd D:\Project coding Perancangan aplikasi Real\sotera-android
npm run sync
npm run build:apk
```
