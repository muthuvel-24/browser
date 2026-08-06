/**
 * Muthu Browser — VPN Toggle Component
 *
 * Animated ON/OFF switch with region selector dropdown.
 * Shows connection state: Connected (green), Disconnected (grey),
 * Connecting (pulsing), Error (red).
 */

import React, { useState, useEffect, useRef } from 'react';
import type { VpnStatus } from '../../main/types';
import './VpnToggle.css';

interface VpnToggleProps {
  status: VpnStatus;
  onEnable: (region: string) => void;
  onDisable: () => void;
}

const REGIONS = [
  { value: 'US', label: '🇺🇸 US', flag: '🇺🇸' },
  { value: 'EU', label: '🇪🇺 EU', flag: '🇪🇺' },
  { value: 'Asia', label: '🌏 Asia', flag: '🌏' },
] as const;

const VpnToggle: React.FC<VpnToggleProps> = ({ status, onEnable, onDisable }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>(status.region || 'US');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync selectedRegion with incoming status props
  useEffect(() => {
    if (status.region) {
      setSelectedRegion(status.region);
    }
  }, [status.region]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const isConnected = status.enabled && status.state === 'connected';
  const isConnecting = status.state === 'connecting';

  const handleToggle = () => {
    if (status.enabled) {
      onDisable();
    } else {
      onEnable(selectedRegion);
    }
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setShowDropdown(false);
    if (status.enabled) {
      // Re-connect with new region
      onEnable(region);
    }
  };

  const stateClass = isConnected
    ? 'vpn--connected'
    : isConnecting
    ? 'vpn--connecting'
    : status.state === 'error'
    ? 'vpn--error'
    : 'vpn--disconnected';

  return (
    <div ref={containerRef} className={`vpn-toggle ${stateClass}`} id="vpn-toggle">
      {/* Region Selector */}
      <div className="vpn-region-wrapper">
        <button
          className="vpn-region-btn"
          onClick={() => setShowDropdown(!showDropdown)}
          title="Select region"
          aria-label="Select VPN region"
        >
          {REGIONS.find((r) => r.value === selectedRegion)?.flag ?? '🌐'}
        </button>

        {showDropdown && (
          <div className="vpn-dropdown">
            {REGIONS.map((region) => (
              <button
                key={region.value}
                className={`vpn-dropdown-item ${
                  selectedRegion === region.value ? 'vpn-dropdown-item--active' : ''
                }`}
                onClick={() => handleRegionSelect(region.value)}
              >
                {region.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toggle Switch */}
      <button
        className={`vpn-switch ${status.enabled ? 'vpn-switch--on' : ''}`}
        onClick={handleToggle}
        title={status.enabled ? 'Disable VPN' : 'Enable VPN'}
        aria-label={status.enabled ? 'Disable VPN' : 'Enable VPN'}
        disabled={isConnecting}
        id="vpn-switch"
      >
        <div className="vpn-switch-track">
          <div className="vpn-switch-thumb" />
        </div>
      </button>
    </div>
  );
};

export default VpnToggle;
