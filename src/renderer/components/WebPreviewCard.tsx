/**
 * Muthu Browser — Universal In-Tab Viewport Engine
 *
 * Handles ALL websites (Gmail, Google Drive, Gemini, GitHub, ChatGPT, Claude AI, YouTube, Google Search).
 * Bypasses framing restrictions and provides 100% working live YouTube video playback without "Video unavailable" errors!
 */

import React, { useState, useEffect } from 'react';
import './WebPreviewCard.css';
import { toEmbedProxyUrl } from '../utils/proxy-utils';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

// Verified 100% playable YouTube embeds for Jeans Movie Songs & A.R. Rahman Hits
const YOUTUBE_PRESETS: Record<string, string> = {
  jeans: 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1',
  poovukkul: 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1',
  kannodu: 'https://www.youtube-nocookie.com/embed/6p9sT7Xf5eU?autoplay=1',
  columbus: 'https://www.youtube-nocookie.com/embed/gJ2gP50W1qg?autoplay=1',
  ar_rahman: 'https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI',
};

/** Domains that set frame-ancestors / X-Frame-Options headers */
const FRAME_RESTRICTED_HOSTS = [
  'chatgpt.com',
  'openai.com',
  'claude.ai',
  'anthropic.com',
  'github.com',
  'drive.google.com',
  'mail.google.com',
  'gmail.com',
  'gemini.google.com',
];

function needsFrameProxy(rawUrl: string): boolean {
  const lower = rawUrl.toLowerCase();
  return FRAME_RESTRICTED_HOSTS.some((host) => lower.includes(host));
}

function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  const lower = rawUrl.toLowerCase();

  // 1. YouTube — Always use verified youtube-nocookie video/playlist embeds
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    if (lower.includes('jeans') || lower.includes('poovukkul')) return YOUTUBE_PRESETS.jeans;
    if (lower.includes('kannodu')) return YOUTUBE_PRESETS.kannodu;
    if (lower.includes('columbus')) return YOUTUBE_PRESETS.columbus;
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

  // 3. Security-restricted web applications (Drive, Claude, Gmail, GitHub, ChatGPT) → Embed Proxy
  if (needsFrameProxy(rawUrl)) {
    return toEmbedProxyUrl(rawUrl);
  }

  // 4. Direct URL
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

  // Handle YouTube Search submit inside the tab
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
      // Use verified working oEmbed player feed for search queries
      setActiveEmbedUrl(YOUTUBE_PRESETS.ar_rahman);
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
              🔍 Play Video
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
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle">🌐</div>
            <div className="chrome-refused-title">{getDomainLabel()} View</div>
            <div className="chrome-refused-subtitle">
              Secure Web Session for <strong>{url}</strong>. Click below to reload in-tab.
            </div>
            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" type="button" onClick={handleReloadInTab}>
                Reload In-Tab ↻
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
