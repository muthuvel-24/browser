/**
 * Muthu Browser — Web Viewport & Unrestricted Web Engine Component
 *
 * Automatically bypasses X-Frame-Options embedding restrictions on major websites
 * (GitHub, Gmail, Google, YouTube) so that EVERY site loads LIVE inside http://localhost:5174!
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Generate a clean iframe URL that strips X-Frame-Options headers */
function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  // Google Search official iframe-enabled parameter
  if (rawUrl.includes('google.com/search')) {
    if (!rawUrl.includes('igu=1')) {
      return rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return rawUrl;
  }

  // If already proxied, return directly
  if (rawUrl.includes('corsproxy.io')) return rawUrl;

  // Use CORS / X-Frame-Options proxy to embed any website live (GitHub, Gmail, YouTube, Amazon)
  return `https://corsproxy.io/?url=${encodeURIComponent(rawUrl)}`;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const embedUrl = getEmbeddableUrl(url);
  const [useFallback, setUseFallback] = useState(false);

  const openDirect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="chrome-web-viewport">
      {/* Top Controls Bar */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Live Web Mode: <strong>{new URL(url).hostname}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="chrome-banner-btn" onClick={() => setUseFallback((prev) => !prev)}>
            {useFallback ? 'Try Embed Mode' : 'Direct Embed'}
          </button>
          <button className="chrome-banner-btn chrome-banner-btn--primary" onClick={openDirect}>
            Open New Tab ↗
          </button>
        </div>
      </div>

      <div className="chrome-iframe-container">
        {!useFallback ? (
          <iframe
            key={embedUrl}
            className="chrome-viewport-iframe"
            src={embedUrl}
            title={title || url}
            onError={() => setUseFallback(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="chrome-refused-card">
            <svg className="chrome-sad-tab-icon" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="#303134" />
              <path d="M20 28H28M36 28H44" stroke="#8AB4F8" strokeWidth="3" strokeLinecap="round" />
              <path d="M24 40C28 44 36 44 40 40" stroke="#8AB4F8" strokeWidth="3" strokeLinecap="round" />
            </svg>

            <div className="chrome-refused-title">
              {new URL(url).hostname} Live Portal
            </div>

            <div className="chrome-refused-subtitle">
              Click below to launch <strong>{url}</strong> directly in a new window or switch embed modes.
            </div>

            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" onClick={openDirect}>
                Launch {new URL(url).hostname} ↗
              </button>
              <button className="chrome-btn-secondary" onClick={() => setUseFallback(false)}>
                Reload Embed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
