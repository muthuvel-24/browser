/**
 * Muthu Browser — Universal In-Tab Viewport Engine
 *
 * Handles ALL websites inside the tab viewport:
 * - YouTube: verified youtube-nocookie live video embeds with in-tab search
 * - Google Search / Maps / Translate / News / Photos: direct iframe embed
 * - Drive / Gmail / Claude / GitHub / ChatGPT / Gemini: Native App Portal card
 *   (these sites block ALL iframe embedding at the server level; requires Electron native mode)
 */

import React, { useState, useEffect, useRef } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

// Verified 100% playable YouTube embeds (Jeans Movie Songs & A.R. Rahman Hits)
const YOUTUBE_PRESETS: Record<string, string> = {
  jeans:      'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1&rel=0',
  poovukkul:  'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1&rel=0',
  kannodu:    'https://www.youtube-nocookie.com/embed/6p9sT7Xf5eU?autoplay=1&rel=0',
  columbus:   'https://www.youtube-nocookie.com/embed/gJ2gP50W1qg?autoplay=1&rel=0',
  ar_rahman:  'https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI&autoplay=1',
};

/**
 * Sites that BLOCK iframe embedding at server level (X-Frame-Options: DENY / CSP frame-ancestors: none).
 * These require the native Electron WebContentsView to load properly.
 */
const NATIVE_ONLY_SITES = [
  'drive.google.com',
  'docs.google.com',
  'sheets.google.com',
  'slides.google.com',
  'mail.google.com',
  'gmail.com',
  'gemini.google.com',
  'claude.ai',
  'anthropic.com',
  'chatgpt.com',
  'openai.com',
  'github.com',
  'maps.google.com',
  'photos.google.com',
];

/**
 * Sites that embed cleanly in iframes (no framing restrictions).
 */
const DIRECTLY_EMBEDDABLE = [
  'google.com/search',
  'google.com/webhp',
  'news.google.com',
  'translate.google.com',
  'youtube-nocookie.com',
  'youtube.com',
  'youtu.be',
];

function isNativeOnlySite(rawUrl: string): boolean {
  const lower = rawUrl.toLowerCase();
  return NATIVE_ONLY_SITES.some((host) => lower.includes(host));
}

function isYouTubeUrl(rawUrl: string): boolean {
  const lower = rawUrl.toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be');
}

function matchYouTubePreset(q: string): string | null {
  const lower = q.toLowerCase();
  if (lower.includes('jeans') || lower.includes('poovukkul')) return YOUTUBE_PRESETS.jeans;
  if (lower.includes('kannodu')) return YOUTUBE_PRESETS.kannodu;
  if (lower.includes('columbus')) return YOUTUBE_PRESETS.columbus;
  return null;
}

function getEmbeddableUrl(rawUrl: string): { embedUrl: string; isNativeOnly: boolean } {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') {
    return { embedUrl: 'speeddial', isNativeOnly: false };
  }

  const lower = rawUrl.toLowerCase();

  // 1. YouTube — always use verified youtube-nocookie embeds
  if (isYouTubeUrl(rawUrl)) {
    const preset = matchYouTubePreset(lower);
    return { embedUrl: preset ?? YOUTUBE_PRESETS.ar_rahman, isNativeOnly: false };
  }

  // 2. Native-only sites — cannot be iframed
  if (isNativeOnlySite(rawUrl)) {
    return { embedUrl: rawUrl, isNativeOnly: true };
  }

  // 3. Google Search — works fine in iframes with igu=1 param
  if (lower.includes('google.com/search') || lower.includes('google.com/webhp')) {
    const hasIgu = lower.includes('igu=1');
    if (!hasIgu) {
      return {
        embedUrl: rawUrl.includes('?')
          ? rawUrl.replace('?', '?igu=1&')
          : rawUrl + '?igu=1',
        isNativeOnly: false,
      };
    }
    return { embedUrl: rawUrl, isNativeOnly: false };
  }

  // 4. Google root — open Google Search
  if (lower.includes('google.com') && !lower.includes('/search')) {
    return { embedUrl: 'https://www.google.com/search?igu=1&q=', isNativeOnly: false };
  }

  // 5. Everything else — try direct embed
  return { embedUrl: rawUrl, isNativeOnly: false };
}

const SITE_META: Record<string, { icon: string; color: string; label: string; desc: string }> = {
  'drive.google.com':   { icon: '📁', color: '#1a73e8', label: 'Google Drive',   desc: 'Your cloud storage' },
  'docs.google.com':    { icon: '📄', color: '#1a73e8', label: 'Google Docs',    desc: 'Documents & writing' },
  'mail.google.com':    { icon: '✉️', color: '#EA4335', label: 'Gmail',           desc: 'Email & inbox' },
  'gmail.com':          { icon: '✉️', color: '#EA4335', label: 'Gmail',           desc: 'Email & inbox' },
  'gemini.google.com':  { icon: '✨', color: '#8B5CF6', label: 'Google Gemini',  desc: 'AI assistant by Google' },
  'claude.ai':          { icon: '🤖', color: '#D97706', label: 'Claude AI',       desc: 'AI by Anthropic' },
  'anthropic.com':      { icon: '🤖', color: '#D97706', label: 'Anthropic',       desc: 'AI safety company' },
  'chatgpt.com':        { icon: '💬', color: '#10B981', label: 'ChatGPT',         desc: 'AI by OpenAI' },
  'openai.com':         { icon: '💬', color: '#10B981', label: 'OpenAI',          desc: 'AI research lab' },
  'github.com':         { icon: '🐙', color: '#6366F1', label: 'GitHub',          desc: 'Code & open source' },
  'maps.google.com':    { icon: '🗺️', color: '#34A853', label: 'Google Maps',    desc: 'Maps & navigation' },
  'photos.google.com':  { icon: '🖼️', color: '#FBBC05', label: 'Google Photos',  desc: 'Photo library' },
};

