/**
 * Muthu Browser — Chrome Desktop Dark Mode Omnibox Component
 */

import React, { useState, useEffect, useRef } from 'react';
import type { AdBlockStats, VpnStatus } from '../../main/types';
import './AddressBar.css';

interface AddressBarProps {
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  activeTabId: string | null;
  isPrivate?: boolean;
  adBlockStats?: AdBlockStats;
  vpnStatus?: VpnStatus;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onToggleVpnModal: () => void;
  onFindClick?: () => void;
  onDevToolsClick?: () => void;
}

function isSecure(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function getDisplayUrl(url: string): string {
  if (!url || url === 'about:blank' || url === 'speeddial') return '';
  return url;
}

const AddressBar: React.FC<AddressBarProps> = ({
  url,
  isLoading,
  canGoBack,
  canGoForward,
  activeTabId,
  isPrivate,
  adBlockStats,
  vpnStatus,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onToggleVpnModal,
  onFindClick,
  onDevToolsClick,
}) => {
  const [inputValue, setInputValue] = useState(getDisplayUrl(url));
  const [isFocused, setIsFocused] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused && !pendingTarget) {
      setInputValue(getDisplayUrl(url));
    }
  }, [url, isFocused, pendingTarget]);

  useEffect(() => {
    setPendingTarget(null);
    setIsFocused(false);
    setInputValue(getDisplayUrl(url));
  }, [activeTabId, url]);

  const triggerNavigation = () => {
    const target = inputValue.trim();
    if (target) {
      setPendingTarget(target);
      onNavigate(target);
      inputRef.current?.blur();
      window.muthuAPI?.focusContent();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerNavigation();
  };

  const handleFocus = () => {
    setIsFocused(true);
    window.muthuAPI?.focusToolbar();
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      triggerNavigation();
    } else if (e.key === 'Escape') {
      setInputValue(getDisplayUrl(url));
      inputRef.current?.blur();
      window.muthuAPI?.focusContent();
    }
  };

  const secure = isSecure(url);

  return (
    <div className={`address-bar ${isPrivate ? 'address-bar--private' : ''}`} id="address-bar">
      {/* Navigation Buttons */}
      <div className="nav-buttons">
        <button
          className="nav-btn"
          onClick={onBack}
          disabled={!canGoBack}
          title="Click to go back (Alt+Left Arrow)"
          id="nav-back"
        >
          ←
        </button>
        <button
          className="nav-btn"
          onClick={onForward}
          disabled={!canGoForward}
          title="Click to go forward (Alt+Right Arrow)"
          id="nav-forward"
        >
          →
        </button>
        <button
          className="nav-btn"
          onClick={isLoading ? onStop : onReload}
          title={isLoading ? 'Stop loading' : 'Reload page (Ctrl+R / F5)'}
          id="nav-reload"
        >
          {isLoading ? '✕' : '↻'}
        </button>
        <button
          className="nav-btn"
          onClick={onHome}
          title="Open New Tab Home Page"
          id="nav-home"
        >
          🏠
        </button>
      </div>

      {/* Chrome Pill Omnibox Form */}
      <form className="url-form" onSubmit={handleSubmit}>
        <div className={`url-input-wrapper ${isFocused ? 'url-input-wrapper--focused' : ''} ${isPrivate ? 'url-input-wrapper--private' : ''}`}>
          {/* SSL / Site Info Icon */}
          <span className={`ssl-indicator ${secure ? 'ssl-indicator--secure' : 'ssl-indicator--insecure'}`}>
            {isPrivate ? '🕶️' : secure ? '🔒' : '🔓'}
          </span>

          <input
            ref={inputRef}
            type="text"
            className="url-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={isPrivate ? "Search Google or type a URL (Incognito)" : "Search Google or type a URL"}
            spellCheck={false}
            autoComplete="off"
            id="url-input"
          />

          {/* Inner Omnibox Icons (Voice Mic & Star) */}
          <div className="url-actions">
            <button
              type="button"
              className="url-action-btn"
              title="Search by voice"
              onClick={() => {
                const q = prompt('Voice Search:');
                if (q) onNavigate(q);
              }}
            >
              🎙️
            </button>
            <button
              type="button"
              className={`url-action-btn ${isStarred ? 'url-action-btn--starred' : ''}`}
              title="Bookmark this tab"
              onClick={() => setIsStarred((prev) => !prev)}
            >
              {isStarred ? '★' : '☆'}
            </button>
            <button
              type="submit"
              className="url-action-btn url-action-btn--submit"
              onClick={triggerNavigation}
              title="Search or Go"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Loading Progress Bar */}
        {isLoading && <div className="loading-bar" />}
      </form>

      {/* Chrome Action Toolbar (AdBlocker, VPN, Extensions, Profile, Menu) */}
      <div className="toolbar-actions">
        {/* Ad Blocker Shield Button */}
        <button
          className="url-action-btn"
          title={`Ad Blocker: ${adBlockStats?.totalBlocked ?? 0} ads & trackers blocked`}
          onClick={() => alert(`Ad Blocker Active!\nBlocked Total: ${adBlockStats?.totalBlocked ?? 0}\nEngine: Ghostery AdBlocker`)}
        >
          🛡️
          {adBlockStats && adBlockStats.totalBlocked > 0 && (
            <span className="action-badge">{adBlockStats.totalBlocked}</span>
          )}
        </button>

        {/* VPN Toggle Control Panel Button */}
        <button
          className="url-action-btn"
          title={`Chrome VPN: ${vpnStatus?.enabled ? 'Protected (' + vpnStatus.region + ')' : 'Disconnected'}`}
          onClick={onToggleVpnModal}
        >
          ⚡
          {vpnStatus?.enabled && <span className="action-badge action-badge--active">ON</span>}
        </button>

        {/* Find in Page */}
        {onFindClick && (
          <button className="url-action-btn" onClick={onFindClick} title="Find in page (Ctrl+F)">
            📄
          </button>
        )}

        {/* DevTools */}
        {onDevToolsClick && (
          <button className="url-action-btn" onClick={onDevToolsClick} title="Developer Tools (F12)">
            🛠️
          </button>
        )}

        {/* Profile */}
        <button className="url-action-btn" title="Google Chrome Profile (Guest/User)">
          👤
        </button>

        {/* 3-Dot Chrome Settings Menu */}
        <button
          className="url-action-btn"
          title="Customize and control Google Chrome"
          onClick={() => alert('Google Chrome Settings & Tools Menu')}
        >
          ⋮
        </button>
      </div>
    </div>
  );
};

export default AddressBar;
