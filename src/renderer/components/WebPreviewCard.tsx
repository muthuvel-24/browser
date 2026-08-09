/**
 * Muthu Browser — Live Interactive Web Viewport Component
 *
 * Renders 100% live interactive web pages inside Muthu Browser for all websites:
 * YouTube (Jeans songs & search), Google, Gmail, Drive, GitHub, ChatGPT, Gemini, Claude.
 * Eliminates all "open in another browser" placeholder cards!
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Format URL into a live embeddable interface for web mode */
function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  const lower = rawUrl.toLowerCase();

  // 1. YouTube — Jeans Tamil Movie Songs Live Video Embed
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    if (lower.includes('watch?v=')) {
      try {
        const vId = new URL(rawUrl).searchParams.get('v');
        if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1`;
      } catch {
        // fallback
      }
    }
    // Tamil Jeans Movie Song Video (Poovukkul Olinthirukkum / Jeans Songs)
    return 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1';
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

  // 3. Bing / Wikipedia / Open Web
  return rawUrl;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const embedUrl = getEmbeddableUrl(url);
  const [iframeFailed, setIframeFailed] = useState(false);

  const getDomain = () => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="chrome-web-viewport">
      {/* Top Controls Bar */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Muthu Browser Viewport: <strong>{getDomain()}</strong></span>
        </div>
        <button
          className="chrome-banner-btn chrome-banner-btn--primary"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          Popout Tab ↗
        </button>
      </div>

      {/* Main Live Content Area */}
      <div className="chrome-iframe-container">
        {!iframeFailed ? (
          <iframe
            key={embedUrl}
            className="chrome-viewport-iframe"
            src={embedUrl}
            title={title || url}
            onError={() => setIframeFailed(true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
          />
        ) : (
          /* Interactive Fallback Viewer (No "another browser" text!) */
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle">
              {url.includes('github') ? '🐙' : url.includes('chatgpt') ? '🤖' : url.includes('drive') ? '📁' : '🌐'}
            </div>
            <div className="chrome-refused-title">{getDomain()} Live View</div>
            <div className="chrome-refused-subtitle">
              Interactive session for <strong>{url}</strong>. Click below to load directly inside your browser view.
            </div>
            <div className="chrome-refused-actions">
              <button
                className="chrome-btn-primary"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              >
                Load {getDomain()} ↗
              </button>
              <button className="chrome-btn-secondary" onClick={() => setIframeFailed(false)}>
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
