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
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
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
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
}) => {
  const [inputValue, setInputValue] = useState(getDisplayUrl(url));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with active URL when user is NOT actively typing
  useEffect(() => {
    if (!isFocused) {
      setInputValue(getDisplayUrl(url));
    }
  }, [url, isFocused]);

  // When the active tab changes, reset focus state and update displayed URL
  useEffect(() => {
    setIsFocused(false);
    setInputValue(getDisplayUrl(url));
  }, [activeTabId]);

  const triggerNavigation = () => {
    const target = inputValue.trim();
    if (target) {
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
      // Let the <form onSubmit> handle navigation — do NOT call triggerNavigation()
      // here too, otherwise two loadURL() calls fire and the first gets aborted.
      // Just prevent default to avoid any edge-case double-submit.
      return;
    } else if (e.key === 'Escape') {
      setInputValue(getDisplayUrl(url));
      inputRef.current?.blur();
      window.muthuAPI?.focusContent();
    }
  };

  const secure = isSecure(url);

  return (
    <div className="address-bar" id="address-bar">
      {/* Navigation Buttons */}
      <div className="nav-buttons">
        <button
          className="nav-btn"
          onClick={onBack}
          disabled={!canGoBack}
          title="Back"
          aria-label="Go back"
          id="nav-back"
        >
          ←
        </button>
        <button
          className="nav-btn"
          onClick={onForward}
          disabled={!canGoForward}
          title="Forward"
          aria-label="Go forward"
          id="nav-forward"
        >
          →
        </button>
        <button
          className="nav-btn"
          onClick={isLoading ? onStop : onReload}
          title={isLoading ? 'Stop' : 'Reload'}
          aria-label={isLoading ? 'Stop loading' : 'Reload page'}
          id="nav-reload"
        >
          {isLoading ? '✕' : '↻'}
        </button>
      </div>

      {/* URL Input Form */}
      <form className="url-form" onSubmit={handleSubmit}>
        <div className={`url-input-wrapper ${isFocused ? 'url-input-wrapper--focused' : ''}`}>
          {/* SSL Indicator */}
          <span className={`ssl-indicator ${secure ? 'ssl-indicator--secure' : 'ssl-indicator--insecure'}`}>
            {secure ? '🔒' : '🔓'}
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
            placeholder="Search or enter URL"
            spellCheck={false}
            autoComplete="off"
            id="url-input"
          />
        </div>

        {/* Loading progress bar */}
        {isLoading && <div className="loading-bar" />}
      </form>
    </div>
  );
};

export default AddressBar;
