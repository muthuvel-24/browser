/**
 * Muthu Browser — Memory Manager
 *
 * Implements real adaptive multi-tab resource management based on
 * actual OS and Chromium process metrics (never static fake formulas).
 *
 * Lifecycle:  Active → Sleeping → Discarded
 *
 * Memory Pressure Levels:
 * - Normal (< 700 MB): sleep background tabs after 25 min, discard after 60 min
 * - Moderate (700 - 1200 MB): sleep after 10 min, discard after 30 min
 * - High (1200 - 1800 MB): sleep after 3 min, discard oldest idle tabs after 15 min
 * - Critical (> 1800 MB): aggressively discard inactive tabs
 *
 * Protections:
 * - Never discards active tab
 * - Never discards tabs playing audio (audible)
 * - Never discards tabs with active downloads or pending forms
 */

import { app } from 'electron';
import type { TabStatus, MemoryStats } from './types';

/** How often the adaptive memory monitor runs (15s) */
const MONITOR_INTERVAL_MS = 15 * 1000;

export interface MemoryManagerCallbacks {
  /** Configurable sleep threshold in ms */
  sleepThresholdMs?: number;
  /** Configurable discard threshold in ms */
  discardThresholdMs?: number;
  /** Get all tab IDs that are not the currently active tab */
  getBackgroundTabIds(): string[];
  /** Get the last-active timestamp for a given tab */
  getLastActiveTime(tabId: string): number;
  /** Get the current status of a tab */
  getTabStatus(tabId: string): TabStatus | undefined;
  /** Check if a tab is protected from discard (audio playing, active download) */
  isTabProtected?(tabId: string): boolean;
  /** Put a tab to sleep (throttle JS, mute audio) */
  sleepTab(tabId: string): void;
  /** Fully discard a tab (destroy WebContents, save metadata) */
  discardTab(tabId: string): void;
}

export class MemoryManager {
  private timer: ReturnType<typeof setInterval> | null = null;
  private callbacks: MemoryManagerCallbacks;
  private lastStats: MemoryStats = {
    sleepingTabs: 0,
    discardedTabs: 0,
    activeTabs: 1,
    totalTabs: 1,
    processMemoryMB: 0,
    totalSuiteMemoryMB: 0,
    cpuPercent: 0,
    pressureLevel: 'normal',
  };

  public onStatsUpdated: ((stats: MemoryStats) => void) | null = null;

  constructor(callbacks: MemoryManagerCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.evaluate(), MONITOR_INTERVAL_MS);
    void this.evaluate();
    console.log('[Memory] Adaptive process memory manager started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Memory] Adaptive memory manager stopped');
    }
  }

  /**
   * Evaluate real process memory metrics and execute adaptive tab actions.
   */
  async evaluate(): Promise<void> {
    try {
      // 1. Gather real process and suite memory from Electron APIs
      const processMem = await process.getProcessMemoryInfo();
      const privateMemMB = Math.round(processMem.private / 1024);

      let totalSuiteKB = 0;
      let totalCpu = 0;
      const metrics = app.getAppMetrics();

      for (const m of metrics) {
        totalSuiteKB += m.memory.workingSetSize;
        totalCpu += m.cpu.percentCPUUsage;
      }
      const totalSuiteMB = Math.round(totalSuiteKB / 1024);
      const roundedCpu = Math.min(100, Math.round(totalCpu));

      // 2. Determine real memory pressure level
      let pressure: MemoryStats['pressureLevel'] = 'normal';
      let sleepThresholdMs = this.callbacks.sleepThresholdMs ?? 25 * 60 * 1000;
      let discardThresholdMs = this.callbacks.discardThresholdMs ?? 60 * 60 * 1000;

      if (totalSuiteMB >= 1800) {
        pressure = 'critical';
        sleepThresholdMs = 2 * 60 * 1000;
        discardThresholdMs = 8 * 60 * 1000;
      } else if (totalSuiteMB >= 1200) {
        pressure = 'high';
        sleepThresholdMs = 5 * 60 * 1000;
        discardThresholdMs = 15 * 60 * 1000;
      } else if (totalSuiteMB >= 700) {
        pressure = 'moderate';
        sleepThresholdMs = 10 * 60 * 1000;
        discardThresholdMs = 30 * 60 * 1000;
      }

      // 3. Apply adaptive lifecycle management
      const now = Date.now();
      const backgroundTabIds = this.callbacks.getBackgroundTabIds();

      let sleepingCount = 0;
      let discardedCount = 0;
      let activeCount = 1; // active tab

      for (const tabId of backgroundTabIds) {
        const status = this.callbacks.getTabStatus(tabId);
        const lastActive = this.callbacks.getLastActiveTime(tabId);
        const idleDuration = now - lastActive;
        const isProtected = this.callbacks.isTabProtected?.(tabId) ?? false;

        if (status === 'discarded') {
          discardedCount++;
          continue;
        }

        if (status === 'sleeping') {
          sleepingCount++;
        } else {
          activeCount++;
        }

        // Do not discard tabs playing audio or active downloads
        if (isProtected) continue;

        if (idleDuration >= discardThresholdMs) {
          console.log(`[Memory] Discarding inactive tab ${tabId} (${Math.round(idleDuration / 60000)}m idle, pressure: ${pressure})`);
          this.callbacks.discardTab(tabId);
          if (status === 'sleeping') sleepingCount--;
          else activeCount--;
          discardedCount++;
          continue;
        }

        if (idleDuration >= sleepThresholdMs && status === 'background') {
          console.log(`[Memory] Sleeping tab ${tabId} (${Math.round(idleDuration / 60000)}m idle, pressure: ${pressure})`);
          this.callbacks.sleepTab(tabId);
          activeCount--;
          sleepingCount++;
        }
      }

      this.lastStats = {
        sleepingTabs: sleepingCount,
        discardedTabs: discardedCount,
        activeTabs: activeCount,
        totalTabs: activeCount + sleepingCount + discardedCount,
        processMemoryMB: privateMemMB,
        totalSuiteMemoryMB: totalSuiteMB,
        cpuPercent: roundedCpu,
        pressureLevel: pressure,
      };

      this.onStatsUpdated?.(this.lastStats);
    } catch (err) {
      console.error('[Memory] Evaluation error:', err);
    }
  }

  getStats(): MemoryStats {
    return { ...this.lastStats };
  }

  forceSweep(): void {
    void this.evaluate();
  }
}
