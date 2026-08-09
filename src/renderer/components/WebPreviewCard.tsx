/**
 * Muthu Browser — Smart Web Viewport Engine Component
 *
 * Implements clean multi-strategy viewport rendering:
 * 1. Google Search & Queries: Uses Google's official iframe-enabled endpoint (`igu=1`)
 * 2. YouTube & Video Media: Transforms YouTube URLs into official embed player (`youtube-nocookie.com/embed/...`)
 * 3. Open Web Sites (Wikipedia, Bing, Docs): Direct clean iframe rendering
 * 4. Security-Protected Login Apps (Gmail, ChatGPT, GitHub): Sleek Chrome Dark Mode Launcher Card
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Check if a URL is a YouTube video or search */
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

    // Default YouTube Home / Trending Embed Feed
    return 'https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI';
  } catch {
    return null;
  }
}

/** Determine the ideal embed URL for web preview mode */
function getSmartEmbedUrl(rawUrl: string): { embedUrl: string; isPortal: boolean } {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') {
    return { embedUrl: 'speeddial', isPortal: false };
  }

  // 1. YouTube Video / Channel Embed
  const ytEmbed = getYouTubeEmbedUrl(rawUrl);
  if (ytEmbed) {
    return { embedUrl: ytEmbed, isPortal: false };
  }

  // 2. Google Search official iframe-enabled parameter
  if (rawUrl.includes('google.com/search')) {
    const iguUrl = rawUrl.includes('igu=1')
      ? rawUrl
      : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    return { embedUrl: iguUrl, isPortal: false };
  }

  // 3. Security-Protected Login Apps requiring direct launcher
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    const isProtected = [
      'chatgpt.com',
      'claude.ai',
      'mail.google.com',
      'accounts.google.com',
      'github.com',
      'twitter.com',
      'x.com',
    ].some((d) => host.includes(d));

    if (isProtected) {
      return { embedUrl: rawUrl, isPortal: true };
    }
  } catch {
    // ignore parse error
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
              {url.includes('chatgpt')
                ? '🤖'
                : url.includes('gmail') || url.includes('mail.google')
                ? '✉️'
                : url.includes('github')
                ? '🐙'
                : url.includes('youtube')
                ? '▶️'
                : '🌐'}
            </div>

            <div className="chrome-refused-title">
              {getDomainLabel()} Web Application
            </div>

            <div className="chrome-refused-subtitle">
              This security-protected application (<strong>{getDomainLabel()}</strong>) requires direct tab authorization.
              Click below to launch in a full window or use the native <strong>Electron Desktop App</strong>.
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
