# 🚀 Muthu Browser

<p align="center">
  <img src="https://img.shields.io/badge/Electron-33.4.0-47A248?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4.11-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Security-Hardened-00E676?style=for-the-badge&logo=securityscorecard&logoColor=white" alt="Security" />
</p>

> **Muthu Browser** is a fast, privacy-hardened desktop web browser built with **Electron v33**, **React 18**, and **TypeScript**. It features a modern **Google Chrome-style dark mode interface**, built-in **network-level ad/tracker blocking**, an **instant YouTube video ad-skipper**, **DNS-over-HTTPS (DoH) zero-log VPN privacy**, **anti-fingerprinting defenses**, **OAuth / Google Sign-In popup support**, and an **intelligent V8 memory optimization engine**.

---

## ✨ Key Features

### 🌌 Chrome Desktop Dark Theme & Navigation
- **Chrome Dark Theme Palette**: Polished UI matching Google Chrome (`#202124` Canvas, `#35363A` Frame, `#28292C` Omnibox Pill).
- **Chrome Tab Strip**: Responsive tabs with favicons, live loading spinners, sleep badges (`💤`), and private mode indicators (`🕶️`).
- **Chrome 3-Dot (⋮) Menu**: Fast access to New Tab (`Ctrl+T`), New Incognito Tab (`Ctrl+Shift+N`), Zoom controls (`-` / `+` / `100%`), Find in Page (`Ctrl+F`), and Settings.
- **Speed Dial Start Page**: Quick-access shortcuts to popular web destinations and customizable bookmarks.

### ⚙️ User Personalization & Settings Page
- **Full Settings Dashboard**: 8 comprehensive configuration categories:
  - 🏠 **General**: Search engine selection (Google, Bing, DuckDuckGo, Yahoo), startup behavior, and custom homepage.
  - 🎨 **Appearance**: Theme selector (Dark / Light / System), font sizes, and default zoom level.
  - 🔒 **Privacy & Security**: Do Not Track (DNT), clear data on exit, homograph phishing protection, and dangerous download alerts.
  - 🛡️ **Ad Blocker**: Global ad-blocker toggle and customizable domain whitelist manager.
  - 📥 **Downloads**: Default download directory picker and confirm-before-download options.
  - 🧩 **Content**: Popup blocking, autoplay restrictions, and JavaScript toggles.
  - 🌐 **VPN & Proxy**: Auto-connect on startup and default server region preference.
  - ℹ️ **About**: App version, Chromium, Node.js, and Electron runtime details.
- **Persistent Atomic Storage**: Settings saved automatically to `muthu-settings.json`.

### 🛡️ Ad & Tracker Blocker + YouTube Ad Skipper
- **Network-Level Filter Engine**: Blocks known ad servers, telemetry endpoints, and tracking networks without breaking websites.
- **Instant YouTube Ad Skipper**: Preload-level video ad cleaner that skips pre-roll and mid-roll ads instantly.
- **Tracking Parameter Sanitizer**: Strips invasive tracking tokens (`utm_*`, `fbclid`, `gclid`, `msclkid`, etc.) from URLs while preserving authentication and OAuth state parameters.
- **Live Metrics Badge**: Shield icon in the address bar displaying real-time blocked request counts.

### 🔒 Enterprise Browser Security & Anti-Fingerprinting
- **Google Sign-In & Bot Detection Bypass**: Spoofs `navigator.webdriver`, `window.chrome`, and plugins so Google, Claude.ai, and Cloudflare services work smoothly.
- **OAuth / SSO Native Popup Windows**: Allows Google, Apple, GitHub, Microsoft, and Auth0 popup dialogs with preserved `window.opener` and `postMessage` support.
- **Anti-Fingerprinting Shield**:
  - `navigator.hardwareConcurrency` normalization.
  - Battery Status API privacy mask.
  - WebGL vendor/renderer standardization (`Google Inc. / ANGLE`).
- **Download Protection**: Automatic filename sanitization against path traversal (`../`) and dangerous extension warnings (`.exe`, `.bat`, `.ps1`, `.vbs`, `.msi`, `.cmd`).
- **IDN Homograph Phishing Defense**: Detects and highlights mixed-script lookalike domain spoofing attempts.
- **Renderer Privilege Isolation**: Disallows `<webview>` tag injection and blocks dangerous execution schemes (`javascript:`, `vbscript:`, `file:`).

### 🌐 Zero-Log Regional VPN & DNS-over-HTTPS (DoH)
- **Encrypted DNS-over-HTTPS**: Enforces Cloudflare HTTPS DNS (`https://cloudflare-dns.com/dns-query`) so local Wi-Fi routers and ISP servers cannot track or log domain queries.
- **Multi-Region Routing**: Switch between **US 🇺🇸**, **EU 🇪🇺**, and **Asia 🌏** secure proxy tunnels with `direct://` failover.
- **WebRTC IP Leak Protection**: Enforces `disable_non_proxied_udp` to eliminate local LAN and public IP address leaks.
- **Instant Network Flush**: Automatically flushes host resolver and authentication caches on VPN toggle.
- **Built-in IP & Protection Verification**: Live test tool in the VPN panel to verify your outward visible IP address and encryption status.

