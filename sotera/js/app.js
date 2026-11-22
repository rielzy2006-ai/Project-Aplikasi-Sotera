/* =========================================================
   SOTERA â€” application logic
   Front-end prototype. All accounts, verification and data
   are simulated locally in the browser (localStorage).
   ========================================================= */
(function () {
  'use strict';

  var icon = window.icon;
  var DATA = window.SOTERA_DATA;
  var I18N = window.SOTERA_I18N;

  var KEY = 'sotera.prototype.v1';
  var LOGO = 'assets/logo/sotera-logo.png';
  var DEMO_PASS = 'Sotera2025!';
  var DEMO = { name: 'Anna Putri', username: 'annaputri', email: 'anna.putri@campus.edu', joined: 'Sep 2025' };
  var SEED = ['notion', 'chatgpt', 'zotero', 'figma', 'canva', 'miro', 'overleaf', 'desmos'];

  var DEFAULT_STATE = {
    onboarded: false,
    lang: 'en',
    theme: 'light',
    contrast: false,
    motion: 'full',
    oled: false,
    user: null,
    avatar: null,
    saved: [],
    customFolders: [],
    settings: { toolUpdates: true, notifications: true }
  };

  var state = loadState();
  var ui = {
    q: '',
    cat: 'all',
    pricing: [],
    rating: 0,
    studentOnly: false,
    sort: 'popular',
    folder: 'all',
    cq: '',
    chat: null,
    assistantFilter: 'all',
    pendingEmail: '',
    code: '123456',
    searchHelp: ''
  };
  var lastHash = null;
  var timers = [];
  var sheetTimer = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULT_STATE, { settings: Object.assign({}, DEFAULT_STATE.settings) });
      var parsed = JSON.parse(raw);
      var merged = Object.assign({}, DEFAULT_STATE, parsed);
      merged.settings = Object.assign({}, DEFAULT_STATE.settings, parsed.settings || {});
      if (!Array.isArray(merged.saved)) merged.saved = [];
      if (!Array.isArray(merged.customFolders)) merged.customFolders = [];
      return merged;
    } catch (e) {
      return Object.assign({}, DEFAULT_STATE, { settings: Object.assign({}, DEFAULT_STATE.settings) });
    }
  }

  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage may be unavailable */ }
  }

  function clearState() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function t(key) {
    var pack = I18N[state.lang] || I18N.en;
    if (pack && pack[key] !== undefined) return pack[key];
    if (I18N.en && I18N.en[key] !== undefined) return I18N.en[key];
    return key;
  }

  function x(key) {
    var pack = C[state.lang] || C.en;
    if (pack && pack[key] !== undefined) return pack[key];
    return C.en[key] !== undefined ? C.en[key] : key;
  }

  function initials(name) {
    return String(name || 'S')
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); }).join('') || 'S';
  }

  function fmtCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k';
    return String(n);
  }

  function firstName() {
    return state.user ? String(state.user.name || 'Student').split(' ')[0] : 'Guest';
  }

  function applyTheme() {
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var effective = state.theme === 'system' ? (prefersDark ? 'dark' : 'light') : state.theme;
    var root = document.documentElement;
    root.setAttribute('data-theme', effective);
    root.setAttribute('data-contrast', state.contrast ? 'true' : 'false');
    root.setAttribute('data-motion', state.motion === 'reduced' ? 'reduced' : 'full');
    root.setAttribute('data-oled', state.oled ? 'true' : 'false');
    root.setAttribute('lang', state.lang === 'id' ? 'id' : 'en');
  }

  function clearTimers() {
    timers.forEach(function (id) { clearInterval(id); clearTimeout(id); });
    timers = [];
  }

  function go(path) {
    var target = '#/' + String(path).replace(/^#\/?/, '');
    if (location.hash === target) renderApp();
    else location.hash = target;
  }

  function parseHash() {
    var raw = (location.hash || '#/home').replace(/^#\/?/, '');
    var parts = raw.split('?');
    return { path: parts[0] || 'home', params: new URLSearchParams(parts[1] || '') };
  }

  function toast(message, iconName) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = icon(iconName || 'check') + '<span>' + esc(message) + '</span>';
    root.appendChild(node);
    setTimeout(function () {
      node.classList.add('out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 260);
    }, 2600);
  }

  function openSheet(options) {
    var root = document.getElementById('sheet-root');
    if (!root) return;
    if (sheetTimer) { clearTimeout(sheetTimer); sheetTimer = null; }
    var head = '<div class="sheet-grab"></div><div class="sheet-head"><div><h2>' + (options.title || '') + '</h2>' +
      (options.sub ? '<div class="sub">' + options.sub + '</div>' : '') + '</div>' +
      '<div class="sheet-head-actions"><button class="icon-btn" data-close-sheet aria-label="' + esc(t('common.close')) + '">' + icon('x') + '</button></div></div>';
    root.innerHTML = '<div class="sheet-backdrop" data-close-sheet></div><div class="sheet" role="dialog" aria-modal="true">' +
      head + '<div class="sheet-body">' + (options.body || '') + '</div>' +
      (options.foot ? '<div class="sheet-foot">' + options.foot + '</div>' : '') + '</div>';
    root.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function closeSheet() {
    var root = document.getElementById('sheet-root');
    if (!root) return;
    root.classList.remove('open');
    document.body.classList.remove('no-scroll');
    sheetTimer = setTimeout(function () { root.innerHTML = ''; }, 320);
  }

  function avatarHtml(sizeClass, bg) {
    var cls = 'avatar' + (sizeClass ? ' ' + sizeClass : '');
    if (state.avatar) {
      return '<span class="' + cls + '" style="background-image:url(' + esc(state.avatar) + ');background-size:cover;background-position:center;color:transparent">' + esc(initials(state.user && state.user.name)) + '</span>';
    }
    return '<span class="' + cls + '"' + (bg ? ' style="background:' + bg + '"' : '') + '>' + esc(initials(state.user && state.user.name)) + '</span>';
  }

  function pageTitleFor(path) {
    var map = {
      home: 'nav.home', explore: 'explore.title', collections: 'collections.title', discover: 'discover.title',
      assistant: 'assistant.title', settings: 'settings.title', help: 'help.title', faq: 'faq.title',
      about: 'about.title', privacy: 'privacy.title', terms: 'terms.title', contact: 'contact.title',
      login: 'common.login', signup: 'common.signup', forgot: x('auth.forgotTitle'),
      locked: 'locked.title', deleted: 'deleted.title'
    };
    if (path === 'settings/language') return t('language.title');
    if (path === 'settings/theme') return t('theme.title');
    if (path === 'settings/account') return t('account.title');
    if (path === 'settings/profile') return t('profile.title');
    if (path === 'settings/password') return t('password.title');
    if (path === 'settings/password/done') return x('password.updatedTitle');
    if (path === 'settings/email') return t('email.title');
    if (path === 'settings/email/done') return x('email.updatedTitle');
    if (path === 'settings/verify') return t('verify.title');
    if (path === 'settings/delete') return t('delete.title');
    if (path.indexOf('onboarding') === 0) return 'SOTERA';
    return map[path] ? t(map[path]) : 'SOTERA';
  }

  function activeFor(path) {
    if (path.indexOf('settings') === 0) return 'settings';
    if (path === 'assistant') return 'assistant';
    if (path === 'collections') return 'collections';
    if (path === 'discover') return 'discover';
    if (path === 'explore') return 'explore';
    return 'home';
  }

  /* ---------- shell pieces ---------- */

  function brandBlock() {
    return '<a class="brand" href="#/home"><img src="' + LOGO + '" alt="SOTERA" /><div><div class="brand-name">SOTERA</div><div class="brand-sub">' + esc(t('brand.tagline')) + '</div></div></a>';
  }

  function mobileTopbar() {
    var actions = '<button class="icon-btn" data-action="search" aria-label="' + esc(t('common.search')) + '">' + icon('search') + '</button>' +
      '<button class="icon-btn" data-action="notifications" aria-label="' + esc(t('common.notifications')) + '">' + icon('bell') + '</button>';
    if (state.user) {
      actions += '<button class="avatar" data-action="open-profile" aria-label="' + esc(t('settings.manageProfile')) + '"' +
        (state.avatar ? ' style="background-image:url(' + esc(state.avatar) + ');background-size:cover;color:transparent"' : '') + '>' + esc(initials(state.user.name)) + '</button>';
    } else {
      actions += '<a class="btn btn-primary btn-sm" href="#/login">' + esc(t('common.login')) + '</a>';
    }
    return '<header class="mobile-topbar">' + brandBlock() + '<div class="topbar-actions">' + actions + '</div></header>';
  }

  function navItems() {
    return [
      { id: 'home', label: t('nav.home'), icon: 'home', href: '#/home' },
      { id: 'explore', label: t('nav.explore'), icon: 'compass', href: '#/explore' },
      { id: 'collections', label: t('nav.collections'), icon: 'bookmark', href: '#/collections' },
      { id: 'discover', label: t('nav.discover'), icon: 'sparkles', href: '#/discover' },
      { id: 'settings', label: t('nav.settings'), icon: 'settings', href: '#/settings' }
    ];
  }

  function sidebar(active) {
    var items = navItems().map(function (item) {
      var extra = item.id === 'collections' && state.user && state.saved.length
        ? '<span class="badge badge-lg side-badge">' + state.saved.length + '</span>' : '';
      return '<a class="side-item' + (active === item.id ? ' is-active' : '') + '" href="' + item.href + '">' +
        icon(item.icon) + '<span>' + esc(item.label) + '</span>' + extra + '</a>';
    }).join('');
    var userBlock = state.user
      ? '<div class="side-user" data-action="open-profile" role="button" tabindex="0">' + avatarHtml('') +
        '<div class="grow"><div class="u-name">' + esc(state.user.name) + '</div><div class="u-mail truncate">' + esc(state.user.email) + '</div></div>' + icon('chevron-right', 'chev') + '</div>'
      : '<div class="side-user" data-action="go-login" role="button" tabindex="0">' +
        '<span class="avatar">G</span><div class="grow"><div class="u-name">' + esc(t('common.guest')) + '</div><div class="u-mail">' + esc(x('shell.guestSub')) + '</div></div>' + icon('arrow-right', 'chev') + '</div>';
    return '<aside class="sidebar"><a class="sidebar-brand" href="#/home"><img src="' + LOGO + '" alt="SOTERA" /><div><div class="brand-name">SOTERA</div><div class="brand-sub">' + esc(t('brand.tagline')) + '</div></div></a>' +
      '<nav class="side-nav"><div class="side-label section-label">' + esc(t('nav.browse')) + '</div>' + items +
      '<div class="side-label section-label">' + esc(t('nav.workspace')) + '</div>' +
      '<a class="side-item' + (active === 'assistant' ? ' is-active' : '') + '" href="#/assistant">' + icon('sparkles') + '<span>' + esc(t('nav.assistant')) + '</span><span class="badge side-badge">' + esc(x('shell.new')) + '</span></a>' +
      '<a class="side-item' + (active === 'settings' ? ' is-active' : '') + '" href="#/settings">' + icon('settings') + '<span>' + esc(t('nav.settings')) + '</span></a></nav>' +
      '<div class="side-foot">' + userBlock + '</div></aside>';
  }

  function bottomNav(active) {
    var items = navItems().map(function (item) {
      return '<a class="nav-item' + (active === item.id ? ' is-active' : '') + '" href="' + item.href + '" aria-label="' + esc(item.label) + '">' +
        '<span class="nav-dot"></span>' + icon(item.icon) + '<span>' + esc(item.label) + '</span></a>';
    }).join('');
    return '<nav class="bottomnav">' + items + '</nav>';
  }

  function aiFab(active) {
    if (['home', 'explore', 'collections', 'discover'].indexOf(active) === -1) return '';
    return '<a class="ai-fab" href="#/assistant"><span class="ai-fab-ico">' + icon('sparkles') + '</span><span class="fab-lines"><span>' + esc(t('nav.assistant')) + '</span><span>' + esc(x('shell.fabSub')) + '</span></span></a>';
  }

  function shell(content, active) {
    return '<div class="app-shell">' + sidebar(active) + '<div class="app-body">' + mobileTopbar() + content + bottomNav(active) + aiFab(active) + '</div></div>';
  }

  function mainPage(content, extraClass) {
    return '<main class="page' + (extraClass ? ' ' + extraClass : '') + '">' + content + '</main>';
  }

  function backRow(href, label) {
    return '<div class="back-row"><a class="back-btn" href="' + href + '">' + icon('arrow-left') + '<span>' + esc(label || t('common.back')) + '</span></a></div>';
  }

  function sectionHead(title, linkHref, linkLabel) {
    return '<div class="section-head"><h2>' + esc(title) + '</h2>' +
      (linkHref ? '<a class="link" href="' + linkHref + '">' + esc(linkLabel || t('common.seeAll')) + icon('arrow-right') + '</a>' : '') + '</div>';
  }

  /* ---------- tool helpers ---------- */

  function toolById(id) {
    for (var i = 0; i < DATA.tools.length; i++) if (DATA.tools[i].id === id) return DATA.tools[i];
    return null;
  }

  function catById(id) {
    for (var i = 0; i < DATA.categories.length; i++) if (DATA.categories[i].id === id) return DATA.categories[i];
    return null;
  }

  function priceTag(tool) {
    if (tool.pricing === 'Free') return '<span class="tool-tag t-free">' + esc(t('common.free')) + '</span>';
    if (tool.pricing === 'Free for Students') return '<span class="tool-tag t-paid">' + esc(t('common.students')) + '</span>';
    return '<span class="tool-tag">' + esc(t('common.freemium')) + '</span>';
  }

  function normalizeToolSourceUrl(value) {
    if (DATA && typeof DATA.normalizeSourceUrl === 'function') return DATA.normalizeSourceUrl(value);
    if (!value || typeof value !== 'string') return '';
    var trimmed = value.trim();
    if (!trimmed) return '';
    if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)) trimmed = 'https://' + trimmed;
    try {
      var url = new URL(trimmed);
      return ['http:', 'https:'].indexOf(url.protocol) !== -1 ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function extractToolDomain(value) {
    if (DATA && typeof DATA.extractDomain === 'function') return DATA.extractDomain(value);
    var url = normalizeToolSourceUrl(value);
    if (!url) return '';
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  function resolveToolLogoUrl(tool) {
    if (!tool) return '';
    if (tool.logoUrl && /^https?:\/\//i.test(tool.logoUrl)) return tool.logoUrl;
    if (DATA && typeof DATA.resolveToolLogo === 'function') return DATA.resolveToolLogo(tool);
    var domain = tool.domain || extractToolDomain(tool.sourceUrl || tool.url || '');
    return domain ? 'https://www.google.com/s2/favicons?sz=128&domain_url=' + encodeURIComponent('https://' + domain) : '';
  }

  function resolveToolFaviconUrl(tool) {
    var sourceUrl = normalizeToolSourceUrl(tool && (tool.sourceUrl || tool.url || tool.domain));
    return sourceUrl ? 'https://www.google.com/s2/favicons?sz=128&domain_url=' + encodeURIComponent(sourceUrl) : '';
  }

  function logoSpan(tool, size) {
    var logoUrl = resolveToolLogoUrl(tool);
    var faviconUrl = resolveToolFaviconUrl(tool);
    var cls = 'tool-logo' + (size ? ' ' + size : '');
    if (logoUrl) cls += ' has-image';
    var initials = esc(tool.initial || initials(tool.name));
    if (logoUrl) {
      return '<span class="' + cls + '" style="--tile:' + esc(tool.tile || 'var(--grad-primary)') + '" aria-label="' + esc(tool.name) + '">' +
        '<img src="' + esc(logoUrl) + '" data-tool-id="' + esc(tool.id) + '" data-fallback-src="' + esc(faviconUrl !== logoUrl ? faviconUrl : '') + '" alt="' + esc(tool.name) + '" loading="lazy" decoding="async" />' +
        '<span class="tool-logo-fallback" aria-hidden="true">' + icon('globe') + '</span>' +
        '</span>';
    }
    return '<span class="' + cls + '" style="--tile:' + esc(tool.tile || 'var(--grad-primary)') + '" aria-label="' + esc(tool.name) + '">' + initials + '</span>';
  }

  function handleToolLogoError(event) {
    var img = event.target;
    if (!img || !img.matches || !img.matches('.tool-logo img')) return;
    var tool = toolById(img.getAttribute('data-tool-id'));
    var fallbackUrl = img.getAttribute('data-fallback-src');
    if (fallbackUrl && !img.dataset.fallbackTried) {
      img.dataset.fallbackTried = 'true';
      if (tool) {
        tool.logoUrl = fallbackUrl;
        tool.logoSource = 'favicon';
        tool.isLogoVerified = false;
      }
      img.src = fallbackUrl;
      return;
    }
    if (tool) {
      tool.logoUrl = '';
      tool.logoSource = 'fallback';
      tool.isLogoVerified = false;
    }
    img.style.display = 'none';
    img.parentNode.classList.add('fallback');
  }

  function toolLogoButton(tool) {
    return '<button class="tool-logo-button" data-action="tool" data-id="' + esc(tool.id) + '" aria-label="' + esc(tool.name) + '">' +
      logoSpan(tool) + '</button>';
  }

  function ratingInline(tool) {
    return '<span class="rating-inline">' + icon('star') + esc(tool.rating.toFixed(1)) + '</span>';
  }

  function savedOn(id) { return state.saved.indexOf(id) !== -1; }

  function saveButton(tool, extra) {
    return '<button class="fav-btn' + (savedOn(tool.id) ? ' on' : '') + (extra ? ' ' + extra : '') + '" data-action="save" data-save-btn="' + esc(tool.id) + '" aria-label="' + esc(t('collections.title')) + '">' + icon('bookmark') + '</button>';
  }

  function ensureSeed() {
    if (!state.saved.length) state.saved = SEED.slice();
  }

  function toggleSave(id) {
    if (!state.user) {
      toast(x('auth.saveGuest'), 'lock');
      setTimeout(function () { go('locked'); }, 550);
      return;
    }
    var idx = state.saved.indexOf(id);
    if (idx === -1) {
      state.saved.push(id);
      toast(x('toast.saved'));
    } else {
      state.saved.splice(idx, 1);
      state.customFolders.forEach(function (folder) {
        var fi = folder.tools ? folder.tools.indexOf(id) : -1;
        if (fi !== -1) folder.tools.splice(fi, 1);
      });
      toast(x('toast.removed'));
    }
    saveState();
    syncSaveButtons();
  }

  function syncSaveButtons() {
    document.querySelectorAll('[data-save-btn]').forEach(function (btn) {
      var on = savedOn(btn.getAttribute('data-save-btn'));
      btn.classList.toggle('on', on);
      if (btn.classList.contains('btn')) {
        btn.innerHTML = icon('bookmark') + '<span>' + esc(on ? x('common.saved') : t('common.save')) + '</span>';
        btn.classList.toggle('btn-outline', !on);
        btn.classList.toggle('btn-soft', on);
      }
    });
    document.querySelectorAll('[data-saved-count]').forEach(function (node) {
      node.textContent = state.saved.length;
    });
  }

  function toolCard(tool) {
    var cat = catById(tool.cat);
    return '<article class="tool-card">' +
      toolLogoButton(tool) +
      '<div class="tool-main">' +
      '<div class="tool-top"><div class="grow" data-action="tool" data-id="' + esc(tool.id) + '" role="button" tabindex="0">' +
      '<div class="tool-name">' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</div>' +
      '<div class="tool-url">' + esc(tool.domain) + '</div></div>' + saveButton(tool) + '</div>' +
      '<p class="tool-desc clamp-2">' + esc(tool.tagline) + '</p>' +
      '<div class="tool-bottom"><div class="tool-tags">' + priceTag(tool) +
      (tool.student ? '<span class="tool-tag">' + esc(t('common.students')) + '</span>' : '') +
      (cat ? '<span class="tool-tag">' + esc(cat.short) + '</span>' : '') + '</div>' +
      '<span class="tool-rate">' + icon('star') + esc(tool.rating.toFixed(1)) + ' <span>(' + fmtCount(tool.reviews) + ')</span></span></div>' +
      '</div></article>';
  }

  function openTool(id) {
    var tool = toolById(id);
    if (!tool) return;
    var cat = catById(tool.cat);
    var features = (tool.features || []).map(function (f) {
      return '<div class="detail-feat"><span class="df-ico">' + icon('check') + '</span><span>' + esc(f) + '</span></div>';
    }).join('');
    var on = savedOn(tool.id);
    var body = '<div class="detail-head">' + logoSpan(tool, 'lg') + '<div class="dh-main">' +
      '<h2>' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</h2>' +
      '<div class="detail-url">' + esc(tool.domain) + '</div>' +
      '<div class="detail-meta-row">' + priceTag(tool) +
      (tool.student ? '<span class="badge badge-accent">' + icon('graduation-cap') + esc(t('common.students')) + '</span>' : '') +
      (cat ? '<span class="badge badge-neutral">' + esc(cat.name) + '</span>' : '') +
      (tool.verified ? '<span class="badge badge-success">' + icon('shield') + esc(t('common.verified')) + '</span>' : '') +
      '</div></div></div>' +
      '<div class="detail-actions"><a class="btn btn-primary" href="' + esc(tool.url) + '" target="_blank" rel="noopener">' + icon('external-link') + '<span>' + esc(x('tool.open')) + '</span></a>' +
      '<button class="btn ' + (on ? 'btn-soft' : 'btn-outline') + '" data-action="save" data-save-btn="' + esc(tool.id) + '">' + icon('bookmark') + '<span>' + esc(on ? x('common.saved') : t('common.save')) + '</span></button></div>' +
      '<section class="detail-section"><h3>' + esc(x('tool.about')) + '</h3><p>' + esc(tool.desc) + '</p></section>' +
      '<section class="detail-section"><h3>' + esc(x('tool.features')) + '</h3><div class="detail-feats">' + features + '</div></section>' +
      '<section class="detail-section"><h3>' + esc(x('tool.stats')) + '</h3><div class="detail-stats">' +
      '<div class="detail-stat"><div class="ds-val">' + esc(tool.rating.toFixed(1)) + '</div><div class="ds-lab">' + esc(x('tool.rating')) + '</div></div>' +
      '<div class="detail-stat"><div class="ds-val">' + fmtCount(tool.reviews) + '</div><div class="ds-lab">' + esc(x('tool.reviews')) + '</div></div>' +
      '<div class="detail-stat"><div class="ds-val">' + esc(tool.platforms.length) + '</div><div class="ds-lab">' + esc(x('tool.platforms')) + '</div></div>' +
      '</div></section>' +
      '<div class="detail-source">' + icon('shield') + '<span>' + esc(x('tool.source')) + ' ' + esc(tool.domain) + '</span></div>';
    openSheet({ title: x('tool.detail'), sub: esc(tool.tagline), body: body });
  }

  /* ---------- router ---------- */

  function renderApp() {
    clearTimers();
    var route = parseHash();
    var hash = location.hash || '#/home';
    var external = hash !== lastHash;
    lastHash = hash;
    if (external && document.getElementById('sheet-root').classList.contains('open')) closeSheet();
    if (route.path.indexOf('onboarding') === 0 && !state.onboarded) {
      state.onboarded = true;
      saveState();
    }
    if (route.path !== 'settings/language' && ui.langBefore) {
      ui.langBefore = null;
      ui.langChoice = null;
    }
    if (external && route.path === 'explore') {
      ui.q = route.params.get('q') || '';
      ui.cat = route.params.get('cat') || 'all';
    }
    var html;
    switch (route.path) {
      case 'onboarding/1': html = renderOnboarding(1); break;
      case 'onboarding/2': html = renderOnboarding(2); break;
      case 'login': html = renderLogin(); break;
      case 'signup': html = renderSignup(); break;
      case 'forgot': html = renderForgot(); break;
      case 'home': html = renderHome(); break;
      case 'explore': html = renderExplore(); break;
      case 'collections': html = renderCollections(); break;
      case 'discover': html = renderDiscover(); break;
      case 'assistant': html = state.user ? renderAssistant() : renderLocked(); break;
      case 'settings': html = renderSettings(); break;
      case 'settings/language': html = renderLanguage(); break;
      case 'settings/theme': html = renderTheme(); break;
      case 'settings/account': html = state.user ? renderAccount() : renderLocked(); break;
      case 'settings/profile': html = state.user ? renderProfile() : renderLocked(); break;
      case 'settings/password': html = state.user ? renderPassword() : renderLocked(); break;
      case 'settings/password/done': html = state.user ? renderPasswordDone() : renderLocked(); break;
      case 'settings/email': html = state.user ? renderEmail() : renderLocked(); break;
      case 'settings/verify': html = state.user ? renderVerify() : renderLocked(); break;
      case 'settings/email/done': html = state.user ? renderEmailDone() : renderLocked(); break;
      case 'settings/delete': html = state.user ? renderDelete() : renderLocked(); break;
      case 'deleted': html = renderDeleted(); break;
      case 'locked': html = renderLocked(); break;
      case 'help': html = renderHelp(); break;
      case 'faq': html = renderFaq(); break;
      case 'about': html = renderAbout(); break;
      case 'privacy': html = renderPrivacy(); break;
      case 'terms': html = renderTerms(); break;
      case 'contact': html = renderContact(); break;
      default: html = renderHome(); break;
    }
    document.getElementById('app').innerHTML = html;
    document.title = route.path.indexOf('onboarding') === 0 ? 'SOTERA - Satu Sumber untuk Segala Tools' : pageTitleFor(route.path) + ' - SOTERA';
    window.scrollTo(0, 0);
    syncTopbar();
    if (route.path === 'explore' && external && route.params.get('tool')) {
      var toolId = route.params.get('tool');
      setTimeout(function () { openTool(toolId); }, 120);
    }
    if (route.path === 'settings/verify') startVerifyTimer();
    if (route.path === 'settings/theme') {
      document.querySelectorAll('[data-theme-choice]').forEach(function (node) {
        node.classList.toggle('is-active', node.getAttribute('data-theme-choice') === state.theme);
      });
    }
  }

  function syncTopbar() {
    var bar = document.querySelector('.mobile-topbar');
    if (!bar) return;
    var handler = function () { bar.classList.toggle('scrolled', window.scrollY > 6); };
    window.removeEventListener('scroll', syncTopbar._handler || function () {});
    syncTopbar._handler = handler;
    window.addEventListener('scroll', handler, { passive: true });
    handler();
  }

  /* ---------- extra copy (kept beside the app for prototype-specific text) ---------- */
  var C = {
    en: {
      'shell.guestSub': 'Guest mode - browse freely',
      'shell.new': 'New',
      'shell.fabSub': 'Find my tool',
      'shell.guestNav': 'Sign in',
      'onb.skip': 'Skip',
      'onb.eyebrow1': 'YOUR ACADEMIC TOOLKIT',
      'onb.title1': 'One Source for All Your Tools',
      'onb.desc1': 'Discover, save, and organize the best research, writing, design, and productivity tools in one clean student workspace.',
      'onb.p1': '39 curated tools',
      'onb.p2': '8 categories',
      'onb.p3': 'Local demo',
      'onb.eyebrow2': 'CURATED FOR STUDENTS',
      'onb.title2': 'Find the Right Tool Without the Endless Tabs',
      'onb.desc2': 'Search a verified directory, build collections, and let the local assistant suggest a study stack in seconds.',
      'onb.next': 'Continue',
      'onb.start': 'Get Started',
      'onb.have': 'Already have an account?',
      'onb.signin': 'Sign in',
      'onb.cardAi': 'AI Tools',
      'onb.cardAiSub': 'Explain & summarize',
      'onb.cardCite': 'Citations',
      'onb.cardCiteSub': 'Thesis ready',
      'onb.cardDesign': 'Design',
      'onb.cardDesignSub': 'Slides & posters',
      'onb.stat': 'Tools saved by students this week',
      'onb.saved': 'Saved',
      'onb.verified': 'Verified',
      'onb.collections': 'Collections',
      'onb.rating': 'Avg. rating',
      'auth.brandEyebrow': 'SOTERA STUDENT PLATFORM',
      'auth.brandTitle': 'Your entire academic toolkit, finally in one place.',
      'auth.brandDesc': 'From thesis citations to lecture notes, discover the tools students actually use and keep them organized.',
      'auth.feat1': 'Curated and verified tool directory',
      'auth.feat2': 'Smart local assistant for study stacks',
      'auth.feat3': 'Student-only perks and discounts',
      'auth.quote': 'Built for students, with students.',
      'auth.loginTitle': 'Welcome Back',
      'auth.loginSub': 'Sign in to continue building your academic toolkit.',
      'auth.emailPh': 'you@campus.edu',
      'auth.passPh': 'Enter your password',
      'auth.remember': 'Keep me signed in',
      'auth.forgot': 'Forgot password?',
      'auth.noAccount': 'No account yet?',
      'auth.createFree': 'Create one free',
      'auth.demoHint': 'Demo account is prefilled. Any valid email and a 6+ character password work in this prototype.',
      'auth.google': 'Continue with Google',
      'auth.googleNote': 'Google sign-in is simulated locally.',
      'auth.guest': 'Continue as Guest',
      'auth.welcome': 'Welcome back, ',
      'auth.guestWelcome': 'Browsing as guest',
      'auth.signupTitle': 'Create Your Account',
      'auth.signupSub': 'Join a campus-ready directory of tools, collections, and study workflows.',
      'auth.namePh': 'Your full name',
      'auth.name': 'Full Name',
      'auth.signupPassHint': 'At least 8 characters, with a number and a symbol.',
      'auth.terms': 'I agree to the Terms & Conditions and Privacy Policy of this prototype.',
      'auth.hasAccount': 'Already have an account?',
      'auth.signin': 'Sign in',
      'auth.signupCta': 'Create Free Account',
      'auth.forgotTitle': 'Reset Password',
      'auth.forgotSub': 'Enter your campus email and we will simulate sending a reset link.',
      'auth.forgotSend': 'Send Reset Link',
      'auth.forgotBack': 'Back to sign in',
      'auth.forgotSent': 'Reset link simulated',
      'auth.strWeak': 'Weak',
      'auth.strFair': 'Fair',
      'auth.strGood': 'Good',
      'auth.strStrong': 'Strong',
      'auth.reqLen': '8+ characters',
      'auth.reqNum': 'One number',
      'auth.reqSym': 'One symbol',
      'auth.errEmail': 'Enter a valid email address.',
      'auth.errPass': 'Password must be at least 6 characters.',
      'auth.errName': 'Enter your full name.',
      'auth.errTerms': 'Please accept the terms to continue.',
      'auth.errMatch': 'Passwords do not match.',
      'auth.errCurrent': 'Enter your current password.',
      'auth.errCode': 'Enter the 6-digit demo code.',
      'auth.errUsername': 'Use 3-24 letters, numbers, dots or underscores.',
      'auth.saveGuest': 'Sign in to save tools to your collections.',
      'auth.signedIn': 'Welcome back',
      'auth.signedOut': 'You have been signed out.',
      'auth.accountCreated': 'Account created. Welcome to SOTERA.',
      'auth.emailInUse': 'This email is already used by the demo account.',
      'common.saved': 'Saved',
      'common.on': 'On',
      'common.off': 'Off',
      'common.all': 'All',
      'common.results': 'results',
      'common.filter': 'Filter',
      'common.demoNote': 'Demo data',
      'tool.detail': 'Tool detail',
      'tool.open': 'Open official site',
      'tool.about': 'About this tool',
      'tool.features': 'Key features',
      'tool.stats': 'At a glance',
      'tool.rating': 'Rating',
      'tool.reviews': 'Reviews',
      'tool.platforms': 'Platforms',
      'tool.source': 'Official source:',
      'toast.saved': 'Saved to your collections.',
      'toast.removed': 'Removed from your collections.',
      'toast.langChanged': 'Language preferences applied.',
      'toast.themeSaved': 'Theme preferences saved.',
      'toast.themeReset': 'Theme reset to defaults.',
      'toast.profileSaved': 'Profile updated.',
      'toast.passwordSaved': 'Password updated successfully.',
      'toast.emailCode': 'Demo code sent: 123456',
      'toast.messageSent': 'Message saved locally.',
      'toast.suggestion': 'Suggestion saved locally. Thank you!',
      'toast.request': 'Tool request saved locally. Thank you!',
      'toast.folderCreated': 'Collection created.',
      'toast.linkSimulated': 'This action is simulated in the prototype.',
      'toast.signedIn': 'Signed in successfully.',
      'toast.guest': 'Guest mode enabled.',
      'home.studentLabel': 'STUDENT WORKSPACE',
      'home.streakSuffix': 'day streak',
      'home.week': 'This week',
      'home.browseAll': 'Browse all',
      'home.popularSub': 'Jump into a study need',
      'home.featuredSub': 'Hand-picked for campus work',
      'home.trendingSub': 'Most opened by students',
      'home.recentSub': 'Fresh in the directory',
      'home.tipsEyebrow': 'FAST THESIS TIPS',
      'home.tipsTitle': 'Build a citation pipeline before you write',
      'home.tipsBody': 'Collect sources in Zotero, map them with Connected Papers, then draft in Overleaf. A repeatable stack saves hours every week.',
      'home.guestSignIn': 'Sign in to save',
      'home.seeTools': 'Explore tools',
      'explore.all': 'All Tools',
      'explore.filterTitle': 'Filter Tools',
      'explore.filterSub': 'Narrow the directory to your exact study need.',
      'explore.category': 'Category',
      'explore.pricing': 'Pricing',
      'explore.audience': 'Student perks',
      'explore.ratingLabel': 'Minimum rating',
      'explore.studentOnly': 'Student-friendly only',
      'explore.apply': 'Show results',
      'explore.resetFilters': 'Reset',
      'explore.active': 'active',
      'explore.filtersApplied': 'Filters applied.',
      'explore.filtersReset': 'Filters reset.',
      'explore.freeOnly': 'Free',
      'explore.freemiumOnly': 'Freemium',
      'explore.studentPlans': 'Free for Students',
      'explore.anyRating': 'Any',
      'explore.rating4': '4.0+',
      'explore.rating45': '4.5+',
      'collections.newTitle': 'New Collection',
      'collections.newSub': 'Create a folder for a course, project, or study workflow.',
      'collections.nameLabel': 'Collection name',
      'collections.namePh': 'e.g. Thesis References',
      'collections.iconLabel': 'Choose an icon',
      'collections.pickTools': 'Add saved tools',
      'collections.create': 'Create Collection',
      'collections.emptyFolder': 'No tools in this collection yet',
      'collections.emptyFolderSub': 'Save tools from Explore, then add them here.',
      'collections.guestCta': 'Create a free account to start saving.',
      'collections.guestBadge': 'MEMBER FEATURE',
      'collections.benefitCloud': 'Sync saved tools across phone and laptop',
      'collections.benefitFolders': 'Dedicated folders for research, thesis, and assignments',
      'collections.benefitAssistant': 'Personalized recommendations from the local assistant',
      'collections.countOne': 'tool',
      'collections.countMany': 'tools',
      'collections.sortRecent': 'Recently saved',
      'collections.sortName': 'Name A-Z',
      'collections.sortCat': 'Category',
      'collections.deleteFolder': 'Delete collection',
      'collections.emptyList': 'No saved tools yet',
      'collections.emptyListSub': 'Bookmark a tool in Explore and it will appear here.',
      'discover.live': 'Live',
      'discover.personalized': 'PERSONALIZED PICK',
      'discover.heroTitle': 'Thesis Research Stack',
      'discover.heroDesc': 'A research workflow matched to your writing interest: search, map, cite, and draft in one loop.',
      'discover.openCanvas': 'Open Canvas',
      'discover.quickSub': 'Tools you opened recently',
      'discover.updatesSub': 'Release notes and student offers',
      'discover.memberOnly': 'Member view',
      'discover.guestCta': 'Sign in to personalize',
      'discover.matched': 'Matched your Writing & Research interest',
      'discover.recommendSub': 'Based on saved tools and campus activity',
      'asst.demo': 'Local demo assistant',
      'asst.resultsTitle': 'Recommended tools',
      'asst.why': 'Why it fits',
      'asst.noResults': 'No tools matched that request yet. Try a broader keyword such as research, design, or coding.',
      'asst.thinking': 'Finding tools in the local catalog...',
      'asst.allTools': 'All Tools',
      'asst.studentOnly': 'Students Only',
      'asst.freeDiscount': 'Free / Discount',
      'asst.found': 'Here are three verified tools that match your need. All links open the official provider site.',
      'asst.placeholder': 'Tell me which tools you are looking for...',
      'asst.example': 'Example: free tools to paraphrase international journal papers',
      'asst.send': 'Send',
      'asst.count': 'tools in the local catalog',
      'asst.tryAgain': 'Ask another way',
      'set.version': 'SOTERA v1.0 - Prototype',
      'set.prototype': 'Front-end demo. Accounts and data stay on this device.',
      'set.memberSince': 'Verified student',
      'set.themeValue': 'Theme',
      'set.languageValue': 'Language',
      'set.on': 'On',
      'set.off': 'Off',
      'set.sessionsTitle': 'Active Sessions',
      'set.sessionsBody': 'This prototype keeps a single local session. No server-side sessions exist.',
      'set.thisDevice': 'This browser',
      'set.activeNow': 'Active now',
      'set.shareTitle': 'Share a Resource',
      'set.shareSub': 'Share a tool with your student peers.',
      'set.shareName': 'Resource name',
      'set.shareUrl': 'Official URL',
      'set.shareNote': 'Why is it useful?',
      'set.shareSend': 'Share Resource',
      'set.requestTitle': 'Request a Tool',
      'set.requestSub': 'Tell the curation team what to add next.',
      'set.requestName': 'Tool name',
      'set.requestReason': 'What should it help students do?',
      'set.requestSend': 'Submit Request',
      'set.guestTitle': 'Sign in to manage your account',
      'set.guestDesc': 'Saved tools, preferences, security settings, and the assistant workspace unlock with a free account.',
      'set.logoutConfirm': 'Sign out of SOTERA?',
      'set.logoutDesc': 'Your saved tools stay in the local demo state until you create an account again.',
      'set.logoutYes': 'Sign Out',
      'set.logoutNo': 'Keep me signed in',
      'set.notifOn': 'Email and in-app alerts',
      'set.toolUpdatesOn': 'Trending alerts and AI releases',
      'set.savedToast': 'Preference saved.',
      'profile.bio': 'Short bio',
      'profile.bioPh': 'Tell peers what you study or build.',
      'profile.updated': 'Profile saved.',
      'profile.photoUpdated': 'Photo updated.',
      'profile.photoRemoved': 'Photo removed.',
      'password.updatedTitle': 'Password updated',
      'password.updatedDesc': 'Your demo password has been changed locally. Use the new password next time you sign in on this device.',
      'password.updatedBack': 'Back to account',
      'password.demoNote': 'Prototype note: the current password is accepted as long as it is not empty. Nothing is sent or stored on a server.',
      'password.updatedToast': 'Password updated successfully.',
      'email.sentTitle': 'Verification code ready',
      'email.sentDesc': 'A 6-digit demo code has been prepared for the new address.',
      'email.demoCode': 'Demo verification code',
      'email.updatedTitle': 'Email updated',
      'email.updatedDesc': 'Your campus email has been updated in this local prototype.',
      'email.same': 'Enter a different email address.',
      'email.wrongCode': 'That code does not match the demo code.',
      'email.resend': 'A new demo code was generated: 123456',
      'delete.finalTitle': 'Final Confirmation',
      'delete.finalSub': 'Confirm the account name and password to continue.',
      'delete.finalName': 'Type this account name',
      'delete.finalPassword': 'Password',
      'delete.typedWrong': 'The account name does not match exactly.',
      'delete.demoHint': 'Demo note: any non-empty password is accepted for this local simulation.',
      'delete.finalCancel': 'Cancel Deletion',
      'delete.finalBtn': 'Delete account permanently',
      'delete.doneToast': 'Account deleted from this device.',
      'status.backHome': 'Back to home',
      'status.signIn': 'Go to sign in',
      'status.check': 'Continue',
      'help.guides': 'Popular guides',
      'help.faqPreview': 'Common questions',
      'help.searchPh': 'Search help articles...',
      'help.noResults': 'No help articles match that search.',
      'help.contactTitle': 'Still need help?',
      'help.contactSub': 'Our campus support team usually replies within one working day.',
      'help.openContact': 'Contact Support',
      'help.article': 'Open guide',
      'help.heroTitle': 'How can we help?',
      'help.articles': 'articles',
      'help.step': 'Step',
      'help.get1': 'Create a simulated account or continue as a guest.',
      'help.get2': 'Browse categories or search the verified directory.',
      'help.get3': 'Save tools to Collections and open the local assistant.',
      'help.save1': 'Tap the bookmark icon on any tool card or detail sheet.',
      'help.save2': 'Saved tools appear under Collections and persist locally.',
      'help.save3': 'Use the plus button to create a custom folder.',
      'help.asst1': 'Open Bantu Cari Aku from the navigation or floating button.',
      'help.asst2': 'Type a study goal or choose an inspiration prompt.',
      'help.asst3': 'Filter results, open a recommendation, and save it.',
      'help.ver1': 'Campus verification is presented as a member-only feature.',
      'help.ver2': 'Sign in with any valid-looking email to test the gate.',
      'help.ver3': 'No real verification email is sent in this prototype.',
      'help.acc1': 'Open Settings then Manage Account.',
      'help.acc2': 'Update your profile, password, or campus email.',
      'help.acc3': 'Account deletion removes only local demo data.',
      'help.priv1': 'All demo data is stored in your browser localStorage.',
      'help.priv2': 'There is no analytics, server, or advertising cookie.',
      'help.priv3': 'Clear site data to remove everything from this device.',
      'contact.name': 'Your name',
      'privacy.sub': 'How this prototype handles demo data on your device.',
      'terms.sub': 'Demo terms for using the SOTERA front-end prototype.',
      'collections.allSaved': 'All saved',
      'about.version': 'Version 1.0 - Front-end prototype',
      'about.statsTools': 'Curated tools',
      'about.statsCats': 'Categories',
      'about.statsCollections': 'Curated folders',
      'about.local': 'local',
      'about.updated': 'Updated Nov 2026',
      'legal.updated': 'Last updated: November 2026',
      'legal.note': 'This is a prototype document. It describes how this demonstration build behaves, not a production legal agreement.',
      'contact.topicPh': 'Choose a topic',
      'contact.topicGeneral': 'General question',
      'contact.topicBug': 'Report a bug',
      'contact.topicTool': 'Tool listing issue',
      'contact.topicAccount': 'Account or sign-in',
      'contact.placeholder': 'Describe what you need help with...',
      'contact.errMessage': 'Write a short message first.',
      'contact.sentToast': 'Message saved locally.',
      'form.required': 'This field is required.',
      'form.invalidUrl': 'Enter a valid URL starting with http:// or https://.',
      'notif.title': 'Notifications',
      'notif.sub': 'Demo updates from the local catalog',
      'notif.empty': 'Nothing new right now.',
      'notif.mark': 'Mark all read',
      'notif.read': 'All caught up.',
      'suggest.title': 'Suggest a Tool',
      'suggest.sub': 'Know a resource other students need?',
      'suggest.name': 'Tool name',
      'suggest.url': 'Official URL',
      'suggest.note': 'Why should students use it?',
      'suggest.send': 'Send Suggestion',
      'suggest.done': 'Suggestion saved locally. Thank you!',
      'explore.searchPh': 'Search tools, categories, keywords...',
      'faq.back': 'Back to help center',
      'locked.memberTitle': 'You already have full access',
      'locked.memberDesc': 'This is the guest access screen. Use the directory, collections, and assistant from the main navigation.',
      'locked.home': 'Return to home',
      'locked.manage': 'Manage account',
      'notFound.title': 'Page not found',
      'notFound.desc': 'The page you requested does not exist in this prototype.'
    },
    id: {
      'shell.guestSub': 'Mode tamu - jelajah bebas',
      'shell.new': 'Baru',
      'shell.fabSub': 'Cari tool saya',
      'shell.guestNav': 'Masuk',
      'onb.skip': 'Lewati',
      'onb.eyebrow1': 'RUANG KERJA AKADEMIKMU',
      'onb.title1': 'Satu Sumber untuk Segala Tools',
      'onb.desc1': 'Temukan, simpan, dan atur tool riset, penulisan, desain, dan produktivitas terbaik dalam satu ruang kerja mahasiswa.',
      'onb.p1': '39 tool pilihan',
      'onb.p2': '8 kategori',
      'onb.p3': 'Demo lokal',
      'onb.eyebrow2': 'DIKURASI UNTUK MAHASISWA',
      'onb.title2': 'Temukan Tool yang Tepat Tanpa Banyak Tab',
      'onb.desc2': 'Telusuri direktori terverifikasi, buat koleksi, dan biarkan asisten lokal menyusun stack belajar dalam hitungan detik.',
      'onb.next': 'Lanjut',
      'onb.start': 'Mulai Sekarang',
      'onb.have': 'Sudah punya akun?',
      'onb.signin': 'Masuk',
      'onb.cardAi': 'Tool AI',
      'onb.cardAiSub': 'Jelaskan & ringkas',
      'onb.cardCite': 'Sitasi',
      'onb.cardCiteSub': 'Siap skripsi',
      'onb.cardDesign': 'Desain',
      'onb.cardDesignSub': 'Slide & poster',
      'onb.stat': 'Tool disimpan mahasiswa minggu ini',
      'onb.saved': 'Tersimpan',
      'onb.verified': 'Terverifikasi',
      'onb.collections': 'Koleksi',
      'onb.rating': 'Rating rata-rata',
      'auth.brandEyebrow': 'PLATFORM MAHASISWA SOTERA',
      'auth.brandTitle': 'Seluruh kebutuhan tool akademikmu, akhirnya di satu tempat.',
      'auth.brandDesc': 'Dari sitasi skripsi sampai catatan kuliah, temukan tool yang benar-benar dipakai mahasiswa dan tetap rapi.',
      'auth.feat1': 'Direktori tool terkurasi dan terverifikasi',
      'auth.feat2': 'Asisten lokal untuk menyusun stack belajar',
      'auth.feat3': 'Perk dan diskon khusus mahasiswa',
      'auth.quote': 'Dibuat untuk mahasiswa, bersama mahasiswa.',
      'auth.loginTitle': 'Selamat Datang Kembali',
      'auth.loginSub': 'Masuk untuk melanjutkan menyusun ruang kerja akademikmu.',
      'auth.emailPh': 'kamu@kampus.edu',
      'auth.passPh': 'Masukkan password',
      'auth.remember': 'Tetap masuk',
      'auth.forgot': 'Lupa password?',
      'auth.noAccount': 'Belum punya akun?',
      'auth.createFree': 'Buat gratis',
      'auth.demoHint': 'Akun demo sudah terisi. Email valid apa pun dan password 6+ karakter berfungsi di prototipe ini.',
      'auth.google': 'Lanjut dengan Google',
      'auth.googleNote': 'Login Google disimulasikan secara lokal.',
      'auth.guest': 'Lanjut sebagai Tamu',
      'auth.welcome': 'Selamat datang kembali, ',
      'auth.guestWelcome': 'Menjelajah sebagai tamu',
      'auth.signupTitle': 'Buat Akunmu',
      'auth.signupSub': 'Bergabung dengan direktori tool, koleksi, dan alur belajar siap kampus.',
      'auth.namePh': 'Nama lengkapmu',
      'auth.name': 'Nama Lengkap',
      'auth.signupPassHint': 'Minimal 8 karakter, dengan angka dan simbol.',
      'auth.terms': 'Saya setuju dengan Syarat & Ketentuan serta Kebijakan Privasi prototipe ini.',
      'auth.hasAccount': 'Sudah punya akun?',
      'auth.signin': 'Masuk',
      'auth.signupCta': 'Buat Akun Gratis',
      'auth.forgotTitle': 'Reset Password',
      'auth.forgotSub': 'Masukkan email kampus dan kami akan menyimulasikan pengiriman tautan reset.',
      'auth.forgotSend': 'Kirim Tautan Reset',
      'auth.forgotBack': 'Kembali ke masuk',
      'auth.forgotSent': 'Tautan reset disimulasikan',
      'auth.strWeak': 'Lemah',
      'auth.strFair': 'Cukup',
      'auth.strGood': 'Bagus',
      'auth.strStrong': 'Kuat',
      'auth.reqLen': '8+ karakter',
      'auth.reqNum': 'Satu angka',
      'auth.reqSym': 'Satu simbol',
      'auth.errEmail': 'Masukkan alamat email yang valid.',
      'auth.errPass': 'Password minimal 6 karakter.',
      'auth.errName': 'Masukkan nama lengkapmu.',
      'auth.errTerms': 'Setujui ketentuan untuk melanjutkan.',
      'auth.errMatch': 'Password tidak cocok.',
      'auth.errCurrent': 'Masukkan password saat ini.',
      'auth.errCode': 'Masukkan kode demo 6 digit.',
      'auth.errUsername': 'Gunakan 3-24 huruf, angka, titik, atau garis bawah.',
      'auth.saveGuest': 'Masuk untuk menyimpan tool ke koleksimu.',
      'auth.signedIn': 'Selamat datang kembali',
      'auth.signedOut': 'Kamu telah keluar.',
      'auth.accountCreated': 'Akun dibuat. Selamat datang di SOTERA.',
      'auth.emailInUse': 'Email ini sudah dipakai akun demo.',
      'common.saved': 'Tersimpan',
      'common.on': 'Aktif',
      'common.off': 'Nonaktif',
      'common.all': 'Semua',
      'common.results': 'hasil',
      'common.filter': 'Filter',
      'common.demoNote': 'Data demo',
      'tool.detail': 'Detail tool',
      'tool.open': 'Buka situs resmi',
      'tool.about': 'Tentang tool ini',
      'tool.features': 'Fitur utama',
      'tool.stats': 'Sekilas',
      'tool.rating': 'Rating',
      'tool.reviews': 'Ulasan',
      'tool.platforms': 'Platform',
      'tool.source': 'Sumber resmi:',
      'toast.saved': 'Disimpan ke koleksimu.',
      'toast.removed': 'Dihapus dari koleksimu.',
      'toast.langChanged': 'Preferensi bahasa diterapkan.',
      'toast.themeSaved': 'Preferensi tema disimpan.',
      'toast.themeReset': 'Tema direset ke default.',
      'toast.profileSaved': 'Profil diperbarui.',
      'toast.passwordSaved': 'Password berhasil diperbarui.',
      'toast.emailCode': 'Kode demo dikirim: 123456',
      'toast.messageSent': 'Pesan disimpan secara lokal.',
      'toast.suggestion': 'Saran disimpan lokal. Terima kasih!',
      'toast.request': 'Permintaan tool disimpan lokal. Terima kasih!',
      'toast.folderCreated': 'Koleksi dibuat.',
      'toast.linkSimulated': 'Aksi ini disimulasikan di prototipe.',
      'toast.signedIn': 'Berhasil masuk.',
      'toast.guest': 'Mode tamu diaktifkan.',
      'home.studentLabel': 'RUANG KERJA MAHASISWA',
      'home.streakSuffix': 'hari beruntun',
      'home.week': 'Minggu ini',
      'home.browseAll': 'Jelajahi semua',
      'home.popularSub': 'Langsung ke kebutuhan belajar',
      'home.featuredSub': 'Pilihan untuk tugas kampus',
      'home.trendingSub': 'Paling sering dibuka mahasiswa',
      'home.recentSub': 'Baru di direktori',
      'home.tipsEyebrow': 'TIPS SKRIPSI CEPAT',
      'home.tipsTitle': 'Bangun alur sitasi sebelum menulis',
      'home.tipsBody': 'Kumpulkan sumber di Zotero, petakan dengan Connected Papers, lalu tulis di Overleaf. Stack yang konsisten menghemat berjam-jam setiap minggu.',
      'home.guestSignIn': 'Masuk untuk menyimpan',
      'home.seeTools': 'Jelajahi tool',
      'explore.all': 'Semua Tool',
      'explore.filterTitle': 'Filter Tool',
      'explore.filterSub': 'Persempit direktori sesuai kebutuhan belajarmu.',
      'explore.category': 'Kategori',
      'explore.pricing': 'Harga',
      'explore.audience': 'Perk mahasiswa',
      'explore.ratingLabel': 'Rating minimum',
      'explore.studentOnly': 'Hanya ramah mahasiswa',
      'explore.apply': 'Tampilkan hasil',
      'explore.resetFilters': 'Reset',
      'explore.active': 'aktif',
      'explore.filtersApplied': 'Filter diterapkan.',
      'explore.filtersReset': 'Filter direset.',
      'explore.freeOnly': 'Gratis',
      'explore.freemiumOnly': 'Freemium',
      'explore.studentPlans': 'Gratis untuk Mahasiswa',
      'explore.anyRating': 'Semua',
      'explore.rating4': '4.0+',
      'explore.rating45': '4.5+',
      'collections.newTitle': 'Koleksi Baru',
      'collections.newSub': 'Buat folder untuk mata kuliah, proyek, atau alur belajar.',
      'collections.nameLabel': 'Nama koleksi',
      'collections.namePh': 'mis. Referensi Skripsi',
      'collections.iconLabel': 'Pilih ikon',
      'collections.pickTools': 'Tambahkan tool tersimpan',
      'collections.create': 'Buat Koleksi',
      'collections.emptyFolder': 'Belum ada tool di koleksi ini',
      'collections.emptyFolderSub': 'Simpan tool dari Explore, lalu tambahkan ke sini.',
      'collections.guestCta': 'Buat akun gratis untuk mulai menyimpan.',
      'collections.guestBadge': 'FITUR ANGGOTA',
      'collections.benefitCloud': 'Sinkronkan tool tersimpan di ponsel dan laptop',
      'collections.benefitFolders': 'Folder khusus untuk riset, skripsi, dan tugas',
      'collections.benefitAssistant': 'Rekomendasi personal dari asisten lokal',
      'collections.countOne': 'tool',
      'collections.countMany': 'tool',
      'collections.sortRecent': 'Terbaru disimpan',
      'collections.sortName': 'Nama A-Z',
      'collections.sortCat': 'Kategori',
      'collections.deleteFolder': 'Hapus koleksi',
      'collections.emptyList': 'Belum ada tool tersimpan',
      'collections.emptyListSub': 'Tandai tool di Explore dan tool akan muncul di sini.',
      'discover.live': 'Live',
      'discover.personalized': 'PILIHAN PERSONAL',
      'discover.heroTitle': 'Stack Riset Skripsi',
      'discover.heroDesc': 'Alur riset yang cocok dengan minat menulismu: cari, petakan, sitasi, lalu tulis dalam satu putaran.',
      'discover.openCanvas': 'Buka Canvas',
      'discover.quickSub': 'Tool yang baru kamu buka',
      'discover.updatesSub': 'Catatan rilis dan penawaran mahasiswa',
      'discover.memberOnly': 'Tampilan anggota',
      'discover.guestCta': 'Masuk untuk personalisasi',
      'discover.matched': 'Cocok dengan minat Menulis & Riset',
      'discover.recommendSub': 'Berdasarkan tool tersimpan dan aktivitas kampus',
      'asst.demo': 'Asisten demo lokal',
      'asst.resultsTitle': 'Tool rekomendasi',
      'asst.why': 'Kenapa cocok',
      'asst.noResults': 'Belum ada tool yang cocok. Coba kata kunci lebih luas seperti riset, desain, atau coding.',
      'asst.thinking': 'Mencari tool di katalog lokal...',
      'asst.allTools': 'Semua Tool',
      'asst.studentOnly': 'Khusus Mahasiswa',
      'asst.freeDiscount': 'Gratis / Diskon',
      'asst.found': 'Berikut tiga tool terverifikasi yang cocok. Semua tautan membuka situs resmi penyedia.',
      'asst.placeholder': 'Ceritakan tool yang kamu cari...',
      'asst.example': 'Contoh: tool gratis untuk parafrase jurnal internasional',
      'asst.send': 'Kirim',
      'asst.count': 'tool di katalog lokal',
      'asst.tryAgain': 'Tanya dengan cara lain',
      'set.version': 'SOTERA v1.0 - Prototipe',
      'set.prototype': 'Demo front-end. Akun dan data tetap di perangkat ini.',
      'set.memberSince': 'Mahasiswa terverifikasi',
      'set.themeValue': 'Tema',
      'set.languageValue': 'Bahasa',
      'set.on': 'Aktif',
      'set.off': 'Nonaktif',
      'set.sessionsTitle': 'Sesi Aktif',
      'set.sessionsBody': 'Prototipe ini memakai satu sesi lokal. Tidak ada sesi di server.',
      'set.thisDevice': 'Browser ini',
      'set.activeNow': 'Aktif sekarang',
      'set.shareTitle': 'Bagikan Resource',
      'set.shareSub': 'Bagikan tool ke teman mahasiswa.',
      'set.shareName': 'Nama resource',
      'set.shareUrl': 'URL resmi',
      'set.shareNote': 'Kenapa bermanfaat?',
      'set.shareSend': 'Bagikan Resource',
      'set.requestTitle': 'Minta Tool',
      'set.requestSub': 'Beri tahu tim kurasi apa yang perlu ditambahkan.',
      'set.requestName': 'Nama tool',
      'set.requestReason': 'Apa manfaatnya untuk mahasiswa?',
      'set.requestSend': 'Kirim Permintaan',
      'set.guestTitle': 'Masuk untuk mengatur akunmu',
      'set.guestDesc': 'Tool tersimpan, preferensi, keamanan, dan ruang asisten terbuka dengan akun gratis.',
      'set.logoutConfirm': 'Keluar dari SOTERA?',
      'set.logoutDesc': 'Tool tersimpan tetap ada di state demo lokal sampai kamu membuat akun lagi.',
      'set.logoutYes': 'Keluar',
      'set.logoutNo': 'Tetap masuk',
      'set.notifOn': 'Email dan notifikasi dalam aplikasi',
      'set.toolUpdatesOn': 'Peringatan trending dan rilis AI',
      'set.savedToast': 'Preferensi disimpan.',
      'profile.bio': 'Bio singkat',
      'profile.bioPh': 'Ceritakan apa yang kamu pelajari atau bangun.',
      'profile.updated': 'Profil disimpan.',
      'profile.photoUpdated': 'Foto diperbarui.',
      'profile.photoRemoved': 'Foto dihapus.',
      'password.updatedTitle': 'Password diperbarui',
      'password.updatedDesc': 'Password demo kamu sudah diubah secara lokal. Gunakan password baru saat masuk lagi di perangkat ini.',
      'password.updatedBack': 'Kembali ke akun',
      'password.demoNote': 'Catatan prototipe: password saat ini diterima selama tidak kosong. Tidak ada data yang dikirim atau disimpan di server.',
      'password.updatedToast': 'Password berhasil diperbarui.',
      'email.sentTitle': 'Kode verifikasi siap',
      'email.sentDesc': 'Kode demo 6 digit sudah disiapkan untuk alamat baru.',
      'email.demoCode': 'Kode verifikasi demo',
      'email.updatedTitle': 'Email diperbarui',
      'email.updatedDesc': 'Email kampusmu sudah diperbarui di prototipe lokal ini.',
      'email.same': 'Masukkan alamat email yang berbeda.',
      'email.wrongCode': 'Kode itu tidak cocok dengan kode demo.',
      'email.resend': 'Kode demo baru dibuat: 123456',
      'delete.finalTitle': 'Konfirmasi Terakhir',
      'delete.finalSub': 'Konfirmasi nama akun dan password untuk melanjutkan.',
      'delete.finalName': 'Ketik nama akun ini',
      'delete.finalPassword': 'Password',
      'delete.typedWrong': 'Nama akun tidak cocok persis.',
      'delete.demoHint': 'Catatan demo: password apa pun yang tidak kosong diterima untuk simulasi lokal ini.',
      'delete.finalCancel': 'Batalkan Penghapusan',
      'delete.finalBtn': 'Hapus akun secara permanen',
      'delete.doneToast': 'Akun dihapus dari perangkat ini.',
      'status.backHome': 'Kembali ke beranda',
      'status.signIn': 'Ke halaman masuk',
      'status.check': 'Lanjut',
      'help.guides': 'Panduan populer',
      'help.faqPreview': 'Pertanyaan umum',
      'help.searchPh': 'Cari artikel bantuan...',
      'help.noResults': 'Tidak ada artikel bantuan yang cocok.',
      'help.contactTitle': 'Masih butuh bantuan?',
      'help.contactSub': 'Tim dukungan kampus biasanya membalas dalam satu hari kerja.',
      'help.openContact': 'Hubungi Dukungan',
      'help.article': 'Buka panduan',
      'help.heroTitle': 'Apa yang bisa kami bantu?',
      'help.articles': 'artikel',
      'help.step': 'Langkah',
      'help.get1': 'Buat akun simulasi atau lanjut sebagai tamu.',
      'help.get2': 'Telusuri kategori atau cari di direktori terverifikasi.',
      'help.get3': 'Simpan tool ke Koleksi dan buka asisten lokal.',
      'help.save1': 'Ketuk ikon bookmark pada kartu tool atau detail tool.',
      'help.save2': 'Tool tersimpan muncul di Koleksi dan tersimpan lokal.',
      'help.save3': 'Gunakan tombol plus untuk membuat folder khusus.',
      'help.asst1': 'Buka Bantu Cari Aku dari navigasi atau tombol melayang.',
      'help.asst2': 'Tulis tujuan belajar atau pilih prompt inspirasi.',
      'help.asst3': 'Filter hasil, buka rekomendasi, lalu simpan.',
      'help.ver1': 'Verifikasi kampus ditampilkan sebagai fitur anggota.',
      'help.ver2': 'Masuk dengan email yang terlihat valid untuk menguji gate.',
      'help.ver3': 'Tidak ada email verifikasi nyata dalam prototipe ini.',
      'help.acc1': 'Buka Pengaturan lalu Kelola Akun.',
      'help.acc2': 'Perbarui profil, kata sandi, atau email kampus.',
      'help.acc3': 'Penghapusan akun hanya menghapus data demo lokal.',
      'help.priv1': 'Semua data demo disimpan di localStorage browser.',
      'help.priv2': 'Tidak ada analitik, server, atau cookie iklan.',
      'help.priv3': 'Hapus data situs untuk membersihkan perangkat ini.',
      'contact.name': 'Nama kamu',
      'privacy.sub': 'Cara prototipe ini menangani data demo di perangkatmu.',
      'terms.sub': 'Ketentuan demo untuk prototipe front-end SOTERA.',
      'collections.allSaved': 'Semua tersimpan',
      'about.version': 'Versi 1.0 - Prototipe front-end',
      'about.statsTools': 'Tool terkurasi',
      'about.statsCats': 'Kategori',
      'about.statsCollections': 'Folder terkurasi',
      'about.local': 'lokal',
      'about.updated': 'Diperbarui Nov 2026',
      'legal.updated': 'Terakhir diperbarui: November 2026',
      'legal.note': 'Ini adalah dokumen prototipe. Dokumen menjelaskan perilaku build demonstrasi ini, bukan perjanjian hukum produksi.',
      'contact.topicPh': 'Pilih topik',
      'contact.topicGeneral': 'Pertanyaan umum',
      'contact.topicBug': 'Laporkan bug',
      'contact.topicTool': 'Masalah daftar tool',
      'contact.topicAccount': 'Akun atau masuk',
      'contact.placeholder': 'Jelaskan apa yang ingin kamu tanyakan...',
      'contact.errMessage': 'Tulis pesan singkat terlebih dahulu.',
      'contact.sentToast': 'Pesan disimpan secara lokal.',
      'form.required': 'Kolom ini wajib diisi.',
      'form.invalidUrl': 'Masukkan URL valid yang diawali http:// atau https://.',
      'notif.title': 'Notifikasi',
      'notif.sub': 'Pembaruan demo dari katalog lokal',
      'notif.empty': 'Belum ada yang baru.',
      'notif.mark': 'Tandai semua dibaca',
      'notif.read': 'Semua sudah dibaca.',
      'suggest.title': 'Sarankan Tool',
      'suggest.sub': 'Tahu resource yang dibutuhkan mahasiswa lain?',
      'suggest.name': 'Nama tool',
      'suggest.url': 'URL resmi',
      'suggest.note': 'Kenapa mahasiswa perlu memakainya?',
      'suggest.send': 'Kirim Saran',
      'suggest.done': 'Saran disimpan lokal. Terima kasih!',
      'explore.searchPh': 'Cari tool, kategori, kata kunci...',
      'faq.back': 'Kembali ke pusat bantuan',
      'locked.memberTitle': 'Kamu sudah punya akses penuh',
      'locked.memberDesc': 'Ini adalah layar akses tamu. Gunakan direktori, koleksi, dan asisten dari navigasi utama.',
      'locked.home': 'Kembali ke beranda',
      'locked.manage': 'Atur akun',
      'notFound.title': 'Halaman tidak ditemukan',
      'notFound.desc': 'Halaman yang diminta tidak ada di prototipe ini.'
    }
  };

  /* ---------- shared form helpers ---------- */

  function inputField(o) {
    var id = o.id || ('f-' + o.name);
    var label = o.label ? '<div class="field-label"><span>' + esc(o.label) + '</span>' +
      (o.labelLink ? '<a class="link-plain" href="' + o.labelLink + '">' + esc(o.labelLinkText || '') + '</a>' : '') + '</div>' : '';
    var tag = o.textarea
      ? '<textarea class="input-area" id="' + id + '" name="' + o.name + '" placeholder="' + esc(o.placeholder || '') + '"' + (o.readonly ? ' readonly' : '') + '>' + esc(o.value || '') + '</textarea>'
      : '<input id="' + id + '" name="' + o.name + '" type="' + (o.type || 'text') + '" placeholder="' + esc(o.placeholder || '') + '" value="' + esc(o.value || '') + '"' +
        (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') + (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') + (o.maxlength ? ' maxlength="' + o.maxlength + '"' : '') + (o.readonly ? ' readonly' : '') + ' />';
    var suffix = '';
    if (o.password) {
      suffix = '<div class="suffix"><button type="button" data-action="peek" data-target="' + id + '" aria-label="Show password">' + icon('eye') + '</button></div>';
    }
    return '<div class="field" data-field="' + esc(o.name) + '">' + label +
      '<div class="input-wrap">' + (o.icon ? icon(o.icon) : '') + tag + suffix + '</div>' +
      (o.help ? '<div class="field-help">' + (o.helpIcon ? icon(o.helpIcon) : icon('info')) + '<span>' + esc(o.help) + '</span></div>' : '') +
      '<div class="field-error">' + icon('alert-circle') + '<span></span></div></div>';
  }

  function fieldInput(form, name) {
    return form ? form.querySelector('[name="' + name + '"]') : null;
  }

  function setFieldError(form, name, msg) {
    var input = fieldInput(form, name);
    if (!input) return;
    var field = input.closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    field.classList.remove('is-ok');
    var slot = field.querySelector('.field-error span');
    if (slot) slot.textContent = msg;
  }

  function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
  }

  function passwordScore(value) {
    var v = String(value || '');
    var score = 0;
    if (v.length >= 8) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (v.length >= 12) score++;
    return Math.min(score, 4);
  }

  function strengthMarkup() {
    return '<div class="strength" data-strength><div class="strength-bars"><span></span><span></span><span></span><span></span></div><span class="strength-label" data-strength-label>' + esc(x('auth.strWeak')) + '</span></div>' +
      '<div class="req-list">' +
      '<div class="req" data-req="len"><span class="r-ico">' + icon('check') + '</span><span>' + esc(x('auth.reqLen')) + '</span></div>' +
      '<div class="req" data-req="num"><span class="r-ico">' + icon('check') + '</span><span>' + esc(x('auth.reqNum')) + '</span></div>' +
      '<div class="req" data-req="sym"><span class="r-ico">' + icon('check') + '</span><span>' + esc(x('auth.reqSym')) + '</span></div>' +
      '</div>';
  }

  function authBrandPanel() {
    return '<aside class="auth-brand"><div class="auth-brand-logo"><img src="' + LOGO + '" alt="SOTERA" /><div><div class="bn">SOTERA</div><div class="bs">' + esc(t('brand.tagline')) + '</div></div></div>' +
      '<div class="auth-brand-copy"><p class="eyebrow" style="color:rgba(255,255,255,.6)">' + esc(x('auth.brandEyebrow')) + '</p>' +
      '<h2>' + esc(x('auth.brandTitle')) + '</h2><p>' + esc(x('auth.brandDesc')) + '</p>' +
      '<div class="auth-brand-feats">' +
      '<div class="auth-brand-feat"><span class="afi">' + icon('compass') + '</span><span>' + esc(x('auth.feat1')) + '</span></div>' +
      '<div class="auth-brand-feat"><span class="afi">' + icon('sparkles') + '</span><span>' + esc(x('auth.feat2')) + '</span></div>' +
      '<div class="auth-brand-feat"><span class="afi">' + icon('graduation-cap') + '</span><span>' + esc(x('auth.feat3')) + '</span></div>' +
      '</div></div>' +
      '<div class="auth-brand-quote"><strong>' + esc(x('auth.quote')) + '</strong> - SOTERA campus directory</div></aside>';
  }

  function authShell(inner) {
    return '<div class="auth">' + authBrandPanel() + '<div class="auth-panel"><div class="auth-inner">' + inner + '</div></div></div>';
  }

  function authMobileTop(rightHref, rightLabel) {
    return '<div class="auth-mobile-top"><a href="#/onboarding/1" aria-label="SOTERA"><img src="' + LOGO + '" alt="SOTERA" /></a>' +
      (rightHref ? '<a class="btn btn-ghost btn-sm" href="' + rightHref + '">' + esc(rightLabel) + '</a>' : '<a class="btn btn-ghost btn-sm" href="#/home">' + esc(t('common.skip')) + '</a>') + '</div>';
  }

  /* ---------- onboarding ---------- */

  function renderOnboarding(step) {
    var brandTop = '<div class="onboard-top"><a class="brand" href="#/home"><img src="' + LOGO + '" alt="SOTERA" style="width:38px;height:38px" /><div><div class="brand-name">SOTERA</div><div class="brand-sub">' + esc(t('brand.tagline')) + '</div></div></a>' +
      '<a class="onboard-skip" href="#/login">' + esc(x('onb.skip')) + '</a></div>';
    var dots = '<div class="onboard-dots"><span class="' + (step === 1 ? 'on' : '') + '"></span><span class="' + (step === 2 ? 'on' : '') + '"></span></div>';
    var footer;
    var stage;
    if (step === 1) {
      stage = '<div class="onboard-stage"><div class="collage">' +
        '<div class="collage-card" style="left:0;top:22px;--rot:-4deg"><span class="cc-ico" style="background:linear-gradient(135deg,#4f46e5,#8b5cf6)">' + icon('sparkles') + '</span><div><div class="cc-title">' + esc(x('onb.cardAi')) + '</div><div class="cc-sub">' + esc(x('onb.cardAiSub')) + '</div></div></div>' +
        '<div class="collage-card" style="right:0;top:86px;--rot:4deg;animation-delay:.7s"><span class="cc-ico" style="background:linear-gradient(135deg,#f59e0b,#f97316)">' + icon('book-open') + '</span><div><div class="cc-title">' + esc(x('onb.cardCite')) + '</div><div class="cc-sub">' + esc(x('onb.cardCiteSub')) + '</div></div></div>' +
        '<div class="collage-card" style="left:12px;bottom:30px;--rot:3deg;animation-delay:1.1s"><span class="cc-ico" style="background:linear-gradient(135deg,#ec4899,#f97316)">' + icon('palette') + '</span><div><div class="cc-title">' + esc(x('onb.cardDesign')) + '</div><div class="cc-sub">' + esc(x('onb.cardDesignSub')) + '</div></div></div>' +
        '<div class="collage-ring"></div><div class="collage-center"><img src="' + LOGO + '" alt="SOTERA" /></div>' +
        '<span class="collage-dot" style="left:34px;top:8px;background:#8b5cf6"></span>' +
        '<span class="collage-dot" style="right:38px;bottom:86px;background:#f97316"></span>' +
        '<div class="collage-stat">' + icon('users') + '<span>42,000+ ' + esc(t('common.students')) + '</span></div>' +
        '</div>' +
        '<div class="onboard-copy"><p class="eyebrow">' + esc(x('onb.eyebrow1')) + '</p><h1>' + esc(x('onb.title1')) + '</h1><p>' + esc(x('onb.desc1')) + '</p>' +
        '<div class="pill-group"><span class="pill">' + icon('layers') + esc(x('onb.p1')) + '</span><span class="pill">' + icon('grid') + esc(x('onb.p2')) + '</span><span class="pill">' + icon('shield') + esc(x('onb.p3')) + '</span></div></div></div>';
      footer = '<div class="onboard-footer">' + dots + '<a class="btn btn-primary" href="#/onboarding/2">' + esc(x('onb.next')) + icon('arrow-right') + '</a></div>';
    } else {
      stage = '<div class="onboard-stage onboard-2"><div class="mock-stack">' +
        '<div class="mock-card mock-main"><div class="mm-top"><span class="mm-ico">' + icon('book-open') + '</span><div class="grow"><div class="cc-title">' + esc(x('discover.heroTitle')) + '</div><div class="cc-sub">' + esc(t('discover.matched')) + '</div></div></div>' +
        '<div class="mock-line w90"></div><div class="mock-line w70"></div><div class="mock-line w50"></div>' +
        '<div class="mock-tile-row"><span class="mock-tile">' + icon('search') + '</span><span class="mock-tile">' + icon('bookmark') + '</span><span class="mock-tile">' + icon('sparkles') + '</span></div></div>' +
        '<div class="mock-card mock-float-1" style="--rot:-4deg"><div class="row-between"><span class="cc-title">' + esc(x('onb.verified')) + '</span>' + icon('badge-check') + '</div><div class="mock-line w70" style="margin-top:8px"></div><div class="mock-pill" style="margin-top:8px">' + icon('check') + 'Campus .edu</div></div>' +
        '<div class="mock-card mock-float-2" style="--rot:4deg;animation-delay:.6s"><div class="cc-sub">' + esc(x('onb.rating')) + '</div><div class="row" style="margin-top:4px">' + icon('star') + '<strong style="font-size:14px">4.8</strong></div></div>' +
        '<div class="mock-card mock-float-3" style="--rot:3deg;animation-delay:.9s"><div class="row-between"><span class="cc-title">' + esc(x('onb.collections')) + '</span>' + icon('folder') + '</div><div class="mock-line w90" style="margin-top:8px"></div><div class="mock-line w50"></div></div>' +
        '<div class="mock-card mock-float-4" style="--rot:-3deg;animation-delay:1.2s"><div class="row">' + logoSpan(toolById('zotero'), 'xs') + '<div><div class="cc-title">Zotero</div><div class="cc-sub">' + esc(x('onb.saved')) + '</div></div></div></div>' +
        '</div><div class="onboard-copy"><p class="eyebrow">' + esc(x('onb.eyebrow2')) + '</p><h1>' + esc(x('onb.title2')) + '</h1><p>' + esc(x('onb.desc2')) + '</p></div></div>';
      footer = '<div class="onboard-footer">' + dots + '<a class="btn btn-primary" href="#/login">' + esc(x('onb.start')) + icon('arrow-right') + '</a></div>' +
        '<div class="auth-foot" style="margin-top:4px">' + esc(x('onb.have')) + ' <a class="link-plain" href="#/login">' + esc(x('onb.signin')) + '</a></div>';
    }
    return '<div class="onboard">' + brandTop + stage + footer + '</div>';
  }

  /* ---------- login / signup / forgot ---------- */

  function renderLogin() {
    var inner = authMobileTop('#/signup', t('common.signup')) +
      '<div class="auth-title-wrap"><div class="auth-logo-badge"><img src="' + LOGO + '" alt="SOTERA" /></div><h1>' + esc(x('auth.loginTitle')) + '</h1><p>' + esc(x('auth.loginSub')) + '</p></div>' +
      '<form class="auth-form" data-form="login" novalidate>' +
      inputField({ name: 'email', type: 'email', label: t('common.email'), placeholder: x('auth.emailPh'), icon: 'mail', value: DEMO.email, autocomplete: 'email' }) +
      inputField({ name: 'password', type: 'password', password: true, label: t('common.password'), placeholder: x('auth.passPh'), icon: 'key', value: DEMO_PASS, autocomplete: 'current-password' }) +
      '<div class="auth-row"><label class="check"><input type="checkbox" checked /><span class="box">' + icon('check') + '</span><span>' + esc(x('auth.remember')) + '</span></label>' +
      '<a class="link-plain" href="#/forgot" style="font-size:10.5px">' + esc(x('auth.forgot')) + '</a></div>' +
      '<button class="btn btn-primary btn-block" type="submit">' + icon('arrow-right') + '<span>' + esc(t('common.login')) + '</span></button>' +
      '</form>' +
      '<div class="note-card info mt-3">' + icon('info') + '<span>' + esc(x('auth.demoHint')) + '</span></div>' +
      '<div class="auth-divider">' + esc(t('common.or')) + '</div>' +
      '<button class="btn btn-outline btn-block" data-action="google">' + icon('google') + '<span>' + esc(x('auth.google')) + '</span></button>' +
      '<a class="auth-guest-link" href="#/home" data-action="guest">' + esc(x('auth.guest')) + '</a>' +
      '<div class="auth-foot">' + esc(x('auth.noAccount')) + ' <a class="link-plain" href="#/signup">' + esc(x('auth.createFree')) + '</a></div>';
    return authShell(inner);
  }

  function renderSignup() {
    var inner = authMobileTop('#/login', t('common.login')) +
      '<div class="auth-title-wrap"><h1>' + esc(x('auth.signupTitle')) + '</h1><p>' + esc(x('auth.signupSub')) + '</p></div>' +
      '<form class="auth-form" data-form="signup" novalidate>' +
      inputField({ name: 'name', label: x('auth.name'), placeholder: x('auth.namePh'), icon: 'user', autocomplete: 'name' }) +
      inputField({ name: 'email', type: 'email', label: t('common.email'), placeholder: x('auth.emailPh'), icon: 'mail', autocomplete: 'email' }) +
      inputField({ name: 'password', type: 'password', password: true, label: t('common.password'), placeholder: x('auth.signupPassHint'), icon: 'key', autocomplete: 'new-password', help: x('auth.signupPassHint') }) +
      strengthMarkup() +
      '<label class="check"><input type="checkbox" name="terms" /><span class="box">' + icon('check') + '</span><span>' + esc(x('auth.terms')) + '</span></label>' +
      '<button class="btn btn-primary btn-block" type="submit">' + icon('sparkles') + '<span>' + esc(x('auth.signupCta')) + '</span></button>' +
      '</form>' +
      '<div class="auth-divider">' + esc(t('common.or')) + '</div>' +
      '<button class="btn btn-outline btn-block" data-action="google">' + icon('google') + '<span>' + esc(x('auth.google')) + '</span></button>' +
      '<div class="auth-foot">' + esc(x('auth.hasAccount')) + ' <a class="link-plain" href="#/login">' + esc(x('auth.signin')) + '</a></div>';
    return authShell(inner);
  }

  function renderForgot() {
    var inner = authMobileTop('#/login', t('common.login')) +
      '<div class="auth-title-wrap"><div class="auth-logo-badge" style="justify-content:center"><span class="status-orb orb-primary" style="width:72px;height:72px;border-radius:24px;margin:0">' + icon('key') + '</span></div><h1>' + esc(x('auth.forgotTitle')) + '</h1><p>' + esc(x('auth.forgotSub')) + '</p></div>' +
      '<form class="auth-form" data-form="forgot" novalidate>' +
      inputField({ name: 'email', type: 'email', label: t('common.email'), placeholder: x('auth.emailPh'), icon: 'mail', autocomplete: 'email' }) +
      '<button class="btn btn-primary btn-block" type="submit">' + icon('send') + '<span>' + esc(x('auth.forgotSend')) + '</span></button>' +
      '</form>' +
      '<div class="note-card info mt-4">' + icon('info') + '<span>' + esc(x('auth.demoHint')) + '</span></div>' +
      '<a class="auth-guest-link" href="#/login">' + icon('arrow-left') + ' ' + esc(x('auth.forgotBack')) + '</a>';
    return authShell(inner);
  }

  /* ---------- locked / guest gate ---------- */

  function renderLocked() {
    if (state.user) {
      return shell(mainPage('<div class="locked-page"><div class="locked-hero"><span class="lock-art">' + icon('unlock') + '</span>' +
        '<div class="badge badge-success">' + icon('check-circle') + esc(t('common.available')) + '</div>' +
        '<h1>' + esc(x('locked.memberTitle')) + '</h1><p>' + esc(x('locked.memberDesc')) + '</p></div>' +
        '<div class="locked-actions"><a class="btn btn-primary" href="#/home">' + icon('home') + esc(x('locked.home')) + '</a>' +
        '<a class="btn btn-outline" href="#/settings/account">' + icon('settings') + esc(x('locked.manage')) + '</a></div></div>'), 'settings');
    }
    var features = [
      { i: 'bookmark', t: t('locked.f1'), d: t('locked.f1d') },
      { i: 'sparkles', t: t('locked.f2'), d: t('locked.f2d') },
      { i: 'graduation-cap', t: t('locked.f3'), d: t('locked.f3d') },
      { i: 'bell', t: t('locked.f4'), d: t('locked.f4d') }
    ].map(function (f) {
      return '<div class="feature-lock"><span class="fl-ico">' + icon(f.i) + '</span><div><h4>' + esc(f.t) + '</h4><p>' + esc(f.d) + '</p></div></div>';
    }).join('');
    var content = '<div class="locked-page">' +
      '<div class="guest-session-bar"><span class="gs-brand"><img src="' + LOGO + '" alt="" />SOTERA GUEST</span><span class="gs-limit">' + icon('timer') + esc(t('locked.limited')) + '</span></div>' +
      '<div class="locked-hero"><span class="lock-art">' + icon('lock') + '</span>' +
      '<span class="badge badge-grad badge-lg">' + esc(t('locked.badge')) + '</span>' +
      '<h1>' + esc(t('locked.title')) + '</h1><p>' + esc(t('locked.desc')) + '</p></div>' +
      '<div class="section-label" style="margin:16px 4px 0">' + esc(t('locked.features')) + '</div>' +
      '<div class="feature-lock-list">' + features + '</div>' +
      '<div class="joined-pill"><span class="jp-avs"><span class="jp-av">A</span><span class="jp-av">R</span><span class="jp-av">M</span><span class="jp-av">+</span></span><span>' + esc(t('locked.join')) + '</span></div>' +
      '<div class="locked-actions"><a class="btn btn-primary" href="#/login">' + icon('arrow-right') + '<span>' + esc(t('locked.login')) + '</span></a>' +
      '<a class="btn btn-outline" href="#/signup">' + icon('user') + '<span>' + esc(t('locked.signup')) + '</span></a></div>' +
      '<div class="or-split">' + esc(t('locked.quick')) + '</div>' +
      '<button class="btn btn-soft btn-block" data-action="sso">' + icon('graduation-cap') + '<span>' + esc(t('locked.sso')) + '</span></button>' +
      '<div class="locked-foot"><a class="link-plain" href="#/explore">' + esc(t('locked.exploreGuest')) + '</a><br />' + esc(t('locked.foot')) + '</div></div>';
    return '<div class="page no-nav">' + content + '</div>';
  }

  /* ---------- status helper ---------- */

  function statusPage(opts) {
    var orbClass = opts.orb === 'danger' ? ' status-orb orb-danger' : (opts.orb === 'primary' ? ' status-orb orb-primary' : ' status-orb');
    var actions = opts.actions || '';
    var card = opts.card || '';
    return '<div class="page no-nav"><div class="status-page"><div class="' + orbClass.trim() + '">' + icon(opts.icon || 'check') + '</div>' +
      (opts.eyebrow ? '<div class="status-eyebrow">' + esc(opts.eyebrow) + '</div>' : '') +
      '<h1>' + esc(opts.title) + '</h1><p>' + esc(opts.desc) + '</p>' +
      (card ? card : '') +
      (actions ? '<div class="status-actions">' + actions + '</div>' : '') + '</div></div>';
  }

  /* ---------- home ---------- */

  function greeting() {
    var hour = new Date().getHours();
    if (hour < 12) return t('home.morning');
    if (hour < 18) return t('home.afternoon');
    return t('home.evening');
  }

  function categoryGrid() {
    return '<div class="cat-grid">' + DATA.categories.map(function (cat) {
      var count = DATA.tools.filter(function (tool) { return tool.cat === cat.id; }).length;
      return '<a class="cat-card" href="#/explore?cat=' + encodeURIComponent(cat.id) + '" style="--cat-tint:' + cat.tint + ';--cat-grad:' + cat.grad + '">' +
        '<span class="cat-ico">' + icon(cat.icon) + '</span>' +
        '<div><h3>' + esc(cat.name) + '</h3><div class="cat-count">' + count + ' ' + esc(t('common.tools')) + '</div></div>' +
        '<span class="cat-arrow">' + icon('arrow-up-right') + '</span></a>';
    }).join('') + '</div>';
  }

  function featureCards(list) {
    var tones = ['', 'fc-warm', 'fc-cool'];
    return '<div class="h-scroll">' + list.map(function (tool, i) {
      var cat = catById(tool.cat);
      var badge = tool.badge || (i === 0 ? t('common.popular') : t('common.new'));
      return '<button class="feature-card ' + (tones[i % tones.length] || '') + '" data-action="tool" data-id="' + esc(tool.id) + '">' +
        '<div class="feature-top">' + logoSpan(tool) + '<span class="badge badge-grad">' + esc(badge) + '</span></div>' +
        '<div class="feature-title">' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</div>' +
        '<div class="feature-cat">' + esc(cat ? cat.name : '') + '</div>' +
        '<p class="feature-desc clamp-2">' + esc(tool.tagline) + '</p>' +
        '<div class="feature-foot"><span class="feature-link">' + esc(x('tool.detail')) + icon('arrow-right') + '</span>' +
        '<span class="rating-inline">' + icon('star') + esc(tool.rating.toFixed(1)) + '</span></div></button>';
    }).join('') + '</div>';
  }

  function trendRow(tool, index) {
    var cat = catById(tool.cat);
    return '<button class="trend-row" data-action="tool" data-id="' + esc(tool.id) + '">' +
      '<span class="rank-badge' + (index === 0 ? ' r1' : '') + '">' + (index + 1) + '</span>' +
      logoSpan(tool, 'sm') +
      '<div class="trend-main"><div class="trend-title">' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</div>' +
      '<div class="trend-desc clamp-2">' + esc(tool.tagline) + '</div>' +
      '<div class="trend-meta">' + priceTag(tool) + (cat ? '<span class="tool-tag">' + esc(cat.short) + '</span>' : '') + '</div></div>' +
      '<div class="trend-right"><span class="rating-inline">' + icon('star') + esc(tool.rating.toFixed(1)) + '</span><span class="review-count">' + fmtCount(tool.reviews) + '</span></div></button>';
  }

  function recentCard(tool) {
    var cat = catById(tool.cat);
    return '<button class="recent-card" data-action="tool" data-id="' + esc(tool.id) + '">' +
      '<div class="recent-head">' + logoSpan(tool, 'sm') + icon('arrow-up-right') + '</div>' +
      '<div class="recent-title">' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</div>' +
      '<p class="recent-desc clamp-2">' + esc(tool.tagline) + '</p>' +
      '<div class="recent-meta"><span>' + esc(cat ? cat.name : '') + '</span><span>' + esc(tool.added) + '</span></div></button>';
  }

  function popularTools(n) {
    return DATA.tools.slice().sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, n || 3);
  }

  function tipCard() {
    return '<div class="note-card info mt-4">' + icon('lightbulb') +
      '<div><div class="section-label" style="color:var(--primary)">' + esc(x('home.tipsEyebrow')) + '</div>' +
      '<div class="strong" style="font-size:12px;margin-top:2px">' + esc(x('home.tipsTitle')) + '</div>' +
      '<p style="margin-top:2px">' + esc(x('home.tipsBody')) + '</p>' +
      '<a class="link-plain" style="font-size:10px;display:inline-flex;align-items:center;gap:4px;margin-top:6px" href="#/explore?cat=writing">' + esc(x('home.seeTools')) + icon('arrow-right') + '</a></div></div>';
  }

  function renderHome() {
    if (!state.user) return renderGuestHome();
    var trending = popularTools(5);
    var featured = [toolById('chatgpt'), toolById('figma'), toolById('zotero')].filter(Boolean);
    var recent = DATA.tools.slice().sort(function (a, b) { return String(b.added).localeCompare(String(a.added)); }).slice(0, 6);
    var content = '<div class="home-top"><div><p class="eyebrow">' + esc(x('home.studentLabel')) + '</p>' +
      '<div class="greeting">' + esc(greeting()) + ', <strong>' + esc(firstName()) + '</strong></div>' +
      '<p class="home-prompt">' + esc(t('home.prompt')) + '</p></div>' +
      '<div class="streak">' + icon('flame') + '<span>12 ' + esc(x('home.streakSuffix')) + '</span></div></div>' +
      '<form class="mt-3" data-form="home-search"><div class="search-bar">' + icon('search') +
      '<input name="q" placeholder="' + esc(t('home.search')) + '" aria-label="' + esc(t('common.search')) + '" />' +
      '<button class="search-go" type="submit" aria-label="' + esc(t('common.search')) + '">' + icon('arrow-right') + '</button></div></form>' +
      sectionHead(t('home.popular'), '#/explore', x('home.browseAll')) + categoryGrid() +
      sectionHead(t('home.featured'), '#/explore', t('common.seeAll')) + featureCards(featured) +
      sectionHead(t('home.trending'), '#/discover', t('common.seeAll')) + '<div class="trend-list">' + trending.map(trendRow).join('') + '</div>' +
      sectionHead(t('home.recent'), '#/explore?sort=newest', t('common.seeAll')) + '<div class="h-scroll recent-grid">' + recent.map(recentCard).join('') + '</div>' +
      tipCard();
    return shell(mainPage(content), 'home');
  }

  function renderGuestHome() {
    var featured = [toolById('zotero'), toolById('overleaf'), toolById('notion')].filter(Boolean);
    var content = '<div class="home-top"><div><p class="eyebrow">' + esc(t('guest.directory')) + '</p>' +
      '<div class="greeting">' + esc(t('home.morning')) + ', <strong>' + esc(t('common.guest')) + '</strong></div>' +
      '<p class="home-prompt">' + esc(t('home.guest.assistant')) + '</p></div>' +
      '<span class="streak" style="background:var(--lavender-soft);border-color:var(--lavender-line);color:var(--primary)">' + icon('eye') + '<span>' + esc(x('auth.guestWelcome')) + '</span></span></div>' +
      '<section class="guest-hero"><div class="gh-brand">' + icon('sparkles') + esc(t('guest.directory')) + '</div>' +
      '<h1>' + esc(t('home.guest.title')) + '</h1><p>' + esc(t('home.guest.desc')) + '</p>' +
      '<form data-form="home-search"><div class="search-bar">' + icon('search') + '<input name="q" placeholder="' + esc(t('home.guest.search')) + '" />' +
      '<button class="search-go" type="submit" aria-label="' + esc(t('common.search')) + '">' + icon('arrow-right') + '</button></div></form>' +
      '<div class="gh-actions"><button class="gh-tool-btn" data-action="assistant-locked">' + icon('sparkles') + esc(t('home.guest.assistant')) + '</button>' +
      '<span class="gh-note">' + icon('lock') + esc(t('home.guest.note')) + '</span></div></section>' +
      '<div class="guest-cta"><span class="gcta-ico">' + icon('graduation-cap') + '</span><div class="grow"><h3>' + esc(t('common.signup')) + '</h3><p>' + esc(t('home.guest.cta')) + '</p></div>' +
      '<a class="btn btn-primary" href="#/signup">' + esc(t('common.signup')) + '</a></div>' +
      sectionHead(t('home.popular'), '#/explore', t('common.seeAll')) + categoryGrid() +
      sectionHead(t('home.guest.weekly'), '#/discover', t('common.seeAll')) + featureCards(featured) +
      tipCard();
    return shell(mainPage(content), 'home');
  }

  /* ---------- explore ---------- */

  function searchHaystack(tool) {
    return [tool.name, tool.tagline, tool.desc, tool.tag, tool.catName, tool.catShort, tool.domain,
      (tool.features || []).join(' '), (tool.platforms || []).join(' ')].join(' ').toLowerCase();
  }

  function matchesQuery(tool, q) {
    if (!q) return true;
    var hay = searchHaystack(tool);
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (word) { return hay.indexOf(word) !== -1; });
  }

  function filterCount() {
    var count = 0;
    if (ui.cat !== 'all') count++;
    if (ui.pricing.length) count++;
    if (ui.rating > 0) count++;
    if (ui.studentOnly) count++;
    return count;
  }

  function filteredTools() {
    var q = ui.q.trim();
    var list = DATA.tools.filter(function (tool) {
      if (ui.cat !== 'all' && tool.cat !== ui.cat) return false;
      if (ui.pricing.length && ui.pricing.indexOf(tool.pricing) === -1) return false;
      if (ui.rating > 0 && tool.rating < ui.rating) return false;
      if (ui.studentOnly && !(tool.student || tool.edu || tool.pricing === 'Free for Students')) return false;
      return matchesQuery(tool, q);
    });
    list.sort(function (a, b) {
      if (ui.sort === 'rating') return b.rating - a.rating;
      if (ui.sort === 'newest') return String(b.added).localeCompare(String(a.added));
      if (ui.sort === 'name') return a.name.localeCompare(b.name);
      return b.popularity - a.popularity;
    });
    return list;
  }

  function exploreBodyHtml() {
    var list = filteredTools();
    var cards = list.length
      ? '<div class="tool-list">' + list.map(toolCard).join('') + suggestCardHtml() + '</div>'
      : '<div class="empty"><span class="e-ico">' + icon('search') + '</span><h3>' + esc(t('explore.noResults')) + '</h3><p>' + esc(t('explore.noResultsSub')) + '</p>' +
        '<button class="btn btn-soft btn-sm mt-4" data-action="filter-reset">' + icon('refresh') + '<span>' + esc(t('explore.resetAll')) + '</span></button></div>' +
        suggestCardHtml();
    return '<div class="explore-meta-row"><div class="explore-count">' + esc(t('explore.showing')) + ' <strong>' + list.length + '</strong> ' + esc(t('explore.matching')) + '</div>' +
      '<span class="sort-pill">' + esc(t('common.sortBy')) +
      '<select data-explore-sort aria-label="' + esc(t('common.sortBy')) + '">' +
      '<option value="popular"' + (ui.sort === 'popular' ? ' selected' : '') + '>' + esc(t('explore.mostPopular')) + '</option>' +
      '<option value="rating"' + (ui.sort === 'rating' ? ' selected' : '') + '>' + esc(t('explore.highestRated')) + '</option>' +
      '<option value="newest"' + (ui.sort === 'newest' ? ' selected' : '') + '>' + esc(t('explore.newest')) + '</option>' +
      '<option value="name"' + (ui.sort === 'name' ? ' selected' : '') + '>' + esc(t('explore.nameAZ')) + '</option>' +
      '</select></span></div>' + cards;
  }

  function suggestCardHtml() {
    return '<div class="suggest-card"><span class="sg-ico">' + icon('lightbulb') + '</span>' +
      '<div class="grow"><h3>' + esc(t('explore.suggest')) + '</h3><p>' + esc(t('explore.suggestSub')) + '</p></div>' +
      '<button class="btn btn-soft btn-sm" data-action="suggest">' + icon('plus') + '<span>' + esc(t('explore.suggestBtn')) + '</span></button></div>';
  }

  function renderExplore() {
    var chips = '<button class="chip' + (ui.cat === 'all' ? ' is-active' : '') + '" data-action="filter-cat" data-cat="all">' + icon('grid') + esc(x('explore.all')) + '</button>' +
      DATA.categories.map(function (cat) {
        return '<button class="chip' + (ui.cat === cat.id ? ' is-active' : '') + '" data-action="filter-cat" data-cat="' + esc(cat.id) + '">' + icon(cat.icon) + esc(cat.short) + '</button>';
      }).join('');
    var fc = filterCount();
    var head = '<div class="explore-head"><div><p class="eyebrow">' + esc(t('guest.directory')) + '</p><h1>' + esc(t('explore.title')) + '</h1><p class="sub">' + esc(t('explore.sub')) + '</p></div>' +
      '<span class="badge badge-neutral">' + DATA.tools.length + ' ' + esc(t('common.tools')) + '</span></div>';
    var search = '<div class="explore-search-row"><div class="search-bar">' + icon('search') +
      '<input data-live="explore" value="' + esc(ui.q) + '" placeholder="' + esc(x('explore.searchPh')) + '" aria-label="' + esc(t('common.search')) + '" /></div>' +
      '<button class="filter-btn" data-action="open-filters" aria-label="' + esc(t('explore.filters')) + '">' + icon('sliders') +
      (fc ? '<span class="fcount">' + fc + '</span>' : '') + '</button></div>';
    var filters = '<div class="explore-filters"><div class="chip-row">' + chips + '</div></div>';
    var content = head + search + filters + '<div id="explore-body">' + exploreBodyHtml() + '</div>';
    return shell(mainPage(content), 'explore');
  }

  function filterSheetHtml() {
    var cats = '<div class="filter-block"><div class="filter-block-head"><h3>' + esc(x('explore.category')) + '</h3></div>' +
      '<div class="option-grid"><button class="option o-radio' + (ui.cat === 'all' ? ' is-on' : '') + '" data-action="filter-cat-opt" data-cat="all">' +
      '<span class="o-check">' + icon('check') + '</span>' + icon('grid') + '<span>' + esc(x('explore.all')) + '</span></button>' +
      DATA.categories.map(function (cat) {
        return '<button class="option o-radio' + (ui.cat === cat.id ? ' is-on' : '') + '" data-action="filter-cat-opt" data-cat="' + esc(cat.id) + '">' +
          '<span class="o-check">' + icon('check') + '</span>' + icon(cat.icon) + '<span>' + esc(cat.short) + '</span></button>';
      }).join('') + '</div></div>';
    var plans = [
      { value: 'Free', label: x('explore.freeOnly') },
      { value: 'Freemium', label: x('explore.freemiumOnly') },
      { value: 'Free for Students', label: x('explore.studentPlans') }
    ];
    var pricing = '<div class="filter-block"><div class="filter-block-head"><h3>' + esc(x('explore.pricing')) + '</h3><span class="fb-hint">' + esc(t('common.select')) + '</span></div>' +
      '<div class="option-row">' + plans.map(function (plan) {
        return '<button class="option' + (ui.pricing.indexOf(plan.value) !== -1 ? ' is-on' : '') + '" data-action="filter-plan" data-value="' + esc(plan.value) + '">' +
          '<span class="o-check">' + icon('check') + '</span><span>' + esc(plan.label) + '</span></button>';
      }).join('') + '</div></div>';
    var ratings = '<div class="filter-block"><div class="filter-block-head"><h3>' + esc(x('explore.ratingLabel')) + '</h3></div><div class="filter-rating">' +
      [{ v: 0, l: x('explore.anyRating') }, { v: 4, l: x('explore.rating4') }, { v: 4.5, l: x('explore.rating45') }].map(function (r) {
        return '<button class="option o-radio' + (ui.rating === r.v ? ' is-on' : '') + '" data-action="filter-rating" data-value="' + r.v + '">' +
          '<span class="o-check">' + icon('check') + '</span><span>' + esc(r.l) + '</span></button>';
      }).join('') + '</div></div>';
    var student = '<div class="filter-block"><div class="filter-block-head"><h3>' + esc(x('explore.audience')) + '</h3></div>' +
      '<div class="option-row"><button class="option' + (ui.studentOnly ? ' is-on' : '') + '" data-action="filter-student"><span class="o-check">' + icon('check') + '</span>' + icon('graduation-cap') + '<span>' + esc(x('explore.studentOnly')) + '</span></button></div></div>';
    return cats + pricing + ratings + student;
  }

  function openFilterSheet() {
    openSheet({
      title: icon('sliders') + ' ' + esc(t('explore.filters')),
      sub: esc(x('explore.filterSub')),
      body: filterSheetHtml(),
      foot: '<button class="btn btn-outline" data-action="filter-reset">' + esc(t('explore.resetAll')) + '</button>' +
        '<button class="btn btn-primary" data-action="filter-apply">' + icon('check') + '<span>' + esc(x('explore.apply')) + '</span></button>'
    });
  }

  /* ---------- collections ---------- */

  function allFolders() {
    return DATA.collections.map(function (folder) { return Object.assign({ custom: false }, folder); })
      .concat(state.customFolders.map(function (folder) { return Object.assign({ custom: true }, folder); }));
  }

  function folderById(id) {
    var folders = allFolders();
    for (var i = 0; i < folders.length; i++) if (folders[i].id === id) return folders[i];
    return null;
  }

  function folderCatalogTools(folder) {
    if (!folder) return [];
    if (folder.custom) return (folder.tools || []).map(toolById).filter(Boolean);
    return DATA.tools.filter(function (tool) { return folder.cats.indexOf(tool.cat) !== -1; });
  }

  function folderCount(folder) {
    if (folder.custom) return (folder.tools || []).length;
    return folderCatalogTools(folder).length;
  }

  function folderCardHtml(folder) {
    return '<button class="folder-card" data-action="folder" data-folder="' + esc(folder.id) + '" style="--folder-bg:' + folder.bg + ';--folder-fg:' + folder.fg + '">' +
      '<span class="folder-ico">' + icon(folder.icon) + '</span>' +
      '<h3>' + esc(folder.name) + '</h3><p class="clamp-2">' + esc(folder.desc) + '</p>' +
      '<div class="folder-foot"><span class="folder-count">' + folderCount(folder) + ' ' + esc(x('collections.countMany')) + '</span>' + icon('arrow-up-right') + '</div></button>';
  }

  function collectionListTools() {
    var list;
    var folder = ui.folder === 'all' ? null : folderById(ui.folder);
    if (!folder) {
      list = state.saved.map(toolById).filter(Boolean);
    } else {
      list = folderCatalogTools(folder);
    }
    if (ui.cq.trim()) {
      list = list.filter(function (tool) { return matchesQuery(tool, ui.cq.trim()); });
    }
    list.sort(function (a, b) {
      if (ui.sort === 'name') return a.name.localeCompare(b.name);
      if (ui.sort === 'cat') return String(a.catName).localeCompare(String(b.catName));
      return 0;
    });
    return list;
  }

  function savedItemHtml(tool) {
    var cat = catById(tool.cat);
    return '<article class="saved-item">' + logoSpan(tool, 'sm') +
      '<div class="saved-main"><div class="saved-title">' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</div>' +
      '<div class="saved-sub clamp-2">' + esc(tool.tagline) + '</div>' +
      '<span class="saved-cat">' + icon('folder') + esc(cat ? cat.name : '') + '</span></div>' +
      saveButton(tool) + '</article>';
  }

  function collectionsListHtml() {
    var list = collectionListTools();
    var folder = ui.folder === 'all' ? null : folderById(ui.folder);
    var heading = folder ? folder.name : x('collections.allSaved');
    var items = list.length
      ? '<div class="saved-list">' + list.map(savedItemHtml).join('') + '</div>'
      : '<div class="empty"><span class="e-ico">' + icon('bookmark') + '</span><h3>' + esc(folder ? x('collections.emptyFolder') : x('collections.emptyList')) + '</h3><p>' + esc(folder ? x('collections.emptyFolderSub') : x('collections.emptyListSub')) + '</p>' +
        '<a class="btn btn-soft btn-sm mt-4" href="#/explore">' + icon('compass') + esc(t('nav.explore')) + '</a></div>';
    return '<div class="collections-list-head"><div class="cl-count"><strong>' + list.length + '</strong> ' + esc(heading.toLowerCase()) + ' - ' + esc(t('common.tools')) + '</div>' +
      '<div class="collections-tools"><span class="sort-pill">' + esc(t('collections.sort')) +
      '<select data-collection-sort aria-label="' + esc(t('collections.sort')) + '">' +
      '<option value="recent"' + (ui.sort !== 'name' && ui.sort !== 'cat' ? ' selected' : '') + '>' + esc(x('collections.sortRecent')) + '</option>' +
      '<option value="name"' + (ui.sort === 'name' ? ' selected' : '') + '>' + esc(x('collections.sortName')) + '</option>' +
      '<option value="cat"' + (ui.sort === 'cat' ? ' selected' : '') + '>' + esc(x('collections.sortCat')) + '</option>' +
      '</select></span></div></div>' + items;
  }

  function collectionTabsHtml() {
    var tabs = [{ id: 'all', name: x('collections.allSaved'), icon: 'bookmark' }].concat(allFolders().map(function (f) {
      return { id: f.id, name: f.name, icon: f.icon, custom: f.custom };
    }));
    var chips = tabs.map(function (tab) {
      return '<button class="chip' + (ui.folder === tab.id ? ' is-active' : '') + '" data-action="folder" data-folder="' + esc(tab.id) + '">' +
        icon(tab.icon) + esc(tab.name) + (tab.custom ? ' ' + icon('x') : '') + '</button>';
    }).join('');
    return '<div class="collection-tabs"><div class="chip-row">' + chips + '</div></div>';
  }

  function renderCollections() {
    if (!state.user) return renderGuestCollections();
    var folders = allFolders();
    var content = '<div class="page-head"><div><p class="eyebrow">' + esc(t('nav.workspace')) + '</p><h1>' + esc(t('collections.title')) + '</h1><p class="sub">' + esc(t('collections.sub')) + '</p></div>' +
      '<div class="head-actions"><button class="btn btn-primary btn-sm" data-action="new-folder">' + icon('folder-plus') + '<span>' + esc(t('collections.newFolder')) + '</span></button></div></div>' +
      '<div class="search-bar">' + icon('search') + '<input data-live="collections" value="' + esc(ui.cq) + '" placeholder="' + esc(t('collections.search')) + '" aria-label="' + esc(t('collections.search')) + '" /></div>' +
      '<div class="section-head"><h2>' + esc(t('collections.folders')) + '</h2><span class="section-label">' + esc(t('collections.foldersHint')) + '</span></div>' +
      '<div class="folder-grid">' + folders.map(folderCardHtml).join('') +
      '<button class="folder-card" data-action="new-folder" style="--folder-bg:var(--surface);--folder-fg:var(--muted)"><span class="folder-ico">' + icon('plus') + '</span><h3>' + esc(t('collections.newFolder')) + '</h3><p>' + esc(x('collections.newSub')) + '</p><div class="folder-foot"><span class="folder-count">' + esc(t('common.available')) + '</span>' + icon('arrow-right') + '</div></button></div>' +
      '<div class="divider"></div>' +
      '<div class="row-between"><h2 class="page-title" style="font-size:17px">' + esc(t('collections.saved')) + '</h2><span class="badge badge-neutral"><span data-saved-count>' + state.saved.length + '</span> ' + esc(t('collections.savedAcross')) + '</span></div>' +
      collectionTabsHtml() +
      '<div id="collections-body">' + collectionsListHtml() + '</div>';
    return shell(mainPage(content), 'collections');
  }

  function renderGuestCollections() {
    var examples = [
      { name: 'Thesis & Academic', icon: 'book-open', count: 10, bg: 'linear-gradient(145deg,#fffbeb,#fef3c7)', fg: '#d97706' },
      { name: 'Design & UI Assets', icon: 'palette', count: 6, bg: 'linear-gradient(145deg,#fdf2f8,#fce7f3)', fg: '#db2777' },
      { name: 'Daily Productivity', icon: 'clock', count: 6, bg: 'linear-gradient(145deg,#ecfdf5,#d1fae5)', fg: '#059669' }
    ];
    var content = '<div class="page-head"><div><p class="eyebrow">' + esc(t('guest.directory')) + '</p><h1>' + esc(t('collections.title')) + '</h1><p class="sub">' + esc(t('collections.sub')) + '</p></div>' +
      '<span class="badge badge-accent">' + icon('lock') + esc(x('collections.guestBadge')) + '</span></div>' +
      '<div class="panel" style="padding:20px;background:var(--grad-primary-soft);border-color:var(--lavender-line)">' +
      '<div class="row" style="align-items:flex-start"><span class="status-orb orb-primary" style="width:60px;height:60px;border-radius:20px;margin:0">' + icon('bookmark') + '</span>' +
      '<div class="grow"><h2 style="font-size:18px">' + esc(t('collections.guest.title')) + '</h2>' +
      '<p class="small muted" style="margin-top:5px;line-height:1.65">' + esc(t('collections.guest.desc')) + '</p></div></div>' +
      '<div class="feature-lock-list">' +
      '<div class="feature-lock"><span class="fl-ico">' + icon('refresh') + '</span><div><h4>' + esc(x('collections.benefitCloud')) + '</h4></div></div>' +
      '<div class="feature-lock"><span class="fl-ico">' + icon('folder') + '</span><div><h4>' + esc(x('collections.benefitFolders')) + '</h4></div></div>' +
      '<div class="feature-lock"><span class="fl-ico">' + icon('sparkles') + '</span><div><h4>' + esc(x('collections.benefitAssistant')) + '</h4></div></div>' +
      '</div>' +
      '<div class="row wrap mt-4"><a class="btn btn-primary" href="#/signup">' + icon('user') + esc(t('common.signup')) + '</a>' +
      '<a class="btn btn-outline" href="#/login">' + esc(t('common.login')) + '</a></div>' +
      '<div class="locked-foot" style="text-align:left;margin-top:10px">' + esc(t('home.guest.cta')) + '</div></div>' +
      '<div class="section-head"><h2>' + esc(t('collections.guest.example')) + '</h2><span class="badge badge-neutral">' + esc(t('collections.guest.open')) + '</span></div>' +
      '<div class="folder-grid">' + examples.map(function (example) {
        return '<div class="folder-card" style="--folder-bg:' + example.bg + ';--folder-fg:' + example.fg + '"><span class="folder-ico">' + icon(example.icon) + '</span>' +
          '<h3>' + esc(example.name) + '</h3><p>' + esc(t('collections.guest.cloud')) + '</p><div class="folder-foot"><span class="folder-count">' + example.count + ' ' + esc(t('common.tools')) + '</span>' + icon('lock') + '</div></div>';
      }).join('') + '</div>';
    return shell(mainPage(content), 'collections');
  }

  function openNewFolderSheet() {
    var icons = ['folder', 'book-open', 'palette', 'sparkles', 'clock', 'code', 'graduation-cap', 'chart'];
    var saved = state.saved.map(toolById).filter(Boolean);
    var body = '<form data-form="new-folder" novalidate>' +
      inputField({ name: 'folderName', label: x('collections.nameLabel'), placeholder: x('collections.namePh'), icon: 'folder', autocomplete: 'off' }) +
      '<div class="filter-block"><div class="filter-block-head"><h3>' + esc(x('collections.iconLabel')) + '</h3></div><div class="option-row">' +
      icons.map(function (name, i) {
        return '<label class="option o-radio' + (i === 0 ? ' is-on' : '') + '"><input type="radio" name="icon" value="' + name + '"' + (i === 0 ? ' checked' : '') + ' style="display:none" />' +
          '<span class="o-check">' + icon('check') + '</span>' + icon(name) + '<span>' + esc(name) + '</span></label>';
      }).join('') + '</div></div>' +
      '<div class="filter-block"><div class="filter-block-head"><h3>' + esc(x('collections.pickTools')) + '</h3><span class="fb-hint">' + state.saved.length + ' ' + esc(x('common.saved')) + '</span></div>' +
      (saved.length ? '<div class="option-grid">' + saved.map(function (tool) {
        return '<label class="option"><input type="checkbox" name="tools" value="' + esc(tool.id) + '" style="display:none" /><span class="o-check">' + icon('check') + '</span><span>' + esc(tool.name) + '</span></label>';
      }).join('') + '</div>' : '<div class="field-help">' + icon('info') + '<span>' + esc(x('collections.emptyListSub')) + '</span></div>') +
      '</div>' +
      '<div class="form-actions" style="margin-top:16px"><button class="btn btn-primary btn-block" type="submit">' + icon('folder-plus') + '<span>' + esc(x('collections.create')) + '</span></button></div></form>';
    openSheet({ title: icon('folder-plus') + ' ' + esc(x('collections.newTitle')), sub: esc(x('collections.newSub')), body: body });
  }

  /* ---------- discover ---------- */

  function updateCardHtml(update) {
    var tool = toolById(update.toolId);
    if (!tool) return '';
    return '<button class="update-card" data-action="tool" data-id="' + esc(tool.id) + '">' +
      '<div class="update-top"><span class="badge badge-neutral">' + esc(update.kind) + '</span><span class="review-count">' + esc(update.date) + '</span></div>' +
      '<div class="update-title">' + esc(update.title) + '</div>' +
      '<div class="update-meta">' + icon('clock') + esc(update.read) + '</div>' +
      '<div class="update-foot"><span class="row" style="gap:6px">' + logoSpan(tool, 'xs') + '<span class="small strong">' + esc(tool.name) + '</span></span>' +
      '<span class="feature-link">' + esc(update.cta) + icon('arrow-right') + '</span></div></button>';
  }

  function discoveryCards(list) {
    return '<div class="discover-cards">' + list.map(function (tool) {
      var cat = catById(tool.cat);
      return '<button class="disc-card card-hover" data-action="tool" data-id="' + esc(tool.id) + '">' +
        '<div class="dc-head">' + logoSpan(tool, 'sm') + '<div class="grow"><h3>' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</h3><div class="dc-sub">' + esc(cat ? cat.name : '') + '</div></div>' +
        '<span class="rating-inline">' + icon('star') + esc(tool.rating.toFixed(1)) + '</span></div>' +
        '<p class="disc-desc clamp-2">' + esc(tool.desc) + '</p>' +
        '<div class="dc-foot">' + priceTag(tool) + '<span class="feature-link">' + esc(t('common.viewAll')) + icon('arrow-right') + '</span></div></button>';
    }).join('') + '</div>';
  }

  function topicsHtml() {
    return '<div class="topic-cloud">' + DATA.topics.map(function (topic) {
      var term = topic.replace('#', '').replace(/([A-Z])/g, ' $1').trim();
      return '<a class="topic" href="#/explore?q=' + encodeURIComponent(term) + '">' + esc(topic) + '</a>';
    }).join('') + '</div>';
  }

  function discoverHero(member) {
    if (!member) {
      return '<section class="discover-hero"><span class="dh-orb">' + icon('sparkles') + '</span>' +
        '<div class="dh-match">' + esc(t('guest.directory')) + '</div>' +
        '<h2 class="dh-title">' + esc(t('discover.guest.title')) + '</h2>' +
        '<p class="dh-desc">' + esc(t('discover.guest.desc')) + '</p>' +
        '<div class="dh-actions"><a class="btn btn-primary" href="#/signup">' + icon('user') + esc(t('common.signup')) + '</a>' +
        '<a class="btn btn-outline" href="#/login">' + esc(t('common.login')) + '</a></div>' +
        '<div class="dh-tags"><span class="dh-tag">' + esc(t('discover.recommended')) + '</span><span class="dh-tag">' + esc(t('discover.latest')) + '</span><span class="dh-tag">' + esc(t('discover.trending')) + '</span></div></section>';
    }
    return '<section class="discover-hero"><span class="dh-orb">' + icon('book-open') + '</span>' +
      '<div class="dh-match">' + esc(x('discover.personalized')) + '</div>' +
      '<h2 class="dh-title">' + esc(x('discover.heroTitle')) + '</h2>' +
      '<p class="dh-desc">' + esc(x('discover.heroDesc')) + '</p>' +
      '<div class="dh-actions"><button class="btn btn-primary" data-action="canvas">' + icon('layers') + '<span>' + esc(x('discover.openCanvas')) + '</span></button>' +
      '<a class="btn btn-outline" href="#/assistant">' + icon('sparkles') + '<span>' + esc(t('nav.assistant')) + '</span></a></div>' +
      '<div class="dh-tags"><span class="dh-tag">' + esc(t('explore.freeFreemium')) + '</span><span class="dh-tag">' + esc(t('explore.studentDiscount')) + '</span><span class="dh-tag">' + esc(t('explore.highestRated')) + '</span></div></section>';
  }

  function renderDiscover() {
    var member = !!state.user;
    var recommended = [toolById('zotero'), toolById('connected-papers'), toolById('overleaf')].filter(Boolean);
    var quick = [toolById('figma'), toolById('notion'), toolById('cursor')].filter(Boolean);
    var trending = popularTools(4);
    var content = '<div class="page-head"><div><p class="eyebrow">' + esc(t('nav.discover')) + '</p><h1>' + esc(t('discover.title')) + '</h1><p class="sub">' + esc(t('discover.sub')) + '</p></div>' +
      '<span class="pulse-pill"><span class="pd"></span>' + esc(x('discover.live')) + '</span></div>' +
      discoverHero(member) +
      '<div class="discover-layout mt-2"><div>' +
      (member ? '<div class="section-head"><h2>' + esc(t('discover.recommended')) + '</h2><span class="section-label">' + esc(x('discover.recommendSub')) + '</span></div>' +
        '<div class="pulse-pill">' + icon('target') + esc(t('discover.matched')) + '</div>' + discoveryCards(recommended) :
        '<div class="guest-cta"><span class="gcta-ico">' + icon('sparkles') + '</span><div class="grow"><h3>' + esc(t('discover.guest.title')) + '</h3><p>' + esc(t('discover.guest.desc')) + '</p></div><a class="btn btn-primary" href="#/signup">' + esc(t('common.signup')) + '</a></div>') +
      '<div class="section-head"><h2>' + esc(t('discover.latest')) + '</h2><span class="section-label">' + esc(x('discover.updatesSub')) + '</span></div>' +
      '<div class="updates-grid">' + DATA.updates.map(updateCardHtml).join('') + '</div>' +
      '<div class="section-head"><h2>' + esc(t('discover.quickLaunch')) + '</h2><span class="section-label">' + esc(x('discover.quickSub')) + '</span></div>' +
      '<div class="mini-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px">' + quick.map(function (tool) {
        var cat = catById(tool.cat);
        return '<button class="mini-tool" data-action="tool" data-id="' + esc(tool.id) + '">' + logoSpan(tool, 'sm') +
          '<div class="grow"><div class="mt-title">' + esc(tool.name) + '</div><div class="mt-meta">' + esc(cat ? cat.short : '') + '</div></div>' + icon('arrow-up-right') + '</button>';
      }).join('') + '</div></div>' +
      '<div><div class="section-head"><h2>' + esc(t('discover.trending')) + '</h2></div>' +
      '<div class="trend-vertical">' + trending.map(trendRow).join('') + '</div>' +
      '<div class="section-head"><h2>' + esc(t('discover.topics')) + '</h2></div>' + topicsHtml() +
      '<div class="note-card info mt-4">' + icon('info') + '<span>' + esc(x('set.prototype')) + '</span></div></div></div>';
    return shell(mainPage(content), 'discover');
  }

  /* ---------- assistant ---------- */

  function assistantPool(filter) {
    var pool = DATA.tools.slice();
    if (filter === 'student') pool = pool.filter(function (tool) { return tool.student || tool.edu || tool.pricing === 'Free for Students'; });
    if (filter === 'free') pool = pool.filter(function (tool) { return tool.pricing === 'Free' || tool.pricing === 'Freemium' || tool.pricing === 'Free for Students'; });
    return pool;
  }

  function recommendTools(query, filter) {
    var words = String(query || '').toLowerCase().split(/\s+/).filter(function (w) { return w.length > 2; });
    var pool = assistantPool(filter);
    var scored = pool.map(function (tool) {
      var hay = searchHaystack(tool);
      var score = tool.popularity / 100;
      var name = tool.name.toLowerCase();
      words.forEach(function (word) {
        if (name.indexOf(word) !== -1) score += 6;
        if (tool.tag.toLowerCase().indexOf(word) !== -1) score += 3;
        if (hay.indexOf(word) !== -1) score += 2;
      });
      return { tool: tool, score: score };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 3).map(function (row) { return row.tool; });
  }

  function recoListHtml(list) {
    if (!list.length) {
      return '<div class="empty" style="padding:22px"><span class="e-ico">' + icon('search') + '</span><h3>' + esc(x('asst.noResults')) + '</h3></div>';
    }
    return '<div class="reco-list">' + list.map(function (tool) {
      var cat = catById(tool.cat);
      return '<button class="reco-item" data-action="tool" data-id="' + esc(tool.id) + '">' + logoSpan(tool, 'sm') +
        '<div class="reco-main"><div class="reco-name">' + esc(tool.name) + (tool.verified ? ' ' + icon('badge-check') : '') + '</div>' +
        '<div class="reco-desc clamp-2">' + esc(tool.tagline) + '</div>' +
        '<div class="reco-why">' + icon('sparkles') + esc(x('asst.why')) + ': ' + esc(cat ? cat.short : tool.tag) + ' - ' + esc(tool.pricing) + '</div></div>' +
        icon('arrow-up-right') + '</button>';
    }).join('') + '</div>';
  }

  function assistantChatHtml() {
    var greeting = '<div class="chat"><div class="chat-assistant" style="margin-top:0"><span class="ca-ico">' + icon('sparkles') + '</span>' +
      '<div class="chat-bubble"><h4>' + esc(t('assistant.greeting')) + '</h4><p>' + esc(t('assistant.greetDesc')) + '</p>' +
      '<span class="ca-status"><span class="status-dot"></span>' + esc(t('assistant.green')) + '</span></div></div></div>';
    if (!ui.chat) return '<div id="bantu-chat">' + greeting + '</div>';
    var user = '<div class="chat"><div class="chat-row"><div class="chat-user">' + esc(ui.chat.query) + '</div></div>';
    if (!ui.chat.results) {
      return '<div id="bantu-chat">' + greeting + user + '<div class="chat-assistant"><span class="ca-ico">' + icon('sparkles') + '</span>' +
        '<div class="chat-bubble"><div class="typing"><span></span><span></span><span></span></div><p class="tiny">' + esc(t('assistant.typing')) + '</p></div></div></div></div>';
    }
    var bubble = '<div class="chat-assistant"><span class="ca-ico">' + icon('sparkles') + '</span><div class="chat-bubble">' +
      '<h4>' + esc(x('asst.resultsTitle')) + '</h4><p>' + esc(x('asst.found')) + '</p>' +
      '<span class="ca-status"><span class="status-dot"></span>' + esc(t('assistant.demoNote')) + '</span></div></div>';
    return '<div id="bantu-chat">' + greeting + user + bubble + '</div></div>';
  }

  function renderAssistant() {
    var prompts = DATA.prompts.map(function (prompt) {
      return '<button class="prompt-card" data-action="prompt" data-prompt="' + esc(prompt.id) + '">' +
        '<span class="prompt-ico" style="--p-tile:' + prompt.tile + '">' + icon(prompt.icon) + '</span>' +
        '<h4>' + esc(prompt.title) + '</h4><p class="clamp-2">' + esc(prompt.desc) + '</p>' +
        '<span class="prompt-tag">' + esc(prompt.tag) + '</span></button>';
    }).join('');
    var filters = [
      { id: 'all', label: x('asst.allTools') },
      { id: 'student', label: x('asst.studentOnly') },
      { id: 'free', label: x('asst.freeDiscount') }
    ].map(function (f) {
      return '<button class="chip' + (ui.assistantFilter === f.id ? ' is-active' : '') + '" data-action="assistant-filter" data-filter="' + f.id + '">' + esc(f.label) + '</button>';
    }).join('');
    var resultsBlock = '<div id="bantu-results">' + (ui.chat && ui.chat.results ?
      '<div class="section-head"><h2>' + esc(x('asst.resultsTitle')) + '</h2><span class="section-label">' + esc(x('asst.found')) + '</span></div>' +
      '<div class="bantu-filters"><div class="chip-row">' + filters + '</div></div>' + recoListHtml(ui.chat.results) : '') + '</div>';
    var content = '<div class="bantu-wrap"><div class="bantu-brand"><span class="bantu-orb">' + icon('sparkles') + '</span>' +
      '<div><h2>' + esc(t('assistant.name')) + '</h2><p>' + esc(t('assistant.understands')) + '</p></div>' +
      '<span class="badge badge-neutral tools-count">' + DATA.tools.length + ' ' + esc(x('asst.count')) + '</span></div>' +
      assistantChatHtml() +
      '<form class="chat-input-row" data-form="assistant"><div class="chat-input">' + icon('message') +
      '<input name="q" placeholder="' + esc(x('asst.placeholder')) + '" value="' + esc(ui.chat ? ui.chat.query : '') + '" aria-label="' + esc(t('assistant.title')) + '" />' +
      '<button class="chat-send" type="submit" aria-label="' + esc(x('asst.send')) + '">' + icon('send') + '</button></div>' +
      '<div class="chat-note">' + icon('shield') + '<span>' + esc(t('assistant.demoNote')) + '</span></div></form>' +
      resultsBlock +
      '<div class="section-head"><h2>' + esc(t('assistant.inspiration')) + '</h2><span class="section-label">' + esc(t('assistant.choosePrompt')) + '</span></div>' +
      '<div class="prompt-grid">' + prompts + '</div>' +
      '<div class="note-card info mt-4">' + icon('info') + '<span>' + esc(x('asst.demo')) + '. ' + esc(t('assistant.demoNote')) + '</span></div></div>';
    return shell(mainPage(content), 'assistant');
  }

  function askAssistant(query) {
    var q = String(query || '').trim();
    if (!q) return;
    ui.chat = { query: q, results: null };
    renderApp();
    var handle = setTimeout(function () {
      if (!ui.chat) return;
      ui.chat.results = recommendTools(q, ui.assistantFilter);
      if (parseHash().path === 'assistant') renderApp();
    }, 620);
    timers.push(handle);
  }

  /* ---------- settings ---------- */

  function themeLabel() {
    if (state.theme === 'dark') return t('theme.dark');
    if (state.theme === 'system') return t('theme.system');
    return t('theme.light');
  }

  function langLabel() {
    return state.lang === 'id' ? 'Bahasa Indonesia' : 'English';
  }

  function switchHtml(key) {
    var on = !!state.settings[key];
    return '<label class="switch"><input type="checkbox" data-setting="' + esc(key) + '"' + (on ? ' checked' : '') + ' /><span class="track"></span></label>';
  }

  function settingRow(o) {
    var end = o.end !== undefined ? o.end : (o.toggle ? switchHtml(o.toggle) : (o.action ? icon('chevron-right', 'chev') : (o.href ? icon('chevron-right', 'chev') : '')));
    var inner = '<span class="set-ico' + (o.tone ? ' ' + o.tone : '') + '">' + icon(o.icon) + '</span>' +
      '<span class="set-main"><span class="set-title">' + esc(o.title) + '</span>' + (o.sub ? '<span class="set-sub">' + esc(o.sub) + '</span>' : '') + '</span>' +
      '<span class="set-end">' + end + '</span>';
    if (o.toggle) return '<div class="set-item">' + inner + '</div>';
    if (o.href) return '<a class="set-item" href="' + o.href + '">' + inner + '</a>';
    return '<button class="set-item" data-action="' + o.action + '"' + (o.value ? ' data-value="' + esc(o.value) + '"' : '') + '>' + inner + '</button>';
  }

  function settingsFooter() {
    return '<div class="settings-foot"><div class="sf-brand"><img src="' + LOGO + '" alt="" /><span>SOTERA</span></div>' +
      '<div class="sf-copy">' + esc(x('set.version')) + '</div><div class="sf-copy">' + esc(x('set.prototype')) + '</div></div>';
  }

  function renderSettings() {
    if (!state.user) return renderGuestSettings();
    var banner = '<div class="profile-banner">' + avatarHtml('avatar-lg') +
      '<div class="pb-main"><h2>' + esc(state.user.name) + '</h2><div class="pb-mail">' + esc(state.user.email) + '</div>' +
      '<div class="pb-sub">' + icon('badge-check') + ' ' + esc(x('set.memberSince')) + ' - ' + esc(state.user.joined) + '</div></div>' +
      '<a class="btn btn-outline btn-sm" href="#/settings/profile">' + icon('pencil') + '<span>' + esc(t('settings.manageProfile')) + '</span></a></div>';
    var content = '<div class="settings-page"><div class="page-head"><div><p class="eyebrow">' + esc(t('nav.workspace')) + '</p><h1>' + esc(t('settings.title')) + '</h1></div></div>' + banner +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.preferences')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/settings/theme', icon: 'moon', title: t('settings.appearance'), sub: t('settings.appearanceSub'), end: '<span class="set-value">' + esc(themeLabel()) + '</span>' }) +
      settingRow({ href: '#/settings/language', icon: 'globe', title: t('settings.language'), sub: t('settings.languageSub'), end: '<span class="set-value">' + esc(langLabel()) + '</span>' }) +
      settingRow({ toggle: 'toolUpdates', icon: 'bell', title: t('settings.toolUpdates'), sub: t('settings.toolUpdatesSub') }) +
      '</div></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.account')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/settings/account', icon: 'user', title: t('settings.manageAccount'), sub: t('settings.manageAccountSub') }) +
      settingRow({ toggle: 'notifications', icon: 'mail', title: t('settings.notifications'), sub: t('settings.notificationsSub') }) +
      settingRow({ action: 'sessions', icon: 'shield', title: t('settings.privacy'), sub: t('settings.privacySub') }) +
      '</div></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.community')) + '</span><div class="settings-card">' +
      settingRow({ action: 'share', icon: 'upload', title: t('settings.share'), sub: t('settings.shareSub'), tone: 'warm' }) +
      settingRow({ action: 'request', icon: 'plus', title: t('settings.request'), sub: t('settings.requestSub'), tone: 'green' }) +
      '</div></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.support')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/help', icon: 'help-circle', title: t('settings.helpCenter'), sub: t('settings.helpSub'), tone: 'blue' }) +
      settingRow({ href: '#/faq', icon: 'message', title: t('settings.faq'), sub: t('settings.faqSub') }) +
      settingRow({ href: '#/contact', icon: 'mail', title: t('settings.contact'), sub: t('settings.contactSub') }) +
      '</div></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.about')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/about', icon: 'info', title: t('settings.aboutApp'), sub: x('set.version') }) +
      settingRow({ href: '#/privacy', icon: 'lock', title: t('settings.privacyPolicy') }) +
      settingRow({ href: '#/terms', icon: 'file-text', title: t('settings.terms') }) +
      '</div></div>' +
      '<div class="settings-group"><div class="settings-card">' +
      settingRow({ action: 'logout', icon: 'logout', title: t('settings.logout'), tone: 'red' }) + '</div></div>' +
      settingsFooter() + '</div>';
    return shell(mainPage(content), 'settings');
  }

  function renderGuestSettings() {
    var content = '<div class="settings-page"><div class="page-head"><div><p class="eyebrow">' + esc(t('nav.workspace')) + '</p><h1>' + esc(t('settings.title')) + '</h1></div></div>' +
      '<div class="profile-banner"><span class="avatar avatar-lg">G</span><div class="pb-main"><h2>' + esc(x('set.guestTitle')) + '</h2>' +
      '<div class="pb-mail">' + esc(x('set.guestDesc')) + '</div></div></div>' +
      '<div class="row wrap mt-4"><a class="btn btn-primary" href="#/login">' + icon('arrow-right') + esc(t('common.login')) + '</a>' +
      '<a class="btn btn-outline" href="#/signup">' + esc(t('common.signup')) + '</a></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.preferences')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/settings/theme', icon: 'moon', title: t('settings.appearance'), sub: t('settings.appearanceSub'), end: '<span class="set-value">' + esc(themeLabel()) + '</span>' }) +
      settingRow({ href: '#/settings/language', icon: 'globe', title: t('settings.language'), sub: t('settings.languageSub'), end: '<span class="set-value">' + esc(langLabel()) + '</span>' }) +
      '</div></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.support')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/help', icon: 'help-circle', title: t('settings.helpCenter'), sub: t('settings.helpSub'), tone: 'blue' }) +
      settingRow({ href: '#/faq', icon: 'message', title: t('settings.faq'), sub: t('settings.faqSub') }) +
      settingRow({ href: '#/contact', icon: 'mail', title: t('settings.contact'), sub: t('settings.contactSub') }) +
      '</div></div>' +
      '<div class="settings-group"><span class="section-label">' + esc(t('settings.about')) + '</span><div class="settings-card">' +
      settingRow({ href: '#/about', icon: 'info', title: t('settings.aboutApp'), sub: x('set.version') }) +
      settingRow({ href: '#/privacy', icon: 'lock', title: t('settings.privacyPolicy') }) +
      settingRow({ href: '#/terms', icon: 'file-text', title: t('settings.terms') }) +
      '</div></div>' + settingsFooter() + '</div>';
    return shell(mainPage(content), 'settings');
  }

  function openNotifications() {
    var body = '<div class="updates-grid" style="margin-top:2px">' + DATA.updates.map(updateCardHtml).join('') + '</div>' +
      '<div class="note-card info mt-4">' + icon('info') + '<span>' + esc(t('common.demo')) + ' - ' + esc(x('notif.sub')) + '</span></div>';
    openSheet({
      title: icon('bell') + ' ' + esc(x('notif.title')),
      sub: esc(x('notif.sub')),
      body: body,
      foot: '<button class="btn btn-outline" data-close-sheet>' + esc(t('common.close')) + '</button>' +
        '<button class="btn btn-primary" data-action="mark-read">' + icon('check') + '<span>' + esc(x('notif.mark')) + '</span></button>'
    });
  }

  function openSessions() {
    openSheet({
      title: icon('shield') + ' ' + esc(x('set.sessionsTitle')),
      sub: esc(t('settings.privacy')),
      body: '<div class="status-card" style="margin-top:2px"><h3>' + icon('monitor') + esc(x('set.thisDevice')) + '</h3>' +
        '<p>' + esc(x('set.sessionsBody')) + '</p><div class="sc-row"><span class="status-dot"></span><span class="badge badge-success">' + esc(x('set.activeNow')) + '</span></div></div>' +
        '<div class="note-card info mt-4">' + icon('lock') + '<span>' + esc(t('account.encryption')) + '</span></div>'
    });
  }

  function openShareSheet() {
    var body = '<form data-form="share" novalidate>' +
      inputField({ name: 'shareName', label: x('set.shareName'), icon: 'link', placeholder: 'Zotero' }) +
      inputField({ name: 'shareUrl', type: 'url', label: x('set.shareUrl'), icon: 'external-link', placeholder: 'https://' }) +
      inputField({ name: 'shareNote', textarea: true, label: x('set.shareNote'), placeholder: x('set.shareNote') }) +
      '<div class="form-actions"><button class="btn btn-primary btn-block" type="submit">' + icon('send') + '<span>' + esc(x('set.shareSend')) + '</span></button></div></form>';
    openSheet({ title: icon('upload') + ' ' + esc(x('set.shareTitle')), sub: esc(x('set.shareSub')), body: body });
  }

  function openRequestSheet() {
    var body = '<form data-form="request" novalidate>' +
      inputField({ name: 'requestName', label: x('set.requestName'), icon: 'plus', placeholder: x('set.requestName') }) +
      inputField({ name: 'requestReason', textarea: true, label: x('set.requestReason'), placeholder: x('set.requestReason') }) +
      '<div class="form-actions"><button class="btn btn-primary btn-block" type="submit">' + icon('send') + '<span>' + esc(x('set.requestSend')) + '</span></button></div></form>';
    openSheet({ title: icon('plus') + ' ' + esc(x('set.requestTitle')), sub: esc(x('set.requestSub')), body: body });
  }

  /* ---------- language ---------- */

  function renderLanguage() {
    var choice = ui.langChoice || state.lang;
    var langs = [
      { id: 'en', flag: 'EN', name: 'English', sub: 'English interface and international campus formats.' },
      { id: 'id', flag: 'ID', name: 'Bahasa Indonesia', sub: 'Antarmuka Bahasa Indonesia dan format kampus lokal.' }
    ].map(function (lang) {
      return '<button class="lang-card' + (choice === lang.id ? ' is-active' : '') + '" data-action="lang-choice" data-lang="' + lang.id + '">' +
        '<span class="lang-flag">' + esc(lang.flag) + '</span><div class="lang-main"><div class="lang-name">' + esc(lang.name) +
        (choice === lang.id ? ' <span class="badge badge-success">' + esc(t('language.systemActive')) + '</span>' : '') + '</div>' +
        '<div class="lang-sub">' + esc(lang.sub) + '</div></div>' + icon(choice === lang.id ? 'check-circle' : 'circle') + '</button>';
    }).join('');
    var content = backRow('#/settings', t('common.back')) +
      '<div class="form-page"><div class="page-head"><div><h1>' + esc(t('language.title')) + '</h1><p class="sub">' + esc(t('language.sub')) + '</p></div></div>' +
      '<div class="section-marker">' + esc(t('language.primary')) + '</div><div class="col" style="gap:9px">' + langs + '</div>' +
      '<div class="section-marker">' + esc(t('language.supported')) + '</div>' +
      '<div class="settings-card"><div class="set-item"><span class="set-ico">' + icon('check-circle') + '</span><span class="set-main"><span class="set-title">' + esc(t('language.available')) + '</span><span class="set-sub">English, Bahasa Indonesia</span></span><span class="set-end"><span class="set-value">2</span></span></div></div>' +
      '<div class="section-marker">' + esc(t('language.regional')) + '</div>' +
      '<div class="panel"><div class="field"><div class="field-label"><span>' + esc(t('language.calendar')) + '</span></div><select class="select-plain"><option>Ganjil / Odd Semester 2026</option><option>Genap / Even Semester 2026</option></select></div>' +
      '<div class="field mt-3"><div class="field-label"><span>' + esc(t('language.date')) + '</span></div><select class="select-plain"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></div>' +
      '<div class="field mt-3"><div class="field-label"><span>' + esc(t('language.currency')) + '</span></div><select class="select-plain"><option>IDR - Indonesian Rupiah</option><option>USD - US Dollar</option></select></div></div>' +
      '<div class="note-card info mt-4">' + icon('globe') + '<span>' + esc(x('legal.note')) + '</span></div>' +
      '<div class="form-actions"><button class="btn btn-primary" data-action="lang-apply">' + icon('check') + '<span>' + esc(t('language.apply')) + '</span></button>' +
      '<button class="btn btn-ghost" data-action="lang-cancel">' + esc(t('language.cancel')) + '</button></div></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- theme ---------- */

  function themePreview(kind) {
    return '<span class="theme-preview ' + kind + '"><span class="tp-side"></span>' +
      '<span class="tp-line" style="top:12px;width:36px"></span><span class="tp-line" style="top:22px;width:26px"></span>' +
      '<span class="tp-card" style="left:24px;top:32px;width:30px;height:14px"></span>' +
      '<span class="tp-card" style="left:58px;top:32px;width:9px;height:14px;opacity:.45"></span></span>';
  }

  function themeCard(value, iconName, title, desc, preview) {
    var active = state.theme === value;
    return '<button class="theme-card' + (active ? ' is-active' : '') + '" data-action="theme-choice" data-theme-value="' + value + '">' +
      themePreview(preview) + '<span class="theme-main"><span class="theme-name">' + icon(iconName) + esc(title) + '</span>' +
      '<span class="theme-desc">' + esc(desc) + '</span></span><span class="theme-check">' + icon('check') + '</span></button>';
  }

  function renderTheme() {
    var content = backRow('#/settings', t('common.back')) +
      '<div class="form-page"><div class="page-head"><div><h1>' + esc(t('theme.title')) + '</h1><p class="sub">' + esc(t('theme.sub')) + '</p></div></div>' +
      '<div class="col" style="gap:9px">' +
      themeCard('light', 'sun', t('theme.light'), t('theme.lightDesc'), '') +
      themeCard('dark', 'moon', t('theme.dark'), t('theme.darkDesc'), 'dark') +
      themeCard('system', 'monitor', t('theme.system'), t('theme.systemDesc'), 'system') +
      '</div>' +
      '<div class="section-marker">' + esc(t('theme.enhancements')) + '</div>' +
      '<div class="settings-card">' +
      '<div class="set-item"><span class="set-ico">' + icon('eye') + '</span><span class="set-main"><span class="set-title">' + esc(t('theme.contrast')) + '</span><span class="set-sub">' + esc(t('theme.contrastDesc')) + '</span></span><span class="set-end"><label class="switch"><input type="checkbox" data-flag="contrast"' + (state.contrast ? ' checked' : '') + ' /><span class="track"></span></label></span></div>' +
      '<div class="set-item"><span class="set-ico">' + icon('zap') + '</span><span class="set-main"><span class="set-title">' + esc(t('theme.reduceMotion')) + '</span><span class="set-sub">' + esc(t('theme.reduceMotionDesc')) + '</span></span><span class="set-end"><label class="switch"><input type="checkbox" data-flag="reduceMotion"' + (state.motion === 'reduced' ? ' checked' : '') + ' /><span class="track"></span></label></span></div>' +
      '<div class="set-item"><span class="set-ico">' + icon('smartphone') + '</span><span class="set-main"><span class="set-title">' + esc(t('theme.oled')) + '</span><span class="set-sub">' + esc(t('theme.oledDesc')) + '</span></span><span class="set-end"><label class="switch"><input type="checkbox" data-flag="oled"' + (state.oled ? ' checked' : '') + ' /><span class="track"></span></label></span></div>' +
      '</div>' +
      '<div class="form-actions"><button class="btn btn-primary" data-action="theme-save">' + icon('check') + '<span>' + esc(t('theme.save')) + '</span></button>' +
      '<button class="btn btn-ghost" data-action="theme-reset">' + icon('refresh') + '<span>' + esc(t('theme.resetDefault')) + '</span></button></div></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- manage account ---------- */

  function renderAccount() {
    var content = backRow('#/settings', t('settings.title')) +
      '<div class="settings-page"><div class="page-head"><div><h1>' + esc(t('account.title')) + '</h1><p class="sub">' + esc(t('account.sub')) + '</p></div></div>' +
      '<div class="profile-banner">' + avatarHtml('avatar-lg') + '<div class="pb-main"><h2>' + esc(state.user.name) + '</h2>' +
      '<div class="pb-mail">' + esc(state.user.email) + '</div><div class="pb-sub">' + esc(x('set.memberSince')) + ' - ' + esc(state.user.joined) + '</div></div>' +
      '<a class="btn btn-outline btn-sm" href="#/settings/profile">' + icon('pencil') + '<span>' + esc(t('settings.manageProfile')) + '</span></a></div>' +
      '<div class="settings-card mt-4">' +
      settingRow({ href: '#/settings/profile', icon: 'user', title: t('account.editProfile'), sub: t('account.editProfileSub') }) +
      settingRow({ href: '#/settings/password', icon: 'key', title: t('account.changePassword'), sub: t('account.changePasswordSub') }) +
      settingRow({ href: '#/settings/email', icon: 'mail', title: t('account.changeEmail'), sub: t('account.changeEmailSub') }) +
      '</div>' +
      '<div class="note-card info mt-4">' + icon('shield') + '<span>' + esc(t('account.encryption')) + '</span></div>' +
      '<div class="section-marker">' + esc(t('account.dangerZone')) + '</div>' +
      '<div class="danger-zone"><h3>' + icon('alert-circle') + esc(t('account.delete')) + '</h3><p>' + esc(t('account.deleteSub')) + '</p>' +
      '<a class="btn btn-danger-soft btn-sm mt-3" href="#/settings/delete">' + icon('trash') + '<span>' + esc(t('account.delete')) + '</span></a></div></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- profile ---------- */

  function renderProfile() {
    var content = backRow('#/settings/account', t('account.title')) +
      '<div class="form-page"><div class="page-head"><div><h1>' + esc(t('profile.title')) + '</h1><p class="sub">' + esc(t('profile.sub')) + '</p></div></div>' +
      '<div class="profile-avatar-row">' + avatarHtml('avatar-xl') +
      '<div class="pa-actions"><button class="btn btn-outline btn-sm" data-action="pick-avatar">' + icon('camera') + '<span>' + esc(t('profile.photo')) + '</span></button>' +
      '<button class="link-plain" data-action="remove-avatar">' + esc(t('profile.remove')) + '</button>' +
      '<span class="pa-hint">' + esc(t('profile.photoHint')) + '</span></div>' +
      '<input type="file" id="avatar-input" accept="image/*" style="display:none" /></div>' +
      '<form data-form="profile" novalidate>' +
      inputField({ name: 'name', label: t('profile.fullName'), icon: 'user', value: state.user.name, autocomplete: 'name' }) +
      inputField({ name: 'username', label: t('profile.username'), icon: 'at-sign', value: state.user.username, help: t('profile.usernameHint') }) +
      inputField({ name: 'bio', textarea: true, label: x('profile.bio'), placeholder: x('profile.bioPh'), value: state.user.bio || '' }) +
      inputField({ name: 'email', type: 'email', label: t('profile.email'), icon: 'mail', value: state.user.email, readonly: true, help: t('profile.linked') }) +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' + icon('check') + '<span>' + esc(t('common.save')) + '</span></button>' +
      '<a class="btn btn-ghost" href="#/settings/account">' + esc(t('common.cancel')) + '</a></div></form></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- password ---------- */

  function renderPassword() {
    var content = backRow('#/settings/account', t('account.title')) +
      '<div class="form-page"><div class="page-head"><div><h1>' + esc(t('password.title')) + '</h1><p class="sub">' + esc(t('password.sub')) + '</p></div></div>' +
      '<div class="note-card info">' + icon('shield') + '<div><div class="strong">' + esc(t('password.noteTitle')) + '</div><span>' + esc(t('password.note')) + '</span></div></div>' +
      '<form data-form="password" novalidate>' +
      inputField({ name: 'current', type: 'password', password: true, label: t('password.current'), icon: 'key', autocomplete: 'current-password', labelLink: '#/forgot', labelLinkText: t('password.forgot') }) +
      inputField({ name: 'next', type: 'password', password: true, label: t('password.new'), icon: 'lock', autocomplete: 'new-password' }) +
      strengthMarkup() +
      inputField({ name: 'confirm', type: 'password', password: true, label: t('password.confirm'), icon: 'lock', autocomplete: 'new-password' }) +
      '<div class="panel mt-3"><div class="row-between"><div class="grow"><div class="set-title">' + esc(t('password.logout')) + '</div><div class="set-sub">' + esc(t('password.logoutHint')) + '</div></div>' +
      '<label class="switch"><input type="checkbox" checked /><span class="track"></span></label></div></div>' +
      '<div class="note-card mt-3">' + icon('info') + '<span>' + esc(x('password.demoNote')) + '</span></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' + icon('check') + '<span>' + esc(t('password.update')) + '</span></button>' +
      '<a class="btn btn-ghost" href="#/settings/account">' + esc(t('common.cancel')) + '</a></div></form></div>';
    return shell(mainPage(content), 'settings');
  }

  function renderPasswordDone() {
    return statusPage({
      orb: 'success',
      eyebrow: t('password.update'),
      icon: 'check-circle',
      title: x('password.updatedTitle'),
      desc: x('password.updatedDesc'),
      actions: '<a class="btn btn-primary" href="#/settings/account">' + icon('arrow-left') + esc(x('password.updatedBack')) + '</a>' +
        '<a class="btn btn-ghost" href="#/home">' + esc(x('status.backHome')) + '</a>'
    });
  }

  /* ---------- email ---------- */

  function renderEmail() {
    var content = backRow('#/settings/account', t('account.title')) +
      '<div class="form-page"><div class="page-head"><div><h1>' + esc(t('email.title')) + '</h1><p class="sub">' + esc(t('email.sub')) + '</p></div></div>' +
      '<div class="note-card info">' + icon('mail') + '<span>' + esc(t('email.desc')) + '</span></div>' +
      '<form data-form="email" novalidate>' +
      inputField({ name: 'current', type: 'email', label: t('email.current'), icon: 'mail', value: state.user.email, readonly: true, help: t('email.primary') }) +
      inputField({ name: 'email', type: 'email', label: t('email.new'), icon: 'at-sign', placeholder: 'new.name@campus.edu', autocomplete: 'email' }) +
      inputField({ name: 'confirm', type: 'email', label: t('email.confirm'), icon: 'at-sign', placeholder: 'new.name@campus.edu', autocomplete: 'email' }) +
      inputField({ name: 'password', type: 'password', password: true, label: t('email.password'), icon: 'key', help: t('email.passwordHint'), autocomplete: 'current-password' }) +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' + icon('send') + '<span>' + esc(t('email.send')) + '</span></button>' +
      '<a class="btn btn-ghost" href="#/settings/account">' + esc(t('common.cancel')) + '</a></div></form></div>';
    return shell(mainPage(content), 'settings');
  }

  function otpInputs() {
    var html = '';
    for (var i = 0; i < 6; i++) {
      html += '<input name="o' + i + '" data-otp="' + i + '" inputmode="numeric" maxlength="1" aria-label="' + esc(t('verify.code')) + ' ' + (i + 1) + '" />';
    }
    return html;
  }

  function renderVerify() {
    var pending = ui.pendingEmail || 'new.name@campus.edu';
    var content = backRow('#/settings/email', t('email.title')) +
      '<div class="form-page"><div class="page-head page-head-centered"><div><span class="status-orb orb-primary" style="width:64px;height:64px;border-radius:22px;margin:0 auto 12px">' + icon('mail') + '</span>' +
      '<h1>' + esc(t('verify.title')) + '</h1><p class="sub">' + esc(t('verify.desc')) + '</p></div></div>' +
      '<div class="status-card" style="margin-top:0"><h3>' + icon('at-sign') + esc(t('email.new')) + '</h3><p>' + esc(pending) + '</p>' +
      '<div class="sc-row"><span class="badge badge-neutral">' + esc(x('email.demoCode')) + '</span><span class="badge badge-grad">123456</span></div></div>' +
      '<form data-form="verify" class="mt-4" novalidate><div class="otp">' + otpInputs() + '</div>' +
      '<div class="otp-meta mt-3"><span>' + esc(t('verify.expires')) + ' <strong data-otp-timer>09:59</strong></span>' +
      '<button class="link-plain" type="button" data-action="resend">' + esc(t('verify.resend')) + ' 60s</button></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' + icon('check') + '<span>' + esc(t('verify.verify')) + '</span></button>' +
      '<a class="btn btn-ghost" href="#/settings/email">' + esc(t('verify.change')) + '</a></div></form></div>';
    return shell(mainPage(content), 'settings');
  }

  function startVerifyTimer() {
    var seconds = 600;
    var node = document.querySelector('[data-otp-timer]');
    if (!node) return;
    var tick = function () {
      seconds = Math.max(0, seconds - 1);
      var mm = String(Math.floor(seconds / 60)).padStart(2, '0');
      var ss = String(seconds % 60).padStart(2, '0');
      node.textContent = mm + ':' + ss;
      if (seconds === 0) clearInterval(handle);
    };
    var handle = setInterval(tick, 1000);
    timers.push(handle);
  }

  function renderEmailDone() {
    return statusPage({
      orb: 'success',
      eyebrow: t('email.primary'),
      icon: 'check-circle',
      title: x('email.updatedTitle'),
      desc: x('email.updatedDesc') + ' ' + (state.user ? state.user.email : ''),
      actions: '<a class="btn btn-primary" href="#/settings/account">' + icon('arrow-left') + esc(t('account.title')) + '</a>' +
        '<a class="btn btn-ghost" href="#/settings">' + esc(t('settings.title')) + '</a>'
    });
  }

  /* ---------- delete account ---------- */

  function renderDelete() {
    var lost = [t('delete.l1'), t('delete.l2'), t('delete.l3')].map(function (line) {
      return '<div class="feature-lock"><span class="fl-ico" style="background:var(--danger-soft);color:var(--danger)">' + icon('x') + '</span><div><p>' + esc(line) + '</p></div></div>';
    }).join('');
    var content = backRow('#/settings/account', t('account.title')) +
      '<div class="form-page"><div class="status-page" style="padding-top:0"><div class="status-orb orb-danger">' + icon('trash') + '</div>' +
      '<div class="status-eyebrow" style="color:var(--danger)">' + esc(t('delete.warning')) + '</div>' +
      '<h1>' + esc(t('delete.title')) + '</h1><p>' + esc(t('delete.desc')) + '</p>' +
      '<div class="note-card danger mt-4" style="text-align:left">' + icon('alert-circle') + '<div><div class="strong">' + esc(t('delete.after')) + '</div><span>' + esc(t('delete.noRestore')) + '</span></div></div>' +
      '<div class="feature-lock-list" style="text-align:left">' + lost + '</div>' +
      '<div class="status-actions"><button class="btn btn-danger" data-action="delete-open">' + icon('trash') + '<span>' + esc(t('delete.confirm')) + '</span></button>' +
      '<a class="btn btn-outline" href="#/settings/account">' + esc(t('delete.cancel')) + '</a></div></div></div>';
    return shell(mainPage(content), 'settings');
  }

  function openDeleteFinal() {
    var body = '<div class="note-card danger" style="margin-top:0">' + icon('alert-circle') + '<div><div class="strong">' + esc(t('delete.review')) + '</div><span>' + esc(t('delete.noRestore')) + '</span></div></div>' +
      '<form data-form="delete-final" novalidate class="mt-4">' +
      inputField({ name: 'accountName', label: x('delete.finalName'), icon: 'user', placeholder: state.user ? state.user.name : '', autocomplete: 'off' }) +
      inputField({ name: 'password', type: 'password', password: true, label: x('delete.finalPassword'), icon: 'key', autocomplete: 'current-password' }) +
      '<div class="form-actions"><button class="btn btn-danger" type="submit">' + icon('trash') + '<span>' + esc(x('delete.finalBtn')) + '</span></button>' +
      '<button class="btn btn-ghost" type="button" data-close-sheet>' + esc(x('delete.finalCancel')) + '</button></div>' +
      '<div class="form-note">' + esc(x('delete.demoHint')) + '</div></form>';
    openSheet({ title: icon('trash') + ' ' + esc(x('delete.finalTitle')), sub: esc(x('delete.finalSub')), body: body });
  }

  /* ---------- help / faq ---------- */

  function faqItemHtml(faq, key) {
    var open = ui.faqOpen === key;
    return '<div class="faq-item' + (open ? ' open' : '') + '"><button class="faq-q" data-action="faq-toggle" data-key="' + esc(key) + '">' +
      '<span>' + esc(faq.q) + '</span>' + icon('chevron-down') + '</button>' +
      '<div class="faq-a">' + esc(faq.a) + '</div></div>';
  }

  function helpArticleBody(id) {
    var steps = {
      'getting-started': [x('help.get1'), x('help.get2'), x('help.get3')],
      saving: [x('help.save1'), x('help.save2'), x('help.save3')],
      assistant: [x('help.asst1'), x('help.asst2'), x('help.asst3')],
      verification: [x('help.ver1'), x('help.ver2'), x('help.ver3')],
      account: [x('help.acc1'), x('help.acc2'), x('help.acc3')],
      privacy: [x('help.priv1'), x('help.priv2'), x('help.priv3')]
    };
    var guide = DATA.guideCards.filter(function (g) { return g.id === id; })[0];
    var list = (steps[id] || []).map(function (line, i) {
      return '<div class="feature-lock"><span class="fl-ico">' + icon('check') + '</span><div><h4>' + esc(x('help.step')) + ' ' + (i + 1) + '</h4><p>' + esc(line) + '</p></div></div>';
    }).join('');
    return '<div class="note-card info" style="margin-top:0">' + icon('info') + '<span>' + esc(guide ? guide.desc : '') + '</span></div>' +
      '<div class="feature-lock-list">' + list + '</div>' +
      '<a class="btn btn-primary btn-block mt-3" href="#/contact" data-close-sheet>' + icon('mail') + '<span>' + esc(t('help.contactBtn')) + '</span></a>';
  }

  function openHelpArticle(id) {
    var guide = DATA.guideCards.filter(function (g) { return g.id === id; })[0];
    if (!guide) return;
    openSheet({ title: icon(guide.icon) + ' ' + esc(guide.title), sub: esc(x('help.article')), body: helpArticleBody(id) });
  }

  function renderHelp() {
    var query = String(ui.helpQuery || '').toLowerCase();
    var guides = DATA.guideCards.filter(function (guide) {
      return !query || (guide.title + ' ' + guide.desc).toLowerCase().indexOf(query) !== -1;
    });
    var guideHtml = guides.length ? '<div class="help-grid">' + guides.map(function (guide) {
      return '<button class="help-card" data-action="help-article" data-id="' + esc(guide.id) + '"><span class="hc-ico">' + icon(guide.icon) + '</span>' +
        '<h3>' + esc(guide.title) + '</h3><p>' + esc(guide.desc) + '</p></button>';
    }).join('') + '</div>' : '<div class="note-card mt-3">' + icon('search') + '<span>' + esc(x('help.noResults')) + '</span></div>';
    var faqs = DATA.faqs.slice(0, 3).map(function (faq, i) { return faqItemHtml(faq, 'help-' + i); }).join('');
    var content = backRow('#/settings', t('settings.title')) +
      '<div class="help-page"><div class="help-hero"><p class="eyebrow">' + esc(t('help.title')) + '</p><h1>' + esc(x('help.heroTitle')) + '</h1>' +
      '<p>' + esc(t('help.sub')) + '</p><form class="search-bar" data-form="help-search">' + icon('search') +
      '<input name="q" placeholder="' + esc(x('help.searchPh')) + '" value="' + esc(ui.helpQuery || '') + '" aria-label="' + esc(t('help.search')) + '" />' +
      '<button class="search-go" type="submit" aria-label="' + esc(t('help.search')) + '">' + icon('arrow-right') + '</button></form></div>' +
      '<div class="section-head"><h2>' + esc(t('help.popular')) + '</h2><span class="section-label">' + guides.length + ' ' + esc(x('help.articles')) + '</span></div>' +
      guideHtml +
      '<div class="section-head"><h2>' + esc(x('help.faqPreview')) + '</h2><a class="section-link" href="#/faq">' + esc(t('faq.title')) + ' ' + icon('arrow-right') + '</a></div>' +
      faqs +
      '<div class="panel mt-4" style="text-align:center"><span class="set-ico" style="margin:0 auto 8px">' + icon('message') + '</span>' +
      '<h3 class="strong">' + esc(x('help.contactTitle')) + '</h3><p class="sub" style="margin:4px auto 12px">' + esc(x('help.contactSub')) + '</p>' +
      '<a class="btn btn-primary" href="#/contact">' + icon('mail') + '<span>' + esc(x('help.openContact')) + '</span></a></div></div>';
    return shell(mainPage(content), 'settings');
  }

  function renderFaq() {
    var query = String(ui.faqQuery || '').toLowerCase();
    var faqs = DATA.faqs.filter(function (faq) {
      return !query || (faq.q + ' ' + faq.a).toLowerCase().indexOf(query) !== -1;
    });
    var list = faqs.length ? faqs.map(function (faq, i) { return faqItemHtml(faq, 'faq-' + i); }).join('') :
      '<div class="empty" style="padding:28px"><span class="e-ico">' + icon('search') + '</span><h3>' + esc(x('help.noResults')) + '</h3></div>';
    var content = backRow('#/help', x('faq.back')) +
      '<div class="help-page"><div class="page-head page-head-centered"><div><span class="status-orb orb-primary" style="width:58px;height:58px;border-radius:20px;margin:0 auto 10px">' + icon('help-circle') + '</span>' +
      '<h1>' + esc(t('faq.title')) + '</h1><p class="sub">' + esc(t('faq.sub')) + '</p></div></div>' +
      '<form class="search-bar" data-form="faq-search">' + icon('search') +
      '<input name="q" placeholder="' + esc(t('help.search')) + '" value="' + esc(ui.faqQuery || '') + '" aria-label="' + esc(t('help.search')) + '" />' +
      '<button class="search-go" type="submit" aria-label="' + esc(t('help.search')) + '">' + icon('arrow-right') + '</button></form>' +
      '<div class="section-marker">' + faqs.length + ' ' + esc(t('faq.title')) + '</div>' + list +
      '<div class="panel mt-4" style="text-align:center"><h3 class="strong">' + esc(x('help.contactTitle')) + '</h3>' +
      '<p class="sub" style="margin:4px auto 12px">' + esc(x('help.contactSub')) + '</p>' +
      '<a class="btn btn-primary" href="#/contact">' + icon('mail') + '<span>' + esc(x('help.openContact')) + '</span></a></div></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- about / legal ---------- */

  function renderAbout() {
    var stats = [
      { n: DATA.tools.length, l: x('about.statsTools') },
      { n: DATA.categories.length, l: x('about.statsCats') },
      { n: DATA.collections.length, l: x('about.statsCollections') }
    ].map(function (stat) {
      return '<div class="about-stat"><strong>' + stat.n + '</strong><span>' + esc(stat.l) + '</span></div>';
    }).join('');
    var features = [t('about.f1'), t('about.f2'), t('about.f3'), t('about.f4')].map(function (line) {
      return '<div class="feature-lock"><span class="fl-ico">' + icon('check') + '</span><div><p>' + esc(line) + '</p></div></div>';
    }).join('');
    var content = backRow('#/settings', t('settings.title')) +
      '<div class="about-page"><div class="about-hero"><img src="' + LOGO + '" alt="SOTERA logo" /><h1>SOTERA</h1>' +
      '<div class="tag">' + esc(t('about.tagline')) + '</div><div class="ver"><span class="badge badge-neutral">' + esc(x('about.version')) + '</span> ' +
      '<span class="badge badge-success">' + esc(x('about.local')) + '</span></div></div>' +
      '<div class="about-stat-grid">' + stats + '</div>' +
      '<div class="section-marker">' + esc(t('about.features')) + '</div>' +
      '<div class="feature-lock-list">' + features + '</div>' +
      '<div class="section-marker">' + esc(t('about.mission')) + '</div>' +
      '<div class="panel"><p class="sub" style="font-size:11px;line-height:1.75">' + esc(t('about.mission')) + '</p></div>' +
      '<div class="note-card info mt-4">' + icon('info') + '<span>' + esc(t('about.note')) + '</span></div>' +
      '<div class="row wrap mt-4"><a class="btn btn-outline" href="#/privacy">' + icon('lock') + '<span>' + esc(t('privacy.title')) + '</span></a>' +
      '<a class="btn btn-outline" href="#/terms">' + icon('file-text') + '<span>' + esc(t('terms.title')) + '</span></a></div>' +
      '<div class="settings-foot" style="margin-top:26px"><div class="sf-brand"><img src="' + LOGO + '" alt="" /><span>SOTERA</span></div>' +
      '<div class="sf-copy">' + esc(x('about.updated')) + '</div><div class="sf-copy">' + esc(x('legal.note')) + '</div></div></div>';
    return shell(mainPage(content), 'settings');
  }

  function legalSections(kind) {
    if (kind === 'privacy') {
      return state.lang === 'id' ? [
        ['Data yang disimulasikan', 'Prototipe ini menyimpan nama, email, bahasa, tema, tool tersimpan, dan preferensi di localStorage perangkatmu. Tidak ada data yang dikirim ke server.'],
        ['Cara penyimpanan', 'Semua data demo berada di browser yang kamu pakai. Menghapus data situs atau akun akan menghapus data tersebut secara permanen dari perangkat ini.'],
        ['Yang tidak kami kumpulkan', 'Tidak ada pelacakan analitik, cookie iklan, password server, atau unggahan file. Form verifikasi dan kontak hanya disimulasikan.'],
        ['Tautan pihak ketiga', 'Setiap tool membuka situs resmi penyedianya. Kebijakan privasi penyedia berlaku setelah kamu meninggalkan SOTERA.'],
        ['Pilihanmu', 'Kamu dapat mengubah bahasa/tema, menghapus tool tersimpan, atau menghapus akun demo kapan saja dari Pengaturan.'],
        ['Kontak', 'Untuk pertanyaan prototipe, gunakan halaman Contact Support. Pesan tidak benar-benar dikirim.']
      ] : [
        ['Information we simulate', 'This prototype stores your name, email, language, theme, saved tools, and preferences in your device localStorage. No data is sent to a server.'],
        ['How storage works', 'All demo data stays in the browser you use. Clearing site data or deleting the account permanently removes it from this device.'],
        ['What we do not collect', 'There is no analytics tracking, advertising cookie, server-side password, or file upload. Verification and contact forms are simulations.'],
        ['Third-party links', 'Every tool opens the official provider website. The provider privacy policy applies after you leave SOTERA.'],
        ['Your choices', 'You can change language/theme, remove saved tools, or delete the demo account at any time from Settings.'],
        ['Contact', 'For prototype questions, use Contact Support. Messages are saved locally and are not sent.']
      ];
    }
    return state.lang === 'id' ? [
      ['Penerimaan', 'Dengan menggunakan prototipe SOTERA, kamu memahami bahwa ini adalah build demonstrasi front-end, bukan layanan produksi.'],
      ['Tujuan prototipe', 'SOTERA memperlihatkan alur direktori tool mahasiswa, koleksi, asisten lokal, dan pengaturan akun. Tidak ada layanan berbayar atau transaksi.'],
      ['Akun demo', 'Akun, verifikasi email, dan perubahan password disimulasikan di perangkat ini. Jangan gunakan password asli atau data sensitif.'],
      ['Penggunaan yang wajar', 'Jangan menyalahgunakan formulir untuk konten berbahaya, meniru orang lain, atau mencoba merusak pengalaman demo.'],
      ['Tool pihak ketiga', 'SOTERA tidak memiliki atau mengoperasikan tool yang terdaftar. Ketersediaan, harga, dan kebijakan provider dapat berubah.'],
      ['Penafian', 'Data katalog, rating, dan pembaruan adalah demo. SOTERA tidak menjamin akurasi atau ketersediaan layanan pihak ketiga.'],
      ['Perubahan', 'Ketentuan demo ini dapat berubah saat prototipe diperbarui. Versi terbaru ditampilkan di halaman ini.']
    ] : [
      ['Acceptance', 'By using the SOTERA prototype, you understand that this is a front-end demonstration build, not a production service.'],
      ['Prototype purpose', 'SOTERA demonstrates a student tool directory, collections, local assistant, and account settings. There are no paid services or transactions.'],
      ['Demo accounts', 'Accounts, email verification, and password changes are simulated on this device. Do not use a real password or sensitive data.'],
      ['Acceptable use', 'Do not misuse forms for harmful content, impersonation, or attempts to disrupt the demo experience.'],
      ['Third-party tools', 'SOTERA does not own or operate listed tools. Provider availability, pricing, and policies may change.'],
      ['Disclaimer', 'Catalog data, ratings, and updates are demonstration content. SOTERA does not guarantee third-party accuracy or availability.'],
      ['Changes', 'These demo terms may change as the prototype is updated. The latest version is shown on this page.']
    ];
  }

  function renderLegal(kind) {
    var sections = legalSections(kind).map(function (section) {
      return '<h2>' + esc(section[0]) + '</h2><p>' + esc(section[1]) + '</p>';
    }).join('');
    var content = backRow('#/settings', t('settings.title')) +
      '<div class="help-page"><div class="page-head"><div><span class="badge badge-neutral">' + esc(x('legal.updated')) + '</span>' +
      '<h1 style="margin-top:8px">' + esc(kind === 'privacy' ? t('privacy.title') : t('terms.title')) + '</h1>' +
      '<p class="sub">' + esc(kind === 'privacy' ? x('privacy.sub') : x('terms.sub')) + '</p></div></div>' +
      '<div class="legal-body">' + sections + '</div>' +
      '<div class="note-card info mt-4">' + icon('info') + '<span>' + esc(x('legal.note')) + '</span></div>' +
      '<div class="row wrap mt-4"><a class="btn btn-outline" href="#/about">' + icon('arrow-left') + '<span>' + esc(t('about.title')) + '</span></a>' +
      '<a class="btn btn-ghost" href="#/settings">' + esc(t('settings.title')) + '</a></div></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- contact ---------- */

  function renderContact() {
    var topics = [
      x('contact.topicGeneral'), x('contact.topicBug'), x('contact.topicTool'), x('contact.topicAccount')
    ].map(function (topic) {
      return '<option>' + esc(topic) + '</option>';
    }).join('');
    var content = backRow('#/settings', t('settings.title')) +
      '<div class="help-page"><div class="page-head page-head-centered"><div><span class="status-orb orb-primary" style="width:58px;height:58px;border-radius:20px;margin:0 auto 10px">' + icon('mail') + '</span>' +
      '<h1>' + esc(t('contact.title')) + '</h1><p class="sub">' + esc(t('contact.sub')) + '</p></div></div>' +
      '<form class="panel" data-form="contact" novalidate>' +
      '<div class="field"><div class="field-label"><span>' + esc(t('contact.topic')) + '</span></div><div class="input-wrap">' + icon('message') +
      '<select class="select-plain" name="topic" style="padding-left:38px">' + topics + '</select></div></div>' +
      inputField({ name: 'name', label: x('contact.name'), icon: 'user', value: state.user ? state.user.name : '', autocomplete: 'name' }) +
      inputField({ name: 'email', type: 'email', label: t('common.email'), icon: 'mail', value: state.user ? state.user.email : '', autocomplete: 'email' }) +
      inputField({ name: 'message', textarea: true, label: t('contact.message'), placeholder: x('contact.placeholder') }) +
      '<button class="btn btn-primary btn-block" type="submit">' + icon('send') + '<span>' + esc(t('contact.send')) + '</span></button>' +
      '<div class="form-note">' + esc(t('contact.sent')) + '</div></form>' +
      '<div class="settings-card mt-4">' +
      settingRow({ href: '#/help', icon: 'help-circle', title: t('settings.helpCenter'), sub: t('settings.helpSub'), tone: 'blue' }) +
      settingRow({ href: '#/faq', icon: 'message', title: t('settings.faq'), sub: t('settings.faqSub') }) +
      '</div></div>';
    return shell(mainPage(content), 'settings');
  }

  /* ---------- legal wrappers ---------- */

  function renderPrivacy() { return renderLegal('privacy'); }
  function renderTerms() { return renderLegal('terms'); }

  /* ---------- deleted ---------- */

  function renderDeleted() {
    return '<div class="page no-nav"><div class="status-page"><span class="status-orb orb-danger">' + icon('trash') + '</span>' +
      '<div class="status-eyebrow">SOTERA</div><h1>' + esc(t('deleted.title')) + '</h1><p>' + esc(t('deleted.desc')) + '</p>' +
      '<div class="note-card mt-4" style="text-align:left">' + icon('shield') + '<span>' + esc(x('delete.demoHint')) + '</span></div>' +
      '<div class="status-actions"><a class="btn btn-primary" href="#/home">' + icon('home') + '<span>' + esc(t('deleted.back')) + '</span></a>' +
      '<a class="btn btn-outline" href="#/signup">' + esc(t('common.signup')) + '</a></div></div></div>';
  }

  /* ---------- interaction helpers ---------- */

  function refreshSheetBody(html) {
    var body = document.querySelector('#sheet-root .sheet-body');
    if (body) body.innerHTML = html;
  }

  function openSuggestSheet() {
    var body = '<form data-form="suggest" novalidate>' +
      inputField({ name: 'suggestName', label: x('suggest.name'), icon: 'compass', placeholder: 'Mendeley' }) +
      inputField({ name: 'suggestUrl', type: 'url', label: x('suggest.url'), icon: 'external-link', placeholder: 'https://' }) +
      inputField({ name: 'suggestNote', textarea: true, label: x('suggest.note'), placeholder: x('suggest.note') }) +
      '<div class="form-actions"><button class="btn btn-primary btn-block" type="submit">' + icon('send') + '<span>' + esc(x('suggest.send')) + '</span></button></div></form>';
    openSheet({ title: icon('lightbulb') + ' ' + esc(x('suggest.title')), sub: esc(x('suggest.sub')), body: body });
  }

  function openLogoutConfirm() {
    var body = '<div class="note-card" style="margin-top:0">' + icon('info') + '<span>' + esc(x('set.logoutDesc')) + '</span></div>';
    openSheet({
      title: icon('logout') + ' ' + esc(x('set.logoutConfirm')),
      sub: esc(t('settings.account')),
      body: body,
      foot: '<button class="btn btn-outline" data-close-sheet>' + esc(x('set.logoutNo')) + '</button>' +
        '<button class="btn btn-danger" data-action="logout-confirm">' + icon('logout') + '<span>' + esc(x('set.logoutYes')) + '</span></button>'
    });
  }

  function openCanvas() {
    var stack = [toolById('zotero'), toolById('connected-papers'), toolById('overleaf'), toolById('notion')].filter(Boolean);
    var body = '<div class="note-card info" style="margin-top:0">' + icon('sparkles') + '<span>' + esc(x('discover.heroDesc')) + '</span></div>' +
      recoListHtml(stack) +
      '<div class="note-card mt-3">' + icon('info') + '<span>' + esc(x('set.prototype')) + '</span></div>';
    openSheet({ title: icon('layers') + ' ' + esc(x('discover.heroTitle')), sub: esc(x('discover.personalized')), body: body });
  }

  function demoLogin(message) {
    state.user = { name: DEMO.name, username: DEMO.username, email: DEMO.email, joined: DEMO.joined };
    state.onboarded = true;
    ensureSeed();
    saveState();
    ui.chat = null;
    closeSheet();
    toast(message || (x('auth.signedIn') + ', ' + DEMO.name), 'check-circle');
    go('home');
  }

  function performLogout() {
    state.user = null;
    state.avatar = null;
    state.onboarded = true;
    saveState();
    ui.chat = null;
    ui.pendingEmail = '';
    ui.folder = 'all';
    closeSheet();
    toast(x('auth.signedOut'), 'logout');
    go('home');
  }

  function monthYear() {
    var d = new Date();
    return d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear();
  }

  function updateStrength(form, value) {
    var wrap = form.querySelector('[data-strength]');
    if (!wrap) return;
    var score = passwordScore(value);
    var cls = score <= 1 ? 'is-weak' : (score === 2 ? 'is-fair' : (score === 3 ? 'is-good' : 'is-strong'));
    wrap.className = 'strength ' + cls;
    var label = wrap.querySelector('[data-strength-label]');
    if (label) {
      var labels = [x('auth.strWeak'), x('auth.strWeak'), x('auth.strFair'), x('auth.strGood'), x('auth.strStrong')];
      label.textContent = labels[score];
    }
    var len = String(value || '');
    var reqs = {
      len: len.length >= 8,
      num: /[0-9]/.test(len),
      sym: /[^A-Za-z0-9]/.test(len)
    };
    Object.keys(reqs).forEach(function (key) {
      var node = wrap.parentNode.querySelector('[data-req="' + key + '"]');
      if (node) node.classList.toggle('ok', reqs[key]);
    });
  }

  function formFail(form) {
    var first = form.querySelector('.has-error input, .has-error textarea, .has-error select');
    if (first) first.focus();
  }

  function urlish(value) {
    return /^https?:\/\/[^\s]+\.[^\s]+/i.test(String(value || '').trim());
  }

  function finishAccountDelete() {
    state.user = null;
    state.avatar = null;
    state.saved = [];
    state.customFolders = [];
    state.onboarded = true;
    saveState();
    ui.chat = null;
    ui.pendingEmail = '';
    ui.folder = 'all';
    closeSheet();
    toast(x('delete.doneToast'), 'trash');
    go('deleted');
  }

  /* ---------- click delegation ---------- */

  function handleClick(event) {
    var closer = event.target.closest('[data-close-sheet]');
    if (closer) {
      event.preventDefault();
      closeSheet();
      return;
    }
    var el = event.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');

    if (action === 'tool') {
      openTool(el.getAttribute('data-id'));
      return;
    }
    if (action === 'save') {
      event.preventDefault();
      event.stopPropagation();
      toggleSave(el.getAttribute('data-save-btn'));
      return;
    }
    if (action === 'peek') {
      var target = document.getElementById(el.getAttribute('data-target'));
      if (target) {
        target.type = target.type === 'password' ? 'text' : 'password';
        el.innerHTML = icon(target.type === 'password' ? 'eye' : 'eye-off');
      }
      return;
    }

    switch (action) {
      case 'search': {
        var onExplore = parseHash().path === 'explore';
        if (!onExplore) go('explore');
        setTimeout(function () {
          var input = document.querySelector('[data-live="explore"]');
          if (input) input.focus();
        }, onExplore ? 0 : 140);
        break;
      }
      case 'notifications': openNotifications(); break;
      case 'open-profile': go(state.user ? 'settings/profile' : 'login'); break;
      case 'go-login': go('login'); break;
      case 'guest': go('home'); break;
      case 'google': demoLogin(x('auth.googleNote')); break;
      case 'sso': demoLogin(t('locked.sso')); break;
      case 'assistant-locked': go(state.user ? 'assistant' : 'locked'); break;
      case 'filter-cat':
        ui.cat = el.getAttribute('data-cat') || 'all';
        renderApp();
        break;
      case 'filter-cat-opt':
        ui.cat = el.getAttribute('data-cat') || 'all';
        refreshSheetBody(filterSheetHtml());
        break;
      case 'filter-plan': {
        var plan = el.getAttribute('data-value');
        var pidx = ui.pricing.indexOf(plan);
        if (pidx === -1) ui.pricing.push(plan); else ui.pricing.splice(pidx, 1);
        refreshSheetBody(filterSheetHtml());
        break;
      }
      case 'filter-rating':
        ui.rating = Number(el.getAttribute('data-value')) || 0;
        refreshSheetBody(filterSheetHtml());
        break;
      case 'filter-student':
        ui.studentOnly = !ui.studentOnly;
        refreshSheetBody(filterSheetHtml());
        break;
      case 'filter-reset':
        ui.q = '';
        ui.cat = 'all';
        ui.pricing = [];
        ui.rating = 0;
        ui.studentOnly = false;
        refreshSheetBody(filterSheetHtml());
        break;
      case 'filter-apply':
        closeSheet();
        renderApp();
        break;
      case 'open-filters': openFilterSheet(); break;
      case 'folder':
        ui.folder = el.getAttribute('data-folder') || 'all';
        renderApp();
        if (parseHash().path === 'collections') {
          setTimeout(function () {
            var body = document.getElementById('collections-body');
            if (body) body.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
        break;
      case 'new-folder': openNewFolderSheet(); break;
      case 'assistant-filter':
        ui.assistantFilter = el.getAttribute('data-filter') || 'all';
        if (ui.chat && ui.chat.query) {
          if (ui.chat.results) ui.chat.results = recommendTools(ui.chat.query, ui.assistantFilter);
        }
        renderApp();
        break;
      case 'prompt': {
        var prompt = DATA.prompts.filter(function (p) { return p.id === el.getAttribute('data-prompt'); })[0];
        if (prompt) askAssistant(prompt.keys.join(' '));
        break;
      }
      case 'faq-toggle': {
        var item = el.closest('.faq-item');
        var key = el.getAttribute('data-key');
        var willOpen = !item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (openItem) { openItem.classList.remove('open'); });
        if (willOpen) item.classList.add('open');
        ui.faqOpen = willOpen ? key : null;
        break;
      }
      case 'help-article': openHelpArticle(el.getAttribute('data-id')); break;
      case 'lang-choice':
        if (!ui.langBefore) ui.langBefore = state.lang;
        state.lang = el.getAttribute('data-lang') || 'en';
        ui.langChoice = state.lang;
        applyTheme();
        saveState();
        renderApp();
        break;
      case 'lang-apply':
        state.lang = ui.langChoice || state.lang;
        ui.langBefore = null;
        ui.langChoice = null;
        applyTheme();
        saveState();
        toast(x('set.savedToast'), 'globe');
        go('settings');
        break;
      case 'lang-cancel':
        if (ui.langBefore) {
          state.lang = ui.langBefore;
          applyTheme();
          saveState();
        }
        ui.langBefore = null;
        ui.langChoice = null;
        go('settings');
        break;
      case 'theme-choice':
        state.theme = el.getAttribute('data-theme-value') || 'light';
        applyTheme();
        saveState();
        renderApp();
        break;
      case 'theme-save':
        applyTheme();
        saveState();
        toast(x('set.savedToast'), 'palette');
        go('settings');
        break;
      case 'theme-reset':
        state.theme = 'light';
        state.contrast = false;
        state.motion = 'full';
        state.oled = false;
        applyTheme();
        saveState();
        toast(x('set.savedToast'), 'refresh');
        renderApp();
        break;
      case 'sessions': openSessions(); break;
      case 'share': openShareSheet(); break;
      case 'request': openRequestSheet(); break;
      case 'suggest': openSuggestSheet(); break;
      case 'canvas': openCanvas(); break;
      case 'logout': openLogoutConfirm(); break;
      case 'logout-confirm': performLogout(); break;
      case 'delete-open': openDeleteFinal(); break;
      case 'mark-read':
        closeSheet();
        toast(x('notif.read'), 'check-circle');
        break;
      case 'pick-avatar':
        var picker = document.getElementById('avatar-input');
        if (picker) picker.click();
        break;
      case 'remove-avatar':
        state.avatar = null;
        saveState();
        toast(x('profile.photoRemoved'), 'trash');
        renderApp();
        break;
      case 'resend':
        ui.code = '123456';
        renderApp();
        toast(x('email.resend'), 'refresh');
        break;
      default:
        break;
    }
  }

  /* ---------- submit delegation ---------- */

  function handleSubmit(event) {
    var form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    clearFormErrors(form);
    var type = form.getAttribute('data-form');
    var value = function (name) {
      var field = form.querySelector('[name="' + name + '"]');
      return field ? String(field.value || '').trim() : '';
    };

    if (type === 'login') {
      var email = value('email').toLowerCase();
      var pass = value('password');
      if (!validEmail(email)) { setFieldError(form, 'email', x('auth.errEmail')); formFail(form); return; }
      if (pass.length < 6) { setFieldError(form, 'password', x('auth.errPass')); formFail(form); return; }
      state.user = { name: DEMO.name, username: DEMO.username, email: email, joined: DEMO.joined };
      state.onboarded = true;
      ensureSeed();
      saveState();
      ui.chat = null;
      toast(x('auth.signedIn') + ', ' + state.user.name, 'check-circle');
      go('home');
      return;
    }

    if (type === 'signup') {
      var name = value('name');
      var signupEmail = value('email').toLowerCase();
      var next = value('password');
      if (name.length < 2) { setFieldError(form, 'name', x('auth.errName')); formFail(form); return; }
      if (!validEmail(signupEmail)) { setFieldError(form, 'email', x('auth.errEmail')); formFail(form); return; }
      if (signupEmail === DEMO.email.toLowerCase()) { setFieldError(form, 'email', x('auth.emailInUse')); formFail(form); return; }
      if (next.length < 8 || !/[0-9]/.test(next) || !/[^A-Za-z0-9]/.test(next)) { setFieldError(form, 'password', x('auth.signupPassHint')); formFail(form); return; }
      var terms = form.querySelector('[name="terms"]');
      if (!terms || !terms.checked) {
        toast(x('auth.errTerms'), 'alert-circle');
        return;
      }
      state.user = {
        name: name,
        username: (name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student').slice(0, 18),
        email: signupEmail,
        joined: monthYear(),
        bio: ''
      };
      state.onboarded = true;
      ensureSeed();
      saveState();
      ui.chat = null;
      toast(x('auth.accountCreated'), 'sparkles');
      go('home');
      return;
    }

    if (type === 'forgot') {
      if (!validEmail(value('email'))) { setFieldError(form, 'email', x('auth.errEmail')); formFail(form); return; }
      toast(x('auth.forgotSent'), 'mail');
      go('login');
      return;
    }

    if (type === 'assistant') {
      var query = value('q');
      if (!query) {
        var qInput = form.querySelector('[name="q"]');
        if (qInput) qInput.focus();
        return;
      }
      askAssistant(query);
      return;
    }

    if (type === 'home-search') {
      var homeQ = value('q');
      go(homeQ ? ('explore?q=' + encodeURIComponent(homeQ)) : 'explore');
      return;
    }

    if (type === 'help-search') {
      ui.helpQuery = value('q');
      renderApp();
      return;
    }

    if (type === 'faq-search') {
      ui.faqQuery = value('q');
      renderApp();
      return;
    }

    if (type === 'password') {
      var current = value('current');
      var fresh = value('next');
      var confirm = value('confirm');
      if (!current) { setFieldError(form, 'current', x('auth.errCurrent')); formFail(form); return; }
      if (fresh.length < 8 || !/[0-9]/.test(fresh) || !/[^A-Za-z0-9]/.test(fresh)) { setFieldError(form, 'next', x('auth.signupPassHint')); formFail(form); return; }
      if (fresh !== confirm) { setFieldError(form, 'confirm', x('auth.errMatch')); formFail(form); return; }
      toast(x('password.updatedToast'), 'check-circle');
      go('settings/password/done');
      return;
    }

    if (type === 'email') {
      var newEmail = value('email').toLowerCase();
      var emailConfirm = value('confirm').toLowerCase();
      if (!validEmail(newEmail)) { setFieldError(form, 'email', x('auth.errEmail')); formFail(form); return; }
      if (state.user && newEmail === String(state.user.email).toLowerCase()) { setFieldError(form, 'email', x('email.same')); formFail(form); return; }
      if (newEmail !== emailConfirm) { setFieldError(form, 'confirm', x('auth.errMatch')); formFail(form); return; }
      if (!value('password')) { setFieldError(form, 'password', x('auth.errCurrent')); formFail(form); return; }
      ui.pendingEmail = newEmail;
      ui.code = '123456';
      go('settings/verify');
      return;
    }

    if (type === 'verify') {
      var code = '';
      for (var i = 0; i < 6; i++) {
        var digit = form.querySelector('[name="o' + i + '"]');
        code += digit ? String(digit.value || '').trim() : '';
      }
      if (code.length !== 6) { toast(x('auth.errCode'), 'alert-circle'); return; }
      if (code !== '123456') { toast(x('email.wrongCode'), 'alert-circle'); return; }
      if (state.user) {
        state.user.email = ui.pendingEmail || state.user.email;
        state.user.emailVerified = true;
        saveState();
      }
      toast(x('email.updatedTitle'), 'check-circle');
      go('settings/email/done');
      return;
    }

    if (type === 'profile') {
      var profileName = value('name');
      var username = value('username');
      if (profileName.length < 2) { setFieldError(form, 'name', x('auth.errName')); formFail(form); return; }
      if (!/^[a-zA-Z0-9._]{3,24}$/.test(username)) { setFieldError(form, 'username', x('auth.errUsername')); formFail(form); return; }
      state.user.name = profileName;
      state.user.username = username;
      state.user.bio = value('bio');
      saveState();
      toast(x('profile.updated'), 'check-circle');
      go('settings/account');
      return;
    }

    if (type === 'new-folder') {
      var folderName = value('folderName');
      if (!folderName) { setFieldError(form, 'folderName', x('form.required')); formFail(form); return; }
      var iconInput = form.querySelector('[name="icon"]:checked');
      var tools = new FormData(form).getAll('tools').map(String);
      var folder = {
        id: 'custom-' + Date.now(),
        name: folderName,
        desc: x('collections.newSub'),
        icon: iconInput ? iconInput.value : 'folder',
        cats: [],
        tools: tools,
        bg: 'linear-gradient(145deg,#eef2ff,#e0e7ff)',
        fg: '#4f46e5'
      };
      state.customFolders.push(folder);
      ui.folder = folder.id;
      saveState();
      closeSheet();
      toast(x('set.savedToast'), 'folder-plus');
      renderApp();
      return;
    }

    if (type === 'share') {
      var shareName = value('shareName');
      var shareUrl = value('shareUrl');
      if (!shareName) { setFieldError(form, 'shareName', x('form.required')); formFail(form); return; }
      if (!urlish(shareUrl)) { setFieldError(form, 'shareUrl', x('form.invalidUrl')); formFail(form); return; }
      closeSheet();
      toast(x('set.savedToast'), 'upload');
      return;
    }

    if (type === 'request') {
      var requestName = value('requestName');
      if (!requestName) { setFieldError(form, 'requestName', x('form.required')); formFail(form); return; }
      closeSheet();
      toast(x('set.savedToast'), 'check-circle');
      return;
    }

    if (type === 'suggest') {
      var suggestName = value('suggestName');
      var suggestUrl = value('suggestUrl');
      if (!suggestName) { setFieldError(form, 'suggestName', x('form.required')); formFail(form); return; }
      if (!urlish(suggestUrl)) { setFieldError(form, 'suggestUrl', x('form.invalidUrl')); formFail(form); return; }
      closeSheet();
      toast(x('suggest.done'), 'lightbulb');
      return;
    }

    if (type === 'contact') {
      if (value('message').length < 10) { setFieldError(form, 'message', x('contact.errMessage')); formFail(form); return; }
      toast(x('contact.sentToast'), 'check-circle');
      form.reset();
      return;
    }

    if (type === 'delete-final') {
      var typedName = value('accountName');
      if (!state.user || typedName !== state.user.name) {
        setFieldError(form, 'accountName', x('delete.typedWrong'));
        formFail(form);
        return;
      }
      if (!value('password')) {
        setFieldError(form, 'password', x('auth.errCurrent'));
        formFail(form);
        return;
      }
      finishAccountDelete();
      return;
    }
  }

  /* ---------- live input / change ---------- */

  function handleInput(event) {
    var target = event.target;
    if (target.matches('[data-live="explore"]')) {
      ui.q = target.value;
      var exploreBody = document.getElementById('explore-body');
      if (exploreBody) exploreBody.innerHTML = exploreBodyHtml();
      return;
    }
    if (target.matches('[data-live="collections"]')) {
      ui.cq = target.value;
      var collectionsBody = document.getElementById('collections-body');
      if (collectionsBody) collectionsBody.innerHTML = collectionsListHtml();
      return;
    }
    if (target.name === 'next') {
      var form = target.closest('form');
      if (form && (form.getAttribute('data-form') === 'signup' || form.getAttribute('data-form') === 'password')) {
        updateStrength(form, target.value);
      }
    }
    if (target.matches('[data-otp]')) {
      target.value = target.value.replace(/\D/g, '').slice(0, 1);
      target.classList.toggle('filled', !!target.value);
      if (target.value) {
        var next = document.querySelector('[data-otp="' + (Number(target.getAttribute('data-otp')) + 1) + '"]');
        if (next) next.focus();
      }
    }
  }

  function handleChange(event) {
    var target = event.target;
    if (target.matches('[data-setting]')) {
      state.settings[target.getAttribute('data-setting')] = target.checked;
      saveState();
      return;
    }
    if (target.matches('[data-flag]')) {
      var flag = target.getAttribute('data-flag');
      if (flag === 'contrast') state.contrast = target.checked;
      if (flag === 'oled') state.oled = target.checked;
      if (flag === 'reduceMotion') state.motion = target.checked ? 'reduced' : 'full';
      applyTheme();
      saveState();
      return;
    }
    if (target.matches('[data-collection-sort]')) {
      ui.sort = target.value;
      var body = document.getElementById('collections-body');
      if (body) body.innerHTML = collectionsListHtml();
      return;
    }
    if (target.id === 'avatar-input') {
      var file = target.files && target.files[0];
      if (!file) return;
      if (file.size > 5200000) {
        toast(t('profile.photoHint'), 'alert-circle');
        target.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        state.avatar = String(reader.result || '');
        saveState();
        toast(x('profile.photoUpdated'), 'camera');
        renderApp();
      };
      reader.readAsDataURL(file);
      return;
    }
    var option = target.closest('.option');
    if (option && (target.type === 'checkbox' || target.type === 'radio')) {
      if (target.type === 'radio') {
        var group = option.parentNode.querySelectorAll('.option');
        group.forEach(function (node) { node.classList.remove('is-on'); });
        option.classList.add('is-on');
      } else {
        option.classList.toggle('is-on', target.checked);
      }
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      var active = document.activeElement;
      if (active && active.getAttribute && active.getAttribute('role') === 'button' && active.hasAttribute('data-action')) {
        event.preventDefault();
        active.click();
        return;
      }
    }
    if (event.key === 'Backspace' && event.target.matches && event.target.matches('[data-otp]') && !event.target.value) {
      var previous = document.querySelector('[data-otp="' + (Number(event.target.getAttribute('data-otp')) - 1) + '"]');
      if (previous) previous.focus();
    }
  }

  function bindEvents() {
    document.addEventListener('click', handleClick);
    document.addEventListener('error', handleToolLogoError, true);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('hashchange', renderApp);
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var handleScheme = function () { if (state.theme === 'system') applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', handleScheme);
      else if (mq.addListener) mq.addListener(handleScheme);
    }
  }

  function boot() {
    applyTheme();
    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      var initial = state.onboarded ? 'home' : 'onboarding/1';
      history.replaceState(null, '', '#/' + initial);
    }
    bindEvents();
    renderApp();
    var launch = document.getElementById('launch');
    if (launch) {
      setTimeout(function () {
        launch.classList.add('is-hidden');
        setTimeout(function () { if (launch.parentNode) launch.parentNode.removeChild(launch); }, 550);
      }, 1050);
    }
  }

  boot();
})();


