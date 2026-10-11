/**
 * Muthu Browser — IPC Authorization & Parameter Validation Engine
 *
 * Provides strict validation for:
 * 1. IPC sender authorization (WebContents ID + frame hierarchy + origin/URL verification)
 * 2. Settings modification types and whitelist boundaries (eliminating unsafe casts)
 * 3. Permission manager parameters
 * 4. Toolbar bounds and sizing constraints
 */

import { DEFAULT_SETTINGS, type BrowserSettings } from './settings-types';

export interface IpcFrameLike {
  url?: string;
  parent?: IpcFrameLike | null;
}

export interface IpcSenderLike {
  id: number;
  isDestroyed?: () => boolean;
}

export interface IpcEventLike {
  sender?: IpcSenderLike;
  senderFrame?: IpcFrameLike | null;
}

/**
 * Validates that an incoming IPC call strictly originates from the trusted
 * top-level toolbar view frame and not from a foreign webContents or injected subframe.
 */
export function isAuthorizedIpcSender(
  event: IpcEventLike,
  expectedWebContentsId: number,
  expectedDevServerUrl?: string,
  expectedProdName?: string
): boolean {
  if (!event || !event.sender) return false;
  if (typeof event.sender.isDestroyed === 'function' && event.sender.isDestroyed()) return false;
  if (event.sender.id !== expectedWebContentsId) return false;

  const frame = event.senderFrame;
  if (!frame) return false;

  // Disallow nested child frames / iframes from invoking privileged toolbar actions
  if (frame.parent !== null && frame.parent !== undefined) return false;

  const frameUrl = frame.url;
  if (!frameUrl || typeof frameUrl !== 'string') return false;

  if (expectedDevServerUrl) {
    try {
      const expectedOrigin = new URL(expectedDevServerUrl).origin;
      const actualOrigin = new URL(frameUrl).origin;
      return expectedOrigin === actualOrigin;
    } catch {
      return false;
    }
  } else {
    // In production, must be local file:// protocol targeting the renderer bundle
    if (!frameUrl.startsWith('file://')) return false;
    const lower = frameUrl.toLowerCase();
    if (!lower.includes('index.html')) return false;
    if (expectedProdName && !lower.includes(expectedProdName.toLowerCase())) return false;
    return true;
  }
}

/**
 * Checks whether a key is a safe, known property of BrowserSettings,
 * protecting against prototype pollution.
 */
export function isValidSettingKey(key: unknown): key is keyof BrowserSettings {
  if (typeof key !== 'string') return false;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return false;
  return Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key);
}

/**
 * Verifies that the setting value matches the expected type and constraints of DEFAULT_SETTINGS.
 */
export function validateSettingValue<K extends keyof BrowserSettings>(
  key: K,
  value: unknown
): value is BrowserSettings[K] {
  if (!isValidSettingKey(key)) return false;
  const defaultVal = DEFAULT_SETTINGS[key];

  if (typeof defaultVal === 'boolean') {
    return typeof value === 'boolean';
  }

  if (typeof defaultVal === 'number') {
    return typeof value === 'number' && Number.isFinite(value) && value >= 25 && value <= 500;
  }

  if (Array.isArray(defaultVal)) {
    return Array.isArray(value) && value.every((x) => typeof x === 'string' && x.length <= 256);
  }

  if (typeof defaultVal === 'string') {
    if (typeof value !== 'string') return false;
    if (key === 'searchEngine') return ['google', 'bing', 'duckduckgo', 'yahoo'].includes(value);
    if (key === 'theme') return ['dark', 'light', 'system'].includes(value);
    if (key === 'fontSize') return ['small', 'medium', 'large'].includes(value);
    if (key === 'startupBehavior') return ['newTab', 'lastSession', 'homepage'].includes(value);
    if (key === 'vpnDefaultRegion') return ['US', 'EU', 'Asia'].includes(value);
    return value.length <= 1024;
  }

  return false;
}

/**
 * Clamps toolbar resize requests between the min toolbar height and the host window content bounds.
 */
export function clampToolbarHeight(height: unknown, maxWindowHeight: number): number {
  const minHeight = 110;
  if (typeof height !== 'number' || !Number.isFinite(height)) {
    return minHeight;
  }
  const maxHeight = Math.max(minHeight, Math.floor(maxWindowHeight));
  return Math.min(Math.max(Math.floor(height), minHeight), maxHeight);
}

export const VALID_PERMISSIONS = new Set([
  'geolocation',
  'notifications',
  'camera',
  'microphone',
  'clipboard',
  'midi',
  'sensors',
]);

export const VALID_DECISIONS = new Set(['allow', 'block', 'ask']);

/**
 * Validates permission mutation arguments before passing to PermissionManager.
 */
export function validatePermissionParams(
  origin: unknown,
  perm: unknown,
  decision: unknown
): { valid: true; origin: string; perm: string; decision: 'allow' | 'block' | 'ask' } | { valid: false } {
  if (typeof origin !== 'string' || origin.length === 0 || origin.length > 512) {
    return { valid: false };
  }
  if (typeof perm !== 'string' || !VALID_PERMISSIONS.has(perm)) {
    return { valid: false };
  }
  if (typeof decision !== 'string' || !VALID_DECISIONS.has(decision)) {
    return { valid: false };
  }
  return { valid: true, origin, perm, decision: decision as 'allow' | 'block' | 'ask' };
}
