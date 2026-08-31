/**
 * Muthu Browser — Main Process Entry Point
 *
 * Bootstraps the Electron application:
 * 1. Applies Chromium flags
 * 2. Creates BaseWindow + toolbar WebContentsView (React UI)
 * 3. Initializes TabManager, MemoryManager, AdBlockEngine, ProxyManager
 * 4. Registers all IPC handlers
 * 5. Intercepts ALL new-window / external-URL events globally so every
 *    site opens inside Muthu Browser — never in an external browser.
 */

import { app, BaseWindow, WebContentsView, ipcMain, session, Menu, shell } from 'electron';
import type { Session } from 'electron';
import path from 'path';
import { TabManager } from './tab-manager';
import { MemoryManager } from './memory-manager';
import { AdBlockEngine } from './adblock-engine';
import { ProxyManager } from './proxy-manager';
import { SettingsStore } from './settings-store';
import { normalizeUrl, isAuthOrPopup } from './url-utils';
import { IPC } from '../shared/ipc-channels';
import type { VpnRegion } from './types';
import type { BrowserSettings, ClearDataOptions } from './settings-types';
import {
  setupCertificateHandling,
  sanitizeFilename,
  isDangerousExtension,
  setupToolbarSecurityHeaders,
  setupTabSecurityHeaders,
  isSafeNavigation,
} from './security-manager';

// ─── Chromium Flags ─────────────────────────────────────────────
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '0');
app.commandLine.appendSwitch('renderer-process-limit', '8');
// Disable QUIC protocol (HTTP/3 over UDP) to prevent net::ERR_QUIC_PROTOCOL_ERROR on Gmail/Google services
app.commandLine.appendSwitch('disable-quic');
// Disable Chromium automation signal checked by Google Sign-In ("This browser or app may not be secure")
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
// Avoid exposing a local address over WebRTC when a proxy is in use.
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');
// Encrypted DNS-over-HTTPS (DoH) — protects browsing queries from being logged by network servers or ISPs
app.commandLine.appendSwitch('enable-features', 'DnsOverHttps');
app.commandLine.appendSwitch('dns-over-https-mode', 'automatic');
app.commandLine.appendSwitch('dns-over-https-templates', 'https://cloudflare-dns.com/dns-query{?dns}');

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BaseWindow | null = null;
let toolbarView: WebContentsView | null = null;
let tabManager: TabManager;
let memoryManager: MemoryManager;
let adBlockEngine: AdBlockEngine;
let proxyManager: ProxyManager;
let settingsStore: SettingsStore;
const configuredTabSessions = new WeakSet<Session>();

// ─── Chrome-compatible User-Agent & Client Hints ────────────────
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Configure User-Agent and Client Hints headers on a session to match standard Google Chrome Desktop.
 * Prevents Google Sign-In ("This browser or app may not be secure") blocks.
 */
function configureChromeHeaders(targetSession: Session): void {
  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...(details.requestHeaders ?? {}) };
    requestHeaders['User-Agent'] = CHROME_UA;
    requestHeaders['sec-ch-ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
    requestHeaders['sec-ch-ua-mobile'] = '?0';
    requestHeaders['sec-ch-ua-platform'] = '"Windows"';
    requestHeaders['sec-ch-ua-arch'] = '"x86"';
    requestHeaders['sec-ch-ua-bitness'] = '"64"';
    requestHeaders['sec-ch-ua-full-version-list'] = '"Google Chrome";v="131.0.6778.205", "Chromium";v="131.0.6778.205", "Not_A Brand";v="24.0.0.0"';

    if (settingsStore?.get('doNotTrack')) {
      requestHeaders['DNT'] = '1';
    }

    callback({ requestHeaders });
  });
}

// ─── Permission Hardening ───────────────────────────────────────
/** Allowed benign permissions by default */
const SAFE_PERMISSIONS = new Set(['fullscreen', 'clipboard-read', 'clipboard-sanitized-write']);

