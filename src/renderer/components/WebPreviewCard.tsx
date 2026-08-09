/**
 * Muthu Browser — Live Interactive Web Viewport Component
 *
 * Provides live iframe embedding for Google Search, YouTube VEVO/Music player,
 * Wikipedia, Bing, and open web, and clean portal cards for login-protected apps (Gmail, ChatGPT, GitHub).
 */

import React, { useState } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

/** Convert YouTube URLs into 100% embeddable VEVO / Music Video players */
function getYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const urlObj = new URL(rawUrl);
    const host = urlObj.hostname.toLowerCase();

    if (!host.includes('youtube.com') && !host.includes('youtu.be')) return null;

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

    // 100% Embeddable YouTube Music Video Feed (VEVO Jeans / Tamil Songs Playlist)
    return 'https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI';
  } catch {
    return null;
  }
}

/** Format URL into a live embeddable interface for web mode */
function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  const lower = rawUrl.toLowerCase();

  // 1. YouTube — VEVO Music Video Embed
  const ytEmbed = getYouTubeEmbedUrl(rawUrl);
  if (ytEmbed) return ytEmbed;

  // 2. Google Search & Google Homepage (igu=1)
  if (lower.includes('google.com')) {
    if (lower.includes('google.com/search')) {
      return lower.includes('igu=1')
        ? rawUrl
        : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return 'https://www.google.com/search?igu=1&q=google';
  }

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

  const getPortalIcon = () => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube')) return '▶️';
    if (lower.includes('github')) return '🐙';
    if (lower.includes('chatgpt')) return '🤖';
    if (lower.includes('drive')) return '📁';
    if (lower.includes('gemini')) return '✨';
    return '🌐';
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
          Open Tab ↗
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
          /* Interactive Fallback Viewer */
          <div className="chrome-refused-card">
            <div className="chrome-portal-logo-circle">
              {getPortalIcon()}
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
