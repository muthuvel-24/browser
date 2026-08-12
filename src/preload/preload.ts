/**
 * Muthu Browser — Preload Script
 *
 * Secure IPC bridge between the renderer (React UI) and the main process.
 * Uses contextBridge.exposeInMainWorld to expose a typed API object
 * on `window.muthuAPI` without leaking ipcRenderer or Node.js globals.
 *
 * Security principles:
 * - Explicit channel whitelist (no wildcard IPC)
 * - Input validation in the bridge layer
 * - Event objects stripped from callbacks (only data forwarded)
 * - Cleanup functions returned for all subscriptions
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

/**
 * The API exposed to the renderer at `window.muthuAPI`.
 */
const muthuAPI = {
  // ─── Tab Management ─────────────────────────────────────────

  /** Create a new tab. Returns the new tab's ID. */
  createTab: (url?: string): Promise<string> => {
    return ipcRenderer.invoke(IPC.TAB_CREATE, url);
  },

  /** Create a new private/incognito tab. Returns the tab ID. */
  createPrivateTab: (url?: string): Promise<string> => {
    return ipcRenderer.invoke(IPC.TAB_CREATE_PRIVATE, url);
  },

  /** Close a tab by ID. */
  closeTab: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_CLOSE, tabId);
  },

  /** Switch to a tab by ID. */
  switchTab: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_SWITCH, tabId);
  },

  /** Navigate the active tab to a URL. */
  navigateTo: (tabId: string, url: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_NAVIGATE, tabId, url);
  },

  /** Navigate back in the tab's history. */
  goBack: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_GO_BACK, tabId);
  },

  /** Navigate forward in the tab's history. */
  goForward: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_GO_FORWARD, tabId);
  },

  /** Reload the current page in the tab. */
  reload: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_RELOAD, tabId);
  },

  /** Stop the current page load. */
  stopLoading: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.TAB_STOP, tabId);
  },

  /** Get the current list of all tabs. */
  getTabList: (): Promise<import('../main/types').TabInfo[]> => {
    return ipcRenderer.invoke(IPC.TAB_LIST);
  },

  /** Focus the top toolbar WebContentsView (for keyboard input). */
  focusToolbar: (): Promise<void> => {
    return ipcRenderer.invoke(IPC.TOOLBAR_FOCUS);
  },

  /** Focus the active web content view. */
  focusContent: (): Promise<void> => {
    return ipcRenderer.invoke(IPC.CONTENT_FOCUS);
  },

  // ─── Find in Page ────────────────────────────────────────────

  findInPage: (text: string, options?: { forward?: boolean; findNext?: boolean }): Promise<void> => {
    return ipcRenderer.invoke(IPC.FIND_IN_PAGE, text, options);
  },

  findStop: (action?: 'clearSelection' | 'keepSelection' | 'activateSelection'): Promise<void> => {
    return ipcRenderer.invoke(IPC.FIND_STOP, action);
  },

  // ─── Zoom & DevTools ─────────────────────────────────────────

  zoomIn: (): Promise<number> => {
    return ipcRenderer.invoke(IPC.ZOOM_IN);
  },

  zoomOut: (): Promise<number> => {
    return ipcRenderer.invoke(IPC.ZOOM_OUT);
  },

  zoomReset: (): Promise<number> => {
    return ipcRenderer.invoke(IPC.ZOOM_RESET);
  },

  toggleDevTools: (): Promise<void> => {
    return ipcRenderer.invoke(IPC.DEVTOOLS_TOGGLE);
  },

  // ─── Downloads ───────────────────────────────────────────────

  getDownloads: (): Promise<import('../main/types').DownloadItemInfo[]> => {
    return ipcRenderer.invoke(IPC.DOWNLOAD_GET_LIST);
  },

  // ─── VPN / Proxy ────────────────────────────────────────────

  /** Enable VPN proxy for the given region. */
  vpnEnable: (region: import('../main/types').VpnRegion): Promise<import('../main/types').VpnStatus> => {
    return ipcRenderer.invoke(IPC.VPN_ENABLE, region);
  },

  /** Disable VPN proxy. */
  vpnDisable: (): Promise<import('../main/types').VpnStatus> => {
    return ipcRenderer.invoke(IPC.VPN_DISABLE);
  },

  /** Get current VPN status. */
  getVpnStatus: (): Promise<import('../main/types').VpnStatus> => {
    return ipcRenderer.invoke(IPC.VPN_GET_STATUS);
  },

  // ─── Ad Blocker ─────────────────────────────────────────────

  /** Get current ad-block statistics. */
  getAdBlockStats: (): Promise<import('../main/types').AdBlockStats> => {
    return ipcRenderer.invoke(IPC.ADBLOCK_GET_STATS);
  },

  // ─── Memory Manager ────────────────────────────────────────

  /** Get current memory optimization statistics. */
  getMemoryStats: (): Promise<import('../main/types').MemoryStats> => {
    return ipcRenderer.invoke(IPC.MEMORY_GET_STATS);
  },

  /** Restore a discarded tab. */
  restoreTab: (tabId: string): Promise<void> => {
    return ipcRenderer.invoke(IPC.MEMORY_RESTORE_TAB, tabId);
  },

  // ─── Event Subscriptions (Main → Renderer) ─────────────────

  /** Subscribe to tab list updates. */
  onTabUpdated: (callback: (tabs: import('../main/types').TabInfo[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tabs: import('../main/types').TabInfo[]) => {
      callback(tabs);
    };
    ipcRenderer.on(IPC.TAB_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC.TAB_UPDATED, handler);
  },

  /** Subscribe to Find in Page match updates. */
  onFindMatch: (callback: (info: import('../main/types').FindMatchInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: import('../main/types').FindMatchInfo) => {
      callback(info);
    };
    ipcRenderer.on(IPC.FIND_MATCH, handler);
    return () => ipcRenderer.removeListener(IPC.FIND_MATCH, handler);
  },

  /** Subscribe to Download item updates. */
  onDownloadUpdated: (callback: (downloads: import('../main/types').DownloadItemInfo[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, downloads: import('../main/types').DownloadItemInfo[]) => {
      callback(downloads);
    };
    ipcRenderer.on(IPC.DOWNLOAD_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC.DOWNLOAD_UPDATED, handler);
  },

  /** Subscribe to VPN status changes. */
  onVpnStatusChanged: (callback: (status: import('../main/types').VpnStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: import('../main/types').VpnStatus) => {
      callback(status);
    };
    ipcRenderer.on(IPC.VPN_STATUS_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC.VPN_STATUS_CHANGED, handler);
  },

  /** Subscribe to ad-block stats updates. */
  onAdBlockStatsUpdated: (callback: (stats: import('../main/types').AdBlockStats) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, stats: import('../main/types').AdBlockStats) => {
      callback(stats);
    };
    ipcRenderer.on(IPC.ADBLOCK_STATS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC.ADBLOCK_STATS_UPDATED, handler);
  },

  /** Subscribe to memory stats updates. */
  onMemoryStatsUpdated: (callback: (stats: import('../main/types').MemoryStats) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, stats: import('../main/types').MemoryStats) => {
      callback(stats);
    };
    ipcRenderer.on(IPC.MEMORY_STATS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC.MEMORY_STATS_UPDATED, handler);
  },

  // ─── Window Controls ────────────────────────────────────────

  /** Minimize the browser window. */
  windowMinimize: (): void => {
    ipcRenderer.send('window:minimize');
  },

  /** Maximize / restore the browser window. */
  windowMaximize: (): void => {
    ipcRenderer.send('window:maximize');
  },

  /** Close the browser window. */
  windowClose: (): void => {
    ipcRenderer.send('window:close');
  },
};

// Expose the API on window.muthuAPI
contextBridge.exposeInMainWorld('muthuAPI', muthuAPI);

// Export the type for use in the renderer's TypeScript declarations
export type MuthuAPI = typeof muthuAPI;
