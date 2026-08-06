/**
 * Muthu Browser — Root App Component (Opera GX UI Theme)
 *
 * Opera-style chrome layout with:
 * - Opera "O" red logo menu button
 * - Chrome-style tab strip with Opera red active indicators
 * - Opera pill-shaped address bar
 * - Quick AI Chat button ("🤖 Claude AI")
 * - Opera GX status indicators (VPN, AdBlock, Memory Saver)
 */

import React, { useState, useEffect } from 'react';
import { useIpc } from './hooks/useIpc';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
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

  // Find the active tab for address bar state
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
      {/* ── Opera Tab Strip ── */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onCloseTab={closeTab}
        onNewTab={() => createTab()}
        onNewPrivateTab={() => createPrivateTab()}
      />

      {/* ── Opera Toolbar Row ── */}
      <div className="toolbar-row">
        {/* Opera "O" Menu Button */}
        <button
          className="opera-menu-btn"
          title="Opera Speed Dial Start Page (New Tab)"
          onClick={() => createTab('speeddial')}
        >
          O
        </button>

        {/* Opera Address Bar */}
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

        {/* Opera Quick AI Button */}
        <button
          className="opera-ai-btn"
          title="Open Claude AI"
          onClick={() => createTab('https://claude.ai')}
        >
          🤖 Claude AI
        </button>

        {/* Opera Actions / Controls */}
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
    </div>
  );
};

export default App;
