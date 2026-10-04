/**
 * Muthu Browser — Per-Site Privacy Dashboard Modal
 *
 * Displays real-time per-site privacy telemetry:
 * - Ads & Trackers blocked on current site
 * - Third-party requests intercepted
 * - Cookies isolated/blocked
 * - Per-site active permissions overview
 * - Shield toggle (ON/OFF per site)
 */

import React from 'react';
import type { SitePrivacyStats } from '../../main/privacy-engine';
import './PrivacyDashboard.css';

interface PrivacyDashboardProps {
  stats: SitePrivacyStats;
  url: string;
  onToggleShield: (domain: string, enabled: boolean) => void;
  onClearSiteData?: (domain: string) => void;
  onClose: () => void;
}

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({
  stats,
  url,
  onToggleShield,
  onClearSiteData,
  onClose,
}) => {
  let displayDomain = stats.domain || 'This site';
  try {
    if (url && url.startsWith('http')) {
      displayDomain = new URL(url).hostname;
    }
  } catch {
    // fallback
  }

  const isShieldOn = stats.shieldEnabled;

  return (
    <div className="privacy-dashboard-backdrop" onClick={onClose}>
      <div className="privacy-dashboard-card" onClick={(e) => e.stopPropagation()}>
        <div className="privacy-dashboard-header">
          <div className="privacy-site-info">
            <span className="privacy-shield-icon">{isShieldOn ? '🛡️' : '⚪'}</span>
            <div>
              <div className="privacy-site-domain">{displayDomain}</div>
              <div className="privacy-site-status">
                {isShieldOn ? 'Privacy Shields Active' : 'Shields Down for this site'}
              </div>
            </div>
          </div>
          <button className="privacy-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="privacy-shield-toggle-row">
          <span>Shields Protection</span>
          <label className="privacy-switch">
            <input
              type="checkbox"
              checked={isShieldOn}
              onChange={(e) => onToggleShield(stats.domain, e.target.checked)}
            />
            <span className="privacy-slider" />
          </label>
        </div>

        <div className="privacy-metrics-grid">
          <div className="privacy-metric-box">
            <div className="privacy-metric-num" style={{ color: '#81c995' }}>{stats.adsBlocked}</div>
            <div className="privacy-metric-name">Ads Blocked</div>
          </div>
          <div className="privacy-metric-box">
            <div className="privacy-metric-num" style={{ color: '#8ab4f8' }}>{stats.trackersBlocked}</div>
            <div className="privacy-metric-name">Trackers Blocked</div>
          </div>
          <div className="privacy-metric-box">
            <div className="privacy-metric-num" style={{ color: '#fdd663' }}>{stats.thirdPartyBlocked}</div>
            <div className="privacy-metric-name">Third-Party Req</div>
          </div>
          <div className="privacy-metric-box">
            <div className="privacy-metric-num" style={{ color: '#ee675c' }}>{stats.cookiesBlocked}</div>
            <div className="privacy-metric-name">Cookies Guarded</div>
          </div>
        </div>

        <div className="privacy-footer-actions">
          {onClearSiteData && (
            <button
              className="privacy-action-btn privacy-action-danger"
              onClick={() => onClearSiteData(stats.domain)}
            >
              Clear Site Cookies & Cache
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
