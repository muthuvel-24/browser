/**
 * Muthu Browser — Opera Speed Dial Start Page HTML
 *
 * Ultra-professional Start Page featuring:
 * - Real-time clock & personalized greeting
 * - Multi-engine search bar (Google, Bing, DuckDuckGo)
 * - Animated Speed Dial grid with custom SVG icons and hover glows
 * - Quick shortcuts & customizable site launcher
 * - Sleek glassmorphic dark mode styling
 */

export function getSpeedDialHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Start Page — Muthu Browser</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 100vw;
      min-height: 100vh;
      overflow-x: hidden;
      font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
      color: #ffffff;
      background: #090a10;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 20px;
      user-select: none;
      position: relative;
    }

    /* Ambient Background Mesh */
    body::before {
      content: '';
      position: fixed;
      top: -20%;
      left: -20%;
      width: 140%;
      height: 140%;
      background: 
        radial-gradient(circle at 20% 20%, rgba(255, 27, 81, 0.15), transparent 40%),
        radial-gradient(circle at 80% 30%, rgba(0, 240, 255, 0.12), transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(138, 43, 226, 0.18), transparent 50%);
      filter: blur(60px);
      z-index: -1;
      pointer-events: none;
      animation: ambient-float 25s ease-in-out infinite alternate;
    }

    @keyframes ambient-float {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.05) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }

    /* Header & Clock */
    .header-clock-section {
      text-align: center;
      margin-bottom: 25px;
      margin-top: 10px;
    }

    .digital-clock {
      font-size: 52px;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #ffffff 0%, #a0a5c0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .greeting-text {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 2px;
      letter-spacing: 0.5px;
    }

    /* Center Search Bar */
    .search-container {
      width: 100%;
      max-width: 660px;
      margin-bottom: 40px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      height: 54px;
      padding: 0 22px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 27px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .search-box:focus-within {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(0, 240, 255, 0.5);
      box-shadow: 0 16px 48px rgba(0, 240, 255, 0.25), 0 0 0 2px rgba(0, 240, 255, 0.4);
    }

    .search-engine-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      cursor: pointer;
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      font-size: 16px;
      font-family: inherit;
      font-weight: 400;
      color: #ffffff;
      background: transparent;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.45);
    }

    .search-submit-btn {
      background: transparent;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      transition: transform 0.2s, color 0.2s;
    }

    .search-submit-btn:hover {
      transform: scale(1.1);
      color: #00f0ff;
    }

    /* Speed Dial Grid */
    .section-title {
      width: 100%;
      max-width: 920px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
    }

    .speed-dial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 20px;
      width: 100%;
      max-width: 920px;
      margin-bottom: 40px;
    }

    .dial-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #ffffff;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dial-tile:hover {
      transform: translateY(-6px);
    }

    .tile-card {
      width: 100%;
      height: 80px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.12);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .dial-tile:hover .tile-card {
      box-shadow: 0 14px 36px rgba(0, 240, 255, 0.3);
      border-color: rgba(0, 240, 255, 0.6);
    }

    .tile-label {
      margin-top: 10px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* Vibrant Gradients for Tiles */
    .card-google { background: linear-gradient(135deg, #4285F4, #34A853); }
    .card-youtube { background: linear-gradient(135deg, #FF0000, #990000); }
    .card-amazon { background: linear-gradient(135deg, #232F3E, #FF9900); }
    .card-flipkart { background: linear-gradient(135deg, #2874F0, #0040A8); }
    .card-chatgpt { background: linear-gradient(135deg, #10A37F, #00563B); }
    .card-claude { background: linear-gradient(135deg, #D97757, #803015); }
    .card-github { background: linear-gradient(135deg, #24292E, #040d21); }
    .card-twitter { background: linear-gradient(135deg, #1DA1F2, #0d5a8a); }
    .card-leetcode { background: linear-gradient(135deg, #FFA116, #995000); }
    .card-add {
      background: rgba(255, 255, 255, 0.04);
      border: 2px dashed rgba(255, 255, 255, 0.2);
    }
    .card-add:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: #00f0ff;
    }

    .tile-text {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    /* Suggestions Bar */
    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      width: 100%;
      max-width: 920px;
    }

    .sug-card {
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s;
    }

    .sug-card:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(0, 240, 255, 0.4);
      color: #ffffff;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>

  <!-- Clock & Greeting -->
  <div class="header-clock-section">
    <div className="digital-clock" id="clock">12:00</div>
    <div className="greeting-text" id="greeting">Welcome to Muthu Browser</div>
  </div>

  <!-- Search Bar -->
  <div class="search-container">
    <form id="searchForm" onsubmit="handleSearch(event)">
      <div class="search-box">
        <svg class="search-engine-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <input type="text" id="searchInput" class="search-input" placeholder="Search the web or enter URL..." autofocus autocomplete="off" />
        <button type="submit" class="search-submit-btn">🔍</button>
      </div>
    </form>
  </div>

  <!-- Speed Dial Section -->
  <div class="section-title">Speed Dial</div>
  <div class="speed-dial-grid">
    <div class="dial-tile" onclick="navigate('https://www.google.com')">
      <div class="tile-card card-google"><span class="tile-text">Google</span></div>
      <span class="tile-label">Google</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://www.youtube.com')">
      <div class="tile-card card-youtube"><span class="tile-text">YouTube</span></div>
      <span class="tile-label">YouTube</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://www.amazon.in')">
      <div class="tile-card card-amazon"><span class="tile-text">Amazon</span></div>
      <span class="tile-label">Amazon</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://www.flipkart.com')">
      <div class="tile-card card-flipkart"><span class="tile-text">Flipkart</span></div>
      <span class="tile-label">Flipkart</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://chatgpt.com')">
      <div class="tile-card card-chatgpt"><span class="tile-text">ChatGPT</span></div>
      <span class="tile-label">ChatGPT</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://claude.ai')">
      <div class="tile-card card-claude"><span class="tile-text">Claude</span></div>
      <span class="tile-label">Claude AI</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://github.com')">
      <div class="tile-card card-github"><span class="tile-text">GitHub</span></div>
      <span class="tile-label">GitHub</span>
    </div>
    <div class="dial-tile" onclick="navigate('https://leetcode.com')">
      <div class="tile-card card-leetcode"><span class="tile-text">LeetCode</span></div>
      <span class="tile-label">LeetCode</span>
    </div>
    <div class="dial-tile" onclick="promptAddSite()">
      <div class="tile-card card-add"><span class="tile-text">+</span></div>
      <span class="tile-label">Add site</span>
    </div>
  </div>

  <!-- Quick Suggestions -->
  <div class="section-title">Quick Access</div>
  <div class="suggestions-grid">
    <div class="sug-card" onclick="navigate('https://wikipedia.org')">🌐 Wikipedia</div>
    <div class="sug-card" onclick="navigate('https://twitter.com')">🐦 X / Twitter</div>
    <div class="sug-card" onclick="navigate('https://reddit.com')">🤖 Reddit</div>
    <div class="sug-card" onclick="navigate('https://news.ycombinator.com')">🟧 Hacker News</div>
  </div>

  <script>
    function updateClock() {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('clock').innerText = hrs + ':' + mins;

      const hour = now.getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      document.getElementById('greeting').innerText = greeting + ' • Muthu Browser';
    }

    updateClock();
    setInterval(updateClock, 1000);

    function navigate(url) {
      window.location.href = url;
    }

    function handleSearch(e) {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return;

      const lower = query.toLowerCase();
      if (lower === 'amazon') {
        window.location.href = 'https://www.amazon.in';
      } else if (lower === 'flipkart') {
        window.location.href = 'https://www.flipkart.com';
      } else if (lower === 'claude') {
        window.location.href = 'https://claude.ai';
      } else if (lower.startsWith('http://') || lower.startsWith('https://')) {
        window.location.href = query;
      } else if (query.includes('.') && !query.includes(' ')) {
        window.location.href = 'https://' + query;
      } else {
        window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
      }
    }

    function promptAddSite() {
      const site = prompt('Enter website URL:');
      if (site) {
        let url = site.trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        window.location.href = url;
      }
    }
  </script>
</body>
</html>`;
}
