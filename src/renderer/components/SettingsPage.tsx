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

const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSettingChange,
  onClearBrowsingData,
  onClose,
  appVersion = '1.0.0',
}) => {
  const [activeSection, setActiveSection] = useState('general');
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [newWhitelistDomain, setNewWhitelistDomain] = useState('');
  
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
    { id: 'privacy', label: '🔒 Privacy & Security' },
    { id: 'adblocker', label: '🛡️ Ad Blocker' },
    { id: 'downloads', label: '⬇️ Downloads' },
    { id: 'content', label: '📄 Content' },
    { id: 'vpn', label: '🌐 VPN' },
    { id: 'about', label: 'ℹ️ About' },
  ];

  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element && contentRef.current) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const Toggle = ({ settingKey, label, desc }: { settingKey: keyof BrowserSettings, label: string, desc?: string }) => (
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

  const handleAddWhitelist = () => {
    if (newWhitelistDomain && !settings.adBlockerWhitelist.includes(newWhitelistDomain)) {
      onSettingChange('adBlockerWhitelist', [...settings.adBlockerWhitelist, newWhitelistDomain]);
      setNewWhitelistDomain('');
    }
  };

  const handleRemoveWhitelist = (domain: string) => {
    onSettingChange('adBlockerWhitelist', settings.adBlockerWhitelist.filter(d => d !== domain));
  };

  const handleClearDataSubmit = () => {
    onClearBrowsingData(clearDataOptions);
    setShowClearDataModal(false);
  };

  return (
    <div className="settingsContainer">
      <button className="closeButton" onClick={onClose} aria-label="Close">✕</button>
      
      <div className="sidebar">
        {sections.map(s => (
          <div 
            key={s.id} 
            className={`sidebarItem ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </div>
        ))}
      </div>
      
      <div className="content" ref={contentRef}>
        <div className="contentInner">
          
          {/* General Section */}
          <div id="section-general" className="section">
            <h2 className="sectionTitle">General</h2>
            <div className="settingRow">
              <span className="settingName">Search Engine</span>
              <select className="select" value={settings.searchEngine} onChange={e => onSettingChange('searchEngine', e.target.value)}>
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="yahoo">Yahoo</option>
              </select>
            </div>
            <div className="settingRow">
              <span className="settingName">Startup Behavior</span>
              <select className="select" value={settings.startupBehavior} onChange={e => onSettingChange('startupBehavior', e.target.value)}>
                <option value="newTab">Open the New Tab page</option>
                <option value="lastSession">Continue where you left off</option>
                <option value="homepage">Open a specific page</option>
              </select>
            </div>
            <div className="settingRow">
              <span className="settingName">Homepage</span>
              <input type="text" className="textInput" value={settings.homepage} onChange={e => onSettingChange('homepage', e.target.value)} />
            </div>
          </div>

          {/* Appearance */}
          <div id="section-appearance" className="section">
            <h2 className="sectionTitle">Appearance</h2>
            <div className="settingRow">
              <span className="settingName">Theme</span>
              <select className="select" value={settings.theme} onChange={e => onSettingChange('theme', e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div className="settingRow">
              <span className="settingName">Font Size</span>
              <select className="select" value={settings.fontSize} onChange={e => onSettingChange('fontSize', e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="settingRow">
              <span className="settingName">Page Zoom (%)</span>
              <input type="number" className="numberInput" min="25" max="500" value={Math.round(settings.zoomLevel * 100)} onChange={e => onSettingChange('zoomLevel', parseInt(e.target.value) / 100)} />
            </div>
          </div>

          {/* Privacy & Security */}
          <div id="section-privacy" className="section">
            <h2 className="sectionTitle">Privacy & Security</h2>
            <div className="settingRow">
              <div className="settingLabel">
                <span className="settingName">Clear browsing data</span>
                <span className="settingDesc">Clear history, cookies, cache, and more</span>
              </div>
              <button className="button danger" onClick={() => setShowClearDataModal(true)}>Clear Data</button>
            </div>
            <Toggle settingKey="httpsOnlyMode" label="Always use secure connections (HTTPS)" />
            <Toggle settingKey="safeBrowsing" label="Safe Browsing" desc="Protects you from dangerous sites" />
            <Toggle settingKey="blockThirdPartyCookies" label="Block third-party cookies" />
            <Toggle settingKey="doNotTrack" label="Send a 'Do Not Track' request" />
            <Toggle settingKey="fingerprintProtection" label="Fingerprinting Protection" />
            <Toggle settingKey="clearCookiesOnExit" label="Clear cookies on exit" />
            <Toggle settingKey="clearHistoryOnExit" label="Clear history on exit" />
            <Toggle settingKey="clearCacheOnExit" label="Clear cache on exit" />
          </div>

          {/* Ad Blocker */}
          <div id="section-adblocker" className="section">
            <h2 className="sectionTitle">Ad Blocker</h2>
            <Toggle settingKey="adBlockerEnabled" label="Enable Ad Blocker" />
            <div className="settingRow" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '16px'}}>
              <span className="settingName">Whitelist Domains</span>
              <div className="whitelistManager">
                <div className="addWhitelistRow">
                  <input 
                    type="text" 
                    className="textInput" 
                    placeholder="example.com" 
                    value={newWhitelistDomain}
                    onChange={(e) => setNewWhitelistDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
                  />
                  <button className="button" onClick={handleAddWhitelist}>Add</button>
                </div>
                <div className="whitelistItems">
                  {settings.adBlockerWhitelist.map(domain => (
                    <div key={domain} className="whitelistItem">
                      <span>{domain}</span>
                      <button className="removeWhitelistBtn" onClick={() => handleRemoveWhitelist(domain)}>✕</button>
                    </div>
                  ))}
                  {settings.adBlockerWhitelist.length === 0 && (
                    <span style={{color: '#9aa0a6', fontSize: '0.85rem'}}>No whitelisted domains.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Downloads */}
          <div id="section-downloads" className="section">
            <h2 className="sectionTitle">Downloads</h2>
            <div className="settingRow">
              <span className="settingName">Location</span>
              <input type="text" className="textInput" style={{width: '300px'}} value={settings.downloadPath} onChange={e => onSettingChange('downloadPath', e.target.value)} />
            </div>
            <Toggle settingKey="askBeforeDownload" label="Ask where to save each file before downloading" />
            <Toggle settingKey="warnDangerousDownloads" label="Warn about dangerous downloads" />
          </div>

          {/* Content */}
          <div id="section-content" className="section">
            <h2 className="sectionTitle">Content Settings</h2>
            <Toggle settingKey="enableJavascript" label="Enable JavaScript" />
            <Toggle settingKey="blockPopups" label="Block pop-ups and redirects" />
            <Toggle settingKey="blockAutoplay" label="Block media autoplay" />
          </div>

          {/* VPN */}
          <div id="section-vpn" className="section">
            <h2 className="sectionTitle">VPN Settings</h2>
            <Toggle settingKey="vpnAutoConnect" label="Auto-connect to VPN on startup" />
            <div className="settingRow">
              <span className="settingName">Default Region</span>
              <select className="select" value={settings.vpnDefaultRegion} onChange={e => onSettingChange('vpnDefaultRegion', e.target.value)}>
                <option value="US">United States</option>
                <option value="EU">Europe</option>
                <option value="Asia">Asia</option>
              </select>
            </div>
          </div>

          {/* About */}
          <div id="section-about" className="section" style={{marginBottom: '40px'}}>
            <h2 className="sectionTitle">About Muthu Browser</h2>
            <div className="settingRow">
              <span className="settingName">Version</span>
              <span style={{color: '#9aa0a6'}}>{appVersion}</span>
            </div>
            <div className="settingRow">
              <span className="settingName">Electron</span>
              <span style={{color: '#9aa0a6'}}>{(window as any).process?.versions?.electron || 'Unknown'}</span>
            </div>
            <div className="settingRow">
              <span className="settingName">Node.js</span>
              <span style={{color: '#9aa0a6'}}>{(window as any).process?.versions?.node || 'Unknown'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Clear Data Modal */}
      {showClearDataModal && (
        <div className="modalOverlay" onClick={() => setShowClearDataModal(false)}>
          <div className="modalCard" onClick={e => e.stopPropagation()}>
            <h3 className="modalTitle">Clear browsing data</h3>
            <div className="modalContent">
              <label className="checkboxRow">
                <input type="checkbox" checked={clearDataOptions.cookies} onChange={e => setClearDataOptions({...clearDataOptions, cookies: e.target.checked})} />
                Cookies and other site data
              </label>
              <label className="checkboxRow">
                <input type="checkbox" checked={clearDataOptions.cache} onChange={e => setClearDataOptions({...clearDataOptions, cache: e.target.checked})} />
                Cached images and files
              </label>
              <label className="checkboxRow">
                <input type="checkbox" checked={clearDataOptions.localStorage} onChange={e => setClearDataOptions({...clearDataOptions, localStorage: e.target.checked})} />
                Local Storage
              </label>
              <label className="checkboxRow">
                <input type="checkbox" checked={clearDataOptions.indexedDB} onChange={e => setClearDataOptions({...clearDataOptions, indexedDB: e.target.checked})} />
                IndexedDB
              </label>
              <label className="checkboxRow">
                <input type="checkbox" checked={clearDataOptions.serviceWorkers} onChange={e => setClearDataOptions({...clearDataOptions, serviceWorkers: e.target.checked})} />
                Service Workers
              </label>
            </div>
            <div className="modalActions">
              <button className="modalBtn" onClick={() => setShowClearDataModal(false)}>Cancel</button>
              <button className="modalBtn primary" onClick={handleClearDataSubmit}>Clear Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
