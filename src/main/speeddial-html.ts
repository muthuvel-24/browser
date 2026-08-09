/**
 * Muthu Browser — Google Chrome Desktop Dark Mode New Tab Page HTML Replica
 */

export function getSpeedDialHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab — Google Chrome</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #202124;
      color: #e8eaed;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      position: relative;
    }

    /* Container */
    .ntp-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 560px;
      margin-top: -60px;
    }

    /* Authentic Google Logo */
    .google-logo {
      width: 272px;
      height: 92px;
      margin-bottom: 38px;
    }

    /* Chrome Search Bar */
    .search-form {
      width: 100%;
      margin-bottom: 32px;
    }

    .search-box {
      display: flex;
      align-items: center;
      width: 100%;
      height: 46px;
      padding: 0 16px;
      background: #303134;
      border: 1px solid transparent;
      border-radius: 23px;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.28);
      transition: background 0.2s, box-shadow 0.2s;
    }

    .search-box:hover {
      background: #3c4043;
      box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
    }

    .search-box:focus-within {
      background: #303134;
      box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28), 0 0 0 1px #8ab4f8;
    }

    .search-icon {
      width: 20px;
      height: 20px;
      fill: #9aa0a6;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      color: #e8eaed;
      font-family: inherit;
      font-size: 16px;
    }

    .search-input::placeholder {
      color: #9aa0a6;
    }

    .search-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 8px;
    }

    .action-mic-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-mic-btn svg {
      width: 22px;
      height: 22px;
    }

    /* Circular Shortcut Grid */
    .shortcut-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px 16px;
      width: 100%;
    }

    .shortcut-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #e8eaed;
      cursor: pointer;
      border-radius: 8px;
      padding: 10px 4px;
      transition: background 0.15s;
    }

    .shortcut-tile:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .shortcut-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #303134;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .shortcut-circle img {
      width: 24px;
      height: 24px;
      object-fit: contain;
      border-radius: 4px;
    }

    .shortcut-label {
      font-size: 12px;
      font-weight: 400;
      color: #e8eaed;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
    }

    .shortcut-add-circle {
      background: rgba(255, 255, 255, 0.06);
      border: 1px dashed #5f6368;
    }

    .shortcut-add-circle span {
      font-size: 20px;
      font-weight: 300;
      color: #8ab4f8;
    }

    /* Customize Chrome Button */
    .customize-btn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #303134;
      border: 1px solid #5f6368;
      border-radius: 18px;
      color: #8ab4f8;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .customize-btn:hover {
      background: #3c4043;
    }
  </style>
