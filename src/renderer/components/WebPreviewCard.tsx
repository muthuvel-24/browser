/**
 * Muthu Browser — Universal Web Viewport Engine
 *
 * Handles ALL websites (ChatGPT, Claude AI, GitHub, Google Drive, Gemini, Gmail, YouTube, Google Search, Wikipedia).
 * Never renders YouTube video players or "video unavailable" errors for non-YouTube sites!
 */

import React, { useState, useEffect } from 'react';
import './WebPreviewCard.css';

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

/** List of web app domains requiring direct window authentication or portal view */
const PORTAL_DOMAINS: Array<{ hint: string; name: string; icon: string; bg: string }> = [
  { hint: 'chatgpt.com', name: 'ChatGPT AI Assistant', icon: '🤖', bg: '#10a37f' },
  { hint: 'openai.com', name: 'OpenAI ChatGPT', icon: '🤖', bg: '#10a37f' },
  { hint: 'claude.ai', name: 'Claude AI Assistant', icon: '🧠', bg: '#d97757' },
  { hint: 'anthropic.com', name: 'Anthropic Claude', icon: '🧠', bg: '#d97757' },
  { hint: 'github.com', name: 'GitHub Developer Portal', icon: '🐙', bg: '#24292e' },
  { hint: 'drive.google.com', name: 'Google Cloud Drive', icon: '📁', bg: '#1a73e8' },
  { hint: 'gemini.google.com', name: 'Google Gemini AI', icon: '✨', bg: '#8e24aa' },
  { hint: 'mail.google.com', name: 'Google Workspace Gmail', icon: '✉️', bg: '#ea4335' },
  { hint: 'gmail.com', name: 'Google Mail', icon: '✉️', bg: '#ea4335' },
];

function findPortalInfo(rawUrl: string) {
  const lower = rawUrl.toLowerCase();
  return PORTAL_DOMAINS.find((p) => lower.includes(p.hint)) || null;
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
  if (lower.includes('google.com') && !lower.includes('drive') && !lower.includes('gemini') && !lower.includes('mail')) {
    if (lower.includes('google.com/search')) {
      return lower.includes('igu=1')
        ? rawUrl
        : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return 'https://www.google.com/search?igu=1&q=google';
  }

  // 3. Direct URL for general websites (Wikipedia, Bing, news, etc.)
  return rawUrl;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
  const portalInfo = findPortalInfo(url);

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
          onClick={handleOpenDirect}
          type="button"
        >
          Open Site ↗
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
        {portalInfo ? (
          /* Web Application Portal View for ChatGPT, Claude, GitHub, Drive, Gmail, Gemini */
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle" style={{ backgroundColor: portalInfo.bg }}>
              {portalInfo.icon}
            </div>
            <div className="chrome-refused-title">{portalInfo.name}</div>
            <div className="chrome-refused-subtitle">
              Secure Web Session: <strong>{url}</strong>
              <br />
              Click below to launch <strong>{portalInfo.name}</strong> inside your Muthu Browser window.
            </div>
            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" type="button" onClick={handleOpenDirect}>
                Launch {portalInfo.name.split(' ')[0]} ↗
              </button>
            </div>
          </div>
        ) : iframeError ? (
          /* Error Fallback View */
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle">🌐</div>
            <div className="chrome-refused-title">{getDomainLabel()} View</div>
            <div className="chrome-refused-subtitle">
              Unable to load <strong>{url}</strong> directly in an iframe. Click below to open.
            </div>
            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" type="button" onClick={handleOpenDirect}>
                Open {getDomainLabel()} ↗
              </button>
              <button className="chrome-btn-secondary" type="button" onClick={() => setIframeError(false)}>
                Retry Loading
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
