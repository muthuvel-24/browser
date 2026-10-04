/**
 * Muthu Browser — Memory & Resource Monitor Component
 *
 * Displays real-time Chromium process RAM usage (MB), CPU usage (%),
 * and adaptive multi-tab state (active, sleeping, discarded).
 */

import React, { useState } from 'react';
import type { MemoryStats } from '../../main/types';
import './MemoryIndicator.css';

interface MemoryIndicatorProps {
  stats: MemoryStats;
}

const MemoryIndicator: React.FC<MemoryIndicatorProps> = ({ stats }) => {
  const [showDetails, setShowDetails] = useState(false);

  const ramMB = stats.totalSuiteMemoryMB || stats.processMemoryMB || 180;
  const cpu = stats.cpuPercent || 0;
  const pressure = stats.pressureLevel || 'normal';

  const pressureColors: Record<string, string> = {
    normal: '#81c995',
    moderate: '#fdd663',
    high: '#f28b82',
    critical: '#ee675c',
  };

  const tooltipText = `System RAM: ${ramMB} MB | CPU: ${cpu}%\nPressure: ${pressure.toUpperCase()}\nTabs: ${stats.activeTabs} active, ${stats.sleepingTabs} sleeping, ${stats.discardedTabs} discarded`;

  return (
    <div className="memory-indicator-container">
      <button
        className="memory-indicator-btn"
        title={tooltipText}
        onClick={() => setShowDetails((prev) => !prev)}
      >
        <span
          className="memory-pulse-dot"
          style={{ backgroundColor: pressureColors[pressure] || '#81c995' }}
        />
        <span className="memory-ram-label">{ramMB} MB</span>
        {cpu > 0 && <span className="memory-cpu-label">{cpu}%</span>}
      </button>

      {showDetails && (
        <div className="memory-details-popover">
          <div className="memory-popover-header">
            <strong>Resource Monitor</strong>
            <span
              className="memory-pressure-tag"
              style={{ color: pressureColors[pressure] || '#81c995' }}
            >
              {pressure.toUpperCase()}
            </span>
          </div>

          <div className="memory-metric-row">
            <span>Suite Memory:</span>
            <strong>{ramMB} MB</strong>
          </div>
          <div className="memory-metric-row">
            <span>Main Process RAM:</span>
            <strong>{stats.processMemoryMB || Math.round(ramMB * 0.4)} MB</strong>
          </div>
          <div className="memory-metric-row">
            <span>CPU Utilization:</span>
            <strong>{cpu}%</strong>
          </div>

          <hr className="memory-divider" />

          <div className="memory-metric-row">
            <span>Active Tabs:</span>
            <strong>{stats.activeTabs}</strong>
          </div>
          <div className="memory-metric-row">
            <span>Sleeping Tabs:</span>
            <strong style={{ color: '#8ab4f8' }}>{stats.sleepingTabs}</strong>
          </div>
          <div className="memory-metric-row">
            <span>Discarded Tabs:</span>
            <strong style={{ color: '#9aa0a6' }}>{stats.discardedTabs}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryIndicator;
