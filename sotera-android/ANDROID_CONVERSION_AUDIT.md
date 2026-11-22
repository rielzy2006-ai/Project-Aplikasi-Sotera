# SOTERA Android Conversion Audit

Audit date: 2026-11-19

## Project separation

- Original web project: `D:\Project coding Perancangan aplikasi Real\sotera`
- Android conversion project: `D:\Project coding Perancangan aplikasi Real\sotera-android`
- The Android project is an independent copy. No file in the original project was modified.

## Project structure

- `index.html`: application shell, splash screen, styles, and script loading
- `css/tokens.css`: design tokens, themes, spacing, and motion
- `css/app.css`: layout, responsive behavior, components, sheets, and navigation
- `js/icons.js`: inline SVG icon registry
- `js/data.js`: local tool catalog and demo content
- `js/i18n.js`: English and Indonesian strings
- `js/app.js`: routing, state, rendering, forms, and interactions
- `assets/logo/sotera-logo.png`: main SOTERA logo
- `assets/logo/favicon.png`: favicon

## Technology

- Plain HTML5, CSS, and JavaScript
- No framework
- No build step
- No npm `package.json`
- Hash-based SPA routing
- Local application state in `localStorage`
- Google Poppins loaded from Google Fonts
- External tool links and remote favicons loaded over HTTPS
- Simulated authentication and account operations only

## Android considerations

- The application already uses viewport-fit and `100dvh`, with bottom navigation and sheet padding aligned to safe-area insets.
- The UI uses responsive breakpoints at 720 px, 1024 px, and 1080 px.
- Hash routing should work in a Capacitor WebView.
- `localStorage` must remain in the Android WebView origin so state is retained.
- External links use `target="_blank"` and must open safely through the Android browser or a browser integration.
- Tool logos and Poppins require internet access; fallback behavior is needed where remote resources are unavailable.
- No backend or API authentication is present, so the prototype should not be represented as production account functionality.
- The app has no network-status handling and does not currently detect offline mode.
- The app includes Android-relevant keyboard and back-navigation behavior that needs explicit validation.

## Required adjustments

1. Add a plain-static Capacitor project configuration and Android platform.
2. Set the web directory to the project root.
3. Configure SOTERA app name and a stable application ID.
4. Add Android network and browser link permissions/configuration where required.
5. Generate launcher assets from `assets/logo/sotera-logo.png`.
6. Configure status bar, navigation bar, splash screen, and screen orientation.
7. Test external links, offline/network behavior, keyboard, scroll, safe areas, and Android back navigation.
8. Build and verify a debug APK.
