/**
 * Muthu Browser — JioSphere Bottom Control Bar Component
 *
 * Fixed bottom action toolbar featuring:
 * 1. Back (←)
 * 2. Forward (→)
 * 3. Home (🏠)
 * 4. Tab Counter Badge ([N]) -> opens Tab Switcher Grid
 * 5. 3-Dot Menu (⋮) -> opens Quick Menu Drawer
 */

import React, { useState } from 'react';
import './BottomControlBar.css';

interface BottomControlBarProps {
  tabCount: number;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onOpenTabSwitcher: () => void;
  onNewPrivateTab: () => void;
  onFindInPage: () => void;
  onToggleDevTools: () => void;
}

const BottomControlBar: React.FC<BottomControlBarProps> = ({
  tabCount,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  onOpenTabSwitcher,
  onNewPrivateTab,
  onFindInPage,
  onToggleDevTools,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <>
      {/* ── Fixed JioSphere Bottom Action Toolbar ── */}
      <div className="jio-bottom-bar" id="bottom-control-bar">
        {/* Back */}
        <button
          className="jio-bar-btn"
          onClick={onBack}
          disabled={!canGoBack}
          title="Go Back"
        >
          ←
        </button>

        {/* Forward */}
        <button
          className="jio-bar-btn"
          onClick={onForward}
          disabled={!canGoForward}
          title="Go Forward"
        >
          →
        </button>

        {/* Home */}
        <button
          className="jio-bar-btn"
          onClick={onHome}
          title="Home (Start Page)"
        >
          🏠
        </button>

        {/* Tab Counter Badge */}
        <button
          className="jio-bar-btn"
          onClick={onOpenTabSwitcher}
          title="Open Tab Switcher"
        >
          <span className="jio-tab-badge">{tabCount}</span>
        </button>

        {/* 3-Dot Menu */}
        <button
          className="jio-bar-btn"
          onClick={() => setShowQuickMenu((prev) => !prev)}
          title="More Options"
        >
          ⋮
        </button>
      </div>

      {/* ── Quick Menu Drawer ── */}
      {showQuickMenu && (
        <div className="quick-menu-overlay" onClick={() => setShowQuickMenu(false)}>
          <div className="quick-menu-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="menu-item-btn"
              onClick={() => {
                onHome();
                setShowQuickMenu(false);
              }}
            >
              <span className="menu-item-icon">🏠</span>
              <span>New Tab</span>
            </button>

            <button
              className="menu-item-btn"
              onClick={() => {
                onNewPrivateTab();
                setShowQuickMenu(false);
              }}
            >
              <span className="menu-item-icon">🕶️</span>
              <span>Incognito</span>
            </button>

            <button
              className="menu-item-btn"
              onClick={() => {
                onFindInPage();
                setShowQuickMenu(false);
              }}
            >
              <span className="menu-item-icon">🔍</span>
              <span>Find</span>
            </button>

            <button
              className="menu-item-btn"
              onClick={() => {
                onToggleDevTools();
                setShowQuickMenu(false);
              }}
            >
              <span className="menu-item-icon">🛠️</span>
              <span>DevTools</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomControlBar;
