/**
 * Muthu Browser — Core Type Definitions
 *
 * Shared interfaces used across the main process modules
 * (tab-manager, memory-manager, adblock-engine, proxy-manager).
 */

// ─── Tab Types ──────────────────────────────────────────────────

/** Lifecycle state of a browser tab */
export type TabStatus = 'active' | 'background' | 'sleeping' | 'discarded';

/** Serializable tab state sent to the renderer */
export interface TabInfo {
  id: string;
  url: string;
  title: string;
  favicon: string;
  status: TabStatus;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isPrivate: boolean;
}

/** Internal tab record with process-level references */
export interface TabRecord {
  id: string;
  url: string;
  title: string;
  favicon: string;
  status: TabStatus;
  isLoading: boolean;
  isPrivate: boolean;
  /** Timestamp of last user interaction with this tab */
  lastActiveTime: number;
  /** Saved scroll position for restoration after discard */
  scrollPosition: { x: number; y: number };
  /** Navigation history entries (for discard/restore) */
  historyEntries: Array<{ url: string; title: string }>;
  /** Index into historyEntries of the current page */
  historyIndex: number;
}

// ─── VPN / Proxy Types ──────────────────────────────────────────

/** Available VPN proxy regions */
export type VpnRegion = 'US' | 'EU' | 'Asia';

/** VPN connection state */
export type VpnConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

/** VPN status sent to the renderer */
export interface VpnStatus {
  enabled: boolean;
  region: VpnRegion;
  state: VpnConnectionState;
  /** Display-friendly endpoint address */
  endpoint: string;
}

/** Configurable proxy endpoint entry */
export interface ProxyEndpoint {
  region: VpnRegion;
  protocol: 'socks5' | 'http' | 'https';
  host: string;
  port: number;
  label: string;
}

// ─── Ad Blocker Types ───────────────────────────────────────────

/** Ad-block statistics */
export interface AdBlockStats {
  /** Total requests blocked since app launch */
  totalBlocked: number;
  /** Requests blocked in current session */
  sessionBlocked: number;
  /** Per-tab blocked count */
  perTab: Record<string, number>;
}

// ─── Memory Types ───────────────────────────────────────────────

/** Memory manager statistics */
export interface MemoryStats {
  /** Number of tabs currently in sleeping state */
  sleepingTabs: number;
  /** Number of tabs currently discarded */
  discardedTabs: number;
  /** Total active (non-discarded) tabs */
  activeTabs: number;
  /** Estimated memory saved (MB) by sleeping/discarding */
  estimatedSavedMB: number;
}

// ─── Download Types ─────────────────────────────────────────────

export interface DownloadItemInfo {
  id: string;
  filename: string;
  savePath: string;
  receivedBytes: number;
  totalBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
}

// ─── Find in Page Types ─────────────────────────────────────────

export interface FindMatchInfo {
  activeMatchOrdinal: number;
  matches: number;
  finalUpdate: boolean;
}

