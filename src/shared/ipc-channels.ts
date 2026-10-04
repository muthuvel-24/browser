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
  TAB_CREATE_PRIVATE:'tab:create-private',
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
  TOOLBAR_RESIZE:    'toolbar:resize',
  CONTENT_FOCUS:     'content:focus',

  // ─── Find in Page ──────────────────────────────────────────────
  FIND_IN_PAGE:      'find:in-page',
  FIND_STOP:         'find:stop',
  FIND_MATCH:        'find:match',         // main → renderer

  // ─── Zoom & Page Controls ─────────────────────────────────────
  ZOOM_IN:           'zoom:in',
  ZOOM_OUT:          'zoom:out',
  ZOOM_RESET:        'zoom:reset',
  DEVTOOLS_TOGGLE:   'devtools:toggle',

  // ─── Downloads ────────────────────────────────────────────────
  DOWNLOAD_UPDATED:  'download:updated',   // main → renderer
  DOWNLOAD_GET_LIST: 'download:get-list',

  // ─── VPN / Proxy ──────────────────────────────────────────────
  VPN_ENABLE:        'vpn:enable',
  VPN_DISABLE:       'vpn:disable',
  VPN_GET_STATUS:    'vpn:get-status',
  VPN_CHECK_IP:      'vpn:check-ip',
  VPN_STATUS_CHANGED:'vpn:status-changed', // main → renderer

  // ─── Ad Blocker ───────────────────────────────────────────────
  ADBLOCK_GET_STATS: 'adblock:get-stats',
  ADBLOCK_STATS_UPDATED: 'adblock:stats-updated', // main → renderer

  // ─── Memory Manager ──────────────────────────────────────────
  MEMORY_GET_STATS:  'memory:get-stats',
  MEMORY_RESTORE_TAB:'memory:restore-tab',
  MEMORY_STATS_UPDATED: 'memory:stats-updated', // main → renderer

  // ─── Tab Operations ───────────────────────────────────────────
  TAB_DUPLICATE:     'tab:duplicate',
  TAB_RESTORE_CLOSED:'tab:restore-closed',

  // ─── Permissions ──────────────────────────────────────────────
  PERMISSION_REQUEST: 'permission:request',       // main → renderer prompt
  PERMISSION_RESPONSE:'permission:response',      // renderer → main user decision
  PERMISSION_GET_ALL: 'permission:get-all',       // renderer → main get permissions map
  PERMISSION_SET:     'permission:set',           // renderer → main set site permission
  PERMISSION_RESET:   'permission:reset',         // renderer → main reset site permission

  // ─── Privacy & Site Shields ───────────────────────────────────
  PRIVACY_GET_SITE_STATS: 'privacy:get-site-stats',
  PRIVACY_TOGGLE_SHIELD:  'privacy:toggle-shield',
  PRIVACY_STATS_UPDATED:  'privacy:stats-updated', // main → renderer

  // ─── AI Search & Assistant ────────────────────────────────────
  AI_SEARCH:          'ai:search',
  AI_SUMMARIZE_PAGE:  'ai:summarize-page',
  AI_EXPLAIN_TEXT:    'ai:explain-text',
  AI_ASK_QUESTION:    'ai:ask-question',
  AI_EXTRACT_POINTS:  'ai:extract-points',

  // ─── Benchmark & Diagnostics ─────────────────────────────────
  BENCHMARK_RUN:      'benchmark:run',

  // ─── Settings ──────────────────────────────────────────────────
  SETTINGS_GET:          'settings:get',
  SETTINGS_SET:          'settings:set',
  SETTINGS_GET_ALL:      'settings:get-all',
  SETTINGS_SET_ALL:      'settings:set-all',
  SETTINGS_RESET:        'settings:reset',
  SETTINGS_CHANGED:      'settings:changed',      // main → renderer

  // ─── Browser Actions ──────────────────────────────────────────
  CLEAR_BROWSING_DATA:   'browser:clear-data',
} as const;

/** Type-safe channel name type */
export type IpcChannel = typeof IPC[keyof typeof IPC];
