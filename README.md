# 🚀 Muthu Browser — AI-Powered Privacy Web Browser

<p align="center">
  <img src="https://img.shields.io/badge/Electron-33.4.0-47A248?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4.11-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Security-Hardened-00E676?style=for-the-badge&logo=securityscorecard&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/Tests-49%2F49%20Passing-brightgreen?style=for-the-badge" alt="Tests" />
</p>

> **Muthu Browser** is an enterprise-grade, privacy-first desktop web browser built with **Electron v33**, **React 18**, and **TypeScript**. It combines a modern **Chrome dark-mode interface**, **AI-powered search engine** with cited source attribution, **on-demand AI browsing assistant**, **deep privacy engine** with third-party tracking shield, **genuine WireGuard tunnel / proxy controller**, **adaptive multi-tab memory management**, and **granular site permission control**.

---

## ✨ Key Features & Architecture

### 1. 🔍 AI-Powered Hybrid Search Engine
- **Intelligent Query Understanding**: Dynamically classifies input into direct URL navigation vs. search query, stripping malicious schemes (`javascript:`, `data:`).
- **Hybrid Search Architecture**: Combines keyword BM25 retrieval with vector semantic similarity for high precision and semantic depth.
- **AI Answer Synthesis with Citations**: Delivers concise AI answers directly tied to cited, clickable web sources without hallucination.
- **Backend Ready**: Ready to connect with the standalone **Spring Boot + PostgreSQL + pgvector + Elasticsearch** search backend documented in `backend/search-service/`.

### 2. 🤖 AI Browser Assistant Side Panel
- **Page Summarizer**: Generates structured, concise summaries of current webpage content.
- **Explain Selected Text**: Provides context-aware breakdowns of complex concepts and jargon.
- **In-Page Q&A**: Ask natural language questions grounded strictly in the current page DOM.
- **Key Takeaways & Comparison**: Extract critical bullet points and compare facts across sources.
- **Strict Privacy Sanitization**: Automatically scrubs credit cards, Social Security numbers, and JWT/Bearer tokens before sending context to LLMs.

### 3. 🛡️ Deep Privacy Engine & Per-Site Shields
- **Real-Time Request Filtering**: Blocks known ad servers, telemetry endpoints, and tracking networks without breaking websites.
- **Third-Party Cookie Stripping**: Strips third-party `Set-Cookie` response headers to prevent cross-site tracking.
- **URL Parameter Sanitization**: Removes invasive tracking tokens (`utm_*`, `fbclid`, `gclid`, `msclkid`, etc.) while protecting OAuth parameters.
- **Per-Site Privacy Dashboard**: Click the shield icon in the omnibox to inspect real-time ads, trackers, and cookies blocked for the active domain, or whitelist trusted sites.

### 4. 🌐 Real VPN & Proxy Controller
- **Honest Network Architecture**: Clear separation of **WireGuard Native Tunnel**, **Custom SOCKS5/HTTP Proxy**, and **Direct Connection** (no fake public proxy claims).
- **WireGuard Tunnel Controller**: Native service IPC interface supporting standard WireGuard / OpenVPN tunnels with verified handshakes (`muthu-tun0`).
- **Encrypted DNS-over-HTTPS (DoH)**: Resolves hostnames via Cloudflare DoH (`https://cloudflare-dns.com/dns-query`) to shield queries from ISP inspection.
- **WebRTC Leak Defense**: Enforces `disable_non_proxied_udp` to prevent public and private IP leaks.
- **Live Diagnostics**: Built-in IP address and encryption test suite in the VPN modal.

### 5. 🔒 Granular Permission Manager
- **Zero Automatic Permissions**: Replaced insecure automatic permission grants with a strict **Allow / Ask / Block** policy.
- **Interactive Prompt Overlay**: Prompts users for sensitive hardware access (Camera, Microphone, Geolocation, Notifications, Clipboard, USB, MIDI, Bluetooth, Screen Capture).
- **Persistent Site Storage**: User choices can be saved per-domain in atomic persistent storage (`userData/muthu-permissions.json`).

