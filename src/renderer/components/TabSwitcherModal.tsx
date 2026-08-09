/**
 * Muthu Browser — JioSphere Tab Switcher Grid Overlay Component
 */

import React from 'react';
import type { TabInfo } from '../../main/types';
import './TabSwitcherModal.css';

interface TabSwitcherModalProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onCloseModal: () => void;
}

const TabSwitcherModal: React.FC<TabSwitcherModalProps> = ({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  onCloseModal,
}) => {
  return (
    <div className="tab-switcher-overlay" onClick={onCloseModal}>
      <div className="tab-switcher-header" onClick={(e) => e.stopPropagation()}>
        <div className="tab-switcher-title">
          <span>Tabs</span>
          <span className="tab-switcher-count">{tabs.length}</span>
        </div>
        <button className="tab-switcher-close-btn" onClick={onCloseModal} title="Done">
          ✕
        </button>
      </div>

      <div className="tab-grid-container" onClick={(e) => e.stopPropagation()}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`tab-card ${isActive ? 'tab-card--active' : ''}`}
              onClick={() => {
                onSwitchTab(tab.id);
                onCloseModal();
              }}
            >
              <div className="tab-card-header">
                <div className="tab-card-title-group">
                  <span className="tab-card-favicon">
                    {tab.isPrivate ? '🕶️' : '🌐'}
                  </span>
                  <span className="tab-card-title">{tab.title || 'New Tab'}</span>
                </div>
                <button
                  className="tab-card-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  title="Close Tab"
                >
                  ✕
                </button>
              </div>

              <div className="tab-card-preview">
                <div className="tab-card-url">{tab.url || 'speeddial'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button (+) */}
      <button
        className="floating-add-tab-btn"
        title="Open New Tab"
        onClick={(e) => {
          e.stopPropagation();
          onNewTab();
          onCloseModal();
        }}
      >
        +
      </button>
    </div>
  );
};

export default TabSwitcherModal;
