/**
 * Muthu Browser — Opera Speed Dial New Tab Page HTML
 *
 * Recreates the exact Opera / Opera GX Start Page:
 * - Swirling neon purple/blue wallpaper background
 * - Prominent center Google search bar ("Search the web")
 * - Interactive Speed Dial tiles for Amazon, Flipkart, Booking, Airbnb, Myntra, AJIO, YouTube, ChatGPT, Claude, LeetCode
 * - Clicking any tile or searching navigates the tab seamlessly
 */

export function getSpeedDialHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Speed Dial</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 100vw;
      height: 100vh;
      overflow-x: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #ffffff;
      background: radial-gradient(circle at 20% 20%, #4a00e0 0%, #15003b 40%, #080015 100%);
      background-attachment: fixed;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 40px;
      user-select: none;
    }

    /* ── Swirling Opera Wallpaper Animation ── */
    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.25), rgba(0, 240, 255, 0.15), transparent 60%);
      animation: opera-swirl 20s ease-in-out infinite alternate;
      z-index: -1;
      pointer-events: none;
    }

    @keyframes opera-swirl {
      0% { transform: rotate(0deg) scale(1); }
      100% { transform: rotate(15deg) scale(1.1); }
    }

    /* ── Opera Banner Prompt ── */
    .opera-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 90%;
      max-width: 960px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      margin-bottom: 30px;
      font-size: 13px;
    }

    .opera-banner-btn {
      padding: 6px 14px;
      background: #7829ff;
      color: #fff;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }

    .opera-banner-btn:hover {
      background: #9146ff;
    }

    /* ── Center Search Bar ── */
    .search-container {
      width: 90%;
      max-width: 680px;
      margin-bottom: 45px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      height: 52px;
      padding: 0 20px;
      background: #ffffff;
      border-radius: 26px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .search-box:focus-within {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 240, 255, 0.3), 0 0 0 2px #00f0ff;
    }

    .google-g {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      font-size: 15px;
      font-family: inherit;
      color: #1a1a2b;
      background: transparent;
    }

    .search-input::placeholder {
      color: #75758a;
    }

    .search-btn {
      background: transparent;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #5f6368;
    }

    /* ── Speed Dial Grid ── */
    .speed-dial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 18px;
      width: 90%;
      max-width: 960px;
      margin-bottom: 40px;
    }

    .dial-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #ffffff;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .dial-tile:hover {
      transform: translateY(-4px);
    }

    .tile-card {
      width: 100%;
      height: 76px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      transition: box-shadow 0.2s, background 0.2s;
    }

    .dial-tile:hover .tile-card {
      box-shadow: 0 10px 28px rgba(0, 240, 255, 0.4);
      background: #ffffff;
    }

    .tile-icon {
      max-width: 80%;
      max-height: 80%;
      object-fit: contain;
      font-size: 28px;
      font-weight: 700;
    }

    .tile-label {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 500;
      color: #e0e0f0;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* Custom colored card backgrounds for Speed Dial tiles */
    .card-amazon { background: #131921; color: #ff9900; }
    .card-flipkart { background: #2874f0; color: #ffe500; }
    .card-booking { background: #003580; color: #ffffff; }
    .card-airbnb { background: #ff385c; color: #ffffff; }
    .card-myntra { background: #ffffff; color: #ff3f6c; }
    .card-ajio { background: #2c4152; color: #ffffff; }
    .card-youtube { background: #ff0000; color: #ffffff; }
    .card-chatgpt { background: #10a37f; color: #ffffff; }
    .card-claude { background: #d97757; color: #ffffff; }
    .card-leetcode { background: #ffa116; color: #ffffff; }
    .card-add { background: rgba(255, 255, 255, 0.1); border: 2px dashed rgba(255, 255, 255, 0.3); }

    /* ── Suggestions Section ── */
    .suggestions-section {
      width: 90%;
      max-width: 960px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 12px;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 14px;
    }

    .sug-card {
      height: 60px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #d0d0e0;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }

    .sug-card:hover {
      background: rgba(255, 255, 255, 0.18);
      transform: translateY(-2px);
      color: #ffffff;
    }
  </style>
</head>
<body>

  <!-- Opera Prominent Banner -->
  <div class="opera-banner">
    <span>Would you like to make Muthu Browser your everyday browser?</span>
    <button class="opera-banner-btn" onclick="alert('Muthu Browser is active!')">Make default</button>
  </div>

  <!-- Center Search Bar -->
  <div class="search-container">
    <form id="searchForm" onsubmit="handleSearch(event)">
      <div class="search-box">
        <svg class="google-g" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <input type="text" id="searchInput" class="search-input" placeholder="Search the web or enter URL" autofocus autocomplete="off" />
        <button type="submit" class="search-btn">🔍</button>
      </div>
    </form>
  </div>

  <!-- Opera Speed Dial Grid -->
  <div class="speed-dial-grid">
    
    <!-- Amazon Tile -->
    <div class="dial-tile" onclick="navigate('https://www.amazon.in')">
      <div class="tile-card card-amazon">
        <span class="tile-icon">amazon</span>
      </div>
      <span class="tile-label">Amazon</span>
    </div>

    <!-- Flipkart Tile -->
    <div class="dial-tile" onclick="navigate('https://www.flipkart.com')">
      <div class="tile-card card-flipkart">
        <span class="tile-icon">Flipkart</span>
      </div>
      <span class="tile-label">Flipkart</span>
    </div>

    <!-- Booking.com Tile -->
    <div class="dial-tile" onclick="navigate('https://www.booking.com')">
      <div class="tile-card card-booking">
        <span class="tile-icon">Booking</span>
      </div>
      <span class="tile-label">Booking.com</span>
    </div>

    <!-- Airbnb Tile -->
    <div class="dial-tile" onclick="navigate('https://www.airbnb.com')">
      <div class="tile-card card-airbnb">
        <span class="tile-icon">airbnb</span>
      </div>
      <span class="tile-label">Airbnb</span>
    </div>

    <!-- Myntra Tile -->
    <div class="dial-tile" onclick="navigate('https://www.myntra.com')">
      <div class="tile-card card-myntra">
        <span class="tile-icon">M</span>
      </div>
      <span class="tile-label">Myntra</span>
    </div>

    <!-- AJIO Tile -->
    <div class="dial-tile" onclick="navigate('https://www.ajio.com')">
      <div class="tile-card card-ajio">
        <span class="tile-icon">AJIO</span>
      </div>
      <span class="tile-label">AJIO</span>
    </div>

    <!-- YouTube Tile -->
    <div class="dial-tile" onclick="navigate('https://www.youtube.com')">
      <div class="tile-card card-youtube">
        <span class="tile-icon">▶ YouTube</span>
      </div>
      <span class="tile-label">YouTube</span>
    </div>

    <!-- ChatGPT Tile -->
    <div class="dial-tile" onclick="navigate('https://chatgpt.com')">
      <div class="tile-card card-chatgpt">
        <span class="tile-icon">🤖 ChatGPT</span>
      </div>
      <span class="tile-label">ChatGPT</span>
    </div>

    <!-- Claude AI Tile -->
    <div class="dial-tile" onclick="navigate('https://claude.ai')">
      <div class="tile-card card-claude">
        <span class="tile-icon">🤖 Claude</span>
      </div>
      <span class="tile-label">Claude AI</span>
    </div>

    <!-- LeetCode Tile -->
    <div class="dial-tile" onclick="navigate('https://leetcode.com')">
      <div class="tile-card card-leetcode">
        <span class="tile-icon">&lt;/&gt; LeetCode</span>
      </div>
      <span class="tile-label">LeetCode</span>
    </div>

    <!-- Add Site Tile -->
    <div class="dial-tile" onclick="promptAddSite()">
      <div class="tile-card card-add">
        <span class="tile-icon">+</span>
      </div>
      <span class="tile-label">Add a site</span>
    </div>

  </div>

  <!-- Suggestions Grid -->
  <div class="suggestions-section">
    <div class="section-title">Suggestions</div>
    <div class="suggestions-grid">
      <div class="sug-card" onclick="navigate('https://www.google.com')">Google</div>
      <div class="sug-card" onclick="navigate('https://twitter.com')">X / Twitter</div>
      <div class="sug-card" onclick="navigate('https://github.com')">GitHub</div>
      <div class="sug-card" onclick="navigate('https://wikipedia.org')">Wikipedia</div>
    </div>
  </div>

  <script>
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
      const site = prompt('Enter website URL (e.g. instagram.com):');
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
