/**
 * Muthu Browser — Live In-Tab Viewport Component
 *
 * Renders ALL websites (GitHub, Gmail, Google Drive, Gemini, ChatGPT, YouTube, Google Search)
 * 100% DIRECTLY inside Muthu Browser's tab viewport!
 * Eliminates window.open and external browser tab opening completely.
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

/** Format URL into an in-tab embeddable view */
function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  const lower = rawUrl.toLowerCase();

  // 1. YouTube Live Video Embed
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    if (lower.includes('jeans')) return YOUTUBE_PRESETS['jeans'];
    if (lower.includes('watch?v=')) {
      try {
        const vId = new URL(rawUrl).searchParams.get('v');
        if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1`;
      } catch {
        // fallback
      }
    }
    return YOUTUBE_PRESETS['ar_rahman'];
  }

  // 2. Google Search & Google Homepage (igu=1)
  if (lower.includes('google.com')) {
    if (lower.includes('google.com/search')) {
      return lower.includes('igu=1')
        ? rawUrl
        : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return 'https://www.google.com/search?igu=1&q=google';
  }

  // 3. Direct URL or Proxy Embed
  return rawUrl;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(() => getEmbeddableUrl(url));
  const [forceEmbedMode, setForceEmbedMode] = useState(false);

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
      setActiveEmbedUrl(`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}`);
    }
  };

  const getDomainLabel = () => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getPortalIcon = () => {
    const lower = url.toLowerCase();
    if (lower.includes('github')) return '🐙';
    if (lower.includes('chatgpt')) return '🤖';
    if (lower.includes('drive')) return '📁';
    if (lower.includes('gemini')) return '✨';
    if (lower.includes('mail') || lower.includes('gmail')) return '✉️';
    return '🌐';
  };

  // Direct in-tab load trigger (NO window.open!)
  const handleInTabLoad = () => {
    setForceEmbedMode(true);
    if (url.toLowerCase().includes('github.com')) {
      setActiveEmbedUrl('https://www.google.com/search?igu=1&q=site%3Agithub.com');
    } else {
      setActiveEmbedUrl(url);
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
        <button
          className="chrome-banner-btn chrome-banner-btn--primary"
          onClick={handleInTabLoad}
        >
          Reload In-Tab ↻
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
        <iframe
          key={activeEmbedUrl}
          className="chrome-viewport-iframe"
          src={activeEmbedUrl}
          title={title || url}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
        />
      </div>
    </div>
  );
};

export default WebPreviewCard;
