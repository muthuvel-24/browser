/**
 * Muthu Browser — Opera-Style Speed Dial / New Tab Page
 *
 * Premium New Tab experience featuring:
 * - Vibrant abstract gradient wallpaper background (CSS-only, animated)
 * - Centered hero search bar with Google logo & Lens icons
 * - Modern rounded shortcut grid with real favicon logos
 * - "Suggestions" section with frosted-glass translucent cards
 * - Real-time clock & personalized greeting
 * - localStorage persistence for custom speed dial tiles
 * - Smooth micro-animations and hover effects
 */

export function getSpeedDialHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab — Muthu Browser</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* ─── Reset & Foundation ──────────────────────────────────── */
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      user-select: none;
    }

    /* ─── Vibrant Wallpaper Background ────────────────────────── */
    body {
      background: #0a0a1a;
      position: relative;
    }

    .wallpaper {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
    }

    /* Multi-layer animated gradient wallpaper */
    .wallpaper::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      top: -50%;
      left: -50%;
      background:
        radial-gradient(ellipse 80% 60% at 25% 30%, rgba(138, 43, 226, 0.7), transparent 60%),
        radial-gradient(ellipse 70% 50% at 75% 25%, rgba(255, 100, 50, 0.65), transparent 55%),
        radial-gradient(ellipse 90% 70% at 60% 70%, rgba(30, 0, 100, 0.9), transparent 60%),
        radial-gradient(ellipse 60% 40% at 10% 80%, rgba(200, 50, 200, 0.5), transparent 50%),
        radial-gradient(ellipse 50% 50% at 85% 75%, rgba(255, 140, 0, 0.45), transparent 55%),
        radial-gradient(ellipse 100% 80% at 50% 50%, rgba(10, 5, 40, 1), transparent 70%);
      animation: wallpaper-drift 30s ease-in-out infinite alternate;
    }

    .wallpaper::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 40% 30% at 35% 40%, rgba(180, 80, 255, 0.3), transparent 50%),
        radial-gradient(ellipse 35% 35% at 70% 60%, rgba(255, 120, 30, 0.25), transparent 45%);
      animation: wallpaper-shimmer 20s ease-in-out infinite alternate-reverse;
    }

    @keyframes wallpaper-drift {
      0% { transform: translate(0, 0) scale(1) rotate(0deg); }
      33% { transform: translate(-3%, 2%) scale(1.03) rotate(1deg); }
      66% { transform: translate(2%, -1%) scale(1.01) rotate(-0.5deg); }
      100% { transform: translate(-1%, 1%) scale(1.02) rotate(0.5deg); }
    }

    @keyframes wallpaper-shimmer {
      0% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
      100% { opacity: 0.7; transform: scale(1); }
    }

    /* Noise texture overlay for depth */
    .wallpaper-noise {
      position: fixed;
      inset: 0;
      z-index: 1;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      pointer-events: none;
    }

    /* ─── Content Container ───────────────────────────────────── */
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 0 24px 40px;
    }

    /* ─── Clock & Greeting ────────────────────────────────────── */
    .header-section {
      text-align: center;
      padding-top: 48px;
      margin-bottom: 28px;
    }

    .clock {
      font-size: 72px;
      font-weight: 700;
      letter-spacing: -3px;
      line-height: 1;
      color: #ffffff;
      text-shadow: 0 4px 30px rgba(0,0,0,0.5);
    }

    .greeting {
      font-size: 16px;
      font-weight: 400;
      color: rgba(255,255,255,0.65);
      margin-top: 6px;
      letter-spacing: 0.3px;
    }

    /* ─── Hero Search Bar ─────────────────────────────────────── */
    .search-section {
      width: 100%;
      max-width: 584px;
      margin-bottom: 48px;
    }

    .search-bar {
      display: flex;
      align-items: center;
      width: 100%;
      height: 48px;
      padding: 0 18px;
      background: rgba(255,255,255,0.92);
      border-radius: 9999px;
      box-shadow:
        0 2px 8px rgba(0,0,0,0.15),
        0 8px 32px rgba(0,0,0,0.12);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: text;
    }

    .search-bar:hover {
      box-shadow:
        0 2px 12px rgba(0,0,0,0.2),
        0 12px 40px rgba(0,0,0,0.18);
    }

    .search-bar:focus-within {
      box-shadow:
        0 2px 12px rgba(0,0,0,0.2),
        0 12px 48px rgba(0,0,0,0.22);
      transform: scale(1.005);
    }

    .search-google-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-right: 14px;
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      font-size: 15px;
      font-family: inherit;
      font-weight: 400;
      color: #202124;
      background: transparent;
      caret-color: #4285f4;
    }

    .search-input::placeholder {
      color: #9aa0a6;
    }

    .search-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 8px;
    }

    .search-action-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      transition: background 0.2s;
      color: #70757a;
      font-size: 16px;
    }

    .search-action-btn:hover {
      background: rgba(0,0,0,0.06);
    }

    .search-action-btn svg {
      width: 18px;
      height: 18px;
    }

    /* ─── Speed Dial Grid ─────────────────────────────────────── */
    .dial-section {
      width: 100%;
      max-width: 720px;
      margin-bottom: 40px;
    }

    .dial-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
    }

    @media (max-width: 640px) {
      .dial-grid { grid-template-columns: repeat(4, 1fr); }
    }

    @media (max-width: 440px) {
      .dial-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .dial-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #ffffff;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .dial-tile:hover {
      transform: translateY(-4px);
    }

    .dial-tile:active {
      transform: translateY(-1px) scale(0.97);
    }

    .tile-icon-card {
      width: 100%;
      aspect-ratio: 1;
      max-width: 96px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.95);
      box-shadow:
        0 2px 8px rgba(0,0,0,0.12),
        0 0 0 1px rgba(0,0,0,0.04);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      position: relative;
    }

    .dial-tile:hover .tile-icon-card {
      box-shadow:
        0 6px 20px rgba(0,0,0,0.2),
        0 0 0 1px rgba(0,0,0,0.06);
    }

    .tile-icon-card img {
      width: 40px;
      height: 40px;
      object-fit: contain;
      border-radius: 4px;
    }

    .tile-icon-card--colored {
      background: var(--tile-bg, rgba(255,255,255,0.95));
    }

    .tile-icon-card--colored img {
      width: 56px;
      height: 56px;
      border-radius: 8px;
    }

    .tile-label {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }

    /* Add Site Card */
    .tile-icon-card--add {
      background: rgba(255,255,255,0.08);
      border: 2px dashed rgba(255,255,255,0.25);
      backdrop-filter: blur(8px);
    }

    .tile-icon-card--add:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.5);
    }

    .add-icon {
      font-size: 28px;
      font-weight: 300;
      color: rgba(255,255,255,0.7);
    }

    /* Custom tile close button */
    .tile-close-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 10px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 5;
      line-height: 1;
    }

    .dial-tile:hover .tile-close-btn {
      display: flex;
    }

    /* ─── Suggestions Section ─────────────────────────────────── */
    .suggestions-section {
      width: 100%;
      max-width: 720px;
    }

    .section-label {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.08);
    }

    .suggestions-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }

    .sug-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
    }

    .sug-card:hover {
      background: rgba(255,255,255,0.14);
      border-color: rgba(255,255,255,0.2);
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }

    .sug-card img {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .sug-card-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ─── Add Site Modal ──────────────────────────────────────── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s;
    }

    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-card {
      background: #1e1e2e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 32px;
      width: 380px;
      max-width: 90vw;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-overlay.active .modal-card {
      transform: translateY(0) scale(1);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 20px;
    }

    .modal-input {
      width: 100%;
      height: 44px;
      padding: 0 16px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      background: rgba(255,255,255,0.06);
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
      margin-bottom: 12px;
    }

    .modal-input:focus {
      border-color: rgba(138, 43, 226, 0.6);
    }

    .modal-input::placeholder {
      color: rgba(255,255,255,0.35);
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .modal-btn {
      padding: 10px 22px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }

    .modal-btn--cancel {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.7);
    }

    .modal-btn--cancel:hover {
      background: rgba(255,255,255,0.14);
      color: #fff;
    }

    .modal-btn--add {
      background: linear-gradient(135deg, #8a2be2, #6a1bb2);
      color: #fff;
    }

    .modal-btn--add:hover {
      background: linear-gradient(135deg, #9a3bf2, #7a2bc2);
      box-shadow: 0 4px 16px rgba(138, 43, 226, 0.4);
    }

    /* ─── Scrollbar ───────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.15);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

    /* ─── Entry Animation ─────────────────────────────────────── */
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header-section { animation: fade-up 0.6s ease-out both; }
    .search-section { animation: fade-up 0.6s 0.1s ease-out both; }
    .dial-section   { animation: fade-up 0.6s 0.2s ease-out both; }
    .suggestions-section { animation: fade-up 0.6s 0.3s ease-out both; }
  </style>
</head>
<body>

  <!-- Animated Wallpaper Background -->
  <div class="wallpaper"></div>
  <div class="wallpaper-noise"></div>

  <!-- Main Content -->
  <div class="content">

    <!-- Clock & Greeting -->
    <div class="header-section">
      <div class="clock" id="clock">12:00</div>
      <div class="greeting" id="greeting">Welcome to Muthu Browser</div>
    </div>

    <!-- Hero Search Bar -->
    <div class="search-section">
      <form id="searchForm" onsubmit="handleSearch(event)" autocomplete="off">
        <div class="search-bar" onclick="document.getElementById('searchInput').focus()">
          <!-- Google Logo SVG -->
          <svg class="search-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>

          <input
            type="text"
            id="searchInput"
            class="search-input"
            placeholder="Search the web"
            autofocus
          />

          <div class="search-actions">
            <!-- Google Lens Icon -->
            <button type="button" class="search-action-btn" title="Search by image" onclick="event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <!-- Submit Search -->
            <button type="submit" class="search-action-btn" title="Search" style="color:#4285f4;">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" transform="rotate(180 12 12)"/>
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Speed Dial Grid -->
    <div class="dial-section">
      <div class="dial-grid" id="dialGrid"></div>
    </div>

    <!-- Suggestions -->
    <div class="suggestions-section">
      <div class="section-label">Suggestions</div>
      <div class="suggestions-row" id="suggestionsRow"></div>
    </div>

  </div>

  <!-- Add Site Modal -->
  <div class="modal-overlay" id="addModal">
    <div class="modal-card">
      <div class="modal-title">Add a shortcut</div>
      <input class="modal-input" id="modalName" type="text" placeholder="Name (e.g. YouTube)" maxlength="30" />
      <input class="modal-input" id="modalUrl" type="text" placeholder="URL (e.g. https://youtube.com)" />
      <div class="modal-actions">
        <button class="modal-btn modal-btn--cancel" onclick="closeModal()">Cancel</button>
        <button class="modal-btn modal-btn--add" onclick="addCustomSite()">Add</button>
      </div>
    </div>
  </div>

  <script>
    // ─── Default Speed Dial Sites ──────────────────────────────
    const DEFAULT_SITES = [
      { name: 'Google',    url: 'https://www.google.com',    icon: 'https://www.google.com/favicon.ico' },
      { name: 'YouTube',   url: 'https://www.youtube.com',   icon: 'https://www.youtube.com/favicon.ico' },
      { name: 'Amazon',    url: 'https://www.amazon.in',     icon: 'https://www.amazon.in/favicon.ico' },
      { name: 'ChatGPT',   url: 'https://chatgpt.com',       icon: 'https://chatgpt.com/favicon.ico' },
      { name: 'Claude AI', url: 'https://claude.ai',         icon: 'https://claude.ai/favicon.ico' },
      { name: 'GitHub',    url: 'https://github.com',        icon: 'https://github.com/favicon.ico' },
      { name: 'Flipkart',  url: 'https://www.flipkart.com',  icon: 'https://www.flipkart.com/favicon.ico' },
      { name: 'LeetCode',  url: 'https://leetcode.com',      icon: 'https://leetcode.com/favicon.ico' },
      { name: 'Reddit',    url: 'https://www.reddit.com',    icon: 'https://www.reddit.com/favicon.ico' },
      { name: 'X',         url: 'https://x.com',             icon: 'https://abs.twimg.com/favicons/twitter.3.ico' },
      { name: 'LinkedIn',  url: 'https://www.linkedin.com',  icon: 'https://www.linkedin.com/favicon.ico' },
    ];

    const SUGGESTION_SITES = [
      { name: 'Google Workspace', url: 'https://workspace.google.com', icon: 'https://workspace.google.com/favicon.ico' },
      { name: 'YouTube',          url: 'https://www.youtube.com',      icon: 'https://www.youtube.com/favicon.ico' },
      { name: 'X / Twitter',      url: 'https://x.com',               icon: 'https://abs.twimg.com/favicons/twitter.3.ico' },
      { name: 'Wikipedia',        url: 'https://wikipedia.org',        icon: 'https://en.wikipedia.org/favicon.ico' },
      { name: 'Stack Overflow',   url: 'https://stackoverflow.com',   icon: 'https://stackoverflow.com/favicon.ico' },
      { name: 'Hacker News',      url: 'https://news.ycombinator.com', icon: 'https://news.ycombinator.com/favicon.ico' },
    ];

    // ─── Color palette for fallback tile backgrounds ──────────
    const TILE_COLORS = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D00',
      '#8E24AA', '#00ACC1', '#43A047', '#E91E63', '#3F51B5',
      '#FF5722', '#009688',
    ];

    function getInitial(name) {
      return name.charAt(0).toUpperCase();
    }

    function getColorForName(name) {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return TILE_COLORS[Math.abs(hash) % TILE_COLORS.length];
    }

    // ─── LocalStorage Persistence ─────────────────────────────
    const STORAGE_KEY = 'muthu_speed_dial_sites';

    function loadSites() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return null;
    }

    function saveSites(sites) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
      } catch (e) {}
    }

    function getSites() {
      return loadSites() || [...DEFAULT_SITES];
    }

    // ─── Render Speed Dial Grid ───────────────────────────────
    function renderDialGrid() {
      const grid = document.getElementById('dialGrid');
      grid.innerHTML = '';
      const sites = getSites();

      sites.forEach((site, index) => {
        const tile = document.createElement('div');
        tile.className = 'dial-tile';
        tile.onclick = (e) => {
          if (e.target.closest('.tile-close-btn')) return;
          navigate(site.url);
        };

        const iconCard = document.createElement('div');
        iconCard.className = 'tile-icon-card';

        // Favicon image with fallback
        const img = document.createElement('img');
        img.src = site.icon || ('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(site.url) + '&sz=64');
        img.alt = site.name;
        img.loading = 'lazy';
        img.onerror = function() {
          this.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;background:' + getColorForName(site.name) + ';border-radius:16px;';
          fallback.textContent = getInitial(site.name);
          iconCard.insertBefore(fallback, iconCard.firstChild);
        };
        iconCard.appendChild(img);

        // Close button for non-default / custom sites
        const stored = loadSites();
        if (stored) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'tile-close-btn';
          closeBtn.innerHTML = '✕';
          closeBtn.title = 'Remove shortcut';
          closeBtn.onclick = (e) => {
            e.stopPropagation();
            removeSite(index);
          };
          iconCard.appendChild(closeBtn);
        }

        const label = document.createElement('span');
        label.className = 'tile-label';
        label.textContent = site.name;

        tile.appendChild(iconCard);
        tile.appendChild(label);
        grid.appendChild(tile);
      });

      // "Add a site" tile
      const addTile = document.createElement('div');
      addTile.className = 'dial-tile';
      addTile.onclick = () => openModal();

      const addCard = document.createElement('div');
      addCard.className = 'tile-icon-card tile-icon-card--add';
      addCard.innerHTML = '<span class="add-icon">+</span>';

      const addLabel = document.createElement('span');
      addLabel.className = 'tile-label';
      addLabel.textContent = 'Add shortcut';

      addTile.appendChild(addCard);
      addTile.appendChild(addLabel);
      grid.appendChild(addTile);
    }

    // ─── Render Suggestions ───────────────────────────────────
    function renderSuggestions() {
      const row = document.getElementById('suggestionsRow');
      row.innerHTML = '';

      SUGGESTION_SITES.forEach((site) => {
        const card = document.createElement('div');
        card.className = 'sug-card';
        card.onclick = () => navigate(site.url);

        const img = document.createElement('img');
        img.src = site.icon || ('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(site.url) + '&sz=32');
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = function() {
          this.style.display = 'none';
        };

        const label = document.createElement('span');
        label.className = 'sug-card-label';
        label.textContent = site.name;

        card.appendChild(img);
        card.appendChild(label);
        row.appendChild(card);
      });
    }

    // ─── Site Management ──────────────────────────────────────
    function removeSite(index) {
      const sites = getSites();
      sites.splice(index, 1);
      saveSites(sites);
      renderDialGrid();
    }

    function addSite(name, url) {
      const sites = getSites();
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      sites.push({
        name: name.trim() || new URL(cleanUrl).hostname,
        url: cleanUrl,
        icon: 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(cleanUrl) + '&sz=64',
      });
      saveSites(sites);
      renderDialGrid();
    }

    // ─── Modal Controls ───────────────────────────────────────
    function openModal() {
      document.getElementById('addModal').classList.add('active');
      setTimeout(() => document.getElementById('modalName').focus(), 100);
    }

    function closeModal() {
      document.getElementById('addModal').classList.remove('active');
      document.getElementById('modalName').value = '';
      document.getElementById('modalUrl').value = '';
    }

    function addCustomSite() {
      const name = document.getElementById('modalName').value;
      const url = document.getElementById('modalUrl').value;
      if (url.trim()) {
        addSite(name, url);
        closeModal();
      }
    }

    // Enter key submits modal
    document.getElementById('modalUrl').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addCustomSite(); }
    });
    document.getElementById('modalName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('modalUrl').focus(); }
    });

    // Close modal on overlay click
    document.getElementById('addModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // ─── Navigation ───────────────────────────────────────────
    function navigate(url) {
      window.location.href = url;
    }

    function handleSearch(e) {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return;

      if (query.startsWith('http://') || query.startsWith('https://')) {
        navigate(query);
      } else if (query.includes('.') && !query.includes(' ')) {
        navigate('https://' + query);
      } else {
        navigate('https://www.google.com/search?q=' + encodeURIComponent(query));
      }
    }

    // ─── Clock ────────────────────────────────────────────────
    function updateClock() {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('clock').textContent = hrs + ':' + mins;

      const hour = now.getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      document.getElementById('greeting').textContent = greeting;
    }

    // ─── Initialize ───────────────────────────────────────────
    updateClock();
    setInterval(updateClock, 1000);
    renderDialGrid();
    renderSuggestions();
  </script>
</body>
</html>`;
}
