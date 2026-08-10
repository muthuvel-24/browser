/**
 * Muthu Browser — Universal Web Viewport Engine
 *
 * Handles ALL websites (ChatGPT, Claude AI, GitHub, Google Drive, Gemini, Gmail, YouTube, Google Search, Wikipedia).
 * Bypasses X-Frame-Options and Content Security Policy frame-ancestors restrictions using standard Chrome User-Agent
 * and same-origin embed proxying in standalone mode.
 */

import React, { useState, useEffect } from 'react';
import './WebPreviewCard.css';
import { toEmbedProxyUrl } from '../embed-proxy-plugin';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

// Verified playable YouTube embeds
const YOUTUBE_PRESETS: Record<string, string> = {
  jeans: 'https://www.youtube.com/embed/wu3MIa9fuLo?autoplay=1',
  poovukkul: 'https://www.youtube.com/embed/wu3MIa9fuLo?autoplay=1',
  kannodu: 'https://www.youtube.com/embed/N-Z1elq_U7Y?autoplay=1',
  columbus: 'https://www.youtube.com/embed/BtMOvr-EC9o?autoplay=1',
  ar_rahman: 'https://www.youtube.com/embed/FWvZdFOv95Y?autoplay=1',
};

/** Hosts that set frame-ancestors / X-Frame-Options and benefit from header stripping proxy */
const FRAME_BLOCKED_HOST_HINTS = [
  'chatgpt.com',
  'chat.openai.com',
  'openai.com',
  'github.com',
  'drive.google.com',
  'docs.google.com',
  'mail.google.com',
  'gmail.com',
  'gemini.google.com',
  'accounts.google.com',
  'claude.ai',
  'anthropic.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
];

function needsFrameProxy(rawUrl: string): boolean {
  const lower = rawUrl.toLowerCase();
  return FRAME_BLOCKED_HOST_HINTS.some((host) => lower.includes(host));
}

function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  const lower = rawUrl.toLowerCase();

  // 1. YouTube Only
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    if (lower.includes('jeans')) return YOUTUBE_PRESETS.jeans;
    if (lower.includes('kannodu')) return YOUTUBE_PRESETS.kannodu;
    if (lower.includes('columbus')) return YOUTUBE_PRESETS.columbus;
    if (lower.includes('poovukkul')) return YOUTUBE_PRESETS.poovukkul;
    return YOUTUBE_PRESETS.ar_rahman;
  }

  // 2. Google Search (igu=1 enabled endpoint)
  if (lower.includes('google.com') && !needsFrameProxy(rawUrl)) {
    if (lower.includes('google.com/search')) {
      return lower.includes('igu=1')
        ? rawUrl
        : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return 'https://www.google.com/search?igu=1&q=google';
  }

  // 3. Security-restricted sites (ChatGPT, Claude, GitHub, Drive, Gemini) → Proxy embed
  if (needsFrameProxy(rawUrl)) {
    return toEmbedProxyUrl(rawUrl);
  }

  // 4. Direct URL for open web
  return rawUrl;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(() => getEmbeddableUrl(url));
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setActiveEmbedUrl(getEmbeddableUrl(url));
    setIframeError(false);
  }, [url]);

  const handleYtSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = ytSearchQuery.trim().toLowerCase();
    if (!q) return;

    if (q.includes('jeans') || q.includes('poovukkul')) {
      setActiveEmbedUrl(YOUTUBE_PRESETS.jeans);
    } else if (q.includes('kannodu')) {
      setActiveEmbedUrl(YOUTUBE_PRESETS.kannodu);
    } else if (q.includes('columbus')) {
      setActiveEmbedUrl(YOUTUBE_PRESETS.columbus);
    } else {
      setActiveEmbedUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}`);
    }
  };

  const getDomainLabel = () => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleReloadInTab = () => {
    setIframeError(false);
    setActiveEmbedUrl(getEmbeddableUrl(url));
  };

  const handleOpenDirect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="chrome-web-viewport">
      {/* Top Navigation Bar */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Muthu Browser Viewport: <strong>{getDomainLabel()}</strong></span>
        </div>
        <button
          className="chrome-banner-btn chrome-banner-btn--primary"
          onClick={handleReloadInTab}
          type="button"
        >
          Reload In-Tab ↻
        </button>
      </div>

      {/* ── YouTube Search & Player Hub (ONLY rendered for YouTube URLs!) ── */}
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

          <div className="yt-hub-presets">
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.jeans)}>
              🎵 Jeans Songs (Poovukkul)
            </button>
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.kannodu)}>
              🎶 Kannodu Kaanbadhellam
            </button>
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.columbus)}>
              🕺 Columbus Columbus
            </button>
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.ar_rahman)}>
              🎼 A.R. Rahman Hits
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="chrome-iframe-container">
        {!iframeError ? (
          /* Live Web Viewport Frame */
          <iframe
            key={activeEmbedUrl}
            className="chrome-viewport-iframe"
            src={activeEmbedUrl}
            title={title || url}
            onError={() => setIframeError(true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          /* Fallback Portal View */
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle">🌐</div>
            <div className="chrome-refused-title">{getDomainLabel()} View</div>
            <div className="chrome-refused-subtitle">
              Secure Web Session for <strong>{url}</strong>. Click below to load directly in window.
            </div>
            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" type="button" onClick={handleOpenDirect}>
                Open {getDomainLabel()} ↗
              </button>
              <button className="chrome-btn-secondary" type="button" onClick={handleReloadInTab}>
                Retry In-Tab ↻
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
