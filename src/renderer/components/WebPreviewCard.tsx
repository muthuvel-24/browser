/**
 * Muthu Browser — Web Viewport & Security Policy Fallback Card
 *
 * Automatically detects X-Frame-Options embedding restrictions on major websites
 * (GitHub, Gmail, Google) in web mode and provides an instant direct launch card + fallback.
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

// Major sites known to send X-Frame-Options: DENY / SAMEORIGIN
const EMBED_RESTRICTED_DOMAINS = [
  'github.com',
  'mail.google.com',
  'accounts.google.com',
  'youtube.com',
  'claude.ai',
  'chatgpt.com',
  'twitter.com',
  'x.com',
  'facebook.com',
];

function isRestricted(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return EMBED_RESTRICTED_DOMAINS.some((d) => host.includes(d));
  } catch {
    return false;
  }
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const restricted = isRestricted(url);
  const [iframeError, setIframeError] = useState(restricted);

  const openDirect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="chrome-web-viewport">
      {/* Security Notification Banner */}
      <div className="chrome-iframe-banner">
        <div className="chrome-banner-text">
          <span>🔒 Web Preview Mode:</span>
          <span>Security policies (X-Frame-Options) prevent embedding security-sensitive sites in iframe.</span>
        </div>
        <button className="chrome-banner-btn" onClick={openDirect}>
          Open Direct Link ↗
        </button>
      </div>

      <div className="chrome-iframe-container">
        {!iframeError ? (
          <iframe
            key={url}
            className="chrome-viewport-iframe"
            src={url}
            title={title || url}
            onError={() => setIframeError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="chrome-refused-card">
            {/* Sad Tab Icon */}
            <svg className="chrome-sad-tab-icon" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="#303134" />
              <path d="M20 28H28M36 28H44" stroke="#9AA0A6" strokeWidth="3" strokeLinecap="round" />
              <path d="M24 44C28 40 36 40 40 44" stroke="#9AA0A6" strokeWidth="3" strokeLinecap="round" />
            </svg>

            <div className="chrome-refused-title">
              {new URL(url).hostname} refused to connect
            </div>

            <div className="chrome-refused-subtitle">
              Standard web browsers enforce <code>X-Frame-Options: SAMEORIGIN</code> to protect your security.
              To browse unrestricted, launch the native <strong>Electron Desktop App</strong> or open the site directly.
            </div>

            <div className="chrome-refused-actions">
              <button className="chrome-btn-primary" onClick={openDirect}>
                Open {new URL(url).hostname} Direct ↗
              </button>
              <button className="chrome-btn-secondary" onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreviewCard;
