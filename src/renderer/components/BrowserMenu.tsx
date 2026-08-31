/**
 * Muthu Browser — Chrome-Style Dropdown Menu Component (3-Dot ⋮ Menu)
 *
 * Google Chrome Desktop Dark Mode dropdown menu with tabs, zoom controls, find, and settings.
 */

import React from 'react';
import './BrowserMenu.css';

export interface BrowserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTab: () => void;
  onNewPrivateTab: () => void;
  onSettings: () => void;
  onFindInPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  zoomLevel?: number;
}

const BrowserMenu: React.FC<BrowserMenuProps> = ({
  isOpen,
  onClose,
  onNewTab,
  onNewPrivateTab,
  onSettings,
  onFindInPage,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoomLevel,
}) => {
  if (!isOpen) {
    return null;
  }

  // Format zoom display string (e.g., 1.0 -> 100%, 1.25 -> 125%, 100 -> 100%)
  const formattedZoom =
    zoomLevel !== undefined
      ? zoomLevel <= 5
        ? `${Math.round(zoomLevel * 100)}%`
        : `${Math.round(zoomLevel)}%`
      : '100%';

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const handleZoomOutClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onZoomOut();
  };

  const handleZoomInClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onZoomIn();
  };

  const handleZoomResetClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onZoomReset();
  };

  return (
    <>
      {/* Backdrop overlay to close dropdown on outside click */}
      <div
        className="browser-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Chrome Dropdown Menu Panel */}
      <div className="browser-menu-container" role="menu" aria-label="Chrome menu">
        {/* Group 1: New Tab & Incognito */}
        <div className="browser-menu-group">
          <div
            className="browser-menu-item"
            role="menuitem"
            tabIndex={0}
            onClick={() => handleItemClick(onNewTab)}
          >
            <span className="browser-menu-icon">📄</span>
            <span className="browser-menu-label">New Tab</span>
            <span className="browser-menu-shortcut">Ctrl+T</span>
          </div>
          <div
            className="browser-menu-item"
            role="menuitem"
            tabIndex={0}
            onClick={() => handleItemClick(onNewPrivateTab)}
          >
            <span className="browser-menu-icon">🕶️</span>
            <span className="browser-menu-label">New Incognito Tab</span>
            <span className="browser-menu-shortcut">Ctrl+Shift+N</span>
          </div>
        </div>

        <div className="browser-menu-separator" role="separator" />

        {/* Group 2: Inline Zoom Controls */}
        <div className="browser-menu-group">
          <div className="browser-menu-item browser-menu-item--zoom" role="menuitem">
            <span className="browser-menu-icon">🔍</span>
            <span className="browser-menu-label">Zoom</span>
            <div className="browser-menu-zoom-controls">
              <button
                type="button"
                className="browser-menu-zoom-btn"
                onClick={handleZoomOutClick}
                title="Zoom out"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className="browser-menu-zoom-percentage"
                onClick={handleZoomResetClick}
                title="Reset zoom to 100%"
                aria-label="Reset zoom"
              >
                {formattedZoom}
              </button>
              <button
                type="button"
                className="browser-menu-zoom-btn"
                onClick={handleZoomInClick}
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="browser-menu-separator" role="separator" />

        {/* Group 3: Find in Page */}
        <div className="browser-menu-group">
          <div
            className="browser-menu-item"
            role="menuitem"
            tabIndex={0}
            onClick={() => handleItemClick(onFindInPage)}
          >
            <span className="browser-menu-icon">📄</span>
            <span className="browser-menu-label">Find in Page</span>
            <span className="browser-menu-shortcut">Ctrl+F</span>
          </div>
        </div>

        <div className="browser-menu-separator" role="separator" />

        {/* Group 4: Settings */}
        <div className="browser-menu-group">
          <div
            className="browser-menu-item"
            role="menuitem"
            tabIndex={0}
            onClick={() => handleItemClick(onSettings)}
          >
            <span className="browser-menu-icon">⚙️</span>
            <span className="browser-menu-label">Settings</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrowserMenu;
