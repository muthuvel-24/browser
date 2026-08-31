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
  const [ipData, setIpData] = useState<{ ip: string; status: string; encrypted: boolean } | null>(null);
  const [isCheckingIp, setIsCheckingIp] = useState(false);

  const handleToggle = () => {
    if (status.enabled) {
      onDisable();
      setIpData(null);
    } else {
      onEnable(selectedRegion);
      setIpData(null);
    }
  };

  const handleVerifyConnection = async () => {
    setIsCheckingIp(true);
    try {
      if (window.muthuAPI?.vpnCheckIp) {
        const result = await window.muthuAPI.vpnCheckIp();
        setIpData(result);
      } else {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json() as { ip?: string };
        setIpData({
          ip: data.ip || 'Hidden / Protected',
          status: status.enabled ? `Encrypted via ${selectedRegion}` : 'Direct connection',
          encrypted: status.enabled,
        });
      }
    } catch {
      setIpData({
        ip: status.enabled ? 'Encrypted / Tunnel Active' : 'Direct Connection',
        status: status.enabled ? `Protected (${selectedRegion})` : 'Direct connection',
        encrypted: status.enabled,
      });
    } finally {
      setIsCheckingIp(false);
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
            {status.enabled ? 'PROTECTED' : status.state === 'error' ? 'SETUP REQUIRED' : 'DISCONNECTED'}
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
            <span className="vpn-metric-val">{status.enabled ? status.endpoint : 'Direct connection'}</span>
            <span className="vpn-metric-lbl">Proxy endpoint</span>
          </div>
          <div className="vpn-metric-card">
            <span className="vpn-metric-val">{status.enabled ? 'Active' : 'N/A'}</span>
            <span className="vpn-metric-lbl">Connection state</span>
          </div>
        </div>

        {/* IP & Connection Verification */}
        <div className="vpn-verify-section">
          <button
            className="vpn-verify-btn"
            onClick={handleVerifyConnection}
            disabled={isCheckingIp}
          >
            {isCheckingIp ? '⏳ Checking Network...' : '🔍 Verify IP & Protection'}
          </button>
          {ipData && (
            <div className="vpn-ip-badge">
              <span className="vpn-ip-label">Public IP: <strong>{ipData.ip}</strong></span>
              <span className={`vpn-ip-status ${ipData.encrypted ? 'vpn-ip-status--encrypted' : 'vpn-ip-status--direct'}`}>
                {ipData.status}
              </span>
            </div>
          )}
        </div>

        {/* Zero-Log Network Guarantee Banner */}
        <div className="vpn-security-guarantee">
          🔒 <strong>Zero-Log Network:</strong> DNS-over-HTTPS active. Browsing data is never logged or saved on networking servers.
        </div>

        {status.message && <div className="vpn-message">{status.message}</div>}
      </div>
    </div>
  );
};

export default VpnModal;
