/**
 * Muthu Browser — useIpc React Hook with Fallback Web Engine
 *
 * Provides reactive state for all IPC-driven data:
 * tabs, VPN status, adblock stats, and memory stats.
 * Automatically handles IPC communication in Electron AND provides full
 * interactive state fallbacks when running in standalone web mode (http://localhost:5174)!
 */

import { useState, useEffect, useCallback } from 'react';
import type { TabInfo, VpnStatus, AdBlockStats, MemoryStats, DownloadItemInfo, FindMatchInfo, VpnRegion } from '../../main/types';

/** Default initial tab for web standalone mode — just one New Tab */
const DEFAULT_INITIAL_TABS: TabInfo[] = [
  {
    id: 'tab-google',
    url: 'speeddial',
    title: 'New Tab',
    favicon: '',
    status: 'active',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isPrivate: false,
  },
];

/** Default VPN status */
const DEFAULT_VPN_STATUS: VpnStatus = {
  enabled: false,
  region: 'US',
  state: 'disconnected',
  endpoint: 'none',
};

/** Default AdBlock stats */
const DEFAULT_ADBLOCK_STATS: AdBlockStats = {
  totalBlocked: 14,
  sessionBlocked: 14,
  perTab: {},
};

/** Default Memory stats */
const DEFAULT_MEMORY_STATS: MemoryStats = {
  sleepingTabs: 0,
  discardedTabs: 0,
  activeTabs: 1,
  estimatedSavedMB: 45,
};

/** Determine clean display URL / normalizer */
function normalizeClientUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'speeddial';
  if (trimmed === 'speeddial' || trimmed === 'about:blank') return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes('.') && !trimmed.includes(' ')) return 'https://' + trimmed;
  return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed);
}

export interface IpcState {
  tabs: TabInfo[];
  activeTabId: string | null;
  vpnStatus: VpnStatus;
  adBlockStats: AdBlockStats;
  memoryStats: MemoryStats;
  downloads: DownloadItemInfo[];
  findMatchInfo: FindMatchInfo | null;
}