### 🍃 Intelligent V8 Memory Saver
- **3-Stage Tab Lifecycle**: `Active` ➔ `Sleeping` (idle 5m) ➔ `Discarded` (idle 15m).
- **Tab Sleeping**: Throttles background JavaScript timers and mutes inactive audio.
- **Tab Discarding**: Unloads background `WebContents` while preserving full page state (URL, title, favicon, scroll position) for instant restoration.
- **Memory Indicator**: Real-time memory saver badge showing active memory optimization metrics.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Electron v33](https://www.electronjs.org/) | Modular multi-process architecture with `BaseWindow` & `WebContentsView` |
| **Frontend** | [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) | Declarative Chrome dark mode user interface |
| **Bundler** | [Vite 5](https://vitejs.dev/) + [@electron-forge/plugin-vite](https://www.electronforge.io/) | Lightning-fast HMR and optimized production bundling |
| **DNS & Network** | DNS-over-HTTPS (DoH) + SOCKS5/HTTPS | Encrypted zero-log DNS routing & multi-region proxy management |
| **Security** | Custom TypeScript Security Manager | SSL verification, anti-fingerprinting, homograph detection, CSP |
| **Storage** | Atomic JSON Store | Local user preferences and browser personalization |

---

## 📁 Project Architecture

```
d:/browser project/
├── src/
│   ├── main/                         # Electron Main Process (Node.js backend)
│   │   ├── main.ts                   # Application entry, BaseWindow setup, IPC router
│   │   ├── tab-manager.ts            # WebContentsView lifecycle & tab management
│   │   ├── proxy-manager.ts          # SOCKS5/HTTPS VPN proxy controller & IP diagnostic
│   │   ├── adblock-engine.ts         # Network ad & tracker filter engine
│   │   ├── memory-manager.ts         # Idle tab sleeping & memory optimization sweep
│   │   ├── security-manager.ts       # SSL certs, homograph phishing, download defense
│   │   ├── settings-store.ts         # Atomic file-based settings persistence
│   │   ├── settings-types.ts         # Settings interfaces & dangerous extension lists
│   │   ├── url-utils.ts              # URL normalization, OAuth detection, UTM sanitizer
│   │   ├── speeddial-html.ts         # Speed Dial Start Page HTML template
│   │   ├── types.ts                  # Shared TypeScript types
│   │   └── security-verification.test.ts # Security test suite (22 automated checks)
│   ├── preload/                      # Isolated Preload Layer (ContextBridge)
│   │   ├── preload.ts                # Typed window.muthuAPI IPC bridge for browser chrome
│   │   └── tab-preload.ts            # Webpage preload: YouTube ad-skipper & anti-fingerprinting
│   ├── renderer/                     # Electron Renderer Process (React 18 UI)
│   │   ├── App.tsx                   # Main layout container & modal router
│   │   ├── App.css                   # Chrome dark mode design system
│   │   ├── components/               # React UI Components
│   │   │   ├── AddressBar.tsx        # Omnibox, SSL badge, action icons, 3-dot trigger
│   │   │   ├── TabBar.tsx            # Chrome tab strip with sleep & private badges
│   │   │   ├── BrowserMenu.tsx       # Chrome 3-dot (⋮) dropdown menu
│   │   │   ├── SettingsPage.tsx      # Chrome settings dashboard with 8 categories
│   │   │   ├── VpnModal.tsx          # VPN control panel with live IP verification
│   │   │   ├── VpnToggle.tsx         # Address bar VPN quick indicator
│   │   │   ├── AdBlockStats.tsx      # Shield badge counter with live block metrics
│   │   │   ├── MemoryIndicator.tsx   # Memory saver badge with optimization metrics
│   │   │   └── FindBar.tsx           # In-page search bar (Ctrl+F)
│   │   ├── hooks/
│   │   │   └── useIpc.ts             # React hook for IPC subscriptions & state
│   │   └── global.d.ts               # Global Window.muthuAPI declarations
│   └── shared/
│       └── ipc-channels.ts           # Centralized IPC channel definitions
├── forge.config.ts                   # Electron Forge build configuration
├── vite.main.config.ts               # Vite configuration for Main process
├── vite.preload.config.ts            # Vite configuration for Preload scripts
├── vite.renderer.config.ts           # Vite configuration for Renderer UI
├── tsconfig.json                     # TypeScript compiler configuration
└── package.json                      # Project dependencies & npm scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **OS**: Windows 10/11, macOS, or Linux

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muthuvel-24/browser.git
   cd browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start in Development Mode**
   ```bash
   npm start
   ```

4. **Run TypeScript Check & Security Tests**
   ```bash
   npm run lint
   npx tsx src/main/security-verification.test.ts
   ```

---

## 📦 Building & Packaging

To compile and package a standalone desktop application for Windows:

```bash
npm run package
```

The production-ready executable will be generated at:
```
out/muthu-browser-win32-x64/muthu-browser.exe
```

---

## ⌨️ Address Bar Keyword Shortcuts

Type any brand name into the address bar and press `Enter` to jump straight to the website:

| Shortcut | Target Destination |
| :--- | :--- |
| `amazon` / `amazon.in` | `https://www.amazon.in` / `https://www.amazon.com` |
| `flipkart` | `https://www.flipkart.com` |
| `claude` | `https://claude.ai` |
| `chatgpt` | `https://chatgpt.com` |
| `youtube` | `https://www.youtube.com` |
| `github` | `https://github.com` |
| `reddit` | `https://www.reddit.com` |
| `netflix` | `https://www.netflix.com` |
| `spotify` | `https://open.spotify.com` |
| `gmail` | `https://mail.google.com` |

---

## 🔒 Security & Privacy Guarantees

- **Zero DNS Snooping**: Queries are routed via encrypted DNS-over-HTTPS (DoH).
- **Zero WebRTC Leaks**: Non-proxied UDP traffic is suppressed to safeguard your true IP.
- **Zero Tracking Parameters**: Privacy-invasive marketing tokens (`utm_*`, `fbclid`) are automatically cleaned.
- **Isolated Incognito Profile**: Private tabs use an in-memory session partition (`muthu-incognito`) that purges all cookies, cache, and history immediately when the last private tab is closed.

---

## 📄 License

Distributed under the **MIT License**.

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/muthuvel-24">Muthuvel</a>
</p>
