/**
 * Muthu Browser — Chrome Desktop Dark Mode TabBar Component
 */

import React from 'react';
import type { TabInfo } from '../../main/types';
import './TabBar.css';

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onNewPrivateTab?: () => void;
}

function getFaviconEl(tab: TabInfo): React.ReactNode {
  if (tab.isLoading) return <span className="tab-spinner">⟳</span>;
  if (tab.isPrivate) return <span className="chrome-tab-favicon">🕶️</span>;
  if (tab.favicon && tab.favicon.startsWith('http')) {
    return <img className="chrome-tab-favicon-img" src={tab.favicon} alt="" width={16} height={16} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
  }
  const url = tab.url || '';
  if (url.includes('youtube')) return <span className="chrome-tab-favicon">▶️</span>;
  if (url.includes('google')) return <span className="chrome-tab-favicon">🔍</span>;
  if (url.includes('gmail') || url.includes('mail')) return <span className="chrome-tab-favicon">📧</span>;
  if (url.includes('drive')) return <span className="chrome-tab-favicon">📁</span>;
  if (url.includes('github')) return <span className="chrome-tab-favicon">🐙</span>;
  if (url.includes('claude')) return <span className="chrome-tab-favicon">🤖</span>;
  if (url.includes('chatgpt') || url.includes('openai')) return <span className="chrome-tab-favicon">💬</span>;
  if (url.includes('gemini')) return <span className="chrome-tab-favicon">✨</span>;
  if (url === 'speeddial' || !url) return <span className="chrome-tab-favicon">🏠</span>;
  return <span className="chrome-tab-favicon">🌐</span>;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  onNewPrivateTab,
}) => {

  const handleMinimize = () => {
    if (window.muthuAPI) {
      (window.muthuAPI as unknown as { windowMinimize?: () => void }).windowMinimize?.();
    }
  };

  const handleMaximize = () => {
    if (window.muthuAPI) {
      (window.muthuAPI as unknown as { windowMaximize?: () => void }).windowMaximize?.();
    }
  };

  const handleClose = () => {
    if (window.muthuAPI) {
      (window.muthuAPI as unknown as { windowClose?: () => void }).windowClose?.();
    } else {
      window.close();
    }
  };

  return (
    <div className="chrome-tab-strip" id="chrome-tab-strip">
      <div className="chrome-tab-list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isSleeping = tab.status === 'sleeping';
          const isDiscarded = tab.status === 'discarded';
          return (
            <div
              key={tab.id}
              className={`chrome-tab ${isActive ? 'chrome-tab--active' : ''} ${tab.isPrivate ? 'chrome-tab--private' : ''} ${isSleeping ? 'chrome-tab--sleeping' : ''}`}
              onClick={() => onSwitchTab(tab.id)}
              title={`${tab.title || 'New Tab'}${isSleeping ? ' (Sleeping)' : isDiscarded ? ' (Discarded)' : ''}`}
            >
              {getFaviconEl(tab)}
              <span className="chrome-tab-title">
                {tab.title || 'New Tab'}
                {isSleeping ? ' 💤' : ''}
                {isDiscarded ? ' 🔄' : ''}
              </span>
              <button
                className="chrome-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title="Close tab (Ctrl+W)"
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* Chrome New Tab (+) Button */}
        <button
          className="chrome-new-tab-btn"
          onClick={onNewTab}
          title="New tab (Ctrl+T)"
        >
          +
        </button>

        {/* Private Tab Button */}
        {onNewPrivateTab && (
          <button
            className="chrome-new-tab-btn chrome-new-tab-btn--private"
            onClick={onNewPrivateTab}
            title="New private tab (Ctrl+Shift+N)"
          >
            🕶️
          </button>
        )}
      </div>

      {/* Window Controls */}
      <div className="window-controls">
        <button className="window-control-btn" title="Minimize" onClick={handleMinimize}>—</button>
        <button className="window-control-btn" title="Maximize" onClick={handleMaximize}>▢</button>
        <button className="window-control-btn window-control-btn--close" title="Close" onClick={handleClose}>✕</button>
      </div>
    </div>
  );
};

export default TabBar;
