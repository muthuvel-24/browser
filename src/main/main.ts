/**
 * Muthu Browser — Main Process Entry Point
 *
 * Bootstraps the Electron application:
 * 1. Applies Chromium memory-optimization flags
 * 2. Creates the BaseWindow + toolbar WebContentsView (React UI)
 * 3. Initializes TabManager, MemoryManager, AdBlockEngine, ProxyManager
 * 4. Registers all IPC handlers for renderer ↔ main communication
 */

import { app, BaseWindow, WebContentsView, ipcMain, session, Menu } from 'electron';
import type { Session } from 'electron';
import path from 'path';
import { TabManager } from './tab-manager';
import { MemoryManager } from './memory-manager';
import { AdBlockEngine } from './adblock-engine';
import { ProxyManager } from './proxy-manager';
import { normalizeUrl } from './url-utils';
import { IPC } from '../shared/ipc-channels';
import type { VpnRegion } from './types';

/**
 * Remove framing restrictions so embedded content (and sites that nest iframes)
 * can load inside Muthu. Top-level WebContentsView navigations do not need this,
 * but it prevents CSP frame-ancestors errors for any in-page frames.
 */
function stripFrameAncestors(targetSession: Session): void {
  targetSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...(details.responseHeaders ?? {}) };

    for (const key of Object.keys(responseHeaders)) {
      const lower = key.toLowerCase();
      if (lower === 'x-frame-options') {
        delete responseHeaders[key];
        continue;
      }
      if (lower === 'content-security-policy' || lower === 'content-security-policy-report-only') {
        const values = responseHeaders[key];
        if (!values) continue;
        const list = Array.isArray(values) ? values : [values];
        const rewritten = list
          .map((csp) =>
            String(csp)
              .split(';')
              .map((d) => d.trim())
              .filter((d) => d && !d.toLowerCase().startsWith('frame-ancestors'))
              .join('; ')
          )
          .filter(Boolean);
        if (rewritten.length === 0) delete responseHeaders[key];
        else responseHeaders[key] = rewritten;
      }
    }

    callback({ responseHeaders });
  });
}

// ─── Chromium Flags for Memory Optimization ─────────────────────
// These must be set before app.whenReady()

// Cap per-renderer V8 heap to 128 MB (default is ~1.4 GB)
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');

// Reduce GPU process memory usage
app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '0');

// Limit the number of renderer processes in the pool
app.commandLine.appendSwitch('renderer-process-limit', '6');

// ─── Electron Forge Vite Dev Server Environment Variables ───────
// These are injected by @electron-forge/plugin-vite at build time
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// ─── Global References ─────────────────────────────────────────
let mainWindow: BaseWindow | null = null;
let toolbarView: WebContentsView | null = null;
let tabManager: TabManager;
let memoryManager: MemoryManager;
let adBlockEngine: AdBlockEngine;
let proxyManager: ProxyManager;

// ─── Window Creation ────────────────────────────────────────────

