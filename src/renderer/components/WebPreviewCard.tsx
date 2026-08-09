/**
 * Muthu Browser — Web Viewport & Web Launcher Component
 *
 * Prevents W3C X-Frame-Options refused to connect errors and 403 iframe blocks
 * for Google, Google Drive, Gemini, Gmail, YouTube, GitHub, ChatGPT.
 */

import React from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Check if a domain requires direct window launching in web preview mode */
function isPortalDomain(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return [
      'google.com',
      'www.google.com',
      'drive.google.com',
      'mail.google.com',
      'accounts.google.com',
      'gemini.google.com',
      'youtube.com',
      'www.youtube.com',
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

/** Format URL for clean embedding when possible */
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
    if (lower.includes('youtube')) return '▶️';
    if (lower.includes('mail') || lower.includes('gmail')) return '✉️';
    if (lower.includes('google')) return '🌐';
    if (lower.includes('chatgpt')) return '🤖';
    if (lower.includes('github')) return '🐙';
    return '🚀';
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
        {!isPortal ? (
          <iframe
            key={embedUrl}
            className="chrome-viewport-iframe"
            src={embedUrl}
            title={title || url}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
          />
        ) : (
          <div className="chrome-refused-card">
            {/* Brand Logo Avatar */}
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
