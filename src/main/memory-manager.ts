/**
 * Muthu Browser — Memory Manager
 *
 * Implements tab sleeping and discarding to minimize RAM usage.
 *
 * Lifecycle:  Active → Sleeping → Discarded
 *
 * - Sleeping: JS execution throttled, audio muted, tab still in memory
 * - Discarded: WebContents destroyed; URL/title/favicon saved for restoration
 *
 * Thresholds are configurable at construction time so main.ts can tune them.
 */

import type { TabStatus, MemoryStats } from './types';

/** How often the sweep timer runs */
const SWEEP_INTERVAL_MS = 60 * 1000;

/** Estimated MB saved per discarded tab (conservative average) */
const ESTIMATED_MB_PER_DISCARD = 80;

/** Estimated MB saved per sleeping tab */
const ESTIMATED_MB_PER_SLEEP = 30;

export interface MemoryManagerCallbacks {
  /** Configurable sleep threshold in ms (default: 30 min) */
  sleepThresholdMs?: number;
  /** Configurable discard threshold in ms (default: 60 min) */
  discardThresholdMs?: number;
  /** Get all tab IDs that are not the currently active tab */
  getBackgroundTabIds(): string[];
  /** Get the last-active timestamp for a given tab */
  getLastActiveTime(tabId: string): number;
  /** Get the current status of a tab */
  getTabStatus(tabId: string): TabStatus | undefined;
  /** Put a tab to sleep (throttle JS, mute audio) */
  sleepTab(tabId: string): void;
  /** Fully discard a tab (destroy WebContents, save metadata) */
  discardTab(tabId: string): void;
}

export class MemoryManager {
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private callbacks: MemoryManagerCallbacks;
  private sleepThresholdMs: number;
  private discardThresholdMs: number;

  public onStatsUpdated: ((stats: MemoryStats) => void) | null = null;

  constructor(callbacks: MemoryManagerCallbacks) {
    this.callbacks = callbacks;
    // Default: 30 min sleep, 60 min discard — relaxed for normal browsing
    this.sleepThresholdMs = callbacks.sleepThresholdMs ?? 30 * 60 * 1000;
    this.discardThresholdMs = callbacks.discardThresholdMs ?? 60 * 60 * 1000;
  }

  start(): void {
    if (this.sweepTimer) return;
    console.log(`[Memory] Sweep timer started (${SWEEP_INTERVAL_MS / 1000}s interval, sleep after ${this.sleepThresholdMs / 60000}min, discard after ${this.discardThresholdMs / 60000}min)`);
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
  }

  stop(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
      console.log('[Memory] Sweep timer stopped');
    }
  }

  private sweep(): void {
    const now = Date.now();
    const backgroundTabIds = this.callbacks.getBackgroundTabIds();

    for (const tabId of backgroundTabIds) {
      const lastActive = this.callbacks.getLastActiveTime(tabId);
      const status = this.callbacks.getTabStatus(tabId);
      const idleDuration = now - lastActive;

      if (!status || status === 'discarded') continue;

      if (idleDuration >= this.discardThresholdMs) {
        console.log(`[Memory] Discarding tab ${tabId} (idle ${Math.round(idleDuration / 60000)}min)`);
        this.callbacks.discardTab(tabId);
        continue;
      }

      if (idleDuration >= this.sleepThresholdMs && status === 'background') {
        console.log(`[Memory] Sleeping tab ${tabId} (idle ${Math.round(idleDuration / 60000)}min)`);
        this.callbacks.sleepTab(tabId);
      }
    }

    this.onStatsUpdated?.(this.getStats());
  }

  getStats(): MemoryStats {
    const backgroundTabIds = this.callbacks.getBackgroundTabIds();
    let sleepingTabs = 0;
    let discardedTabs = 0;
    let activeTabs = 1; // active tab itself

    for (const tabId of backgroundTabIds) {
      const status = this.callbacks.getTabStatus(tabId);
      if (status === 'sleeping') sleepingTabs++;
      else if (status === 'discarded') discardedTabs++;
      else activeTabs++;
    }

    return {
      sleepingTabs,
      discardedTabs,
      activeTabs,
      estimatedSavedMB: discardedTabs * ESTIMATED_MB_PER_DISCARD + sleepingTabs * ESTIMATED_MB_PER_SLEEP,
    };
  }

  forceSweep(): void {
    this.sweep();
  }
}