async function createMainWindow(): Promise<void> {
  // Remove 1990s native desktop menu bar (File Edit View Window Help) for clean Opera look
  Menu.setApplicationMenu(null);

  // Create the top-level BaseWindow (no built-in webContents)
  mainWindow = new BaseWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 400,
    title: 'Muthu',
    backgroundColor: '#0f0f1a',
    // No frame on Windows/Linux for a cleaner look — keep frame on macOS
    // frame: process.platform === 'darwin',
    // titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
  });

  // ─── Toolbar View (React UI) ─────────────────────────────────
  toolbarView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Set toolbar bounds (full width, 82px height at top)
  const contentBounds = mainWindow.getContentBounds();
  toolbarView.setBounds({
    x: 0,
    y: 0,
    width: contentBounds.width,
    height: 110,
  });
  toolbarView.setBackgroundColor('#0f0f1a');

  mainWindow.contentView.addChildView(toolbarView);

  // Load the React renderer into the toolbar view
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    toolbarView.webContents.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    toolbarView.webContents.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // ─── Initialize Core Modules ──────────────────────────────────

  // Tab Manager
  tabManager = new TabManager(mainWindow);
  tabManager.setToolbarView(toolbarView);

  // Wire tab updates → renderer
  tabManager.onTabsUpdated = (tabs) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.TAB_UPDATED, tabs);
    }
  };

  // Memory Manager
  memoryManager = new MemoryManager({
    getBackgroundTabIds: () => tabManager.getBackgroundTabIds(),
    getLastActiveTime: (tabId) => tabManager.getLastActiveTime(tabId),
    getTabStatus: (tabId) => tabManager.getTabStatus(tabId),
    sleepTab: (tabId) => tabManager.sleepTab(tabId),
    discardTab: (tabId) => tabManager.discardTab(tabId),
  });

  memoryManager.onStatsUpdated = (stats) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.MEMORY_STATS_UPDATED, stats);
    }
  };

  memoryManager.start();

  // Ad Blocker Engine
  adBlockEngine = new AdBlockEngine();
  adBlockEngine.onStatsUpdated = (stats) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.ADBLOCK_STATS_UPDATED, stats);
    }
  };

  try {
    await adBlockEngine.initialize();
    // Enable ad-blocking on the persistent partition used by tabs
    const tabSession = session.fromPartition('persist:muthu');
    adBlockEngine.enableOnSession(tabSession);
  } catch (err) {
    console.error('[Main] AdBlock engine initialization failed (non-fatal):', err);
  }

  // Proxy Manager
  proxyManager = new ProxyManager();
  proxyManager.onStatusChanged = (status) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.VPN_STATUS_CHANGED, status);
    }
  };

  // Set standard Chrome User-Agent on the persistent partition session
  const tabSession = session.fromPartition('persist:muthu');
  tabSession.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  // Allow nested frames inside tab pages (sites that set frame-ancestors / X-Frame-Options)
  stripFrameAncestors(tabSession);
  if (toolbarView) {
    stripFrameAncestors(toolbarView.webContents.session);
  }

  // ─── Create Initial User-Requested Tabs in Muthu Browser ─────
  tabManager.createTab('https://www.google.com');
  tabManager.createTab('https://www.youtube.com/results?search_query=jeans+movie+songs');
  tabManager.createTab('https://drive.google.com');
  tabManager.createTab('https://gemini.google.com');

  // ─── Handle Window Resize ─────────────────────────────────────
  mainWindow.on('resize', () => {
    if (!mainWindow || !toolbarView) return;
    const bounds = mainWindow.getContentBounds();
    toolbarView.setBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: 110,
    });
  });

  // ─── Cleanup ──────────────────────────────────────────────────
  mainWindow.on('closed', () => {
    memoryManager.stop();
    mainWindow = null;
    toolbarView = null;
  });
}

// ─── Downloads Tracking ─────────────────────────────────────────
import type { DownloadItemInfo } from './types';

const downloads: DownloadItemInfo[] = [];

function setupDownloadListener(): void {
  const tabSession = session.fromPartition('persist:muthu');
  tabSession.on('will-download', (_event, item) => {
    const downloadId = String(Date.now());
    const info: DownloadItemInfo = {
      id: downloadId,
      filename: item.getFilename(),
      savePath: item.getSavePath(),
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      state: 'progressing',
      startTime: Date.now(),
    };
    downloads.unshift(info);
    broadcastDownloads();

    item.on('updated', (_event, state) => {
      info.receivedBytes = item.getReceivedBytes();
      info.savePath = item.getSavePath();
      info.state = state === 'interrupted' ? 'interrupted' : 'progressing';
      broadcastDownloads();
    });

    item.once('done', (_event, state) => {
      info.receivedBytes = item.getReceivedBytes();
      info.state = state === 'completed' ? 'completed' : 'cancelled';
      broadcastDownloads();
    });
  });
}

function broadcastDownloads(): void {
  if (toolbarView && !toolbarView.webContents.isDestroyed()) {
    toolbarView.webContents.send(IPC.DOWNLOAD_UPDATED, downloads);
  }
}

// ─── IPC Handlers ───────────────────────────────────────────────

