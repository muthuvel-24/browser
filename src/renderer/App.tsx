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

import React from 'react';
import { useIpc } from './hooks/useIpc';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import VpnToggle from './components/VpnToggle';
import AdBlockStats from './components/AdBlockStats';
import MemoryIndicator from './components/MemoryIndicator';

const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    vpnStatus,
    adBlockStats,
    memoryStats,
    createTab,
    closeTab,
    switchTab,
    navigateTo,
    goBack,
    goForward,
    reload,
    stopLoading,
    vpnEnable,
    vpnDisable,
  } = useIpc();

  // Find the active tab for address bar state
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="app-shell">
      {/* ── Opera Tab Strip ── */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onCloseTab={closeTab}
        onNewTab={() => createTab()}
      />

      {/* ── Opera Toolbar Row ── */}
      <div className="toolbar-row">
        {/* Opera "O" Menu Button */}
        <button
          className="opera-menu-btn"
          title="Opera Speed Dial Start Page"
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
          onNavigate={navigateTo}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
          onStop={stopLoading}
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
          <MemoryIndicator stats={memoryStats} />
          <AdBlockStats stats={adBlockStats} />
          <VpnToggle
            status={vpnStatus}
            onEnable={vpnEnable}
            onDisable={vpnDisable}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
