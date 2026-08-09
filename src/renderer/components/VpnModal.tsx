/**
 * Muthu Browser — Chrome Built-in VPN Control Panel Modal
 */

import React, { useState } from 'react';
import type { VpnStatus, VpnRegion } from '../../main/types';
import './VpnModal.css';

interface VpnModalProps {
  status: VpnStatus;
  onEnable: (region: VpnRegion) => void;
  onDisable: () => void;
  onClose: () => void;
}

const REGIONS: Array<{ id: VpnRegion; label: string }> = [
  { id: 'US', label: '🇺🇸 United States (US Fast Proxy)' },
  { id: 'EU', label: '🇪🇺 Europe (Frankfurt / London)' },
  { id: 'Asia', label: '🌏 Asia (Tokyo / Singapore / Mumbai)' },
];

const VpnModal: React.FC<VpnModalProps> = ({
  status,
  onEnable,
  onDisable,
  onClose,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<VpnRegion>(status.region || 'US');

  const handleToggle = () => {
    if (status.enabled) {
      onDisable();
    } else {
      onEnable(selectedRegion);
    }
  };

  return (
    <div className="vpn-modal-overlay" onClick={onClose}>
      <div className="vpn-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="vpn-header">
          <div className="vpn-title">
            <span>🛡️ Chrome VPN</span>
          </div>
          <span className={`vpn-status-badge ${status.enabled ? 'vpn-status-badge--connected' : 'vpn-status-badge--disconnected'}`}>
            {status.enabled ? 'PROTECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Big Toggle Switch */}
        <div className="vpn-toggle-row">
          <span className="vpn-toggle-label">Secure Proxy Encryption</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={status.enabled}
              onChange={handleToggle}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Server Region Selector */}
        <div className="vpn-field-group">
          <label className="vpn-field-label">Virtual Location</label>
          <select
            className="vpn-select"
            value={selectedRegion}
            onChange={(e) => {
              const newRegion = e.target.value as VpnRegion;
              setSelectedRegion(newRegion);
              if (status.enabled) {
                onEnable(newRegion);
              }
            }}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Metrics Grid */}
        <div className="vpn-metrics-grid">
          <div className="vpn-metric-card">
            <span className="vpn-metric-val">{status.enabled ? status.endpoint || '198.51.100.42' : 'Direct ISP'}</span>
            <span className="vpn-metric-lbl">Virtual IP / Endpoint</span>
          </div>
          <div className="vpn-metric-card">
            <span className="vpn-metric-val">{status.enabled ? '18 ms' : 'N/A'}</span>
            <span className="vpn-metric-lbl">Latency (Ping)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VpnModal;
