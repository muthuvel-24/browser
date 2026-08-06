/**
 * Muthu Browser — Memory Indicator Component
 *
 * Shows a leaf icon with the count of optimized tabs
 * and estimated memory saved. Indicates when the memory
 * saver is actively freeing resources.
 */

import React from 'react';
import type { MemoryStats } from '../../main/types';
import './MemoryIndicator.css';

interface MemoryIndicatorProps {
  stats: MemoryStats;
}

const MemoryIndicator: React.FC<MemoryIndicatorProps> = ({ stats }) => {
  const optimizedCount = stats.sleepingTabs + stats.discardedTabs;
  const isActive = optimizedCount > 0;

  const tooltipText = isActive
    ? `Memory Saver Active\n💤 ${stats.sleepingTabs} sleeping, ⚫ ${stats.discardedTabs} discarded\n~${stats.estimatedSavedMB} MB saved`
    : 'Memory Saver — All tabs active';

  return (
    <div
      className={`memory-indicator ${isActive ? 'memory-indicator--active' : ''}`}
      title={tooltipText}
      id="memory-indicator"
    >
      {/* Leaf Icon */}
      <span className="memory-icon">{isActive ? '🍃' : '🌿'}</span>

      {/* Count (only shown when saving memory) */}
      {isActive && (
        <span className="memory-count">{optimizedCount}</span>
      )}
    </div>
  );
};

export default MemoryIndicator;
