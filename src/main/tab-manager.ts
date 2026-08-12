/**
 * Muthu Browser — Tab Manager
 *
 * Manages the lifecycle of browser tabs using Electron's WebContentsView API.
 * Each tab is a separate WebContentsView added to a BaseWindow's contentView.
 *
 * Responsibilities:
 * - Create / close / switch tabs
 * - Layout management (bounds recalculation on resize)
 * - Navigation (back, forward, reload, URL loading)
 * - Tab state broadcasting to the renderer via IPC
 * - Tab sleeping and discarding (delegates lifecycle to MemoryManager)
 * - Scroll position capture and restoration
 */

import { WebContentsView, session, Menu, type BaseWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import type { TabRecord, TabInfo, TabStatus, FindMatchInfo } from './types';
import { getSpeedDialHtml } from './speeddial-html';
import { stripTrackingParams } from './url-utils';
import { IPC } from '../shared/ipc-channels';

/** Height in pixels reserved for the toolbar UI at the top (Tab strip + Omnibox + BookmarksBar) */
const TOOLBAR_HEIGHT = 110;

/** Speed Dial Data URL */
const SPEED_DIAL_DATA_URL = 'data:text/html;charset=utf-8,' + encodeURIComponent(getSpeedDialHtml());

/** Default new-tab URL */
const NEW_TAB_URL = 'speeddial';

/**
 * Generate a unique tab ID using crypto.
 */
function generateTabId(): string {
  return randomUUID();
}

function isSpeedDialUrl(url: string): boolean {
  return url === SPEED_DIAL_DATA_URL;
}

export class TabManager {
  private tabs = new Map<string, TabRecord>();
  private views = new Map<string, WebContentsView>();
  private activeTabId: string | null = null;
  private window: BaseWindow;

  /** Callback fired whenever tab state changes (tab list update → renderer) */
  public onTabsUpdated: ((tabs: TabInfo[]) => void) | null = null;

  /** Reference to the toolbar WebContentsView (for z-order management) */
  private toolbarView: WebContentsView | null = null;

  constructor(window: BaseWindow) {
    this.window = window;

    // Recalculate bounds when window is resized
    this.window.on('resize', () => this.updateAllBounds());
  }

  /**
   * Register the toolbar view so it's always kept on top.
   */
  setToolbarView(view: WebContentsView): void {
    this.toolbarView = view;
  }

  // ─── Tab Creation ───────────────────────────────────────────────

  /**
   * Create a new tab and optionally navigate to a URL.
   * Returns the new tab's ID.
   */
  createTab(url?: string, isPrivate = false): string {
    const tabId = generateTabId();
    const targetUrl = url ?? NEW_TAB_URL;
    const partitionName = isPrivate ? `incognito:${tabId}` : 'persist:muthu';

    // Create a new WebContentsView with sandboxed, isolated web preferences
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webgl: true,
        spellcheck: true,
        partition: partitionName,
      },
    });

    // Set Chrome-like User-Agent on session
    const tabSession = session.fromPartition(partitionName);
    tabSession.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    view.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // Create the tab record
    const record: TabRecord = {
      id: tabId,
      url: targetUrl,
      title: isPrivate ? 'Private Tab' : 'New Tab',
      favicon: '',
      status: 'active',
      isLoading: true,
      isPrivate,
      lastActiveTime: Date.now(),
      scrollPosition: { x: 0, y: 0 },
      historyEntries: [],
      historyIndex: -1,
    };

    this.tabs.set(tabId, record);
    this.views.set(tabId, view);

    // Add to window and position below toolbar
    this.window.contentView.addChildView(view);
    this.updateViewBounds(view);

    // Wire up WebContents events
    this.attachWebContentsEvents(tabId, view);

    const actualUrl = (targetUrl === 'speeddial' || targetUrl === 'about:blank' || !targetUrl)
      ? SPEED_DIAL_DATA_URL
      : targetUrl;

    if (actualUrl === SPEED_DIAL_DATA_URL) {
      record.title = 'Speed Dial';
    }

    // Navigate to the URL
    void view.webContents.loadURL(actualUrl).catch((error: Error) => {
      this.handleNavigationFailure(tabId, actualUrl, error);
    });

    // Switch to the new tab
    this.switchTab(tabId);

    console.log(`[Tabs] Created tab ${tabId} → ${targetUrl}`);
    return tabId;
  }

  // ─── Tab Switching ──────────────────────────────────────────────

  /**
   * Switch the active tab. Shows the target tab and hides all others.
   */
  switchTab(tabId: string): void {
    const targetRecord = this.tabs.get(tabId);
    if (!targetRecord) return;

    // Mark previous active tab as background
    if (this.activeTabId && this.activeTabId !== tabId) {
      const prevRecord = this.tabs.get(this.activeTabId);
      if (prevRecord && prevRecord.status === 'active') {
        prevRecord.status = 'background';
        prevRecord.lastActiveTime = Date.now();

        // Capture scroll position before switching away
        this.captureScrollPosition(this.activeTabId);
      }
    }

    // If the target tab was discarded, it needs to be restored first
    if (targetRecord.status === 'discarded') {
      this.restoreTab(tabId);
      return; // restoreTab will call switchTab again after loading
    }

    // If the tab was sleeping, wake it up
    if (targetRecord.status === 'sleeping') {
      this.wakeTab(tabId);
    }

    // Mark target as active
    targetRecord.status = 'active';
    targetRecord.lastActiveTime = Date.now();
    this.activeTabId = tabId;

    // Update z-order: remove all tab views, add only the active one,
    // then ensure toolbar is on top
    for (const [id, view] of this.views.entries()) {
      if (id !== tabId) {
        try {
          this.window.contentView.removeChildView(view);
        } catch { /* View may already be removed */ }
      }
    }

    const activeView = this.views.get(tabId);
    if (activeView) {
      this.window.contentView.addChildView(activeView);
      this.updateViewBounds(activeView);
    }

    // Keep toolbar on top
    if (this.toolbarView) {
      this.window.contentView.addChildView(this.toolbarView);
    }

    this.broadcastTabsUpdate();
  }

  // ─── Tab Closing ────────────────────────────────────────────────

  /**
   * Close a tab and destroy its WebContents.
   */
  closeTab(tabId: string): void {
    const view = this.views.get(tabId);

    // Remove view from window
    if (view) {
      try {
        this.window.contentView.removeChildView(view);
      } catch { /* already removed */ }

      // Destroy the WebContents to free memory
      if (!view.webContents.isDestroyed()) {
        view.webContents.close();
      }
    }

    this.views.delete(tabId);
    this.tabs.delete(tabId);

    // If we closed the active tab, switch to another
    if (this.activeTabId === tabId) {
      const remainingIds = Array.from(this.tabs.keys());
      if (remainingIds.length > 0) {
        this.switchTab(remainingIds[remainingIds.length - 1]);
      } else {
        // No tabs left — create a new one
        this.activeTabId = null;
        this.createTab();
      }
    }

    this.broadcastTabsUpdate();
    console.log(`[Tabs] Closed tab ${tabId}`);
  }

  // ─── Navigation ─────────────────────────────────────────────────

  /**
   * Navigate the specified tab to a URL.
   */
  navigateTo(tabId: string, url: string): void {
    const view = this.views.get(tabId);
    if (!view || view.webContents.isDestroyed()) return;

    const actualUrl = (url === 'speeddial' || url === 'about:blank' || !url)
      ? SPEED_DIAL_DATA_URL
      : url;

    const record = this.tabs.get(tabId);
    if (record) {
      record.isLoading = true;
      record.url = (actualUrl === SPEED_DIAL_DATA_URL) ? 'speeddial' : actualUrl;
      if (actualUrl === SPEED_DIAL_DATA_URL) {
        record.title = 'Speed Dial';
      }
    }

    void view.webContents.loadURL(actualUrl).catch((error: Error) => {
      this.handleNavigationFailure(tabId, actualUrl, error);
    });
    view.webContents.focus();
    this.broadcastTabsUpdate();
  }

  /** Focus the active tab's webContents */
  focusActiveTab(): void {
    if (!this.activeTabId) return;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.focus();
    }
  }

  goBack(tabId: string): void {
    const view = this.views.get(tabId);
    if (view && !view.webContents.isDestroyed()) {
      if (view.webContents.navigationHistory.canGoBack()) {
        view.webContents.navigationHistory.goBack();
      }
      setTimeout(() => this.broadcastTabsUpdate(), 100);
    }
  }

  goForward(tabId: string): void {
    const view = this.views.get(tabId);
    if (view && !view.webContents.isDestroyed()) {
      if (view.webContents.navigationHistory.canGoForward()) {
        view.webContents.navigationHistory.goForward();
      }
      setTimeout(() => this.broadcastTabsUpdate(), 100);
    }
  }

  reload(tabId: string): void {
    const view = this.views.get(tabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.reload();
    }
  }

  stopLoading(tabId: string): void {
    const view = this.views.get(tabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.stop();
    }
  }

  // ─── Tab Sleeping / Waking ──────────────────────────────────────

  /**
   * Put a tab to sleep — throttle JS and mute audio.
   * The WebContents remains in memory but is heavily throttled.
   */
  sleepTab(tabId: string): void {
    const view = this.views.get(tabId);
    const record = this.tabs.get(tabId);
    if (!view || !record || record.status === 'discarded') return;

    // Capture scroll position before sleep
    this.captureScrollPosition(tabId);

    // Enable aggressive background throttling
    view.webContents.setBackgroundThrottling(true);
    view.webContents.setAudioMuted(true);

    record.status = 'sleeping';
    this.broadcastTabsUpdate();
    console.log(`[Tabs] Tab ${tabId} is now sleeping`);
  }

  /**
   * Wake a sleeping tab — restore normal JS execution.
   */
  private wakeTab(tabId: string): void {
    const view = this.views.get(tabId);
    const record = this.tabs.get(tabId);
    if (!view || !record) return;

    view.webContents.setBackgroundThrottling(false);
    view.webContents.setAudioMuted(false);

    record.status = 'background';
    console.log(`[Tabs] Tab ${tabId} woke up`);
  }

  // ─── Tab Discarding / Restoring ─────────────────────────────────

  /**
   * Fully discard a tab — destroy WebContents and save metadata.
   * The tab remains in the tab bar as a placeholder.
   */
  discardTab(tabId: string): void {
    const view = this.views.get(tabId);
    const record = this.tabs.get(tabId);
    if (!view || !record || tabId === this.activeTabId) return;

    // Capture final state
    if (!view.webContents.isDestroyed()) {
      const currentUrl = view.webContents.getURL();
      record.url = isSpeedDialUrl(currentUrl) ? 'speeddial' : currentUrl || record.url;
      record.title = view.webContents.getTitle() || record.title;
      this.captureScrollPosition(tabId);
    }

    // Remove from window and destroy WebContents
    try {
      this.window.contentView.removeChildView(view);
    } catch { /* already removed */ }

    if (!view.webContents.isDestroyed()) {
      view.webContents.close();
    }

    this.views.delete(tabId);
    record.status = 'discarded';

    this.broadcastTabsUpdate();
    console.log(`[Tabs] Tab ${tabId} discarded (URL saved: ${record.url})`);
  }

  /**
   * Restore a discarded tab — create new WebContents and load saved URL.
   */
  restoreTab(tabId: string): void {
    const record = this.tabs.get(tabId);
    if (!record || record.status !== 'discarded') return;

    console.log(`[Tabs] Restoring tab ${tabId} → ${record.url}`);

    // Demote the currently active tab before restoring
    if (this.activeTabId && this.activeTabId !== tabId) {
      const prevRecord = this.tabs.get(this.activeTabId);
      if (prevRecord && prevRecord.status === 'active') {
        prevRecord.status = 'background';
        prevRecord.lastActiveTime = Date.now();
        this.captureScrollPosition(this.activeTabId);
      }
      // Remove previous active view from window
      const prevView = this.views.get(this.activeTabId);
      if (prevView) {
        try {
          this.window.contentView.removeChildView(prevView);
        } catch { /* already removed */ }
      }
    }

    const partitionName = record.isPrivate ? `incognito:${tabId}` : 'persist:muthu';
    // Create fresh WebContentsView
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webgl: true,
        spellcheck: true,
        partition: partitionName,
      },
    });

    view.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    this.views.set(tabId, view);

    // Add to window
    this.window.contentView.addChildView(view);
    this.updateViewBounds(view);

    // Wire up events
    this.attachWebContentsEvents(tabId, view);

    // Load the saved URL
    record.isLoading = true;
    record.status = 'active';
    const actualUrl = record.url === 'speeddial' ? SPEED_DIAL_DATA_URL : record.url;
    void view.webContents.loadURL(actualUrl).catch((error: Error) => {
      this.handleNavigationFailure(tabId, actualUrl, error);
    });

    // Restore scroll position after page loads
    view.webContents.once('did-finish-load', () => {
      if (record.scrollPosition.x !== 0 || record.scrollPosition.y !== 0) {
        view.webContents.executeJavaScript(
          `window.scrollTo(${record.scrollPosition.x}, ${record.scrollPosition.y});`
        ).catch(() => { /* ignore scroll restore failures */ });
      }
    });

    // Switch to the restored tab
    this.activeTabId = tabId;
    record.lastActiveTime = Date.now();

    // Ensure proper z-order
    if (this.toolbarView) {
      this.window.contentView.addChildView(this.toolbarView);
    }

    this.broadcastTabsUpdate();
  }

  // ─── Layout ─────────────────────────────────────────────────────

  /**
   * Update the bounds of a single WebContentsView to fill below the toolbar.
   */
  private updateViewBounds(view: WebContentsView): void {
    const bounds = this.window.getContentBounds();
    view.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: bounds.width,
      height: bounds.height - TOOLBAR_HEIGHT,
    });
  }

  /**
   * Recalculate bounds for all visible views (called on window resize).
   */
  private updateAllBounds(): void {
    const bounds = this.window.getContentBounds();

    // Update toolbar view bounds
    if (this.toolbarView) {
      this.toolbarView.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: TOOLBAR_HEIGHT,
      });
    }

    // Update only the active tab view
    if (this.activeTabId) {
      const activeView = this.views.get(this.activeTabId);
      if (activeView) {
        this.updateViewBounds(activeView);
      }
    }
  }

  // ─── Internal Helpers ───────────────────────────────────────────

  /**
   * Attach navigation and title/favicon event listeners to a WebContentsView.
   */
  private attachWebContentsEvents(tabId: string, view: WebContentsView): void {
    const wc = view.webContents;

    // Track page title changes
    wc.on('page-title-updated', (_event, title) => {
      const record = this.tabs.get(tabId);
      if (record) {
        record.title = title;
        this.broadcastTabsUpdate();
      }
    });

    // Track URL changes (navigation)
    wc.on('did-navigate', (_event, url) => {
      const record = this.tabs.get(tabId);
      if (record) {
        record.url = isSpeedDialUrl(url) ? 'speeddial' : url;
        if (isSpeedDialUrl(url)) {
          record.title = 'Speed Dial';
        }
        record.isLoading = false;
        this.broadcastTabsUpdate();
      }
    });

    wc.on('did-navigate-in-page', (_event, url) => {
      const record = this.tabs.get(tabId);
      if (record) {
        record.url = isSpeedDialUrl(url) ? 'speeddial' : url;
        this.broadcastTabsUpdate();
      }
    });

    // Keep full Ghostery blocking enabled at the session level while still
    // removing known tracking parameters from user-triggered navigations.
    wc.on('will-navigate', (event, url) => {
      const cleanedUrl = stripTrackingParams(url);
      if (cleanedUrl !== url) {
        event.preventDefault();
        void wc.loadURL(cleanedUrl).catch((error: Error) => {
          this.handleNavigationFailure(tabId, cleanedUrl, error);
        });
      }
    });

    // Track loading state
    wc.on('did-start-loading', () => {
      const record = this.tabs.get(tabId);
      if (record) {
        record.isLoading = true;
        this.broadcastTabsUpdate();
      }
    });

    wc.on('did-stop-loading', () => {
      const record = this.tabs.get(tabId);
      if (record) {
        record.isLoading = false;
        this.broadcastTabsUpdate();
      }
    });

    // Track favicon
    wc.on('page-favicon-updated', (_event, favicons) => {
      const record = this.tabs.get(tabId);
      if (record && favicons.length > 0) {
        record.favicon = favicons[0];
        this.broadcastTabsUpdate();
      }
    });

    // Handle Find in Page results
    wc.on('found-in-page', (_event, result) => {
      if (this.toolbarView && !this.toolbarView.webContents.isDestroyed()) {
        const matchInfo: FindMatchInfo = {
          activeMatchOrdinal: result.activeMatchOrdinal,
          matches: result.matches,
          finalUpdate: result.finalUpdate,
        };
        this.toolbarView.webContents.send(IPC.FIND_MATCH, matchInfo);
      }
    });

    // Right-click context menu (Chrome style)
    wc.on('context-menu', (_event, params) => {
      const template: Electron.MenuItemConstructorOptions[] = [];

      if (params.linkURL) {
        template.push(
          {
            label: 'Open Link in New Tab',
            click: () => this.createTab(params.linkURL),
          },
          {
            label: 'Open Link in Private Tab',
            click: () => this.createTab(params.linkURL, true),
          },
          {
            label: 'Copy Link Address',
            click: () => wc.copy(),
          },
          { type: 'separator' }
        );
      }

      if (params.isEditable) {
        template.push(
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
          { type: 'separator' }
        );
      } else if (params.selectionText) {
        template.push(
          { role: 'copy' },
          {
            label: `Search Google for "${params.selectionText.substring(0, 20)}..."`,
            click: () => this.createTab(`https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`),
          },
          { type: 'separator' }
        );
      }

      template.push(
        {
          label: 'Back',
          enabled: wc.navigationHistory.canGoBack(),
          click: () => wc.navigationHistory.goBack(),
        },
        {
          label: 'Forward',
          enabled: wc.navigationHistory.canGoForward(),
          click: () => wc.navigationHistory.goForward(),
        },
        {
          label: 'Reload',
          click: () => wc.reload(),
        },
        { type: 'separator' },
        {
          label: 'Inspect Element',
          click: () => wc.inspectElement(params.x, params.y),
        }
      );

      const menu = Menu.buildFromTemplate(template);
      menu.popup();
    });

    // ── Intercept ALL new window attempts ──────────────────────
    // This catches window.open(), target="_blank", OAuth popups, etc.
    // EVERYTHING opens as a new tab inside Muthu Browser.
    wc.setWindowOpenHandler(({ url }) => {
      if (!url || url.startsWith('devtools://') || url.startsWith('data:') || url.startsWith('blob:')) {
        return { action: 'allow' };
      }
      console.log(`[Tabs] Intercepting new-window request → new tab: ${url}`);
      setImmediate(() => this.createTab(url));
      return { action: 'deny' };
    });
  }

  // ─── Find in Page ───────────────────────────────────────────────

  findInPage(text: string, options?: { forward?: boolean; findNext?: boolean }): void {
    if (!this.activeTabId) return;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.findInPage(text, options);
    }
  }

  findStop(action: 'clearSelection' | 'keepSelection' | 'activateSelection' = 'clearSelection'): void {
    if (!this.activeTabId) return;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.stopFindInPage(action);
    }
  }

  // ─── Zoom & DevTools Controls ──────────────────────────────────

  zoomIn(): number {
    if (!this.activeTabId) return 1;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      const current = view.webContents.getZoomFactor();
      const next = Math.min(current + 0.1, 3.0);
      view.webContents.setZoomFactor(next);
      return next;
    }
    return 1;
  }

  zoomOut(): number {
    if (!this.activeTabId) return 1;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      const current = view.webContents.getZoomFactor();
      const next = Math.max(current - 0.1, 0.3);
      view.webContents.setZoomFactor(next);
      return next;
    }
    return 1;
  }

  zoomReset(): number {
    if (!this.activeTabId) return 1;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.setZoomFactor(1.0);
    }
    return 1;
  }

  toggleDevTools(): void {
    if (!this.activeTabId) return;
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      if (view.webContents.isDevToolsOpened()) {
        view.webContents.closeDevTools();
      } else {
        view.webContents.openDevTools({ mode: 'detach' });
      }
    }
  }

  /**
   * Capture the current scroll position of a tab via JS execution.
   */
  private captureScrollPosition(tabId: string): void {
    const view = this.views.get(tabId);
    const record = this.tabs.get(tabId);
    if (!view || !record || view.webContents.isDestroyed()) return;

    view.webContents
      .executeJavaScript('[window.scrollX, window.scrollY]')
      .then(([x, y]: [number, number]) => {
        record.scrollPosition = { x, y };
      })
      .catch(() => { /* Page may not support JS execution */ });
  }

  private handleNavigationFailure(tabId: string, url: string, error: Error): void {
    const record = this.tabs.get(tabId);
    if (!record) return;

    record.isLoading = false;
    record.url = isSpeedDialUrl(url) ? 'speeddial' : url;
    this.broadcastTabsUpdate();
    console.warn(`[Tabs] Failed to load ${url}:`, error.message);
  }

  /**
   * Broadcast the current tab list to the renderer.
   */
  private broadcastTabsUpdate(): void {
    const tabInfoList = this.getTabList();
    this.onTabsUpdated?.(tabInfoList);
  }

  // ─── Public Accessors ───────────────────────────────────────────

  /**
   * Get the full tab list as renderer-safe TabInfo objects.
   */
  getTabList(): TabInfo[] {
    const result: TabInfo[] = [];
    for (const [, record] of this.tabs) {
      const view = this.views.get(record.id);
      const isAlive = view && !view.webContents.isDestroyed();
      result.push({
        id: record.id,
        url: record.url,
        title: record.title || 'New Tab',
        favicon: record.favicon,
        status: record.status,
        isLoading: record.isLoading,
        canGoBack: isAlive ? view.webContents.navigationHistory.canGoBack() : false,
        canGoForward: isAlive ? view.webContents.navigationHistory.canGoForward() : false,
        isPrivate: record.isPrivate ?? false,
      });
    }
    return result;
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  getLastActiveTime(tabId: string): number {
    return this.tabs.get(tabId)?.lastActiveTime ?? Date.now();
  }

  getTabStatus(tabId: string): TabStatus | undefined {
    return this.tabs.get(tabId)?.status;
  }

  getBackgroundTabIds(): string[] {
    return Array.from(this.tabs.keys()).filter((id) => id !== this.activeTabId);
  }

  getActiveTabUrl(): string {
    if (!this.activeTabId) return '';
    const view = this.views.get(this.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      return view.webContents.getURL();
    }
    return this.tabs.get(this.activeTabId)?.url ?? '';
  }
}
