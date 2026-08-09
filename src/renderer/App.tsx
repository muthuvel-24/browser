/**
 * Muthu Browser — Root App Component (JioSphere UI Theme)
 *
 * JioSphere-style layout with:
 * - Floating Omnibox with HTTPS lock, Voice Mic, and Bookmark Star
 * - Fixed JioSphere 5-action Bottom Control Bar (Back, Forward, Home, Tab Badge Counter, 3-Dot Menu)
 * - Tab Switcher Grid Overlay with preview cards and floating (+) Action Button
 * - Deep Slate Dark Theme (#0B0E14) & JioSphere Blue Highlights (#0066FF)
 */

import React, { useState, useEffect } from 'react';
import { useIpc } from './hooks/useIpc';
import AddressBar from './components/AddressBar';
import BottomControlBar from './components/BottomControlBar';
import TabSwitcherModal from './components/TabSwitcherModal';
import VpnToggle from './components/VpnToggle';
import AdBlockStats from './components/AdBlockStats';
import MemoryIndicator from './components/MemoryIndicator';
import DownloadManager from './components/DownloadManager';
import FindBar from './components/FindBar';

const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    vpnStatus,
    adBlockStats,
    memoryStats,
    downloads,
    findMatchInfo,
    createTab,
    createPrivateTab,
    closeTab,
    switchTab,
    navigateTo,
    goBack,
    goForward,
    reload,
    stopLoading,
    vpnEnable,
    vpnDisable,
    findInPage,
    findStop,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleDevTools,
  } = useIpc();

  const [showFindBar, setShowFindBar] = useState(false);
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);

  // Find active tab state
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // ─── Global Keyboard Shortcuts ───────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + T : New Tab
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        createTab();
      }
      // Ctrl + Shift + N : New Private Tab
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createPrivateTab();
      }
      // Ctrl + W : Close Active Tab
      else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }
      // Ctrl + F : Find in Page
      else if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindBar((prev) => !prev);
      }
      // Ctrl + L : Focus Address Bar
      else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const input = document.getElementById('url-input') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
      // Ctrl + R / F5 : Reload
      else if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
        e.preventDefault();
        reload();
      }
      // F12 : DevTools
      else if (e.key === 'F12') {
        e.preventDefault();
        toggleDevTools();
      }
      // Ctrl + Plus : Zoom In
      else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }
      // Ctrl + Minus : Zoom Out
      else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      // Ctrl + 0 : Zoom Reset
      else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        zoomReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, createTab, createPrivateTab, closeTab, reload, zoomIn, zoomOut, zoomReset, toggleDevTools]);

  return (
    <div className="app-shell">
      {/* ── Top Floating JioSphere Omnibox Row ── */}
      <div className="toolbar-row">
        {/* JioSphere Logo / Home Trigger */}
        <button
          className="opera-menu-btn"
          style={{ background: 'linear-gradient(135deg, #0066FF, #0040A8)', boxShadow: '0 0 10px rgba(0, 102, 255, 0.4)' }}
          title="JioSphere Home Start Page"
          onClick={() => createTab('speeddial')}
        >
          J
        </button>

        {/* Floating Address Bar */}
        <AddressBar
          url={activeTab?.url ?? ''}
          isLoading={activeTab?.isLoading ?? false}
          canGoBack={activeTab?.canGoBack ?? false}
          canGoForward={activeTab?.canGoForward ?? false}
          activeTabId={activeTabId}
          isPrivate={activeTab?.isPrivate}
          onNavigate={navigateTo}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
          onStop={stopLoading}
          onFindClick={() => setShowFindBar((prev) => !prev)}
          onDevToolsClick={toggleDevTools}
        />

        {/* Status Indicators */}
        <div className="toolbar-actions">
          <DownloadManager downloads={downloads} />
          <MemoryIndicator stats={memoryStats} />
          <AdBlockStats stats={adBlockStats} />
          <VpnToggle
            status={vpnStatus}
            onEnable={vpnEnable}
            onDisable={vpnDisable}
          />
        </div>
      </div>

      {/* Find in Page Overlay */}
      {showFindBar && (
        <FindBar
          matchInfo={findMatchInfo}
          onFind={findInPage}
          onClose={() => {
            findStop('clearSelection');
            setShowFindBar(false);
          }}
        />
      )}

      {/* JioSphere 5-Action Bottom Bar */}
      <BottomControlBar
        tabCount={tabs.length}
        canGoBack={activeTab?.canGoBack ?? false}
        canGoForward={activeTab?.canGoForward ?? false}
        onBack={goBack}
        onForward={goForward}
        onHome={() => createTab('speeddial')}
        onOpenTabSwitcher={() => setShowTabSwitcher(true)}
        onNewPrivateTab={() => createPrivateTab()}
        onFindInPage={() => setShowFindBar((prev) => !prev)}
        onToggleDevTools={toggleDevTools}
      />

      {/* JioSphere Tab Switcher Grid Overlay */}
      {showTabSwitcher && (
        <TabSwitcherModal
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onNewTab={() => createTab()}
          onCloseModal={() => setShowTabSwitcher(false)}
        />
      )}
    </div>
  );
};

export default App;
