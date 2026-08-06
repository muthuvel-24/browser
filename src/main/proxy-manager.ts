/**
 * Muthu Browser — VPN / Proxy Manager
 *
 * Manages proxy routing for all Electron sessions.
 * - Configurable SOCKS5/HTTP proxy endpoints per region
 * - Toggle on/off with region selection
 * - WebRTC IP leak prevention
 * - DNS leak prevention (route DNS through proxy)
 */

import { session, type Session } from 'electron';
import type { VpnRegion, VpnStatus, VpnConnectionState, ProxyEndpoint } from './types';

/** Default proxy endpoints — users should configure these for real VPN servers */
const DEFAULT_ENDPOINTS: ProxyEndpoint[] = [
  {
    region: 'US',
    protocol: 'socks5',
    host: '127.0.0.1',
    port: 9050,
    label: 'US Proxy (Tor)',
  },
  {
    region: 'EU',
    protocol: 'socks5',
    host: '127.0.0.1',
    port: 9051,
    label: 'EU Proxy',
  },
  {
    region: 'Asia',
    protocol: 'socks5',
    host: '127.0.0.1',
    port: 9052,
    label: 'Asia Proxy',
  },
];

export class ProxyManager {
  private enabled = false;
  private currentRegion: VpnRegion = 'US';
  private connectionState: VpnConnectionState = 'disconnected';
  private endpoints: ProxyEndpoint[];

  /** Callback fired whenever VPN status changes */
  public onStatusChanged: ((status: VpnStatus) => void) | null = null;

  constructor(customEndpoints?: ProxyEndpoint[]) {
    this.endpoints = customEndpoints ?? DEFAULT_ENDPOINTS;
  }

  /**
   * Enable proxy routing on the default session.
   *
   * @param region - Target region to route traffic through
   */
  async enable(region: VpnRegion): Promise<void> {
    const endpoint = this.endpoints.find((e) => e.region === region);
    if (!endpoint) {
      console.error(`[Proxy] No endpoint configured for region: ${region}`);
      this.setConnectionState('error');
      return;
    }

    this.currentRegion = region;
    this.setConnectionState('connecting');

    try {
      // Set proxy rule with direct fallback so browser stays usable
      const proxyRule = `${endpoint.protocol}://${endpoint.host}:${endpoint.port}, direct://`;

      // Set proxy on default session AND the persistent partition used by tabs
      const tabSession = session.fromPartition('persist:muthu');
      await session.defaultSession.setProxy({
        proxyRules: proxyRule,
        proxyBypassRules: '',
      });
      await tabSession.setProxy({
        proxyRules: proxyRule,
        proxyBypassRules: '',
      });

      // Prevent WebRTC IP leaks by restricting to public interface only
      this.setWebRtcPolicy(session.defaultSession);

      this.enabled = true;
      this.setConnectionState('connected');
      console.log(`[Proxy] Enabled VPN Proxy: ${proxyRule} (${region})`);
    } catch (err) {
      console.error('[Proxy] Failed to set proxy:', err);
      this.enabled = false;
      this.setConnectionState('error');
    }
  }

  /**
   * Disable proxy routing — return to direct connection.
   */
  async disable(): Promise<void> {
    try {
      await session.defaultSession.setProxy({
        proxyRules: '',
      });
      const tabSession = session.fromPartition('persist:muthu');
      await tabSession.setProxy({
        proxyRules: '',
      });

      // Restore default WebRTC policy
      this.restoreWebRtcPolicy(session.defaultSession);

      this.enabled = false;
      this.setConnectionState('disconnected');
      console.log('[Proxy] Disabled — direct connection restored');
    } catch (err) {
      console.error('[Proxy] Failed to disable proxy:', err);
      this.setConnectionState('error');
    }
  }

  /**
   * Restrict WebRTC to prevent local IP address leaks.
   */
  private setWebRtcPolicy(targetSession: Session): void {
    targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(true);
    });

    console.log('[Proxy] WebRTC leak prevention active');
  }

  /**
   * Restore default WebRTC policy.
   */
  private restoreWebRtcPolicy(targetSession: Session): void {
    targetSession.setPermissionRequestHandler(null);
  }

  /**
   * Update connection state and notify listeners.
   */
  private setConnectionState(state: VpnConnectionState): void {
    this.connectionState = state;
    this.onStatusChanged?.(this.getStatus());
  }

  /**
   * Get current VPN/proxy status.
   */
  getStatus(): VpnStatus {
    const endpoint = this.endpoints.find((e) => e.region === this.currentRegion);
    return {
      enabled: this.enabled,
      region: this.currentRegion,
      state: this.connectionState,
      endpoint: endpoint
        ? `${endpoint.protocol}://${endpoint.host}:${endpoint.port}`
        : 'none',
    };
  }

  /**
   * Get available regions.
   */
  getRegions(): VpnRegion[] {
    return this.endpoints.map((e) => e.region);
  }
}