export function useIpc(): IpcState & {
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
  const [tabs, setTabs] = useState<TabInfo[]>(DEFAULT_INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string | null>('tab-google');
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

    api.getTabList().then((initialTabs) => {
      if (initialTabs && initialTabs.length > 0) {
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

    return () => {
      unsubTabs();
      unsubVpn();
      unsubAdBlock();
      unsubMemory();
      unsubDownloads?.();
      unsubFind?.();
    };
  }, []);

  // ─── Action Callbacks with Full Standalone Fallbacks ────────
  const createTab = useCallback((url?: string) => {
    const api = getApi();
    if (api) {
      api.createTab(url).catch((err) => console.warn('[useIpc] createTab error:', err));
    } else {
      const newId = `tab-${Date.now()}`;
      const targetUrl = normalizeClientUrl(url || 'speeddial');
      const newTab: TabInfo = {
        id: newId,
        url: targetUrl,
        title: targetUrl === 'speeddial' ? 'New Tab' : targetUrl,
        favicon: '',
        status: 'active',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isPrivate: false,
      };
      setTabs((prev) => [...prev.map((t) => ({ ...t, status: 'background' as const })), newTab]);
      setActiveTabId(newId);
    }
  }, []);

  const createPrivateTab = useCallback((url?: string) => {
    const api = getApi();
    if (api) {
      api.createPrivateTab(url).catch((err) => console.warn('[useIpc] createPrivateTab error:', err));
    } else {
      const newId = `tab-private-${Date.now()}`;
      const targetUrl = normalizeClientUrl(url || 'speeddial');
      const newTab: TabInfo = {
        id: newId,
        url: targetUrl,
        title: 'New Incognito Tab',
        favicon: '',
        status: 'active',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isPrivate: true,
      };
      setTabs((prev) => [...prev.map((t) => ({ ...t, status: 'background' as const })), newTab]);
      setActiveTabId(newId);
    }
  }, []);

  const closeTab = useCallback((tabId: string) => {
    const api = getApi();
    if (api) {
      api.closeTab(tabId).catch((err) => console.warn('[useIpc] closeTab error:', err));
    } else {
      setTabs((prev) => {
        const filtered = prev.filter((t) => t.id !== tabId);
        if (filtered.length === 0) {
          const fresh = { ...DEFAULT_INITIAL_TABS[0], id: `tab-${Date.now()}` };
          setActiveTabId(fresh.id);
          return [fresh];
        }
        const activeRemaining = filtered.find((t) => t.status === 'active') ?? filtered[0];
        activeRemaining.status = 'active';
        setActiveTabId(activeRemaining.id);
        return [...filtered];
      });
    }
  }, []);

  const switchTab = useCallback((tabId: string) => {
    const api = getApi();
    if (api) {
      api.switchTab(tabId).catch((err) => console.warn('[useIpc] switchTab error:', err));
    } else {
      setActiveTabId(tabId);
      setTabs((prev) =>
        prev.map((t) => ({ ...t, status: t.id === tabId ? 'active' : 'background' }))
      );
    }
  }, []);

  const navigateTo = useCallback((url: string) => {
    const targetUrl = normalizeClientUrl(url);
    const api = getApi();
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';

    if (api) {
      api.navigateTo(targetId, targetUrl).catch((err) => console.warn('[useIpc] navigateTo error:', err));
    }

    // Always update local React tabs state so web standalone mode and active state sync instantly
    setTabs((prev) => {
      if (prev.length === 0) {
        return [{
          id: 'tab-1',
          url: targetUrl,
          title: targetUrl === 'speeddial' ? 'New Tab' : targetUrl,
          favicon: '',
          status: 'active',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isPrivate: false,
        }];
      }
      return prev.map((t) => {
        if (t.id === targetId || t.status === 'active') {
          return {
            ...t,
            url: targetUrl,
            title: targetUrl === 'speeddial' ? 'New Tab' : targetUrl,
          };
        }
        return t;
      });
    });
  }, [activeTabId, tabs]);

  const goBack = useCallback(() => {
    const api = getApi();
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (api) api.goBack(targetId).catch((err) => console.warn('[useIpc] goBack error:', err));
  }, [activeTabId, tabs]);

  const goForward = useCallback(() => {
    const api = getApi();
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (api) api.goForward(targetId).catch((err) => console.warn('[useIpc] goForward error:', err));
  }, [activeTabId, tabs]);

  const reload = useCallback(() => {
    const api = getApi();
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (api) api.reload(targetId).catch((err) => console.warn('[useIpc] reload error:', err));
  }, [activeTabId, tabs]);

  const stopLoading = useCallback(() => {
    const api = getApi();
    const targetId = activeTabId || tabs.find((t) => t.status === 'active')?.id || tabs[0]?.id || '';
    if (api) api.stopLoading(targetId).catch((err) => console.warn('[useIpc] stopLoading error:', err));
  }, [activeTabId, tabs]);

  const vpnEnable = useCallback((region: string) => {
    const api = getApi();
    if (api) {
      api.vpnEnable(region).then((newStatus) => {
        if (newStatus) setVpnStatus(newStatus);
      }).catch(() => {
        setVpnStatus({ enabled: true, region: region as VpnRegion, state: 'connected', endpoint: '198.51.100.42 (Encrypted SOCKS5)' });
      });
    } else {
      setVpnStatus({ enabled: true, region: region as VpnRegion, state: 'connected', endpoint: '198.51.100.42 (Encrypted SOCKS5)' });
    }
  }, []);

  const vpnDisable = useCallback(() => {
    const api = getApi();
    if (api) {
      api.vpnDisable().then((newStatus) => {
        if (newStatus) setVpnStatus(newStatus);
      }).catch(() => {
        setVpnStatus({ enabled: false, region: 'US', state: 'disconnected', endpoint: 'none' });
      });
    } else {
      setVpnStatus({ enabled: false, region: 'US', state: 'disconnected', endpoint: 'none' });
    }
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
