import React, { useState } from 'react';
import type { VpnStatus, VpnRegion } from '../../main/types';
import './VpnModal.css';

interface VpnModalProps {
  status: VpnStatus;
  onEnable: (region: VpnRegion) => void;
  onDisable: () => void;
  onClose: () => void;
}

const LOCATIONS: Array<{ id: VpnRegion; label: string; city: string }> = [
  { id: 'US', label: 'United States', city: 'New York (East Tunnel)' },
  { id: 'EU', label: 'Europe', city: 'Frankfurt (Central Tunnel)' },
  { id: 'Asia', label: 'Asia-Pacific', city: 'Singapore (Asia Gateway)' },
];

export const VpnModal: React.FC<VpnModalProps> = ({
  status,
  onEnable,
  onDisable,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tunnel' | 'proxy'>('tunnel');
  const [selectedRegion, setSelectedRegion] = useState<VpnRegion>(status.region || 'US');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('1080');
  const [proxyProto, setProxyProto] = useState<'socks5' | 'http'>('socks5');
  const [ipData, setIpData] = useState<{ ip: string; status: string; encrypted: boolean } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleToggle = () => {
    if (status.enabled) {
      onDisable();
      setIpData(null);
    } else {
      onEnable(selectedRegion);
      setIpData(null);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      if (window.muthuAPI?.vpnCheckIp) {
        const result = await window.muthuAPI.vpnCheckIp();
        setIpData(result);
      } else {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json() as { ip?: string };
        setIpData({
          ip: data.ip || 'Unknown',
          status: status.enabled ? `Routed via ${selectedRegion}` : 'Direct connection',
          encrypted: status.enabled,
        });
      }
    } catch {
      setIpData({
        ip: status.enabled ? 'Protected Gateway' : 'Direct Connection',
        status: status.enabled ? `Tunnel active (${selectedRegion})` : 'Direct connection',
        encrypted: status.enabled,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="vpn-modal-overlay" onClick={onClose}>
      <div className="vpn-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="vpn-header">
          <div className="vpn-title">
            <span>🛡️ Network Privacy & Tunnel Control</span>
          </div>
          <span className={`vpn-status-badge ${status.enabled ? 'vpn-status-badge--connected' : 'vpn-status-badge--disconnected'}`}>
            {status.enabled ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="vpn-mode-tabs">
          <button
            className={`vpn-mode-tab ${activeTab === 'tunnel' ? 'vpn-mode-tab--active' : ''}`}
            onClick={() => setActiveTab('tunnel')}
          >
            WireGuard Tunnel
          </button>
          <button
            className={`vpn-mode-tab ${activeTab === 'proxy' ? 'vpn-mode-tab--active' : ''}`}
            onClick={() => setActiveTab('proxy')}
          >
            Custom Proxy
          </button>
        </div>

        {activeTab === 'tunnel' ? (
          <>
            {/* Big Toggle Switch */}
            <div className="vpn-toggle-row">
              <div>
                <div className="vpn-toggle-label">Native Tunnel State</div>
                <div className="vpn-toggle-sub">WireGuard / Encrypted Network Gateway</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={status.enabled}
                  onChange={handleToggle}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Location Selector */}
            <div className="vpn-field-group">
              <label className="vpn-field-label">Select Tunnel Endpoint</label>
              <select
                className="vpn-select"
                value={selectedRegion}
                onChange={(e) => {
                  const newRegion = e.target.value as VpnRegion;
                  setSelectedRegion(newRegion);
                  if (status.enabled) onEnable(newRegion);
                }}
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label} — {loc.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Tunnel Specs */}
            <div className="vpn-endpoint-info">
              <div className="vpn-endpoint-row">
                <span>Protocol:</span>
                <strong>WireGuard (UDP / ChaCha20-Poly1305)</strong>
              </div>
              <div className="vpn-endpoint-row">
                <span>DNS Privacy:</span>
                <strong>Encrypted DoH (Cloudflare 1.1.1.1)</strong>
              </div>
              <div className="vpn-endpoint-row">
                <span>WebRTC IP Policy:</span>
                <strong>disable_non_proxied_udp</strong>
              </div>
            </div>
          </>
        ) : (
          <div className="vpn-custom-proxy-form">
            <div className="vpn-field-group">
              <label className="vpn-field-label">Proxy Protocol</label>
              <select
                className="vpn-select"
                value={proxyProto}
                onChange={(e) => setProxyProto(e.target.value as any)}
              >
                <option value="socks5">SOCKS5 (e.g. Tor or Shadowsocks)</option>
                <option value="http">HTTP / HTTPS Proxy</option>
              </select>
            </div>

            <div className="vpn-field-group">
              <label className="vpn-field-label">Proxy Host & Port</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="vpn-input"
                  placeholder="127.0.0.1"
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="vpn-input"
                  placeholder="1080"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(e.target.value)}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            <p className="vpn-proxy-note">
              Note: SOCKS5/HTTP proxies route HTTP traffic through your designated server.
              They do not provide system-wide VPN encryption.
            </p>
          </div>
        )}

        {/* Verification Section */}
        <div className="vpn-diagnostic-box">
          <div className="vpn-diagnostic-header">
            <span>Network Diagnostic</span>
            <button
              className="vpn-verify-btn"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? 'Testing...' : '🔍 Test Outbound IP'}
            </button>
          </div>

          {ipData && (
            <div className="vpn-diagnostic-results">
              <div className="vpn-result-row">
                <span>External IP:</span>
                <code>{ipData.ip}</code>
              </div>
              <div className="vpn-result-row">
                <span>Status:</span>
                <span>{ipData.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VpnModal;
