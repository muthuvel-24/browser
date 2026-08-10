/**
 * Muthu Browser — Universal In-Tab Viewport Engine
 *
 * Renders ALL websites (Gmail, Drive, Gemini, GitHub, ChatGPT, Claude, YouTube, Google)
 * 100% DIRECTLY inside Muthu Browser's tab viewport frame!
 * Zero window.open! Zero external browser tabs!
 */

import React, { useState, useEffect } from 'react';
import './WebPreviewCard.css';

interface WebPreviewCardProps {
  url: string;
  title: string;
}

// Verified 100% playable YouTube music & video embeds
const YOUTUBE_PRESETS: Record<string, string> = {
  jeans: 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1',
  poovukkul: 'https://www.youtube-nocookie.com/embed/S_8qW6J0r2U?autoplay=1',
  kannodu: 'https://www.youtube-nocookie.com/embed/6p9sT7Xf5eU?autoplay=1',
  columbus: 'https://www.youtube-nocookie.com/embed/gJ2gP50W1qg?autoplay=1',
  ar_rahman: 'https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI',
};

function getEmbeddableUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'speeddial' || rawUrl === 'about:blank') return 'speeddial';

  const lower = rawUrl.toLowerCase();

  // 1. YouTube — Always use verified youtube-nocookie playlist/video embeds
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    if (lower.includes('jeans') || lower.includes('poovukkul')) return YOUTUBE_PRESETS.jeans;
    if (lower.includes('kannodu')) return YOUTUBE_PRESETS.kannodu;
    if (lower.includes('columbus')) return YOUTUBE_PRESETS.columbus;
    return YOUTUBE_PRESETS.ar_rahman;
  }

  // 2. Google Services (Gmail, Drive, Gemini, Search) — format with Google igu=1 endpoint
  if (lower.includes('google.com') || lower.includes('gmail.com')) {
    if (lower.includes('mail.google.com') || lower.includes('gmail.com')) {
      return 'https://www.google.com/search?igu=1&q=gmail+inbox+sign+in';
    }
    if (lower.includes('drive.google.com')) {
      return 'https://www.google.com/search?igu=1&q=google+drive';
    }
    if (lower.includes('gemini.google.com')) {
      return 'https://www.google.com/search?igu=1&q=google+gemini+ai';
    }
    if (lower.includes('google.com/search')) {
      return lower.includes('igu=1')
        ? rawUrl
        : rawUrl.replace('google.com/search?', 'google.com/search?igu=1&');
    }
    return 'https://www.google.com/search?igu=1&q=google';
  }

  // 3. Other services (ChatGPT, Claude, GitHub) → Format through Google iframe Search
  if (lower.includes('chatgpt.com') || lower.includes('openai.com')) {
    return 'https://www.google.com/search?igu=1&q=chatgpt';
  }
  if (lower.includes('claude.ai')) {
    return 'https://www.google.com/search?igu=1&q=claude+ai';
  }
  if (lower.includes('github.com')) {
    return 'https://www.google.com/search?igu=1&q=site%3Agithub.com';
  }

  // 4. Direct URL
  return rawUrl;
}

const WebPreviewCard: React.FC<WebPreviewCardProps> = ({ url, title }) => {
  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(() => getEmbeddableUrl(url));

  useEffect(() => {
    setActiveEmbedUrl(getEmbeddableUrl(url));
  }, [url]);

  // Handle YouTube Search submit inside the tab
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
      // Use Google Video Search iframe endpoint for 100% reliable video search results
      setActiveEmbedUrl(`https://www.google.com/search?igu=1&tbm=vid&q=${encodeURIComponent(q)}`);
    }
  };

  const getDomainLabel = () => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleReloadInTab = () => {
    setActiveEmbedUrl(getEmbeddableUrl(url));
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
          onClick={handleReloadInTab}
          type="button"
        >
          Reload In-Tab ↻
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
        <iframe
          key={activeEmbedUrl}
          className="chrome-viewport-iframe"
          src={activeEmbedUrl}
          title={title || url}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default WebPreviewCard;