function registerIpcHandlers(): void {
  // ── Tab Management ──────────────────────────────────────────
  ipcMain.handle(IPC.TAB_CREATE, (_event, url?: string) => {
    if (!tabManager) return '';
    const normalizedUrl = url ? normalizeUrl(url) : undefined;
    return tabManager.createTab(normalizedUrl, false);
  });

  ipcMain.handle(IPC.TAB_CREATE_PRIVATE, (_event, url?: string) => {
    if (!tabManager) return '';
    const normalizedUrl = url ? normalizeUrl(url) : undefined;
    return tabManager.createTab(normalizedUrl, true);
  });

  ipcMain.handle(IPC.TAB_CLOSE, (_event, tabId: string) => {
    tabManager?.closeTab(tabId);
  });

  ipcMain.handle(IPC.TAB_SWITCH, (_event, tabId: string) => {
    tabManager?.switchTab(tabId);
  });

  ipcMain.handle(IPC.TAB_NAVIGATE, (_event, tabId: string, url: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) {
      const normalizedUrl = normalizeUrl(url);
      tabManager.navigateTo(targetId, normalizedUrl);
    }
  });

  ipcMain.handle(IPC.TAB_GO_BACK, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) {
      tabManager.goBack(targetId);
    }
  });

  ipcMain.handle(IPC.TAB_GO_FORWARD, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) {
      tabManager.goForward(targetId);
    }
  });

  ipcMain.handle(IPC.TAB_RELOAD, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) {
      tabManager.reload(targetId);
    }
  });

  ipcMain.handle(IPC.TAB_STOP, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) {
      tabManager.stopLoading(targetId);
    }
  });

  ipcMain.handle(IPC.TAB_LIST, () => {
    return tabManager?.getTabList() ?? [];
  });

  ipcMain.handle(IPC.TOOLBAR_FOCUS, () => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.focus();
    }
  });

  ipcMain.handle(IPC.CONTENT_FOCUS, () => {
    tabManager?.focusActiveTab();
  });

  // ── Find in Page ─────────────────────────────────────────────
  ipcMain.handle(IPC.FIND_IN_PAGE, (_event, text: string, options?: { forward?: boolean; findNext?: boolean }) => {
    tabManager?.findInPage(text, options);
  });

  ipcMain.handle(IPC.FIND_STOP, (_event, action?: 'clearSelection' | 'keepSelection' | 'activateSelection') => {
    tabManager?.findStop(action);
  });

  // ── Zoom & DevTools ──────────────────────────────────────────
  ipcMain.handle(IPC.ZOOM_IN, () => {
    return tabManager?.zoomIn() ?? 1;
  });

  ipcMain.handle(IPC.ZOOM_OUT, () => {
    return tabManager?.zoomOut() ?? 1;
  });

  ipcMain.handle(IPC.ZOOM_RESET, () => {
    return tabManager?.zoomReset() ?? 1;
  });

  ipcMain.handle(IPC.DEVTOOLS_TOGGLE, () => {
    tabManager?.toggleDevTools();
  });

  // ── Downloads ────────────────────────────────────────────────
  ipcMain.handle(IPC.DOWNLOAD_GET_LIST, () => {
    return downloads;
  });

  // ── VPN / Proxy ─────────────────────────────────────────────
  ipcMain.handle(IPC.VPN_ENABLE, async (_event, region: VpnRegion) => {
    if (!proxyManager) return { enabled: false, region, state: 'disconnected', endpoint: 'none' };
    await proxyManager.enable(region);
    return proxyManager.getStatus();
  });

  ipcMain.handle(IPC.VPN_DISABLE, async () => {
    if (!proxyManager) return { enabled: false, region: 'US', state: 'disconnected', endpoint: 'none' };
    await proxyManager.disable();
    return proxyManager.getStatus();
  });

  ipcMain.handle(IPC.VPN_GET_STATUS, () => {
    return proxyManager?.getStatus() ?? { enabled: false, region: 'US', state: 'disconnected', endpoint: 'none' };
  });

  // ── Ad Blocker ──────────────────────────────────────────────
  ipcMain.handle(IPC.ADBLOCK_GET_STATS, () => {
    return adBlockEngine?.getStats() ?? { totalBlocked: 0, sessionBlocked: 0, perTab: {} };
  });

  // ── Memory Manager ─────────────────────────────────────────
  ipcMain.handle(IPC.MEMORY_GET_STATS, () => {
    return memoryManager?.getStats() ?? { sleepingTabs: 0, discardedTabs: 0, activeTabs: 1, estimatedSavedMB: 0 };
  });

  ipcMain.handle(IPC.MEMORY_RESTORE_TAB, (_event, tabId: string) => {
    tabManager?.restoreTab(tabId);
  });
}

// ─── App Lifecycle ──────────────────────────────────────────────

app.whenReady().then(async () => {
  registerIpcHandlers();
  setupDownloadListener();
  await createMainWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked
    if (!mainWindow) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
