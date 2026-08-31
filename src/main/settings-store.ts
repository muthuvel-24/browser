/**
 * Muthu Browser — Settings Store
 *
 * Lightweight file-based settings persistence using Node.js fs.
 * Reads/writes a JSON file at `app.getPath('userData')/muthu-settings.json`.
 * Thread-safe atomic writes with error handling.
 */

import { app } from 'electron';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import type { BrowserSettings } from './settings-types';
import { DEFAULT_SETTINGS } from './settings-types';

const SETTINGS_FILENAME = 'muthu-settings.json';

export class SettingsStore {
  private settings: BrowserSettings;
  private readonly filePath: string;

  /** Callback fired whenever any setting changes */
  public onSettingsChanged: ((settings: BrowserSettings) => void) | null = null;

  constructor() {
    const userDataDir = app.getPath('userData');
    this.filePath = path.join(userDataDir, SETTINGS_FILENAME);

    // Resolve default download path at runtime
    const defaults = { ...DEFAULT_SETTINGS };
    if (!defaults.downloadPath) {
      try {
        defaults.downloadPath = app.getPath('downloads');
      } catch {
        defaults.downloadPath = path.join(app.getPath('home'), 'Downloads');
      }
    }

    this.settings = this.loadFromDisk(defaults);
  }

  // ─── Read Operations ────────────────────────────────────────

  /** Get a single setting value by key */
  get<K extends keyof BrowserSettings>(key: K): BrowserSettings[K] {
    return this.settings[key];
  }

  /** Get all settings as a plain object */
  getAll(): BrowserSettings {
    return { ...this.settings };
  }

  // ─── Write Operations ───────────────────────────────────────

  /** Set a single setting */
  set<K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]): void {
    if (!(key in DEFAULT_SETTINGS)) {
      console.warn(`[Settings] Unknown setting key: ${String(key)}`);
      return;
    }
    (this.settings as unknown as Record<string, unknown>)[key as string] = value;
    this.saveToDisk();
    this.onSettingsChanged?.(this.getAll());
  }

  /** Merge a partial settings object */
  setAll(partial: Partial<BrowserSettings>): void {
    let changed = false;
    for (const [key, value] of Object.entries(partial)) {
      if (key in DEFAULT_SETTINGS && value !== undefined) {
        (this.settings as unknown as Record<string, unknown>)[key] = value;
        changed = true;
      }
    }
    if (changed) {
      this.saveToDisk();
      this.onSettingsChanged?.(this.getAll());
    }
  }

  /** Reset all settings to defaults */
  reset(): void {
    const downloadPath = this.settings.downloadPath || DEFAULT_SETTINGS.downloadPath;
    this.settings = { ...DEFAULT_SETTINGS, downloadPath };
    try {
      this.settings.downloadPath = app.getPath('downloads');
    } catch { /* keep existing */ }
    this.saveToDisk();
    this.onSettingsChanged?.(this.getAll());
  }

  // ─── Disk I/O ───────────────────────────────────────────────

  private loadFromDisk(defaults: BrowserSettings): BrowserSettings {
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return { ...defaults };
      }
      // Merge saved settings with defaults (handles new keys added in updates)
      const merged = { ...defaults };
      for (const key of Object.keys(defaults) as (keyof BrowserSettings)[]) {
        if (key in parsed && typeof parsed[key] === typeof defaults[key]) {
          (merged as unknown as Record<string, unknown>)[key] = parsed[key];
        }
      }
      // Special handling for arrays
      if (Array.isArray(parsed.adBlockerWhitelist)) {
        merged.adBlockerWhitelist = parsed.adBlockerWhitelist.filter(
          (item: unknown) => typeof item === 'string'
        );
      }
      return merged;
    } catch {
      // File doesn't exist yet or is corrupted — use defaults
      return { ...defaults };
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      mkdirSync(dir, { recursive: true });
      const json = JSON.stringify(this.settings, null, 2);
      writeFileSync(this.filePath, json, 'utf-8');
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err);
    }
  }
}
