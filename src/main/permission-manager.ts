/**
 * Muthu Browser — Permission Manager
 *
 * Implements a strict, secure per-site permission control architecture.
 * - Never auto-grants sensitive permissions without explicit user approval.
 * - Supports states: 'allow' | 'ask' | 'block'
 * - Supported permissions: Location, Camera, Microphone, Notifications, Clipboard, MIDI, Sensors, Screen Capture
 * - Persistent per-site permissions stored in userData/muthu-permissions.json
 * - Interactive in-browser permission prompt routing
 */

import { app, type WebContents } from 'electron';
import fs from 'fs';
import path from 'path';

export type PermissionType =
  | 'location'
  | 'camera'
  | 'microphone'
  | 'notifications'
  | 'clipboard-read'
  | 'midi'
  | 'sensors'
  | 'screen-capture';

export type PermissionDecision = 'allow' | 'ask' | 'block';

export interface SitePermissionRecord {
  [origin: string]: Partial<Record<PermissionType, PermissionDecision>>;
}

export interface PermissionPromptRequest {
  id: string;
  origin: string;
  permission: PermissionType;
  title: string;
}

export interface PendingPrompt {
  id: string;
  origin: string;
  permission: PermissionType;
  callback: (allowed: boolean) => void;
  timer: NodeJS.Timeout;
}

const SAFE_SYSTEM_PERMISSIONS = new Set(['fullscreen', 'clipboard-sanitized-write', 'pointerLock']);

export class PermissionManager {
  private storagePath: string;
  private sitePermissions: SitePermissionRecord = {};
  private pendingPrompts = new Map<string, PendingPrompt>();

  /** Callback to send permission prompt request to renderer */
  public onPromptRequested: ((prompt: PermissionPromptRequest) => void) | null = null;

  constructor(customStoragePath?: string) {
    this.storagePath = customStoragePath ?? path.join(app.getPath('userData'), 'muthu-permissions.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        this.sitePermissions = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[PermissionManager] Failed to load permissions:', err);
      this.sitePermissions = {};
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.sitePermissions, null, 2), 'utf8');
    } catch (err) {
      console.error('[PermissionManager] Failed to save permissions:', err);
    }
  }

  /**
   * Normalizes an Electron permission string to a PermissionType.
   */
  public normalizePermission(permission: string, details?: any): PermissionType | null {
    const p = permission.toLowerCase();
    if (p === 'geolocation') return 'location';
    if (p === 'notifications') return 'notifications';
    if (p === 'clipboard-read') return 'clipboard-read';
    if (p === 'midi' || p === 'midisysex') return 'midi';
    if (p === 'sensors') return 'sensors';
    if (p === 'display-capture') return 'screen-capture';
    if (p === 'media') {
      const mediaTypes: string[] = details?.mediaTypes || [];
      if (mediaTypes.includes('video')) return 'camera';
      if (mediaTypes.includes('audio')) return 'microphone';
      return 'camera';
    }
    return null;
  }

  /**
   * Extracts clean web origin from URL.
   */
  public extractOrigin(url?: string): string {
    if (!url) return 'unknown';
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return url;
    }
  }

  /**
   * Electron setPermissionRequestHandler implementation.
   */
  public handlePermissionRequest(
    webContents: WebContents,
    permission: string,
    callback: (allow: boolean) => void,
    details?: any
  ): void {
    // 1. Immediately allow benign internal permissions
    if (SAFE_SYSTEM_PERMISSIONS.has(permission)) {
      callback(true);
      return;
    }

    const norm = this.normalizePermission(permission, details);
    if (!norm) {
      console.warn(`[Security] Blocked unhandled permission request: ${permission}`);
      callback(false);
      return;
    }

    const requestingUrl = details?.requestingUrl || webContents.getURL();
    const origin = this.extractOrigin(requestingUrl);

    // 2. Check site-specific policy
    const sitePolicy = this.sitePermissions[origin]?.[norm];
    if (sitePolicy === 'allow') {
      callback(true);
      return;
    }
    if (sitePolicy === 'block') {
      callback(false);
      return;
    }

    // 3. Default is 'ask': queue interactive user prompt
    const promptId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timer = setTimeout(() => {
      // Auto-expire after 30s as a block
      if (this.pendingPrompts.has(promptId)) {
        this.pendingPrompts.delete(promptId);
        callback(false);
      }
    }, 30000);

    this.pendingPrompts.set(promptId, {
      id: promptId,
      origin,
      permission: norm,
      callback,
      timer,
    });

    console.log(`[PermissionManager] Requesting user prompt: ${norm} for ${origin} (ID: ${promptId})`);

    this.onPromptRequested?.({
      id: promptId,
      origin,
      permission: norm,
      title: webContents.getTitle() || origin,
    });
  }

  /**
   * Electron setPermissionCheckHandler implementation.
   */
  public handlePermissionCheck(
    webContents: WebContents | null,
    permission: string,
    requestingOrigin: string
  ): boolean {
    if (SAFE_SYSTEM_PERMISSIONS.has(permission)) return true;
    const norm = this.normalizePermission(permission);
    if (!norm) return false;

    const origin = this.extractOrigin(requestingOrigin || (webContents ? webContents.getURL() : ''));
    const policy = this.sitePermissions[origin]?.[norm];
    return policy === 'allow';
  }

  /**
   * Handles user response from the renderer UI prompt.
   */
  public resolvePrompt(promptId: string, decision: 'allow' | 'block', remember: boolean): boolean {
    const item = this.pendingPrompts.get(promptId);
    if (!item) return false;

    clearTimeout(item.timer);
    this.pendingPrompts.delete(promptId);

    const allowed = decision === 'allow';

    if (remember) {
      if (!this.sitePermissions[item.origin]) {
        this.sitePermissions[item.origin] = {};
      }
      this.sitePermissions[item.origin][item.permission] = decision;
      this.save();
      console.log(`[PermissionManager] Saved rule: ${item.origin} -> ${item.permission} = ${decision}`);
    }

    item.callback(allowed);
    return true;
  }

  /**
   * Update or set a permission directly for a site.
   */
  public setSitePermission(origin: string, permission: PermissionType, decision: PermissionDecision): void {
    if (!this.sitePermissions[origin]) {
      this.sitePermissions[origin] = {};
    }
    this.sitePermissions[origin][permission] = decision;
    this.save();
  }

  /**
   * Reset all permissions for a site.
   */
  public resetSitePermissions(origin: string): void {
    delete this.sitePermissions[origin];
    this.save();
  }

  /**
   * Get all stored permissions.
   */
  public getAllPermissions(): SitePermissionRecord {
    return { ...this.sitePermissions };
  }

  /**
   * Get permissions for a specific site.
   */
  public getSitePermissions(origin: string): Partial<Record<PermissionType, PermissionDecision>> {
    return { ...(this.sitePermissions[origin] || {}) };
  }
}