</head>
<body>

  <div class="ntp-container">
    <!-- Google Logo -->
    <svg class="google-logo" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.33 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.33 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.02l8.48-3.53c1.51 3.61 5.21 7.89 11.17 7.89 7.31 0 11.85-4.53 11.85-13.02v-3.36h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.49zm-8.99 21.01c0-7.89-5.21-13.61-11.93-13.61-6.8 0-12.51 5.72-12.51 13.61 0 7.73 5.71 13.36 12.51 13.36 6.72 0 11.93-5.63 11.93-13.36z"/>
      <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
      <path fill="#EA4335" d="M262.02 55.74l7.73 5.13c-2.52 3.7-8.57 10.09-19.16 10.09-12.94 0-22.52-10.09-22.52-22.18 0-13.11 9.66-22.18 21.43-22.18 11.85 0 17.56 9.24 19.49 14.12l1.01 2.52-29.66 12.27c2.27 4.45 5.79 6.72 10.75 6.72 4.96 0 8.4-2.44 10.93-6.49zm-13.61-9.07l19.83-8.23c-1.09-2.77-4.37-4.7-8.32-4.7-4.96 0-11.68 4.37-11.51 12.93z"/>
      <path fill="#4285F4" d="M35.29 41.41V31.15h32.74c.32 1.74.48 3.82.48 6.07 0 7.42-2.03 16.59-8.67 23.23-6.49 6.72-15.04 10.33-24.55 10.33-18.06 0-33.44-14.7-33.44-32.77C1.85 19.95 17.23 5.25 35.29 5.25c9.91 0 16.97 3.86 22.35 8.99l-6.3 6.3c-3.86-3.61-9.07-6.47-16.05-6.47-13.11 0-23.44 10.67-23.44 23.95 0 13.28 10.33 23.95 23.44 23.95 8.57 0 13.53-3.44 16.64-6.55 2.52-2.52 4.12-6.13 4.79-11.01H35.29z"/>
    </svg>

    <!-- Chrome Pill Search Bar -->
    <form class="search-form" id="searchForm" onsubmit="handleSearch(event)">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input type="text" id="searchInput" class="search-input" placeholder="Search Google or type a URL" autofocus autocomplete="off" />
        <div class="search-actions">
          <button type="button" class="action-mic-btn" title="Search by voice" onclick="triggerVoice()">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path fill="#34A853" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </form>

    <!-- Chrome Shortcut Grid -->
    <div class="shortcut-grid" id="shortcutGrid"></div>

  </div>

  <!-- Customize Button -->
  <button class="customize-btn" onclick="alert('Customize Chrome Panel')">
    ✏️ Customize Chrome
  </button>

  <script>
    const DEFAULT_SHORTCUTS = [
      { name: 'Google', url: 'https://www.google.com', icon: 'https://www.google.com/favicon.ico' },
      { name: 'YouTube', url: 'https://www.youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
      { name: 'Gmail', url: 'https://mail.google.com', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
      { name: 'Maps', url: 'https://maps.google.com', icon: 'https://www.google.com/images/branding/product/ico/maps155.ico' },
      { name: 'Drive', url: 'https://drive.google.com', icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
      { name: 'Photos', url: 'https://photos.google.com', icon: 'https://ssl.gstatic.com/social/photos/favicon.ico' },
      { name: 'News', url: 'https://news.google.com', icon: 'https://ssl.gstatic.com/topics/news/favicon.ico' },
      { name: 'Translate', url: 'https://translate.google.com', icon: 'https://ssl.gstatic.com/translate/favicon.ico' },
      { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
    ];

    function renderShortcuts() {
      const grid = document.getElementById('shortcutGrid');
      grid.innerHTML = '';

      DEFAULT_SHORTCUTS.forEach((sc) => {
        const a = document.createElement('a');
        a.className = 'shortcut-tile';
        a.onclick = () => { window.location.href = sc.url; };

        const circle = document.createElement('div');
        circle.className = 'shortcut-circle';

        const img = document.createElement('img');
        img.src = sc.icon;
        img.alt = sc.name;
        img.onerror = function() {
          this.style.display = 'none';
          circle.textContent = sc.name.charAt(0);
          circle.style.fontSize = '18px';
          circle.style.fontWeight = '700';
          circle.style.color = '#8ab4f8';
        };

        const label = document.createElement('span');
        label.className = 'shortcut-label';
        label.textContent = sc.name;

        circle.appendChild(img);
        a.appendChild(circle);
        a.appendChild(label);
        grid.appendChild(a);
      });

      // Add Shortcut Tile
      const addTile = document.createElement('div');
      addTile.className = 'shortcut-tile';
      addTile.onclick = () => {
        const url = prompt('Enter shortcut URL:');
        if (url) {
          let clean = url.trim();
          if (!clean.startsWith('http')) clean = 'https://' + clean;
          window.location.href = clean;
        }
      };

      const addCircle = document.createElement('div');
      addCircle.className = 'shortcut-circle shortcut-add-circle';
      addCircle.innerHTML = '<span>+</span>';

      const addLabel = document.createElement('span');
      addLabel.className = 'shortcut-label';
      addLabel.textContent = 'Add shortcut';

      addTile.appendChild(addCircle);
      addTile.appendChild(addLabel);
      grid.appendChild(addTile);
    }

    function triggerVoice() {
      const q = prompt('Voice Search:');
      if (q) {
        window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(q);
      }
    }

    function handleSearch(e) {
      e.preventDefault();
      const q = document.getElementById('searchInput').value.trim();
      if (!q) return;

      if (q.startsWith('http://') || q.startsWith('https://')) {
        window.location.href = q;
      } else if (q.includes('.') && !q.includes(' ')) {
        window.location.href = 'https://' + q;
      } else {
        window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(q);
      }
    }

    renderShortcuts();
  </script>
</body>
</html>`;
}
