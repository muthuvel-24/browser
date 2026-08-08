/**
 * Muthu Browser — AddressBar Component
 *
 * Navigation toolbar with:
 * - Back / Forward / Reload buttons
 * - URL input with Enter-to-navigate
 * - Explicit focus requesting & robust keyboard submission
 * - SSL lock indicator
 * - Loading progress animation
 */

import React, { useState, useEffect, useRef } from 'react';
import './AddressBar.css';

interface AddressBarProps {
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  activeTabId: string | null;
  isPrivate?: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onFindClick?: () => void;
  onDevToolsClick?: () => void;
}

/** Determine if a URL is using HTTPS */
function isSecure(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Extract displayable hostname or string from URL */
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
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onFindClick,
  onDevToolsClick,
}) => {
  const [inputValue, setInputValue] = useState(getDisplayUrl(url));
  const [isFocused, setIsFocused] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with active URL when user is NOT actively typing or waiting for navigation
  useEffect(() => {
    if (!isFocused && !pendingTarget) {
      setInputValue(getDisplayUrl(url));
    }
  }, [url, isFocused, pendingTarget]);

  // When the active tab or url changes from main process, reset pending target
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
    // Ensure Electron main process grants keyboard focus to the toolbar view
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
          title="Back (Alt+Left)"
          aria-label="Go back"
          id="nav-back"
        >
          ←
        </button>
        <button
          className="nav-btn"
          onClick={onForward}
          disabled={!canGoForward}
          title="Forward (Alt+Right)"
          aria-label="Go forward"
          id="nav-forward"
        >
          →
        </button>
        <button
          className="nav-btn"
          onClick={isLoading ? onStop : onReload}
          title={isLoading ? 'Stop' : 'Reload (Ctrl+R / F5)'}
          aria-label={isLoading ? 'Stop loading' : 'Reload page'}
          id="nav-reload"
        >
          {isLoading ? '✕' : '↻'}
        </button>
      </div>

      {/* URL Input Form */}
      <form className="url-form" onSubmit={handleSubmit}>
        <div className={`url-input-wrapper ${isFocused ? 'url-input-wrapper--focused' : ''} ${isPrivate ? 'url-input-wrapper--private' : ''}`}>
          {/* SSL / Incognito Indicator */}
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
            placeholder={isPrivate ? "Search privately or enter URL" : "Search or enter URL"}
            spellCheck={false}
            autoComplete="off"
            id="url-input"
          />

          {/* Quick Action Icons */}
          <div className="url-actions">
            <button
              type="submit"
              className="url-action-btn url-action-btn--submit"
              onClick={triggerNavigation}
              title="Search or Go (Enter)"
            >
              🔍
            </button>
            {onFindClick && (
              <button
                type="button"
                className="url-action-btn"
                onClick={onFindClick}
                title="Find in page (Ctrl+F)"
              >
                📄
              </button>
            )}
            {onDevToolsClick && (
              <button
                type="button"
                className="url-action-btn"
                onClick={onDevToolsClick}
                title="Toggle Developer Tools (F12)"
              >
                🛠️
              </button>
            )}
          </div>
        </div>

        {/* Loading progress bar */}
        {isLoading && <div className="loading-bar" />}
      </form>
    </div>
  );
};

export default AddressBar;
