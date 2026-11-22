# SOTERA

SOTERA (Satu Sumber untuk Segala Tools) is a responsive front-end web prototype of a curated tools directory for students. It includes onboarding, simulated authentication, an explore catalog, saved collections, a discovery feed, an AI-style tool recommender, and account settings with English/Indonesian copy.

This is a UI/UX prototype. There is no backend, real authentication, email delivery, OTP service, or AI API. All account data lives in the browser.

## Run locally

The app is plain HTML, CSS, and JavaScript with no build step.

Option 1, Python:

```powershell
cd "D:\Coba Coba Buat aplikasi\sotera"
python -m http.server 8000
```

Then open `http://localhost:8000`.

Option 2, Node:

```powershell
npx serve .
```

You can also open `index.html` directly, but a local server is recommended so routing, fonts, and browser storage behave consistently.

Internet access is required to load Poppins from Google Fonts. Without it, the browser falls back to the system font stack.

## Demo access

- Demo email: `anna.putri@campus.edu`
- Demo password: `Sotera2025!`
- OTP demo code: `123456`
- Login accepts any valid email and any password with 6 or more characters.
- Signup requires at least 8 characters, one number, one symbol, and an email different from the demo account.

The demo account starts with eight saved tools: Notion, ChatGPT, Zotero, Figma, Canva, Miro, Overleaf, and Desmos.

## Main routes

| Route | Screen |
| --- | --- |
| `#/onboarding/1`, `#/onboarding/2` | Onboarding |
| `#/login` | Sign in |
| `#/signup` | Sign up |
| `#/forgot` | Forgot password |
| `#/home` | Home, member or guest variant |
| `#/explore` | Tool catalog, search, filters, suggestions |
| `#/collections` | Saved tools and folders |
| `#/discover` | Updates, topics, and weekly picks |
| `#/assistant` | "Bantu Cari Aku" tool recommender |
| `#/settings` | Settings hub, member or guest variant |
| `#/settings/language` | Language selection |
| `#/settings/theme` | Theme selection |
| `#/settings/account` | Account management |
| `#/settings/profile` | Profile editing |
| `#/settings/password` | Change password |
| `#/settings/email` | Change email |
| `#/settings/verify` | OTP verification |
| `#/settings/delete` | Delete account |
| `#/deleted` | Account deleted status |
| `#/help`, `#/faq`, `#/about`, `#/privacy`, `#/terms`, `#/contact` | Support and legal pages |
| `#/locked` | Guest access gate |

## Project structure

```text
sotera/
  index.html              App shell, splash screen, script loading
  assets/logo/            SOTERA logo and favicon
  css/tokens.css          Colors, type, spacing, theme, and motion tokens
  css/app.css             Layout, components, and responsive styles
  js/icons.js             Inline SVG icon registry
  js/data.js              Demo catalog, categories, collections, updates, FAQs
  js/i18n.js              English and Indonesian UI strings
  js/app.js               Router, state, rendering, forms, and interactions
```

## Interface behavior

- Hash-based SPA routing with a persistent sidebar on desktop and bottom navigation on mobile.
- Responsive layout: mobile reference width is 402px; desktop uses a sidebar and wider grids rather than a scaled-up phone view.
- Theme options: light, dark, and system. The selected theme is persisted.
- Language options: English and Indonesian. Language changes are applied on confirmation.
- Search, category, pricing, rating, and student filters are real client-side filters.
- Sheets handle filters, tool details, new folders, notifications, sessions, share, request, suggestions, logout, and account deletion.
- Toasts confirm actions. Focus styles, reduced-motion support, and semantic labels are included.
- The "Bantu Cari Aku" assistant matches queries against the local tool catalog with a short simulated delay. It does not call an AI service.

## Data and reset

State is stored under the localStorage key `sotera.prototype.v1`. It contains the user, saved tool IDs, custom folders, theme, language, and onboarding state.

To reset the prototype, open DevTools and run:

```js
localStorage.removeItem('sotera.prototype.v1');
location.href = location.pathname;
```

Deleting the account from Settings also clears the simulated user.

## Known limitations

- No backend, database, real credentials, sessions, OTP delivery, uploads, or AI responses.
- Avatar selection is simulated and profile images are not uploaded.
- Notification badges and device sessions are demo content.
- Help articles, privacy, and terms are prototype copy and not legal documents.
- External links to the real tools open the tools' official sites.

## Design references

Visual references live outside this folder in `..\Update Ui & Fitur` and `..\Update Logo Aplikasi versi 2`. See `SOTERA_UI_REFERENCE_MAP.md` for the screen-by-screen mapping and design system notes.