/**
 * Secure Permission Request Handler.
 * Restricts dangerous permissions (camera, microphone, geolocation) by default,
 * allowing only explicitly whitelisted safe permissions.
 */
function setupSecurePermissions(targetSession: Session): void {
  targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const isAllowed = SAFE_PERMISSIONS.has(permission);
    if (!isAllowed) {
      console.warn(`[Security] Restricted unprompted permission request: ${permission}`);
    }
    callback(isAllowed);
  });
}

// ─── URL validation helper ──────────────────────────────────────
function shouldOpenInMuthu(url: string): boolean {
  if (!url) return false;
  if (url === 'about:blank') return false;
  if (url.startsWith('devtools://')) return false;
  if (url.startsWith('data:')) return false;
  if (url.startsWith('blob:')) return false;
  return isSafeNavigation(url);
}

// ─── Window Creation ────────────────────────────────────────────
async function createMainWindow(): Promise<void> {
  Menu.setApplicationMenu(null);

  // Initialize Settings Store
  settingsStore = new SettingsStore();

  mainWindow = new BaseWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    title: 'Muthu Browser',
    backgroundColor: '#0f0f1a',
  });

  // ─── Toolbar (React UI) ──────────────────────────────────────
  toolbarView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,  // needed for preload script IPC
      nodeIntegration: false,
    },
  });

  const contentBounds = mainWindow.getContentBounds();
  toolbarView.setBounds({ x: 0, y: 0, width: contentBounds.width, height: 110 });
  toolbarView.setBackgroundColor('#0f0f1a');
  setupToolbarSecurityHeaders(toolbarView.webContents.session);
  mainWindow.contentView.addChildView(toolbarView);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await toolbarView.webContents.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    await toolbarView.webContents.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // ─── Sessions setup ──────────────────────────────────────────
  const tabSession = session.fromPartition('persist:muthu');
  tabSession.setUserAgent(CHROME_UA);
  session.defaultSession.setUserAgent(CHROME_UA);

  // Configure Chrome headers & Client Hints to satisfy Google Sign-In
  configureChromeHeaders(tabSession);
  configureChromeHeaders(session.defaultSession);

  // Enforce secure permission handlers & security headers
  setupSecurePermissions(tabSession);
  setupSecurePermissions(session.defaultSession);
  setupTabSecurityHeaders(tabSession);
  setupTabSecurityHeaders(session.defaultSession);

  // ─── Proxy Manager ───────────────────────────────────────────
  proxyManager = new ProxyManager();
  proxyManager.onStatusChanged = (status) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.VPN_STATUS_CHANGED, status);
    }
  };

  // ─── Ad Blocker ──────────────────────────────────────────────
  adBlockEngine = new AdBlockEngine();
  adBlockEngine.setEnabled(settingsStore.get('adBlockerEnabled'));
  adBlockEngine.setWhitelist(settingsStore.get('adBlockerWhitelist'));
  adBlockEngine.onStatsUpdated = (stats) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.ADBLOCK_STATS_UPDATED, stats);
    }
  };
  try {
    await adBlockEngine.initialize();
    adBlockEngine.enableOnSession(tabSession);
  } catch (err) {
    console.error('[Main] AdBlock init failed (non-fatal):', err);
  }

  // Hook Settings changes
  settingsStore.onSettingsChanged = (settings) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.SETTINGS_CHANGED, settings);
    }
    adBlockEngine.setEnabled(settings.adBlockerEnabled);
    adBlockEngine.setWhitelist(settings.adBlockerWhitelist);
  };

  // Auto-connect VPN if setting enabled
  if (settingsStore.get('vpnAutoConnect')) {
    void proxyManager.enable(settingsStore.get('vpnDefaultRegion')).catch(() => {});
  }

  const configureTabSession = (targetSession: Session) => {
    if (configuredTabSessions.has(targetSession)) return;
    configuredTabSessions.add(targetSession);
    targetSession.setUserAgent(CHROME_UA);
    configureChromeHeaders(targetSession);
    setupSecurePermissions(targetSession);
    adBlockEngine.enableOnSession(targetSession);
    void proxyManager.applyToSession(targetSession).catch(() => {});
  };
  configureTabSession(tabSession);

  // ─── Tab Manager ─────────────────────────────────────────────
  tabManager = new TabManager(mainWindow, configureTabSession);
  tabManager.setToolbarView(toolbarView);
  tabManager.onTabsUpdated = (tabs) => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.send(IPC.TAB_UPDATED, tabs);
    }
  };

  // ─── Memory Manager (relaxed — 30 min sleep, 60 min discard) ─
  memoryManager = new MemoryManager({
    sleepThresholdMs: 30 * 60 * 1000,   // 30 minutes
    discardThresholdMs: 60 * 60 * 1000,  // 60 minutes
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

  // ─── Initial Tabs ─────────────────────────────────────────────
  // Start with Google (New Tab) as the only active tab
  tabManager.createTab('https://www.google.com');

  // ─── Resize Handler ──────────────────────────────────────────
  mainWindow.on('resize', () => {
    if (!mainWindow || !toolbarView) return;
    const bounds = mainWindow.getContentBounds();
    toolbarView.setBounds({ x: 0, y: 0, width: bounds.width, height: 110 });
  });

  mainWindow.on('closed', () => {
    memoryManager.stop();
    mainWindow = null;
    toolbarView = null;
  });
}

// ─── Window Control IPC ─────────────────────────────────────────
function registerWindowControls(): void {
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });
}

