import React, { useState, useRef } from 'react';
import './SettingsPage.css';

export interface BrowserSettings {
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'yahoo';
  homepage: string;
  startupBehavior: 'newTab' | 'lastSession' | 'homepage';
  theme: 'dark' | 'light' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  zoomLevel: number;
  httpsOnlyMode: boolean;
  safeBrowsing: boolean;
  blockThirdPartyCookies: boolean;
  doNotTrack: boolean;
  clearCookiesOnExit: boolean;
  clearHistoryOnExit: boolean;
  clearCacheOnExit: boolean;
  fingerprintProtection: boolean;
  adBlockerEnabled: boolean;
  adBlockerWhitelist: string[];
  downloadPath: string;
  askBeforeDownload: boolean;
  warnDangerousDownloads: boolean;
  blockPopups: boolean;
  blockAutoplay: boolean;
  enableJavascript: boolean;
  vpnAutoConnect: boolean;
  vpnDefaultRegion: 'US' | 'EU' | 'Asia';
}

export interface ClearDataOptions {
  cookies: boolean;
  cache: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  serviceWorkers: boolean;
}

export interface SettingsPageProps {
  settings: BrowserSettings;
  onSettingChange: (key: string, value: any) => void;
  onClearBrowsingData: (options: ClearDataOptions) => void;
  onClose: () => void;
  appVersion?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSettingChange,
  onClearBrowsingData,
  onClose,
  appVersion = '1.0.0',
}) => {
  const [activeSection, setActiveSection] = useState('general');
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [newWhitelistDomain, setNewWhitelistDomain] = useState('');
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [isRunningBench, setIsRunningBench] = useState(false);

  const [clearDataOptions, setClearDataOptions] = useState<ClearDataOptions>({
    cookies: true,
    cache: true,
    localStorage: false,
    indexedDB: false,
    serviceWorkers: false,
  });

  const sections = [
    { id: 'general', label: '⚙️ General' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'search', label: '🔍 Search Engine' },
    { id: 'ai', label: '✨ AI Assistant' },
    { id: 'privacy', label: '🔒 Privacy & Cookies' },
    { id: 'adblocker', label: '🛡️ Ad & Tracker Blocker' },
    { id: 'vpn', label: '🌐 VPN & Tunnels' },
    { id: 'permissions', label: '🔑 Permissions' },
    { id: 'security', label: '🛡️ Security Hardening' },
    { id: 'performance', label: '⚡ Performance' },
    { id: 'downloads', label: '⬇️ Downloads' },
    { id: 'about', label: 'ℹ️ About & Diagnostics' },
  ];

  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element && contentRef.current) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const Toggle = ({ settingKey, label, desc }: { settingKey: keyof BrowserSettings; label: string; desc?: string }) => (
    <div className="settingRow">
      <div className="settingLabel">
        <span className="settingName">{label}</span>
        {desc && <span className="settingDesc">{desc}</span>}
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings[settingKey] as boolean}
          onChange={(e) => onSettingChange(settingKey, e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWhitelistDomain.trim()) {
      const currentList = settings.adBlockerWhitelist || [];
      if (!currentList.includes(newWhitelistDomain.trim())) {
        onSettingChange('adBlockerWhitelist', [...currentList, newWhitelistDomain.trim()]);
      }
      setNewWhitelistDomain('');
    }
  };

  const handleRemoveWhitelist = (domain: string) => {
    const currentList = settings.adBlockerWhitelist || [];
    onSettingChange('adBlockerWhitelist', currentList.filter((d) => d !== domain));
  };

  const handleRunBench = async () => {
    setIsRunningBench(true);
    try {
      if (window.muthuAPI?.runBenchmark) {
        const res = await window.muthuAPI.runBenchmark();
        setBenchmarkResult(res);
      }
    } finally {
      setIsRunningBench(false);
    }
  };

  return (
    <div className="settingsPage">
      {/* Sidebar */}
      <div className="settingsSidebar">
        <div className="sidebarTitle">Settings</div>
        <div className="sidebarNav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`sidebarItem ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="settingsContent" ref={contentRef}>
        <button className="closeBtn" onClick={onClose}>✕</button>

        {/* 1. General */}
        <section id="section-general" className="settingsSection">
          <h2>⚙️ General</h2>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">On Startup</span>
              <span className="settingDesc">Choose what to open when Muthu Browser launches</span>
            </div>
            <select
              className="selectInput"
              value={settings.startupBehavior}
              onChange={(e) => onSettingChange('startupBehavior', e.target.value)}
            >
              <option value="newTab">Open New Tab page</option>
              <option value="lastSession">Restore last browsing session</option>
              <option value="homepage">Open custom homepage</option>
            </select>
          </div>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Homepage URL</span>
              <span className="settingDesc">Set your preferred homepage</span>
            </div>
            <input
              type="text"
              className="textInput"
              value={settings.homepage}
              onChange={(e) => onSettingChange('homepage', e.target.value)}
            />
          </div>
        </section>

        {/* 2. Appearance */}
        <section id="section-appearance" className="settingsSection">
          <h2>🎨 Appearance</h2>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Theme</span>
              <span className="settingDesc">Customize browser aesthetic appearance</span>
            </div>
            <select
              className="selectInput"
              value={settings.theme}
              onChange={(e) => onSettingChange('theme', e.target.value)}
            >
              <option value="dark">Chrome Dark</option>
              <option value="light">Chrome Light</option>
              <option value="system">Follow System</option>
            </select>
          </div>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Font Size</span>
            </div>
            <select
              className="selectInput"
              value={settings.fontSize}
              onChange={(e) => onSettingChange('fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Recommended)</option>
              <option value="large">Large</option>
            </select>
          </div>
        </section>

        {/* 3. Search Engine */}
        <section id="section-search" className="settingsSection">
          <h2>🔍 Search Engine</h2>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Default Search Engine</span>
              <span className="settingDesc">Select search provider for Omnibox queries</span>
            </div>
            <select
              className="selectInput"
              value={settings.searchEngine}
              onChange={(e) => onSettingChange('searchEngine', e.target.value)}
            >
              <option value="google">Google Search</option>
              <option value="duckduckgo">DuckDuckGo (Privacy)</option>
              <option value="bing">Microsoft Bing</option>
              <option value="yahoo">Yahoo</option>
            </select>
          </div>
        </section>

        {/* 4. AI Assistant */}
        <section id="section-ai" className="settingsSection">
          <h2>✨ AI Assistant & LLM</h2>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">AI Engine Architecture</span>
              <span className="settingDesc">Local private LLM (Ollama) or secure API endpoint</span>
            </div>
            <select className="selectInput" defaultValue="ollama">
              <option value="ollama">Local Ollama (100% Private Offline)</option>
              <option value="hybrid">Spring Boot Hybrid Cluster</option>
              <option value="cloud">Cloud LLM API Abstraction</option>
            </select>
          </div>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Data Minimization Policy</span>
              <span className="settingDesc">Passwords and form fields are automatically masked</span>
            </div>
            <span style={{ color: '#81c995', fontWeight: 600, fontSize: '12px' }}>ENFORCED</span>
          </div>
        </section>

        {/* 5. Privacy & Security */}
        <section id="section-privacy" className="settingsSection">
          <h2>🔒 Privacy & Cookies</h2>
          <Toggle settingKey="blockThirdPartyCookies" label="Block Third-Party Cookies" desc="Prevent cross-site trackers from storing cookies" />
          <Toggle settingKey="doNotTrack" label="Send 'Do Not Track' Header" desc="Request websites not to track your browsing session" />
          <Toggle settingKey="fingerprintProtection" label="Anti-Fingerprinting Shield" desc="Normalize WebGL, Canvas, and Battery API signals" />
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Clear Browsing Data</span>
              <span className="settingDesc">Delete cookies, cache, and site data</span>
            </div>
            <button className="primaryBtn" onClick={() => setShowClearDataModal(true)}>Clear Data...</button>
          </div>
        </section>

        {/* 6. Ad Blocker */}
        <section id="section-adblocker" className="settingsSection">
          <h2>🛡️ Ad & Tracker Blocker</h2>
          <Toggle settingKey="adBlockerEnabled" label="Enable Content Filtering" desc="Network-level ad, tracker, and telemetry interceptor" />
          <div className="whitelistManager">
            <span className="settingName">Whitelisted Domains</span>
            <form onSubmit={handleAddWhitelist} className="whitelistForm">
              <input
                type="text"
                placeholder="example.com"
                value={newWhitelistDomain}
                onChange={(e) => setNewWhitelistDomain(e.target.value)}
                className="textInput"
              />
              <button type="submit" className="primaryBtn">Add</button>
            </form>
            <div className="whitelistTags">
              {(settings.adBlockerWhitelist || []).map((domain) => (
                <span key={domain} className="whitelistTag">
                  {domain}
                  <button type="button" onClick={() => handleRemoveWhitelist(domain)}>✕</button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 7. VPN & Tunnels */}
        <section id="section-vpn" className="settingsSection">
          <h2>🌐 VPN & Tunnels</h2>
          <Toggle settingKey="vpnAutoConnect" label="Connect on Launch" desc="Automatically initiate tunnel connection upon browser startup" />
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Default Tunnel Location</span>
            </div>
            <select
              className="selectInput"
              value={settings.vpnDefaultRegion}
              onChange={(e) => onSettingChange('vpnDefaultRegion', e.target.value)}
            >
              <option value="US">United States (East)</option>
              <option value="EU">Europe (Frankfurt)</option>
              <option value="Asia">Asia-Pacific (Singapore)</option>
            </select>
          </div>
        </section>

        {/* 8. Permissions */}
        <section id="section-permissions" className="settingsSection">
          <h2>🔑 Permissions</h2>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Default Permission Policy</span>
              <span className="settingDesc">Prompt user interactively before granting sensitive hardware APIs</span>
            </div>
            <span style={{ color: '#8ab4f8', fontWeight: 600, fontSize: '12px' }}>ASK (Recommended)</span>
          </div>
        </section>

        {/* 9. Security */}
        <section id="section-security" className="settingsSection">
          <h2>🛡️ Security Hardening</h2>
          <Toggle settingKey="httpsOnlyMode" label="HTTPS-Only Mode" desc="Upgrade insecure HTTP navigations to HTTPS" />
          <Toggle settingKey="safeBrowsing" label="Anti-Phishing Homograph Detection" desc="Detect lookalike Cyrillic domains" />
          <Toggle settingKey="warnDangerousDownloads" label="Warn on Dangerous File Downloads" desc="Alert when downloading executable scripts" />
        </section>

        {/* 10. Performance */}
        <section id="section-performance" className="settingsSection">
          <h2>⚡ Performance & Memory Saver</h2>
          <div className="settingRow">
            <div className="settingLabel">
              <span className="settingName">Adaptive Multi-Tab Memory Saver</span>
              <span className="settingDesc">Sleeps background tabs under memory pressure; discards idle WebContents</span>
            </div>
            <span style={{ color: '#81c995', fontWeight: 600, fontSize: '12px' }}>ACTIVE</span>
          </div>
        </section>

        {/* 11. Downloads */}
        <section id="section-downloads" className="settingsSection">
          <h2>⬇️ Downloads</h2>
          <Toggle settingKey="askBeforeDownload" label="Ask Where to Save Each File" desc="Prompt file dialog before downloading" />
        </section>

        {/* 12. About & Diagnostics */}
        <section id="section-about" className="settingsSection">
          <h2>ℹ️ About & Diagnostics</h2>
          <div className="aboutCard">
            <div><strong>Product:</strong> AI-Powered Privacy Web Browser</div>
            <div><strong>Version:</strong> {appVersion}</div>
            <div><strong>Engine:</strong> Electron 33.4 / Chromium 131.0 / Node 20.18</div>
            <div><strong>Architecture:</strong> Production-Grade TypeScript & React 18</div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              className="primaryBtn"
              onClick={handleRunBench}
              disabled={isRunningBench}
            >
              {isRunningBench ? 'Running Diagnostic...' : '⚡ Run Performance Benchmark'}
            </button>

            {benchmarkResult && (
              <div className="aboutCard" style={{ marginTop: '12px' }}>
                <div><strong>Overall Score:</strong> {benchmarkResult.overallScore}/100</div>
                <div><strong>Tab Allocation Latency:</strong> {benchmarkResult.tabCreationAvgMs} ms</div>
                <div><strong>Tab Switch Latency:</strong> {benchmarkResult.tabSwitchAvgMs} ms</div>
                <div><strong>Search Latency:</strong> {benchmarkResult.searchLatencyMs} ms</div>
                <div><strong>Estimated Memory (20 Tabs):</strong> {benchmarkResult.memory20TabsMB} MB</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Clear Data Modal */}
      {showClearDataModal && (
        <div className="modalBackdrop">
          <div className="modalContent">
            <h3>Clear Browsing Data</h3>
            <div className="modalBody">
              <label>
                <input
                  type="checkbox"
                  checked={clearDataOptions.cookies}
                  onChange={(e) => setClearDataOptions((prev) => ({ ...prev, cookies: e.target.checked }))}
                />
                Cookies and site data
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={clearDataOptions.cache}
                  onChange={(e) => setClearDataOptions((prev) => ({ ...prev, cache: e.target.checked }))}
                />
                Cached images and files
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={clearDataOptions.localStorage}
                  onChange={(e) => setClearDataOptions((prev) => ({ ...prev, localStorage: e.target.checked }))}
                />
                Local storage data
              </label>
            </div>
            <div className="modalActions">
              <button className="secondaryBtn" onClick={() => setShowClearDataModal(false)}>Cancel</button>
              <button
                className="dangerBtn"
                onClick={() => {
                  onClearBrowsingData(clearDataOptions);
                  setShowClearDataModal(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
