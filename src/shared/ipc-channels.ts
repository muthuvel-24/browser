/**
 * Muthu Browser — IPC Channel Constants
 *
 * Single source of truth for all IPC channel names used between
 * the main process, preload bridge, and renderer (React UI).
 * Organized by feature domain.
 */

export const IPC = {
  // ─── Tab Management ───────────────────────────────────────────
  TAB_CREATE:        'tab:create',
  TAB_CLOSE:         'tab:close',
  TAB_SWITCH:        'tab:switch',
  TAB_NAVIGATE:      'tab:navigate',
  TAB_GO_BACK:       'tab:go-back',
  TAB_GO_FORWARD:    'tab:go-forward',
  TAB_RELOAD:        'tab:reload',
  TAB_STOP:          'tab:stop',
  TAB_UPDATED:       'tab:updated',       // main → renderer
  TAB_LIST:          'tab:list',           // renderer → main (get all tabs)
  TOOLBAR_FOCUS:     'toolbar:focus',
  CONTENT_FOCUS:     'content:focus',

  // ─── VPN / Proxy ──────────────────────────────────────────────
  VPN_ENABLE:        'vpn:enable',
  VPN_DISABLE:       'vpn:disable',
  VPN_GET_STATUS:    'vpn:get-status',
  VPN_STATUS_CHANGED:'vpn:status-changed', // main → renderer

  // ─── Ad Blocker ───────────────────────────────────────────────
  ADBLOCK_GET_STATS: 'adblock:get-stats',
  ADBLOCK_STATS_UPDATED: 'adblock:stats-updated', // main → renderer

  // ─── Memory Manager ──────────────────────────────────────────
  MEMORY_GET_STATS:  'memory:get-stats',
  MEMORY_RESTORE_TAB:'memory:restore-tab',
  MEMORY_STATS_UPDATED: 'memory:stats-updated', // main → renderer
} as const;

/** Type-safe channel name type */
export type IpcChannel = typeof IPC[keyof typeof IPC];
