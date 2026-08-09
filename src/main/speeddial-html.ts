/**
 * Muthu Browser — JioSphere Mobile Start Page HTML
 *
 * JioSphere Design Language & System:
 * - Deep slate background (#0B0E14) with dark grey container cards (#161B22)
 * - JioSphere Signature Blue highlights (#0066FF)
 * - Glassmorphic overlays (backdrop-filter: blur(12px))
 * - Floating pill omnibox with Voice Mic & Bookmark Star icons
 * - 5x2 Circular App Shortcuts Grid with hover elevation
 * - Horizontal scrollable News Category Pill Tabs ('Top News', 'Tech', 'Entertainment', 'Sports', 'Business', 'Cricket')
 * - Card-based News Feed featuring thumbnails, headlines, sources & time-ago
 * - Dynamic LocalStorage shortcut persistence & full interactivity
 */

export function getSpeedDialHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JioSphere Start Page — Muthu Browser</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* ─── Reset & Core Theme Tokens ──────────────────────────── */
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --bg-primary: #0B0E14;
      --bg-secondary: #161B22;
      --bg-tertiary: #1F242D;
      --jio-blue: #0066FF;
      --jio-blue-hover: #0052CC;
      --jio-accent: #0A66C2;
      --text-primary: #F0F6FC;
      --text-secondary: #8B949E;
      --glass-bg: rgba(22, 27, 34, 0.85);
      --glass-border: rgba(255, 255, 255, 0.08);
      --radius-card: 16px;
      --radius-pill: 9999px;
      --radius-circle: 50%;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text-primary);
      background: var(--bg-primary);
      -webkit-font-smoothing: antialiased;
      user-select: none;
    }

    /* Ambient Subtle Backdrop Mesh */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      background: 
        radial-gradient(circle at 15% 20%, rgba(0, 102, 255, 0.12), transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(10, 102, 194, 0.08), transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(11, 14, 20, 1), transparent 80%);
      pointer-events: none;
    }

    /* ─── Main Layout Container ───────────────────────────────── */
    .content-wrapper {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 24px 20px 60px;
    }

    /* Header Logo & Greeting */
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 680px;
      margin-bottom: 24px;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .brand-badge {
      background: linear-gradient(135deg, var(--jio-blue), #0040A8);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .clock-badge {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--glass-border);
    }

    /* ─── Floating Hero Omnibox Search Bar ───────────────────── */
    .search-container {
      width: 100%;
      max-width: 680px;
      margin-bottom: 32px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      height: 52px;
      padding: 0 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-pill);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .search-box:focus-within {
      border-color: var(--jio-blue);
      box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.3), 0 8px 32px rgba(0, 102, 255, 0.2);
      background: var(--bg-tertiary);
      transform: translateY(-2px);
    }

    .search-lock-icon {
      font-size: 14px;
      color: #00E676;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      font-size: 15px;
      font-family: inherit;
      font-weight: 400;
      color: var(--text-primary);
      background: transparent;
      caret-color: var(--jio-blue);
    }

    .search-input::placeholder {
      color: var(--text-secondary);
      opacity: 0.7;
    }

    .search-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-action-btn {
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 6px;
      border-radius: var(--radius-circle);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-action-btn:hover {
      color: var(--jio-blue);
      background: rgba(0, 102, 255, 0.12);
    }

    .search-submit-btn {
      background: var(--jio-blue);
      color: #ffffff;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-circle);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 102, 255, 0.4);
    }

    .search-submit-btn:hover {
      background: var(--jio-blue-hover);
      transform: scale(1.05);
    }

    /* ─── Quick Access Grid (5x2 Circular App Shortcuts) ──────── */
    .section-title {
      width: 100%;
      max-width: 680px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--glass-border);
    }

    .quick-access-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px 16px;
      width: 100%;
      max-width: 680px;
      margin-bottom: 40px;
    }

    @media (max-width: 520px) {
      .quick-access-grid { grid-template-columns: repeat(4, 1fr); }
    }

    .app-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: var(--text-primary);
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .app-tile:hover {
      transform: translateY(-4px);
    }

    .app-circle-card {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-circle);
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .app-tile:hover .app-circle-card {
      background: var(--bg-tertiary);
      border-color: var(--jio-blue);
      box-shadow: 0 8px 24px rgba(0, 102, 255, 0.3);
    }

    .app-icon-img {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 6px;
    }

    .app-label {
      margin-top: 8px;
      font-size: 11.5px;
      font-weight: 500;
      color: var(--text-secondary);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 72px;
      transition: color 0.2s;
    }

    .app-tile:hover .app-label {
      color: var(--text-primary);
    }

    .app-circle-card--add {
      background: rgba(0, 102, 255, 0.08);
      border: 2px dashed rgba(0, 102, 255, 0.3);
    }

    .app-circle-card--add:hover {
      background: rgba(0, 102, 255, 0.18);
      border-color: var(--jio-blue);
    }

    .add-icon {
      font-size: 24px;
      font-weight: 300;
      color: var(--jio-blue);
    }

    /* ─── Content & News Feed Section ────────────────────────── */
    .news-section {
      width: 100%;
      max-width: 680px;
    }

    /* Horizontal Category Pill Tabs */
    .category-pills-row {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 20px;
      scrollbar-width: none;
    }

    .category-pills-row::-webkit-scrollbar {
      display: none;
    }

    .category-pill {
      padding: 8px 18px;
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-pill);
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .category-pill:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .category-pill--active {
      background: var(--jio-blue);
      border-color: var(--jio-blue);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 102, 255, 0.35);
    }

    /* News Cards List */
    .news-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .news-card {
      display: flex;
      gap: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-card);
      padding: 14px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .news-card:hover {
      background: var(--bg-tertiary);
      border-color: rgba(0, 102, 255, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .news-thumb {
      width: 100px;
      height: 76px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
      background: var(--bg-tertiary);
    }

    .news-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      min-width: 0;
    }

    .news-headline {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.35;
      color: var(--text-primary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      font-size: 11.5px;
      color: var(--text-secondary);
    }

    .news-source {
      font-weight: 600;
      color: var(--jio-blue);
    }

    .news-time {
      opacity: 0.7;
    }

    /* ─── Add Shortcut Modal ─────────────────────────────────── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(11, 14, 20, 0.8);
      backdrop-filter: blur(12px);
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
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      padding: 28px;
      width: 380px;
      max-width: 90vw;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-overlay.active .modal-card {
      transform: translateY(0);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 18px;
    }

    .modal-input {
      width: 100%;
      height: 44px;
      padding: 0 16px;
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      margin-bottom: 12px;
      transition: border-color 0.2s;
    }

    .modal-input:focus {
      border-color: var(--jio-blue);
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
      color: var(--text-secondary);
    }

    .modal-btn--cancel:hover {
      background: rgba(255,255,255,0.14);
      color: #fff;
    }

    .modal-btn--add {
      background: var(--jio-blue);
      color: #fff;
    }

    .modal-btn--add:hover {
      background: var(--jio-blue-hover);
      box-shadow: 0 4px 16px rgba(0, 102, 255, 0.4);
    }
  </style>
</head>
<body>

  <div class="content-wrapper">

    <!-- Header Logo & Clock Bar -->
    <div class="header-bar">
      <div class="brand-title">
        <span>JioSphere</span>
        <span class="brand-badge">5G</span>
      </div>
      <div class="clock-badge" id="clock">12:00</div>
    </div>

    <!-- Floating Hero Search Bar -->
    <div class="search-container">
      <form id="searchForm" onsubmit="handleSearch(event)" autocomplete="off">
        <div class="search-box">
          <span class="search-lock-icon">🔒</span>
          <input
            type="text"
            id="searchInput"
            class="search-input"
            placeholder="Search JioSphere or type URL..."
            autofocus
          />
          <div class="search-actions">
            <button type="button" class="search-action-btn" title="Voice Search" onclick="triggerVoiceSearch()">
              🎙️
            </button>
            <button type="button" class="search-action-btn" title="Bookmark Page" onclick="alert('Page Bookmarked!')">
              ⭐
            </button>
            <button type="submit" class="search-submit-btn" title="Search">
              ➔
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Quick Access Grid (5x2 Circular App Shortcuts) -->
    <div class="section-title">Quick Access</div>
    <div class="quick-access-grid" id="quickGrid"></div>

    <!-- Content & News Feed Section -->
    <div class="news-section">
      <div class="section-title">Trending Feed</div>

      <!-- Horizontal Scrollable Category Pills -->
      <div class="category-pills-row" id="categoryRow">
        <button class="category-pill category-pill--active" onclick="filterCategory('Top News', this)">Top News</button>
        <button class="category-pill" onclick="filterCategory('Tech', this)">Tech</button>
        <button class="category-pill" onclick="filterCategory('Entertainment', this)">Entertainment</button>
        <button class="category-pill" onclick="filterCategory('Sports', this)">Sports</button>
        <button class="category-pill" onclick="filterCategory('Business', this)">Business</button>
        <button class="category-pill" onclick="filterCategory('Cricket', this)">Cricket</button>
      </div>

      <!-- News Cards Grid -->
      <div class="news-grid" id="newsGrid"></div>
    </div>

  </div>

  <!-- Add Shortcut Modal -->
  <div class="modal-overlay" id="addModal">
    <div class="modal-card">
      <div class="modal-title">Add Quick Access App</div>
      <input class="modal-input" id="modalName" type="text" placeholder="Name (e.g. JioCinema)" maxlength="25" />
      <input class="modal-input" id="modalUrl" type="text" placeholder="URL (e.g. https://jiocinema.com)" />
      <div class="modal-actions">
        <button class="modal-btn modal-btn--cancel" onclick="closeModal()">Cancel</button>
        <button class="modal-btn modal-btn--add" onclick="addCustomSite()">Add</button>
      </div>
    </div>
  </div>

  <script>
    // ─── Default JioSphere Circular App Shortcuts ────────────────
    const DEFAULT_APPS = [
      { name: 'JioCinema',  url: 'https://www.jiocinema.com',   icon: 'https://www.jiocinema.com/favicon.ico' },
      { name: 'JioSaavn',   url: 'https://www.jiosaavn.com',    icon: 'https://www.jiosaavn.com/favicon.ico' },
      { name: 'Google',     url: 'https://www.google.com',     icon: 'https://www.google.com/favicon.ico' },
      { name: 'YouTube',    url: 'https://www.youtube.com',    icon: 'https://www.youtube.com/favicon.ico' },
      { name: 'Amazon',     url: 'https://www.amazon.in',      icon: 'https://www.amazon.in/favicon.ico' },
      { name: 'ChatGPT',    url: 'https://chatgpt.com',        icon: 'https://chatgpt.com/favicon.ico' },
      { name: 'Claude AI',  url: 'https://claude.ai',          icon: 'https://claude.ai/favicon.ico' },
      { name: 'GitHub',     url: 'https://github.com',         icon: 'https://github.com/favicon.ico' },
      { name: 'Flipkart',   url: 'https://www.flipkart.com',   icon: 'https://www.flipkart.com/favicon.ico' },
    ];

    // ─── Trending News Articles Database ──────────────────────
    const NEWS_ARTICLES = [
      {
        category: 'Top News',
        headline: 'ISRO Announces Next-Gen Satellite Launch for Enhanced 5G Connectivity',
        source: 'Jio News',
        time: '15 mins ago',
        url: 'https://news.google.com',
        thumb: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=300&q=80'
      },
      {
        category: 'Tech',
        headline: 'Revolutionary AI Models Redefining Real-Time Mobile Web Browsing',
        source: 'TechCrunch',
        time: '42 mins ago',
        url: 'https://techcrunch.com',
        thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80'
      },
      {
        category: 'Sports',
        headline: 'India Secures Thrilling Victory in Final Over T20 Showdown',
        source: 'ESPNCricinfo',
        time: '1 hour ago',
        url: 'https://espncricinfo.com',
        thumb: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&q=80'
      },
      {
        category: 'Entertainment',
        headline: 'Blockbuster Sci-Fi Sequel Shatters Global Box Office Records',
        source: 'Variety',
        time: '2 hours ago',
        url: 'https://variety.com',
        thumb: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&q=80'
      },
      {
        category: 'Business',
        headline: 'Global Tech Stocks Surge Following Breakthrough Semiconductor Innovations',
        source: 'Bloomberg',
        time: '3 hours ago',
        url: 'https://bloomberg.com',
        thumb: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80'
      }
    ];

    // ─── LocalStorage App Shortcuts ────────────────────────────
    const STORAGE_KEY = 'jiosphere_app_shortcuts';

    function loadApps() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return [...DEFAULT_APPS];
    }

    function saveApps(apps) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
      } catch (e) {}
    }

    // ─── Render Quick Access Grid ──────────────────────────────
    function renderQuickGrid() {
      const grid = document.getElementById('quickGrid');
      grid.innerHTML = '';
      const apps = loadApps();

      apps.forEach((app) => {
        const tile = document.createElement('div');
        tile.className = 'app-tile';
        tile.onclick = () => navigate(app.url);

        const card = document.createElement('div');
        card.className = 'app-circle-card';

        const img = document.createElement('img');
        img.className = 'app-icon-img';
        img.src = app.icon || ('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(app.url) + '&sz=64');
        img.onerror = function() {
          this.style.display = 'none';
          card.textContent = app.name.charAt(0).toUpperCase();
          card.style.fontWeight = '800';
          card.style.fontSize = '20px';
          card.style.color = '#0066FF';
        };

        const label = document.createElement('span');
        label.className = 'app-label';
        label.textContent = app.name;

        card.appendChild(img);
        tile.appendChild(card);
        tile.appendChild(label);
        grid.appendChild(tile);
      });

      // Add Shortcut Button
      const addTile = document.createElement('div');
      addTile.className = 'app-tile';
      addTile.onclick = () => openModal();

      const addCard = document.createElement('div');
      addCard.className = 'app-circle-card app-circle-card--add';
      addCard.innerHTML = '<span class="add-icon">+</span>';

      const addLabel = document.createElement('span');
      addLabel.className = 'app-label';
      addLabel.textContent = 'Add App';

      addTile.appendChild(addCard);
      addTile.appendChild(addLabel);
      grid.appendChild(addTile);
    }

    // ─── Render News Feed ──────────────────────────────────────
    function renderNews(categoryFilter = 'Top News') {
      const grid = document.getElementById('newsGrid');
      grid.innerHTML = '';

      const filtered = categoryFilter === 'Top News' 
        ? NEWS_ARTICLES 
        : NEWS_ARTICLES.filter(a => a.category === categoryFilter);

      const itemsToDisplay = filtered.length ? filtered : NEWS_ARTICLES;

      itemsToDisplay.forEach((article) => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.onclick = () => navigate(article.url);

        card.innerHTML = \`
          <img class="news-thumb" src="\${article.thumb}" alt="" loading="lazy" />
          <div class="news-content">
            <div class="news-headline">\${article.headline}</div>
            <div class="news-meta">
              <span class="news-source">\${article.source}</span>
              <span>•</span>
              <span class="news-time">\${article.time}</span>
            </div>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    function filterCategory(cat, el) {
      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('category-pill--active'));
      el.classList.add('category-pill--active');
      renderNews(cat);
    }

    // ─── Voice Search Prompt ──────────────────────────────────
    function triggerVoiceSearch() {
      const q = prompt('Voice Search (speak or type query):');
      if (q && q.trim()) {
        navigate('https://www.google.com/search?q=' + encodeURIComponent(q.trim()));
      }
    }

    // ─── Navigation & Search Handler ──────────────────────────
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
        const apps = loadApps();
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        apps.push({
          name: name.trim() || new URL(cleanUrl).hostname,
          url: cleanUrl,
          icon: 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(cleanUrl) + '&sz=64',
        });
        saveApps(apps);
        renderQuickGrid();
        closeModal();
      }
    }

    // ─── Real-Time Clock ──────────────────────────────────────
    function updateClock() {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('clock').textContent = hrs + ':' + mins;
    }

    // ─── Initialization ───────────────────────────────────────
    updateClock();
    setInterval(updateClock, 1000);
    renderQuickGrid();
    renderNews();
  </script>
</body>
</html>`;
}