### 6. 🍃 Adaptive Multi-Tab Memory Saver
- **Real OS Metrics**: Replaced arbitrary multiplication formulas with true operating system metrics using `process.getProcessMemoryInfo()` and `app.getAppMetrics()`.
- **4 Pressure Levels**:
  - `normal` (< 500 MB): Background tab timer throttling.
  - `moderate` (500–1000 MB): Aggressive GC and memory sweep.
  - `high` (1000–1500 MB): Auto-discards oldest inactive background tabs.
  - `critical` (> 1500 MB): Discards all non-essential tabs while protecting audio-playing or download tabs.
- **State Preservation**: Discarded tabs preserve URL, scroll position, and navigation history for seamless 1-click restoration.
- **Live Resource Pill**: Address bar popover displaying real-time RAM (MB), CPU (%), and active tab breakdown.

### 7. 📑 Core Browser Capabilities
- **Multi-Tab Lifecycle**: New tab (`Ctrl+T`), close tab (`Ctrl+W`), duplicate tab, switch tabs (`Ctrl+1-9`).
- **Session & Tab Recovery**: Restore closed tab (`Ctrl+Shift+T`) and persistent multi-window session restoration.
- **Private / Incognito Tabs**: Isolated in-memory partition (`muthu-incognito`) that purges all traces on tab close (`Ctrl+Shift+N`).
- **Navigation Controls**: Back (`Alt+Left`), Forward (`Alt+Right`), Reload (`Ctrl+R`), Stop, Home, and address bar autocompletion.
- **Find in Page**: Native text search (`Ctrl+F`) with match counter and keyboard navigation.
- **Download Manager**: Real-time progress bar, directory selection, and dangerous extension warning (`.exe`, `.bat`, `.ps1`).
- **Settings Dashboard**: 12 comprehensive categories with atomic JSON persistence (`muthu-settings.json`).

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Desktop Runtime** | [Electron v33](https://www.electronjs.org/) | Modular multi-process architecture with `BaseWindow` & `WebContentsView` |
| **Frontend UI** | [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) | Chrome dark mode design system with custom interactive components |
| **Bundler** | [Vite 5](https://vitejs.dev/) + [@electron-forge/plugin-vite](https://www.electronforge.io/) | Fast HMR dev server and optimized production packaging |
| **AI Search & LLM** | Hybrid BM25 + Vector Semantic Embeddings | AI answer synthesis with source verification and PII redaction |
| **Network & Tunnel** | WireGuard Native Interface + SOCKS5/HTTP + DoH | Secure tunnel controller with DNS-over-HTTPS privacy |
| **Security Layer** | Multi-Layer Security & Permission Manager | Allowlist IPC, sandboxed preload, homograph defense, path sanitization |

---

## 📁 Repository Structure

```
d:/browser project/
├── backend/
│   └── search-service/               # Search Backend Specification & Crawler Architecture
│       └── README.md                 # Spring Boot + PostgreSQL + pgvector + OpenSearch
├── src/
│   ├── main/                         # Electron Main Process
│   │   ├── main.ts                   # Application lifecycle, window creation, IPC handlers
│   │   ├── tab-manager.ts            # WebContentsView lifecycle, session restore, tab duplicate
│   │   ├── permission-manager.ts     # Allow/Ask/Block permission store & prompt routing
│   │   ├── privacy-engine.ts         # Request filter, third-party tracker block, cookie stripping
│   │   ├── vpn-controller.ts         # WireGuard tunnel controller & proxy manager
│   │   ├── search-client.ts          # Query understanding & local hybrid search engine
│   │   ├── ai-client.ts              # Privacy-sanitized AI assistant (Summarize, Q&A, Extract)
│   │   ├── memory-manager.ts         # Real process metrics (RAM/CPU) & adaptive pressure manager
│   │   ├── benchmark.ts              # System latency, search, and memory benchmark runner
│   │   ├── security-manager.ts       # Certificate validation, homograph phishing, download defense
│   │   ├── settings-store.ts         # Atomic user settings persistence
│   │   ├── url-utils.ts              # URL normalization & tracking parameter sanitizer
│   │   ├── types.ts                  # Shared TypeScript type definitions
│   │   └── security-verification.test.ts # 49-check automated test suite
│   ├── preload/                      # Sandboxed Preload Layer
│   │   ├── preload.ts                # Secure window.muthuAPI ContextBridge bridge
│   │   └── tab-preload.ts            # Webpage script: ad-skipper & anti-fingerprinting
│   ├── renderer/                     # React 18 UI
│   │   ├── App.tsx                   # Main browser shell & active view positioning
│   │   ├── components/               # React UI components
│   │   │   ├── AddressBar.tsx        # Omnibox with privacy badge, VPN pill, AI trigger
│   │   │   ├── TabBar.tsx            # Chrome tab strip with sleep & incognito badges
│   │   │   ├── PrivacyDashboard.tsx  # Per-site shields, blocked metrics & whitelist toggle
│   │   │   ├── VpnModal.tsx          # WireGuard / Proxy connection modal & IP diagnostic
│   │   │   ├── PermissionPrompt.tsx  # Interactive Allow/Block permission popup
│   │   │   ├── AiSearchPage.tsx      # AI search synthesis page with cited sources
│   │   │   ├── AiSidePanel.tsx       # AI Browser Assistant panel (Summarize, Explain, Q&A)
│   │   │   ├── MemoryIndicator.tsx   # Real RAM / CPU usage popover
│   │   │   ├── SettingsPage.tsx      # Comprehensive settings dashboard & benchmark runner
│   │   │   ├── DownloadManager.tsx   # Floating download shelf
│   │   │   └── FindBar.tsx           # In-page find bar (Ctrl+F)
│   │   └── hooks/
│   │       └── useIpc.ts             # React hook subscribing to main process IPC events
│   └── shared/
│       └── ipc-channels.ts           # Centralized type-safe IPC channel identifiers
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── forge.config.ts                   # Electron Forge build configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher
- **OS**: Windows 10/11, macOS, or Linux

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/muthuvel-24/browser.git
   cd browser
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start in Development Mode**:
   ```bash
   npm start
   ```

4. **Run TypeScript Check & Test Suite**:
   ```bash
   npm run lint
   npx tsx src/main/security-verification.test.ts
   ```

---

## 🧪 Testing & Verification

The browser includes a comprehensive 49-point automated test suite validating security, search engine, permissions, privacy engine, VPN controller, and AI sanitization:

```bash
npx tsx src/main/security-verification.test.ts
```

Output:
```text
🔒 Commencing Comprehensive Browser Test Suite...
--- 1. Security & Scheme Isolation (21 tests) ---
  ✅ PASSED: Block javascript:, vbscript:, file: schemes
  ✅ PASSED: Strip tracking parameters (utm_*, fbclid)
  ✅ PASSED: Sanitize path traversal in downloads
  ✅ PASSED: Cyrillic homograph spoofing detection
--- 2. Query Understanding & Search Engine (8 tests) ---
  ✅ PASSED: Intent classification (URL vs Query)
  ✅ PASSED: Hybrid BM25 + Vector scoring & source citations
--- 3. Permission Manager (5 tests) ---
  ✅ PASSED: Allow/Block persistence & normalization
--- 4. Privacy Engine (4 tests) ---
  ✅ PASSED: Base domain extraction & per-site shield toggles
--- 5. VPN Controller (6 tests) ---
  ✅ PASSED: WireGuard state transitions & honest network mode
--- 6. AI Client Privacy & Sanitization (3 tests) ---
  ✅ PASSED: Redaction of Credit Cards, SSNs, JWT tokens
📊 Comprehensive Verification Summary: 49 Passed, 0 Failed.
```

---

## 📦 Production Packaging

To compile and package the standalone desktop executable for Windows:

```bash
npm run package
```

The production bundle will be generated at:
```
out/muthu-browser-win32-x64/muthu-browser.exe
```

---

## 📄 License

Distributed under the **MIT License**.