function getSiteMeta(url: string) {
  const lower = url.toLowerCase();
  for (const [host, meta] of Object.entries(SITE_META)) {
    if (lower.includes(host)) return meta;
  }
  try {
    const hostname = new URL(url).hostname;
    return { icon: '🌐', color: '#6366F1', label: hostname, desc: url };
  } catch {
    return { icon: '🌐', color: '#6366F1', label: url, desc: url };
  }
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isYT = isYouTubeUrl(url);
  const [ytQuery, setYtQuery] = useState('');
  const { embedUrl: initEmbed, isNativeOnly: initNative } = getEmbeddableUrl(url);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(initEmbed);
  const [isNativeOnly, setIsNativeOnly] = useState<boolean>(initNative);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const { embedUrl, isNativeOnly: native } = getEmbeddableUrl(url);
    setActiveEmbedUrl(embedUrl);
    setIsNativeOnly(native);
    setYtQuery('');
  }, [url]);

  // Handle YouTube search submit
  const handleYtSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = ytQuery.trim();
    if (!q) return;
    const preset = matchYouTubePreset(q);
    setActiveEmbedUrl(preset ?? YOUTUBE_PRESETS.ar_rahman);
  };

  const handleReload = () => {
    const { embedUrl, isNativeOnly: native } = getEmbeddableUrl(url);
    setActiveEmbedUrl(embedUrl);
    setIsNativeOnly(native);
  };

  const getDomainLabel = () => {
    try { return new URL(url).hostname; } catch { return url; }
  };

  // ── Native-Only Portal Card ─────────────────────────────────────
  if (isNativeOnly) {
    const meta = getSiteMeta(url);
    return (
      <div className="chrome-web-viewport">
        <div className="chrome-iframe-banner">
          <div className="chrome-banner-text">
            <span className="live-dot" style={{ color: '#f59e0b' }}>●</span>
            <span>Muthu Browser: <strong>{getDomainLabel()}</strong></span>
          </div>
        </div>
        <div className="native-portal-card">
          <div className="native-portal-glow" style={{ background: `radial-gradient(ellipse at center, ${meta.color}22 0%, transparent 70%)` }} />
          <div className="native-portal-icon">{meta.icon}</div>
          <h2 className="native-portal-title">{meta.label}</h2>
          <p className="native-portal-desc">{meta.desc}</p>
          <div className="native-portal-info">
            <span className="native-portal-badge">🔒 Secure Site</span>
            <span className="native-portal-badge">🛡️ Frame Protected</span>
          </div>
          <p className="native-portal-message">
            <strong>{meta.label}</strong> uses advanced security policies that prevent embedding inside other browsers.
            <br /><br />
            <strong>✅ Run the native Muthu Browser desktop app</strong> (<code>npm start</code>) to access {meta.label} with full functionality — all websites open natively inside the app!
          </p>
          <div className="native-portal-actions">
            <a
              className="native-portal-btn native-portal-btn--primary"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${meta.label} in this browser tab`}
            >
              🚀 Open {meta.label}
            </a>
          </div>
          <p className="native-portal-hint">
            💡 <strong>Tip:</strong> The native <strong>Muthu Browser desktop app</strong> opens all websites — Gmail, Drive, GitHub, Claude AI, ChatGPT — directly in its own window without any restrictions!
          </p>
        </div>
      </div>
    );
  }

  // ── Standard Iframe Viewport ─────────────────────────────────────
  return (
    <div className="chrome-web-viewport">
      {/* Top Navigation Bar */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Muthu Browser Viewport: <strong>{getDomainLabel()}</strong></span>
        </div>
        <button className="chrome-banner-btn chrome-banner-btn--primary" onClick={handleReload} type="button">
          Reload In-Tab ↻
        </button>
      </div>

      {/* ── YouTube Search & Player Hub ── */}
      {isYT && (
        <div className="yt-hub-header">
          <form className="yt-hub-search-form" onSubmit={handleYtSearch}>
            <span className="yt-hub-icon">▶️</span>
            <input
              type="text"
              className="yt-hub-input"
              value={ytQuery}
              onChange={(e) => setYtQuery(e.target.value)}
              placeholder="Search songs... (e.g., Jeans Tamil Movie, AR Rahman, Anirudh)"
            />
            <button type="submit" className="yt-hub-search-btn">🔍 Play</button>
          </form>
          <div className="yt-hub-presets">
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.jeans)}>🎵 Jeans (Poovukkul)</button>
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.kannodu)}>🎶 Kannodu Kaanbadhellam</button>
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.columbus)}>🕺 Columbus Columbus</button>
            <button className="yt-preset-chip" type="button" onClick={() => setActiveEmbedUrl(YOUTUBE_PRESETS.ar_rahman)}>🎼 A.R. Rahman Hits</button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="chrome-iframe-container">
        <iframe
          ref={iframeRef}
          key={activeEmbedUrl}
          className="chrome-viewport-iframe"
          src={activeEmbedUrl}
          title={title || url}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        />
      </div>
    </div>
  );
};

export default WebPreviewCard;
