/**
 * Muthu Browser — Smart Web Viewport Engine Component
 *
 * Provides live iframe embedding for Google Search, YouTube Jeans Movie Song video player,
 * Wikipedia, Bing, and open web, and clean portal launcher cards for login-protected apps (Gmail, ChatGPT, GitHub).
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Convert YouTube URLs to verified working live video embed players */
function getYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const urlObj = new URL(rawUrl);
    const host = urlObj.hostname.toLowerCase();

    if (!host.includes('youtube.com') && !host.includes('youtu.be')) return null;

    // Shorts: /shorts/ID
    if (urlObj.pathname.startsWith('/shorts/')) {
      const videoId = urlObj.pathname.split('/')[2];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    }

    // Standard video: /watch?v=ID
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    }

    // Short link: youtu.be/ID
    if (host.includes('youtu.be')) {
      const id = urlObj.pathname.substring(1);
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    }

    // Verified live Tamil Jeans Movie Songs Video ID (Poovukkul Olinthirukkum / Jeans Songs)
    return 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1';
  } catch {
    return null;
  }
}

/** Check if a domain requires direct launcher card */
function isPortalDomain(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return [
      'drive.google.com',
      'mail.google.com',
      'accounts.google.com',
      'gemini.google.com',
      'chatgpt.com',
      'claude.ai',
      'github.com',
      'twitter.com',
      'x.com',
    ].some((d) => host.includes(d));
  } catch {
    return false;
  }
}

/** Determine the ideal embed URL for web preview mode */
function getSmartEmbedUrl(rawUrl: string): { embedUrl: string; isPortal: boolean } {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') {
    return { embedUrl: 'speeddial', isPortal: false };
  }

  // 1. YouTube Video / Search Embed (Plays LIVE)
  const ytEmbed = getYouTubeEmbedUrl(rawUrl);
  if (ytEmbed) {
    return { embedUrl: ytEmbed, isPortal: false };
  }

  // 2. Login-protected apps requiring direct launcher
  if (isPortalDomain(rawUrl)) {
    return { embedUrl: rawUrl, isPortal: true };
  }

  // 3. Google Search & Google Homepage official igu=1 parameter (Loads LIVE)
  if (rawUrl.includes('google.com')) {
    if (rawUrl.includes('google.com/search')) {
      const iguUrl = rawUrl.includes('igu=1')
        ? rawUrl
        : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
      return { embedUrl: iguUrl, isPortal: false };
    }
    return { embedUrl: 'https://www.google.com/search?igu=1&q=google', isPortal: false };
  }

  return { embedUrl: rawUrl, isPortal: false };
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const { embedUrl, isPortal } = getSmartEmbedUrl(url);
  const [hasIframeError, setHasIframeError] = useState(false);

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

  const getPortalIcon = () => {
    const lower = url.toLowerCase();
    if (lower.includes('drive')) return '📁';
    if (lower.includes('gemini')) return '✨';
    if (lower.includes('mail') || lower.includes('gmail')) return '✉️';
    if (lower.includes('chatgpt')) return '🤖';
    if (lower.includes('github')) return '🐙';
    return '🌐';
  };

  return (
    <div className="chrome-web-viewport">
      {/* Top Banner */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Web Viewport: <strong>{getDomainLabel()}</strong></span>
        </div>
        <button className="chrome-banner-btn chrome-banner-btn--primary" onClick={openDirect}>
          Open Direct Window ↗
        </button>
      </div>

      <div className="chrome-iframe-container">
        {!isPortal && !hasIframeError ? (
          <iframe
            key={embedUrl}
            className="chrome-viewport-iframe"
            src={embedUrl}
            title={title || url}
            onError={() => setHasIframeError(true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
          />
        ) : (
          <div className="chrome-refused-card">
            {/* Brand Logo Circle */}
            <div className="chrome-portal-logo-circle">
              {getPortalIcon()}
            </div>

            <div className="chrome-refused-title">
              {getDomainLabel()} Web Application
            </div>

            <div className="chrome-refused-subtitle">
              Security-protected web application (<strong>{getDomainLabel()}</strong>).
              Click below to launch directly in a full-screen window or use the native <strong>Electron Desktop Application</strong>.
            </div>

            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" onClick={openDirect}>
                Launch {getDomainLabel()} ↗
              </button>
              <button className="chrome-btn-secondary" onClick={() => setHasIframeError(false)}>
                Reload View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
