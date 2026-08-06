/**
 * Muthu Browser — AdBlock Stats Component
 *
 * Shield icon with blocked-count badge.
 * Pulses on each new block event.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { AdBlockStats as AdBlockStatsType } from '../../main/types';
import './AdBlockStats.css';

interface AdBlockStatsProps {
  stats: AdBlockStatsType;
}

/** Format large numbers compactly (e.g., 1234 → "1.2k") */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const AdBlockStats: React.FC<AdBlockStatsProps> = ({ stats }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCountRef = useRef(stats.totalBlocked);

  // Pulse animation when count increases
  useEffect(() => {
    if (stats.totalBlocked > prevCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 400);
      prevCountRef.current = stats.totalBlocked;
      return () => clearTimeout(timer);
    }
  }, [stats.totalBlocked]);

  return (
    <div
      className={`adblock-stats ${isPulsing ? 'adblock-stats--pulse' : ''}`}
      title={`${stats.totalBlocked} ads & trackers blocked this session`}
      id="adblock-stats"
    >
      {/* Shield Icon */}
      <span className="adblock-icon">🛡️</span>

      {/* Count Badge */}
      {stats.totalBlocked > 0 && (
        <span className={`adblock-badge ${isPulsing ? 'adblock-badge--pulse' : ''}`}>
          {formatCount(stats.totalBlocked)}
        </span>
      )}
    </div>
  );
};

export default AdBlockStats;