// ─── Downloads ──────────────────────────────────────────────────
import type { DownloadItemInfo } from './types';
const downloads: DownloadItemInfo[] = [];

function setupDownloadListener(): void {
  const tabSession = session.fromPartition('persist:muthu');
  tabSession.on('will-download', (_event, item) => {
    const rawFilename = item.getFilename();
    const safeFilename = sanitizeFilename(rawFilename);
    const isDangerous = isDangerousExtension(rawFilename);

    if (isDangerous && settingsStore?.get('warnDangerousDownloads')) {
      console.warn(`[Security] Dangerous download detected: ${safeFilename}`);
    }

    const defaultPath = settingsStore?.get('downloadPath');
    const askBefore = settingsStore?.get('askBeforeDownload');

    if (defaultPath && !askBefore) {
      try {
        item.setSavePath(path.join(defaultPath, safeFilename));
      } catch {
        // Fallback to default save path
      }
    }

    const downloadId = String(Date.now());
    const info: DownloadItemInfo = {
      id: downloadId,
      filename: safeFilename,
      savePath: item.getSavePath(),
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      state: 'progressing',
      startTime: Date.now(),
    };
    downloads.unshift(info);
    broadcastDownloads();
    item.on('updated', (_e, state) => {
      info.receivedBytes = item.getReceivedBytes();
      info.savePath = item.getSavePath();
      info.state = state === 'interrupted' ? 'interrupted' : 'progressing';
      broadcastDownloads();
    });
    item.once('done', (_e, state) => {
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

async function handleClearBrowsingData(options: ClearDataOptions): Promise<void> {
  const tabSession = session.fromPartition('persist:muthu');
  const storagesToClear: ('cookies' | 'localstorage' | 'indexdb' | 'serviceworkers' | 'cachestorage')[] = [];
  if (options.cookies) storagesToClear.push('cookies');
  if (options.localStorage) storagesToClear.push('localstorage');
  if (options.indexedDB) storagesToClear.push('indexdb');
  if (options.serviceWorkers) storagesToClear.push('serviceworkers');
  if (options.cache) storagesToClear.push('cachestorage');

  if (storagesToClear.length > 0) {
    await tabSession.clearStorageData({ storages: storagesToClear });
  }
  if (options.cache) {
    await tabSession.clearCache();
    await tabSession.clearHostResolverCache();
    await tabSession.clearAuthCache();
  }
}

// ─── IPC Handlers ───────────────────────────────────────────────
function registerIpcHandlers(): void {
  ipcMain.handle(IPC.TAB_CREATE, (_event, url?: string) => {
    if (!tabManager) return '';
    return tabManager.createTab(url ? normalizeUrl(url) : undefined, false);
  });

  ipcMain.handle(IPC.TAB_CREATE_PRIVATE, (_event, url?: string) => {
    if (!tabManager) return '';
    return tabManager.createTab(url ? normalizeUrl(url) : undefined, true);
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
    if (targetId) tabManager.navigateTo(targetId, normalizeUrl(url));
  });

  ipcMain.handle(IPC.TAB_GO_BACK, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) tabManager.goBack(targetId);
  });

  ipcMain.handle(IPC.TAB_GO_FORWARD, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) tabManager.goForward(targetId);
  });

  ipcMain.handle(IPC.TAB_RELOAD, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) tabManager.reload(targetId);
  });

  ipcMain.handle(IPC.TAB_STOP, (_event, tabId: string) => {
    if (!tabManager) return;
    const targetId = tabId || tabManager.getActiveTabId() || tabManager.getTabList()[0]?.id || '';
    if (targetId) tabManager.stopLoading(targetId);
  });

  ipcMain.handle(IPC.TAB_LIST, () => tabManager?.getTabList() ?? []);

  ipcMain.handle(IPC.TOOLBAR_FOCUS, () => {
    if (toolbarView && !toolbarView.webContents.isDestroyed()) {
      toolbarView.webContents.focus();
    }
  });

  ipcMain.handle(IPC.TOOLBAR_RESIZE, (_event, height: number) => {
    if (toolbarView && mainWindow) {
      const bounds = mainWindow.getContentBounds();
      const h = height && height > 0 ? height : 110;
      toolbarView.setBounds({ x: 0, y: 0, width: bounds.width, height: h });
    }
  });

  ipcMain.handle(IPC.CONTENT_FOCUS, () => tabManager?.focusActiveTab());

  ipcMain.handle(IPC.FIND_IN_PAGE, (_event, text: string, options?: { forward?: boolean; findNext?: boolean }) => {
    tabManager?.findInPage(text, options);
  });

  ipcMain.handle(IPC.FIND_STOP, (_event, action?: 'clearSelection' | 'keepSelection' | 'activateSelection') => {
    tabManager?.findStop(action);
  });

  ipcMain.handle(IPC.ZOOM_IN, () => tabManager?.zoomIn() ?? 1);
  ipcMain.handle(IPC.ZOOM_OUT, () => tabManager?.zoomOut() ?? 1);
  ipcMain.handle(IPC.ZOOM_RESET, () => tabManager?.zoomReset() ?? 1);

  ipcMain.handle(IPC.DEVTOOLS_TOGGLE, () => tabManager?.toggleDevTools());

  ipcMain.handle(IPC.DOWNLOAD_GET_LIST, () => downloads);

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

  ipcMain.handle(IPC.VPN_GET_STATUS, () =>
    proxyManager?.getStatus() ?? { enabled: false, region: 'US', state: 'disconnected', endpoint: 'none' }
  );

  ipcMain.handle(IPC.VPN_CHECK_IP, async () => {
    return proxyManager?.checkIp() ?? { ip: 'Direct connection', status: 'Direct', encrypted: false };
  });

  ipcMain.handle(IPC.ADBLOCK_GET_STATS, () =>
    adBlockEngine?.getStats() ?? { totalBlocked: 0, sessionBlocked: 0, perTab: {} }
  );

  ipcMain.handle(IPC.MEMORY_GET_STATS, () =>
    memoryManager?.getStats() ?? { sleepingTabs: 0, discardedTabs: 0, activeTabs: 1, estimatedSavedMB: 0 }
  );

  ipcMain.handle(IPC.MEMORY_RESTORE_TAB, (_event, tabId: string) => {
    tabManager?.restoreTab(tabId);
  });

  // ─── Settings IPC ───────────────────────────────────────────
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: keyof BrowserSettings) => {
    return settingsStore?.get(key);
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: keyof BrowserSettings, value: unknown) => {
    settingsStore?.set(key, value as never);
  });

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    return settingsStore?.getAll() ?? {};
  });

  ipcMain.handle(IPC.SETTINGS_SET_ALL, (_event, partial: Partial<BrowserSettings>) => {
    settingsStore?.setAll(partial);
  });

  ipcMain.handle(IPC.SETTINGS_RESET, () => {
    settingsStore?.reset();
  });

  ipcMain.handle(IPC.CLEAR_BROWSING_DATA, async (_event, options: ClearDataOptions) => {
    await handleClearBrowsingData(options);
  });
}

