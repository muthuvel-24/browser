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

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="chrome-tab-strip" id="chrome-tab-strip">
      <div className="chrome-tab-list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`chrome-tab ${isActive ? 'chrome-tab--active' : ''}`}
              onClick={() => onSwitchTab(tab.id)}
              title={tab.url || 'New Tab'}
            >
              <span className="chrome-tab-favicon">
                {tab.isPrivate ? '🕶️' : '🌐'}
              </span>
              <span className="chrome-tab-title">
                {tab.title || 'New Tab'}
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
      </div>

      {/* Window Controls (Minimize, Maximize, Close) */}
      <div className="window-controls">
        <button className="window-control-btn" title="Minimize">—</button>
        <button className="window-control-btn" title="Maximize">▢</button>
        <button className="window-control-btn window-control-btn--close" title="Close">✕</button>
      </div>
    </div>
  );
};

export default TabBar;
