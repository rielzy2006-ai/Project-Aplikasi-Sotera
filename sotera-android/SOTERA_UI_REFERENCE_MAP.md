# SOTERA UI Reference Map

This document maps each implemented screen to its visual reference and its main implementation. The PNG files are design references only. They are not used as page backgrounds; every screen is built from HTML, CSS, and inline SVG components.

## Source of truth

- Branding and visual language: `..\Update Logo Aplikasi versi 2\SOTERA App Branding Style Guide.png`
- Screen designs: `..\Update Ui & Fitur\*.png`
- Logo assets used by the app: `assets\logo\sotera-logo.png` and `assets\logo\favicon.png`
- Design tokens: `css/tokens.css`
- Components and responsive rules: `css/app.css`
- Routing and screen rendering: `js/app.js`
- Demo content: `js/data.js`
- English/Indonesian copy: `js/i18n.js`
- Icon registry: `js/icons.js`

## Screen map

| Screen | Route | Reference image | Implementation notes |
| --- | --- | --- | --- |
| Launch splash | Initial load | `Update splash screen 1.png`, `Update splash screen 2.png` | `#launch` in `index.html`; logo, wordmark, tagline, and loader fade out after boot |
| Onboarding | `#/onboarding/1`, `#/onboarding/2` | `Update View Open app.png` | Two-step introduction with skip, next, start, and guest entry actions |
| Guest home | `#/home` without a user | `Update Before Masuk ( Home ).png` | Guest directory hero, search, locked assistant prompt, signup CTA, categories, and featured tools |
| Sign in | `#/login` | `Update Log in.png` | Email/password form, show-password toggle, remember-me option, Google and SSO demo actions |
| Sign up | `#/signup` | `Update Sign Up.png` | Name, email, password, confirmation, strength feedback, terms consent, and validation |
| Forgot password | `#/forgot` | `Update Forgot Password.png` | Email form with demo success sheet and back-to-login action |
| Guest access gate | `#/locked` | `Update Halaman Akses.png` | Explains member-only features with login and signup actions |
| Member home | `#/home` signed in | `Update Home.png` | Greeting, streak, search, saved tools, categories, weekly picks, and tip card |
| Explore | `#/explore` | `Update Explore Tools.png` | Live search, category chips, sort control, filter sheet, tool cards, and suggest-a-tool card |
| Filter sheet | `#/explore` overlay | `Update Explore Tools.png` | Category, pricing, rating, and student filters with reset and apply actions |
| Collections before saving | `#/collections` empty state | `Update Before Collections.png` | Empty collection state with exploration prompt |
| Collections | `#/collections` | `Update Collections.png` | Saved tools, folder tabs, new-folder sheet, and tool detail sheet |
| Discover before updates | `#/discover` initial state | `Update Before Discover.png` | Discovery feed entry state and weekly feature area |
| Discover | `#/discover` | `Update Discover for you.png` | Update cards, topic chips, weekly feature cards, and prompt section |
| Bantu Cari Aku | `#/assistant` | `Update Bantu Cari Aku.png` | Simulated chat, prompt inspiration cards, result filters, recommendation cards, and demo note |
| Settings | `#/settings` | `Update Settings.png` | Profile summary, theme, language, account, notifications, sessions, share, request, help, and logout |
| Settings for guests | `#/settings` without a user | `Update Settings.png` | Guest account prompt with sign-in and signup actions while appearance and language remain available |
| Language | `#/settings/language` | `Update Bahasa.png` | English and Indonesian options, apply, and cancel behavior |
| Theme | `#/settings/theme` | `Update Tema.png` | Light, dark, and system options with reset |
| Account management | `#/settings/account` | `Update Kelola akun.png` | Profile, email, password, delete account, and account information sections |
| Profile | `#/settings/profile` | `Update Profil Akun.png` | Name, email, campus, major, avatar picking, and save confirmation |
| Change password | `#/settings/password` | `Update Change Password.png` | Current/new/confirmation fields, live strength meter, and demo note |
| Password success | `#/settings/password/done` | `Update password - Success.png` | Success status page with account and home actions |
| Change email | `#/settings/email` | `Update Change Email.png` | New email, confirmation, password, and validation |
| Verify email | `#/settings/verify` | `Send verification code.png` | Six OTP inputs, demo code `123456`, countdown, resend, and error handling |
| Email success | `#/settings/email/done` | `Update Change Email.png` | Success status page showing the updated email |
| Delete account | `#/settings/delete` | `hapus akun.png`, `Update Konfirmasi Terakhir.png` | Consequence list, warning panel, and final confirmation sheet |
| Account deleted | `#/deleted` | `Update Notifikasi Akun sudah Terhapus.png` | Deletion status page with signup and home actions |
| Notifications | Sheet from top bar | `Update Settings.png` | Notification list with unread and mark-read behavior |
| Help center | `#/help` | No dedicated PNG | Built from the settings/card system; includes article and FAQ entry points |
| FAQ | `#/faq` | No dedicated PNG | Accordion using the shared card and disclosure styles |
| About | `#/about` | No dedicated PNG | Brand story, values, and version information using shared components |
| Privacy | `#/privacy` | No dedicated PNG | Legal-style content layout derived from the typography system |
| Terms | `#/terms` | No dedicated PNG | Legal-style content layout derived from the typography system |
| Contact | `#/contact` | No dedicated PNG | Contact form, validation, and success toast/sheet feedback |