// ─── Global User-Agent Fallback ────────────────────────────────
app.userAgentFallback = CHROME_UA;

// ─── App Lifecycle ──────────────────────────────────────────────
app.whenReady().then(async () => {
  setupCertificateHandling();
  registerIpcHandlers();
  registerWindowControls();
  setupDownloadListener();
  await createMainWindow();

  // ════════════════════════════════════════════════════════════════
  // GLOBAL: Intercept EVERY new window / external navigation event
  // across ALL WebContents in the app.
  //
  // This ensures:
  //   - window.open() calls → open as new Muthu Browser tab
  //   - target="_blank" links → open as new Muthu Browser tab
  //   - OAuth / login popups → open as new Muthu Browser tab
  //   - External protocol links → handled by Muthu Browser
  //   - NOTHING opens in Edge, Chrome, or any system browser
  // ════════════════════════════════════════════════════════════════
  app.on('web-contents-created', (_event, contents) => {
    // Intercept window.open / target=_blank / popups
    contents.setWindowOpenHandler(({ url, features }) => {
      if (!shouldOpenInMuthu(url)) return { action: 'allow' };

      // Allow OAuth & Auth popups to preserve window.opener and postMessage
      if (isAuthOrPopup(url, features)) {
        console.log(`[Muthu] Allowing OAuth / Auth popup window: ${url}`);
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 550,
            height: 680,
            minWidth: 380,
            minHeight: 450,
            autoHideMenuBar: true,
            backgroundColor: '#202124',
            webPreferences: {
              sandbox: true,
              contextIsolation: true,
              nodeIntegration: false,
              preload: path.join(__dirname, 'tab-preload.js'),
              partition: 'persist:muthu',
            },
          },
        };
      }

      console.log(`[Muthu] Intercepted new-window → tab: ${url}`);
      setImmediate(() => {
        if (tabManager) tabManager.createTab(url);
      });
      return { action: 'deny' };
    });

    // Prevent unauthorized <webview> tag creation
    contents.on('will-attach-webview', (event) => {
      event.preventDefault();
      console.warn('[Security] Prevented unauthorized <webview> attachment');
    });

    // Intercept navigation within sub-frames that try to open external URLs
    contents.on('will-navigate', (event, url) => {
      // Block navigation away from devtools or internal pages that somehow
      // escaped to an external browser; let normal page navigation proceed
      if (url.startsWith('javascript:') || url.startsWith('vbscript:')) {
        event.preventDefault();
      }
    });
  });

  // Intercept OS-level "open URL" requests (e.g. mailto: links, custom protocols)
  // Redirect http/https to a new Muthu Browser tab instead of opening Edge
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (tabManager) tabManager.createTab(url);
    } else {
      shell.openExternal(url).catch(() => {});
    }
  });

  app.on('activate', () => {
    if (!mainWindow) createMainWindow();
  });
});

app.on('before-quit', async () => {
  if (settingsStore) {
    const clearCookies = settingsStore.get('clearCookiesOnExit');
    const clearCache = settingsStore.get('clearCacheOnExit');
    if (clearCookies || clearCache) {
      await handleClearBrowsingData({
        cookies: clearCookies,
        cache: clearCache,
        localStorage: false,
        indexedDB: false,
        serviceWorkers: false,
      });
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
