/**
 * Muthu Browser — useIpc React Hook
 *
 * Provides reactive state for all IPC-driven data:
 * tabs, VPN status, adblock stats, and memory stats.
 * Automatically subscribes to main-process events and cleans up on unmount.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TabInfo, VpnStatus, AdBlockStats, MemoryStats, DownloadItemInfo, FindMatchInfo } from '../../main/types';

/** The full IPC state consumed by the UI */
export interface IpcState {
  tabs: TabInfo[];
  activeTabId: string | null;
  vpnStatus: VpnStatus;
  adBlockStats: AdBlockStats;
  memoryStats: MemoryStats;
  downloads: DownloadItemInfo[];
  findMatchInfo: FindMatchInfo | null;
}

/** Default VPN status */
const DEFAULT_VPN_STATUS: VpnStatus = {
  enabled: false,
  region: 'US',
  state: 'disconnected',
  endpoint: 'none',
};

/** Default AdBlock stats */
const DEFAULT_ADBLOCK_STATS: AdBlockStats = {
  totalBlocked: 0,
  sessionBlocked: 0,
  perTab: {},
};

/** Default Memory stats */
const DEFAULT_MEMORY_STATS: MemoryStats = {
  sleepingTabs: 0,
  discardedTabs: 0,
  activeTabs: 1,
  estimatedSavedMB: 0,
};