## Shared component mapping

| Component | Reference treatment | Implementation |
| --- | --- | --- |
| App shell | Sidebar on desktop, bottom navigation on mobile, top bar on mobile | `sidebar()`, `bottomNav()`, `mobileTopbar()`, `shell()` in `js/app.js` |
| Floating assistant button | Purple pill with sparkles and two-line label | `aiFab()` and `.ai-fab` in `css/app.css` |
| Cards | White cards, lavender borders, soft purple shadows, rounded corners | `.card`, `.tool-card`, `.feature-card`, `.prompt-card`, `.cat-card` |
| Primary actions | Indigo-to-violet gradient, pill or rounded rectangle | `.btn-primary`, `--grad-primary` |
| Secondary actions | Lavender or white surfaces with indigo text | `.btn-soft`, `.btn-ghost` |
| Accent moments | Orange badges, highlights, and warm feature cards | `.badge-grad`, `.fc-warm`, `--accent`, `--accent-soft` |
| Sheets | Bottom sheet on mobile, centered dialog on desktop | `openSheet()`, `closeSheet()`, `#sheet-root` |
| Toasts | Compact confirmation with icon and message | `toast()` and `#toast-root` |
| Form fields | Label, helper text, error state, and inline SVG icons | `inputField()`, validation helpers, `.field` |
| Status pages | Centered orb, eyebrow, title, description, and actions | `statusPage()` |
| Icons | Inline SVG, consistent stroke style, no emoji | `window.icon()` in `js/icons.js` |

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#4F46E5` | Main actions, active navigation, links |
| Light purple | `#8B5CF6` | Gradients, highlights, decorative accents |
| Lavender | `#EDE9FE` | Soft surfaces, icon tiles, selected states |
| Accent | `#F97316` | Badges, emphasis, warm cards |
| Light orange | `#FED7AA` | Warm tinted backgrounds |
| Text | `#0F172A` | Primary copy |
| Muted | `#64748B` | Secondary copy and metadata |
| Font | Poppins | All interface typography |
| Mobile reference width | `402px` | Design review baseline for phone layouts |
| Desktop breakpoint | `1024px` and above | Persistent sidebar and wider content grids |

Dark mode, OLED black mode, high-contrast adjustments, and reduced-motion handling are defined in `css/tokens.css` using `data-theme`, `data-oled`, `data-contrast`, and `data-motion` attributes.

## Responsive intent

- Mobile keeps the 402px reference composition: stacked sections, bottom navigation, floating assistant button, and bottom sheets.
- Tablet expands grids and spacing without introducing the sidebar too early.
- Desktop uses a 268px sidebar, hides bottom navigation and the mobile top bar, widens the content area, and increases grid density.
- Horizontal chip rows remain scrollable by design; the page itself must not overflow horizontally.

## Copy and localization

- UI labels and reusable page copy are stored in `window.SOTERA_I18N` in `js/i18n.js`.
- Screen-specific copy that is not part of the shared translation set lives in the `C` dictionary in `js/app.js`.
- Dynamic catalog copy comes from `window.SOTERA_DATA` in `js/data.js`.
- Place names, tool names, and product names are intentionally kept in their original form.

## Prototype boundaries

- All visual states are simulated in the browser.
- Authentication, OTP, avatar upload, notifications, sessions, and tool recommendations do not call external services.
- No reference PNG is embedded as UI content; the interface is component-based and responsive.
