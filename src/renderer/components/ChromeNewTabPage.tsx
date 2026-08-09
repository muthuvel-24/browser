/**
 * Muthu Browser — Chrome Desktop Dark Mode New Tab Page Component
 *
 * Renders the authentic Google Chrome Dark Mode New Tab experience inside the React viewport!
 */

import React, { useState } from 'react';
import './ChromeNewTabPage.css';

interface ChromeNewTabPageProps {
  onNavigate: (url: string) => void;
}

const DEFAULT_SHORTCUTS = [
  { name: 'Google', url: 'https://www.google.com', icon: '🌐' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉️' },
  { name: 'Maps', url: 'https://maps.google.com', icon: '📍' },
  { name: 'Drive', url: 'https://drive.google.com', icon: '📁' },
  { name: 'Photos', url: 'https://photos.google.com', icon: '🖼️' },
  { name: 'News', url: 'https://news.google.com', icon: '📰' },
  { name: 'Translate', url: 'https://translate.google.com', icon: '🔤' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
];

const ChromeNewTabPage: React.FC<ChromeNewTabPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (q.startsWith('http://') || q.startsWith('https://')) {
      onNavigate(q);
    } else if (q.includes('.') && !q.includes(' ')) {
      onNavigate('https://' + q);
    } else {
      onNavigate('https://www.google.com/search?q=' + encodeURIComponent(q));
    }
  };

  const triggerVoice = () => {
    const q = prompt('Voice Search:');
    if (q) onNavigate(q);
  };

  return (
    <div className="chrome-ntp-container" id="chrome-ntp-container">
      <div className="chrome-ntp-content">
        {/* Authentic Google Logo SVG */}
        <svg className="chrome-google-logo" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.33 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
          <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.33 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
          <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.02l8.48-3.53c1.51 3.61 5.21 7.89 11.17 7.89 7.31 0 11.85-4.53 11.85-13.02v-3.36h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.49zm-8.99 21.01c0-7.89-5.21-13.61-11.93-13.61-6.8 0-12.51 5.72-12.51 13.61 0 7.73 5.71 13.36 12.51 13.36 6.72 0 11.93-5.63 11.93-13.36z"/>
          <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
          <path fill="#EA4335" d="M262.02 55.74l7.73 5.13c-2.52 3.7-8.57 10.09-19.16 10.09-12.94 0-22.52-10.09-22.52-22.18 0-13.11 9.66-22.18 21.43-22.18 11.85 0 17.56 9.24 19.49 14.12l1.01 2.52-29.66 12.27c2.27 4.45 5.79 6.72 10.75 6.72 4.96 0 8.4-2.44 10.93-6.49zm-13.61-9.07l19.83-8.23c-1.09-2.77-4.37-4.7-8.32-4.7-4.96 0-11.68 4.37-11.51 12.93z"/>
          <path fill="#4285F4" d="M35.29 41.41V31.15h32.74c.32 1.74.48 3.82.48 6.07 0 7.42-2.03 16.59-8.67 23.23-6.49 6.72-15.04 10.33-24.55 10.33-18.06 0-33.44-14.7-33.44-32.77C1.85 19.95 17.23 5.25 35.29 5.25c9.91 0 16.97 3.86 22.35 8.99l-6.3 6.3c-3.86-3.61-9.07-6.47-16.05-6.47-13.11 0-23.44 10.67-23.44 23.95 0 13.28 10.33 23.95 23.44 23.95 8.57 0 13.53-3.44 16.64-6.55 2.52-2.52 4.12-6.13 4.79-11.01H35.29z"/>
        </svg>

        {/* Chrome Pill Search Form */}
        <form className="chrome-ntp-search-form" onSubmit={handleSearch}>
          <div className="chrome-ntp-search-box">
            <svg className="chrome-ntp-search-icon" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              className="chrome-ntp-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google or type a URL"
              autoFocus
            />
            <button type="button" className="chrome-ntp-mic-btn" title="Search by voice" onClick={triggerVoice}>
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path fill="#34A853" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          </div>
        </form>

        {/* Circular Shortcut Grid */}
        <div className="chrome-ntp-shortcut-grid">
          {DEFAULT_SHORTCUTS.map((sc, i) => (
            <div key={i} className="chrome-ntp-tile" onClick={() => onNavigate(sc.url)}>
              <div className="chrome-ntp-circle">
                <span>{sc.icon}</span>
              </div>
              <span className="chrome-ntp-label">{sc.name}</span>
            </div>
          ))}

          {/* Add Shortcut Tile */}
          <div
            className="chrome-ntp-tile"
            onClick={() => {
              const url = prompt('Enter shortcut URL:');
              if (url) onNavigate(url);
            }}
          >
            <div className="chrome-ntp-circle chrome-ntp-circle--add">
              <span>+</span>
            </div>
            <span className="chrome-ntp-label">Add shortcut</span>
          </div>
        </div>
      </div>

      {/* Floating Customize Chrome Button */}
      <button className="chrome-customize-btn" onClick={() => alert('Customize Chrome Appearance')}>
        ✏️ Customize Chrome
      </button>
    </div>
  );
};

export default ChromeNewTabPage;
