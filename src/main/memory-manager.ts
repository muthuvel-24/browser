/**
 * Muthu Browser — Memory Manager
 *
 * Implements aggressive tab sleeping and discarding to minimize RAM usage.
 *
 * Lifecycle:  Active → Sleeping (5 min) → Discarded (15 min)
 *
 * - Sleeping: JS execution throttled, audio muted, tab still in memory
 * - Discarded: WebContents destroyed, only metadata (URL, title, favicon,
 *   scroll position) retained for instant-feeling restoration
 *
 * Runs a periodic sweep every 60 seconds to transition idle tabs.
 */

import type { TabStatus, MemoryStats } from './types';

/** Minutes before a background tab is put to sleep */
const SLEEP_THRESHOLD_MS = 5 * 60 * 1000;

/** Minutes before a sleeping tab is fully discarded */
const DISCARD_THRESHOLD_MS = 15 * 60 * 1000;

/** How often the sweep timer runs */
const SWEEP_INTERVAL_MS = 60 * 1000;

/** Estimated MB saved per discarded tab (conservative average) */
const ESTIMATED_MB_PER_DISCARD = 80;

/** Estimated MB saved per sleeping tab */
const ESTIMATED_MB_PER_SLEEP = 30;

/**
 * Callback interface for the memory manager to interact with the tab manager.
 * Keeps the memory manager decoupled from the tab manager implementation.
 */
export interface MemoryManagerCallbacks {
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

  /** Callback fired whenever memory stats change */
  public onStatsUpdated: ((stats: MemoryStats) => void) | null = null;

  constructor(callbacks: MemoryManagerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start the periodic sweep timer.
   * Scans all background tabs and transitions them based on idle duration.
   */
  start(): void {
    if (this.sweepTimer) return;

    console.log('[Memory] Sweep timer started (60s interval)');
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);

    // Run an initial sweep immediately
    this.sweep();
  }

  /**
   * Stop the periodic sweep timer.
   */
  stop(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
      console.log('[Memory] Sweep timer stopped');
    }
  }

  /**
   * Perform a single sweep across all background tabs.
   * Transitions:
   *   background → sleeping (after SLEEP_THRESHOLD_MS)
   *   sleeping → discarded (after DISCARD_THRESHOLD_MS)
   */
  private sweep(): void {
    const now = Date.now();
    const backgroundTabIds = this.callbacks.getBackgroundTabIds();

    for (const tabId of backgroundTabIds) {
      const lastActive = this.callbacks.getLastActiveTime(tabId);
      const status = this.callbacks.getTabStatus(tabId);
      const idleDuration = now - lastActive;

      if (!status) continue;

      // Already discarded — nothing to do
      if (status === 'discarded') continue;

      // Discard if idle beyond the discard threshold
      if (idleDuration >= DISCARD_THRESHOLD_MS) {
        console.log(`[Memory] Discarding tab ${tabId} (idle ${Math.round(idleDuration / 1000)}s)`);
        this.callbacks.discardTab(tabId);
        continue;
      }

      // Sleep if idle beyond the sleep threshold
      if (idleDuration >= SLEEP_THRESHOLD_MS && status === 'background') {
        console.log(`[Memory] Sleeping tab ${tabId} (idle ${Math.round(idleDuration / 1000)}s)`);
        this.callbacks.sleepTab(tabId);
      }
    }

    // Emit updated stats after each sweep
    this.onStatsUpdated?.(this.getStats());
  }

  /**
   * Get current memory optimization statistics.
   */
  getStats(): MemoryStats {
    const backgroundTabIds = this.callbacks.getBackgroundTabIds();
    let sleepingTabs = 0;
    let discardedTabs = 0;
    let activeTabs = 0;

    for (const tabId of backgroundTabIds) {
      const status = this.callbacks.getTabStatus(tabId);
      switch (status) {
        case 'sleeping':
          sleepingTabs++;
          break;
        case 'discarded':
          discardedTabs++;
          break;
        case 'background':
        case 'active':
          activeTabs++;
          break;
      }
    }

    // The active tab itself
    activeTabs++;

    const estimatedSavedMB =
      discardedTabs * ESTIMATED_MB_PER_DISCARD +
      sleepingTabs * ESTIMATED_MB_PER_SLEEP;

    return {
      sleepingTabs,
      discardedTabs,
      activeTabs,
      estimatedSavedMB,
    };
  }

  /**
   * Force an immediate sweep (useful after a tab is closed or restored).
   */
  forceSweep(): void {
    this.sweep();
  }
}
