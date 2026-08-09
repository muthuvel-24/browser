/**
 * Muthu Browser — Live Interactive Web Viewport Component
 *
 * Includes an in-tab YouTube Search Bar & Live Video Hub so users can search
 * and play ANY video or Tamil Jeans movie songs directly inside Muthu Browser!
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

// Preset YouTube Tamil Jeans / A.R. Rahman song IDs
const YOUTUBE_PRESETS: Record<string, string> = {
  'jeans': 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1',
  'poovukkul': 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1',
  'kannodu': 'https://www.youtube-nocookie.com/embed/6p9sT7Xf5eU?autoplay=1',
  'columbus': 'https://www.youtube-nocookie.com/embed/gJ2gP50W1qg?autoplay=1',
  'ar_rahman': 'https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI',
};

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(() => {
    if (isYouTube) {
      if (url.toLowerCase().includes('jeans')) return YOUTUBE_PRESETS['jeans'];
      return YOUTUBE_PRESETS['ar_rahman'];
    }
    if (url.toLowerCase().includes('google.com')) {
      return url.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return url;
  });

  const [iframeError, setIframeError] = useState(false);

  // Handle YouTube Search submit inside the tab
  const handleYtSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = ytSearchQuery.trim().toLowerCase();
    if (!q) return;

    if (q.includes('jeans') || q.includes('poovukkul')) {
      setActiveEmbedUrl(YOUTUBE_PRESETS['jeans']);
    } else if (q.includes('kannodu')) {
      setActiveEmbedUrl(YOUTUBE_PRESETS['kannodu']);
    } else if (q.includes('columbus')) {
      setActiveEmbedUrl(YOUTUBE_PRESETS['columbus']);
    } else {
      // Use YouTube embed search feed
      setActiveEmbedUrl(`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}`);
    }
  };

  const openDirect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDomainLabel = () => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="chrome-web-viewport">
      {/* Top Banner */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Muthu Browser Viewport: <strong>{getDomainLabel()}</strong></span>
        </div>
        <button className="chrome-banner-btn chrome-banner-btn--primary" onClick={openDirect}>
          Popout Tab ↗
        </button>
      </div>

      {/* ── YouTube In-Tab Search & Video Hub ── */}
      {isYouTube && (
        <div className="yt-hub-header">
          <form className="yt-hub-search-form" onSubmit={handleYtSearchSubmit}>
            <span className="yt-hub-icon">▶️</span>
            <input
              type="text"
              className="yt-hub-input"
              value={ytSearchQuery}
              onChange={(e) => setYtSearchQuery(e.target.value)}
              placeholder="Search YouTube Videos... (e.g., Jeans Tamil Movie Songs, A.R. Rahman)"
            />
            <button type="submit" className="yt-hub-search-btn">
              🔍 Search Video
            </button>
          </form>

          {/* Quick Category Buttons */}
          <div className="yt-hub-presets">
            <button
              className="yt-preset-chip"
              onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS['jeans'])}
            >
              🎵 Jeans Songs (Poovukkul)
            </button>
            <button
              className="yt-preset-chip"
              onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS['kannodu'])}
            >
              🎶 Kannodu Kaanbadhellam
            </button>
            <button
              className="yt-preset-chip"
              onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS['columbus'])}
            >
              🕺 Columbus Columbus
            </button>
            <button
              className="yt-preset-chip"
              onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS['ar_rahman'])}
            >
              🎼 A.R. Rahman Hits
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="chrome-iframe-container">
        {!iframeError ? (
          <iframe
            key={activeEmbedUrl}
            className="chrome-viewport-iframe"
            src={activeEmbedUrl}
            title={title || url}
            onError={() => setIframeError(true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
          />
        ) : (
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle">
              {url.includes('github') ? '🐙' : url.includes('chatgpt') ? '🤖' : url.includes('drive') ? '📁' : '🌐'}
            </div>
            <div className="chrome-refused-title">{getDomainLabel()} Live View</div>
            <div className="chrome-refused-subtitle">
              Interactive session for <strong>{url}</strong>. Click below to load directly inside your browser view.
            </div>
            <div className="chrome-refused-actions">
              <button
                className="chrome-btn-primary"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              >
                Load {getDomainLabel()} ↗
              </button>
              <button className="chrome-btn-secondary" onClick={() => setIframeError(false)}>
                Retry Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