export function useIpc(): IpcState & {
  // Actions
  createTab: (url?: string) => void;
  createPrivateTab: (url?: string) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  navigateTo: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stopLoading: () => void;
  vpnEnable: (region: string) => void;
  vpnDisable: () => void;
  restoreTab: (tabId: string) => void;
  findInPage: (text: string, options?: { forward?: boolean; findNext?: boolean }) => void;
  findStop: (action?: 'clearSelection' | 'keepSelection' | 'activateSelection') => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  toggleDevTools: () => void;
} {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>(DEFAULT_VPN_STATUS);
  const [adBlockStats, setAdBlockStats] = useState<AdBlockStats>(DEFAULT_ADBLOCK_STATS);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>(DEFAULT_MEMORY_STATS);
  const [downloads, setDownloads] = useState<DownloadItemInfo[]>([]);
  const [findMatchInfo, setFindMatchInfo] = useState<FindMatchInfo | null>(null);

  const getApi = () => typeof window !== 'undefined' ? window.muthuAPI : undefined;

  // ─── Subscribe to Main Process Events ────────────────────────
  useEffect(() => {
    const api = getApi();
    if (!api) return;

    const unsubTabs = api.onTabUpdated((updatedTabs) => {
      setTabs(updatedTabs);
      const active = updatedTabs.find((t) => t.status === 'active') ?? updatedTabs[0];
      if (active) setActiveTabId(active.id);
    });

    const unsubVpn = api.onVpnStatusChanged((status) => {
      setVpnStatus(status);
    });

    const unsubAdBlock = api.onAdBlockStatsUpdated((stats) => {
      setAdBlockStats(stats);
    });

    const unsubMemory = api.onMemoryStatsUpdated((stats) => {
      setMemoryStats(stats);
    });

    const unsubDownloads = api.onDownloadUpdated?.((dlList) => {
      setDownloads(dlList);
    });

    const unsubFind = api.onFindMatch?.((info) => {
      setFindMatchInfo(info);
    });

    // Fetch initial state safely
    api.getTabList().then((initialTabs) => {
      if (initialTabs) {
        setTabs(initialTabs);
        const active = initialTabs.find((t) => t.status === 'active') ?? initialTabs[0];
        if (active) setActiveTabId(active.id);
      }
    }).catch((err) => console.warn('[useIpc] getTabList error:', err));

    api.getVpnStatus().then((status) => {
      if (status) setVpnStatus(status);
    }).catch((err) => console.warn('[useIpc] getVpnStatus error:', err));

    api.getAdBlockStats().then((stats) => {
      if (stats) setAdBlockStats(stats);
    }).catch((err) => console.warn('[useIpc] getAdBlockStats error:', err));

    api.getMemoryStats().then((stats) => {
      if (stats) setMemoryStats(stats);
    }).catch((err) => console.warn('[useIpc] getMemoryStats error:', err));

    api.getDownloads?.().then((dlList) => {
      if (dlList) setDownloads(dlList);
    }).catch((err) => console.warn('[useIpc] getDownloads error:', err));

    // Cleanup subscriptions on unmount
    return () => {
      unsubTabs();
      unsubVpn();
      unsubAdBlock();
      unsubMemory();
      unsubDownloads?.();
      unsubFind?.();
    };
  }, []);

  // ─── Action Callbacks ────────────────────────────────────────

  const createTab = useCallback((url?: string) => {
    getApi()?.createTab(url).catch((err) => console.warn('[useIpc] createTab error:', err));
  }, []);

  const createPrivateTab = useCallback((url?: string) => {
    getApi()?.createPrivateTab(url).catch((err) => console.warn('[useIpc] createPrivateTab error:', err));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    getApi()?.closeTab(tabId).catch((err) => console.warn('[useIpc] closeTab error:', err));
  }, []);

  const switchTab = useCallback((tabId: string) => {
    getApi()?.switchTab(tabId).catch((err) => console.warn('[useIpc] switchTab error:', err));
  }, []);

  const navigateTo = useCallback((url: string) => {
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (targetId) {
      getApi()?.navigateTo(targetId, url).catch((err) => console.warn('[useIpc] navigateTo error:', err));
    }
  }, [activeTabId, tabs]);

  const goBack = useCallback(() => {
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (targetId) {
      getApi()?.goBack(targetId).catch((err) => console.warn('[useIpc] goBack error:', err));
    }
  }, [activeTabId, tabs]);

  const goForward = useCallback(() => {
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (targetId) {
      getApi()?.goForward(targetId).catch((err) => console.warn('[useIpc] goForward error:', err));
    }
  }, [activeTabId, tabs]);

  const reload = useCallback(() => {
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (targetId) {
      getApi()?.reload(targetId).catch((err) => console.warn('[useIpc] reload error:', err));
    }
  }, [activeTabId, tabs]);

  const stopLoading = useCallback(() => {
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (targetId) {
      getApi()?.stopLoading(targetId).catch((err) => console.warn('[useIpc] stopLoading error:', err));
    }
  }, [activeTabId, tabs]);

  const vpnEnable = useCallback((region: string) => {
    getApi()?.vpnEnable(region).then((newStatus) => {
      if (newStatus) setVpnStatus(newStatus);
    }).catch(() => {
      setVpnStatus({ enabled: false, region: region as VpnStatus['region'], state: 'error', endpoint: 'none' });
    });
  }, []);

  const vpnDisable = useCallback(() => {
    getApi()?.vpnDisable().then((newStatus) => {
      if (newStatus) setVpnStatus(newStatus);
    }).catch(() => {
      setVpnStatus({ enabled: false, region: 'US', state: 'disconnected', endpoint: 'none' });
    });
  }, []);

  const restoreTab = useCallback((tabId: string) => {
    getApi()?.restoreTab(tabId).catch((err) => console.warn('[useIpc] restoreTab error:', err));
  }, []);

  const findInPage = useCallback((text: string, options?: { forward?: boolean; findNext?: boolean }) => {
    getApi()?.findInPage(text, options).catch((err) => console.warn('[useIpc] findInPage error:', err));
  }, []);

  const findStop = useCallback((action?: 'clearSelection' | 'keepSelection' | 'activateSelection') => {
    getApi()?.findStop(action).catch((err) => console.warn('[useIpc] findStop error:', err));
  }, []);

  const zoomIn = useCallback(() => {
    getApi()?.zoomIn().catch((err) => console.warn('[useIpc] zoomIn error:', err));
  }, []);

  const zoomOut = useCallback(() => {
    getApi()?.zoomOut().catch((err) => console.warn('[useIpc] zoomOut error:', err));
  }, []);

  const zoomReset = useCallback(() => {
    getApi()?.zoomReset().catch((err) => console.warn('[useIpc] zoomReset error:', err));
  }, []);

  const toggleDevTools = useCallback(() => {
    getApi()?.toggleDevTools().catch((err) => console.warn('[useIpc] toggleDevTools error:', err));
  }, []);

  return {
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
    restoreTab,
    findInPage,
    findStop,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleDevTools,
  };
}
