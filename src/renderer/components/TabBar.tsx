/**
 * Muthu Browser — TabBar Component
 *
 * Chrome-style horizontal tab strip with:
 * - Active tab highlight with cyan accent
 * - Sleeping (💤) and discarded (⚫) status indicators
 * - Favicon display
 * - Close button per tab
 * - "+" button to create new tabs
 * - Horizontal scrolling for overflow tabs
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
}

/** Get the status indicator emoji for a tab */
function getStatusIndicator(status: TabInfo['status']): string {
  switch (status) {
    case 'sleeping':  return '💤';
    case 'discarded': return '⚫';
    default:          return '';
  }
}

/** Truncate title to a max length */
function truncateTitle(title: string, maxLen = 18): string {
  if (title.length <= maxLen) return title;
  return title.substring(0, maxLen) + '…';
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="tab-bar" id="tab-bar">
      <div className="tab-strip">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const statusIcon = getStatusIndicator(tab.status);

          return (
            <div
              key={tab.id}
              className={`tab-item ${isActive ? 'tab-item--active' : ''} ${
                tab.status === 'sleeping' ? 'tab-item--sleeping' : ''
              } ${tab.status === 'discarded' ? 'tab-item--discarded' : ''}`}
              onClick={() => onSwitchTab(tab.id)}
              title={tab.url}
              id={`tab-${tab.id}`}
            >
              {/* Favicon */}
              <div className="tab-favicon">
                {tab.isLoading ? (
                  <div className="tab-spinner" />
                ) : tab.favicon ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    width={14}
                    height={14}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="tab-favicon-fallback">🌐</span>
                )}
              </div>

              {/* Title + Status */}
              <span className="tab-title">
                {statusIcon && <span className="tab-status-icon">{statusIcon}</span>}
                {truncateTitle(tab.title || 'New Tab')}
              </span>

              {/* Close Button */}
              <button
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title="Close tab"
                aria-label={`Close ${tab.title}`}
              >
                ✕
              </button>

              {/* Active indicator bar */}
              {isActive && <div className="tab-active-indicator" />}
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <button
        className="tab-new-btn"
        onClick={onNewTab}
        title="New Tab"
        aria-label="Open new tab"
        id="new-tab-btn"
      >
        +
      </button>
    </div>
  );
};

export default TabBar;
