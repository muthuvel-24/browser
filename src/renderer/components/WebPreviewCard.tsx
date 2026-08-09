/**
 * Muthu Browser — Web Viewport & Web Launcher Component
 *
 * Provides instant direct embedding for open web pages & Google Search (igu=1)
 * and clean Chrome Web Portal cards for anti-bot / login sites (ChatGPT, Gmail, GitHub).
 */

import React from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Check if a domain requires direct window launching due to Cloudflare/Anti-Bot policies */
function isPortalDomain(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return [
      'chatgpt.com',
      'claude.ai',
      'mail.google.com',
      'accounts.google.com',
      'github.com',
      'twitter.com',
      'x.com',
    ].some((d) => host.includes(d));
  } catch {
    return false;
  }
}

/** Format URL for direct clean embedding without 3rd party proxy limits */
function getEmbedUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  // Google Search official iframe-enabled parameter
  if (rawUrl.includes('google.com/search')) {
    if (!rawUrl.includes('igu=1')) {
      return rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return rawUrl;
  }

  return rawUrl;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isPortal = isPortalDomain(url);
  const embedUrl = getEmbedUrl(url);

  const openDirect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="chrome-web-viewport">
      {/* Top Banner */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span className="live-dot">●</span>
          <span>Web Viewport: <strong>{new URL(url).hostname}</strong></span>
        </div>
        <button className="chrome-banner-btn chrome-banner-btn--primary" onClick={openDirect}>
          Open Direct Window ↗
        </button>
      </div>

      <div className="chrome-iframe-container">
        {!isPortal ? (
          <iframe
            key={embedUrl}
            className="chrome-viewport-iframe"
            src={embedUrl}
            title={title || url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="chrome-refused-card">
            {/* Brand Logo Avatar */}
            <div className="chrome-portal-logo-circle">
              {url.includes('chatgpt') ? '🤖' : url.includes('gmail') || url.includes('mail.google') ? '✉️' : url.includes('github') ? '🐙' : '🌐'}
            </div>

            <div className="chrome-refused-title">
              {new URL(url).hostname} Web Portal
            </div>

            <div className="chrome-refused-subtitle">
              Security-protected application (<strong>{new URL(url).hostname}</strong>).
              Click below to launch directly in a full-screen window or use the Electron Desktop App.
            </div>

            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" onClick={openDirect}>
                Launch {new URL(url).hostname} ↗
              </button>
              <button className="chrome-btn-secondary" onClick={() => window.location.reload()}>
                Refresh View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
