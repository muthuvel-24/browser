/**
 * Muthu Browser — Root App Component (Google Chrome Desktop Dark Mode UI Replica)
 *
 * Pixel-Perfect Google Chrome Architecture:
 * - Chrome Dark Mode Tab Strip with trapezoidal active/inactive tabs & window controls
 * - Omnibox toolbar with Back, Forward, Reload, Home, pill input, voice search, bookmark star
 * - Built-in AdBlocker shield counter & Chrome VPN control panel modal
 * - Horizontal bookmarks bar with favicons
 * - Chrome Dark Mode New Tab Page Component inside main viewport
 */

import React, { useState, useEffect } from 'react';
import { useIpc } from './hooks/useIpc';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import BookmarksBar from './components/BookmarksBar';
import VpnModal from './components/VpnModal';
import FindBar from './components/FindBar';
import ChromeNewTabPage from './components/ChromeNewTabPage';
import WebPreviewCard from './components/WebPreviewCard';

const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    vpnStatus,
    adBlockStats,
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
  const [showVpnModal, setShowVpnModal] = useState(false);

  // Find active tab
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Electron owns page content via WebContentsView — never iframe remote sites there
  // (iframes hit CSP frame-ancestors on sites like chatgpt.com).
  const isElectronShell = typeof window !== 'undefined' && Boolean(window.muthuAPI);

  // Check if active tab is speeddial/newtab page
  const isSpeedDial = !activeTab || !activeTab.url || activeTab.url === 'speeddial' || activeTab.url === 'about:blank';

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Chrome Top Toolbar Frame */}
      <div className="app-shell">
        {/* ── 1. Chrome Tab Strip ── */}
        <TabBar
          tabs={tabs.length > 0 ? tabs : [{ id: 'tab-1', url: 'speeddial', title: 'New Tab', favicon: '', status: 'active', isLoading: false, canGoBack: false, canGoForward: false, isPrivate: false }]}
          activeTabId={activeTabId || 'tab-1'}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onNewTab={() => createTab()}
          onNewPrivateTab={() => createPrivateTab()}
        />

        {/* ── 2. Chrome Omnibox & Navigation Row ── */}
        <div className="toolbar-row">
          <AddressBar
            url={activeTab?.url ?? ''}
            isLoading={activeTab?.isLoading ?? false}
            canGoBack={activeTab?.canGoBack ?? false}
            canGoForward={activeTab?.canGoForward ?? false}
            activeTabId={activeTabId}
            isPrivate={activeTab?.isPrivate}
            adBlockStats={adBlockStats}
            vpnStatus={vpnStatus}
            onNavigate={navigateTo}
            onBack={goBack}
            onForward={goForward}
            onReload={reload}
            onStop={stopLoading}
            onHome={() => createTab('speeddial')}
            onToggleVpnModal={() => setShowVpnModal((prev) => !prev)}
            onFindClick={() => setShowFindBar((prev) => !prev)}
            onDevToolsClick={toggleDevTools}
          />
        </div>

        {/* ── 3. Chrome Horizontal Bookmarks Bar ── */}
        <BookmarksBar onNavigate={navigateTo} />
      </div>

      {/* ── 4. Main Viewport ──
          Electron: empty (WebContentsView paints below the 110px toolbar).
          Standalone Vite/Chrome: New Tab page or proxied iframe viewport. */}
      {isElectronShell ? null : isSpeedDial ? (
        <ChromeNewTabPage onNavigate={navigateTo} />
      ) : (
        <WebPreviewCard url={activeTab!.url} title={activeTab!.title} onNavigate={navigateTo} />
      )}

      {/* ── 5. Find in Page Overlay ── */}
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

      {/* ── 6. Chrome VPN Dropdown Control Panel Modal ── */}
      {showVpnModal && vpnStatus && (
        <VpnModal
          status={vpnStatus}
          onEnable={vpnEnable}
          onDisable={vpnDisable}
          onClose={() => setShowVpnModal(false)}
        />
      )}
    </div>
  );
};

export default App;
