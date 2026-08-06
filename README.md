# 🚀 Muthu Browser

<p align="center">
  <img src="https://img.shields.io/badge/Electron-33.4.0-47A248?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4.11-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/AdBlocker-Ghostery-FF4081?style=for-the-badge&logo=ghostery&logoColor=white" alt="Ghostery AdBlocker" />
</p>

> **Muthu Browser** is a privacy-focused, high-performance web browser engineered with an **Opera GX-inspired obsidian aesthetic**, built-in **network-level ad/tracker blocking**, an integrated **SOCKS5/HTTP VPN proxy manager**, and an aggressive **V8 memory optimization engine**.

---

## ✨ Key Features

### 🌌 Opera GX-Inspired Dark Aesthetic
- **Obsidian Dark Theme**: Pure `#0f0f1a` obsidian glassmorphic interface with vibrant neon accents.
- **Red "O" Quick Start Button**: One-click launcher for the interactive Speed Dial start page.
- **Side Panel & Quick AI Button**: Instant access to Claude AI, ChatGPT, and productivity tools.
- **Custom Scrollbars & Micro-Animations**: Smooth tab transitions and reactive visual feedback.

### 🛡️ Built-in Ad & Tracker Blocker
- **Ghostery Engine Integration**: Powered by `@ghostery/adblocker-electron` with prebuilt EasyList + EasyPrivacy filter lists.
- **Tracking Parameter Stripping**: Automatically purges privacy-invasive tracking parameters (`utm_*`, `fbclid`, `gclid`, `msclkid`, etc.) from outbound request URLs.
- **Real-Time Block Counter**: Shield icon with live blocked request metrics and pulse animations on block events.

### 🌐 Integrated Regional VPN / Proxy Manager
- **Multi-Region Routing**: Seamlessly route web traffic through configurable **US 🇺🇸**, **EU 🇪🇺**, and **Asia 🌏** proxy endpoints.
- **SOCKS5 & HTTP Support**: Dedicated proxy profiles with fallback routing (`direct://`) for ultra-reliable connections.
- **WebRTC Leak Prevention**: Automatically restricts WebRTC interfaces to prevent local/LAN IP address leaks.

### 🍃 Intelligent Memory Saver Engine
- **Decoupled 3-Stage Lifecycle**: `Active` ➔ `Sleeping` (idle 5m) ➔ `Discarded` (idle 15m).
- **Tab Sleeping**: Mutes audio and throttles V8 JS background timer execution to minimize CPU load.
- **Tab Discarding**: Destroys background `WebContents` while preserving full page state (URL, title, favicon, scroll position) for instant restoration upon clicking.
- **V8 Process Limits**: Enforces `--max-old-space-size=128` per renderer process and caps active worker pools.

### ⚡ Speed Dial & Instant Search
- **Neon Wallpapers**: Interactive Start Page featuring a swirling animated background gradient.
- **Instant Keyword Normalization**: Type shortcuts like `amazon`, `flipkart`, `claude`, `youtube`, or `github` to jump directly to official domain endpoints.
- **Google Search Fallback**: Automatically directs multi-word queries to Google.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Electron v33](https://www.electronjs.org/) + `BaseWindow` & `WebContentsView` |
| **Frontend UI** | [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| **Bundler & Build** | [Vite 5](https://vitejs.dev/) + [@electron-forge/plugin-vite](https://www.electronforge.io/) |
| **Ad Blocker** | [@ghostery/adblocker-electron](https://github.com/ghostery/adblocker) |
| **Styling** | Vanilla CSS3 (Custom design system, CSS variables, glassmorphism) |

---

## 📁 Project Architecture

```
d:/browser project/
├── src/
│   ├── main/                   # Main Process (Electron Node.js runtime)
│   │   ├── main.ts             # App entry, BaseWindow setup, IPC handlers
│   │   ├── tab-manager.ts      # WebContentsView lifecycle & tab management
│   │   ├── proxy-manager.ts    # SOCKS5/HTTP VPN proxy controller & WebRTC rules
│   │   ├── adblock-engine.ts   # Ghostery filter engine & request interception
│   │   ├── memory-manager.ts   # Idle sweep timer, tab sleeping/discarding
│   │   ├── url-utils.ts        # URL normalization, brand shortcuts, UTM stripping
│   │   ├── speeddial-html.ts   # Speed Dial Start Page HTML/CSS/JS
│   │   └── types.ts            # Shared TypeScript interfaces
│   ├── preload/                # Preload Script (ContextBridge IPC security)
│   │   └── preload.ts          # Typed window.muthuAPI bridge
│   ├── renderer/               # Renderer Process (React 18 UI)
│   │   ├── App.tsx             # Main browser chrome layout
│   │   ├── components/         # React UI Components
│   │   │   ├── AddressBar.tsx  # Navigation bar, URL input, SSL indicator
│   │   │   ├── TabBar.tsx      # Chrome-style tab strip with status badges
│   │   │   ├── VpnToggle.tsx   # Animated VPN switch & region selector
│   │   │   ├── AdBlockStats.tsx# Shield badge counter with pulse animation
│   │   │   └── MemoryIndicator.tsx # Memory saver badge with MB saved tooltip
│   │   ├── hooks/
│   │   │   └── useIpc.ts       # Custom React hook for IPC subscriptions
│   │   └── global.d.ts         # Window interface extensions
│   └── shared/
│       └── ipc-channels.ts     # Single source of truth for IPC channel strings
├── forge.config.ts             # Electron Forge packaging configuration
├── vite.main.config.ts         # Vite bundler config for Main process
├── vite.preload.config.ts      # Vite bundler config for Preload script
├── vite.renderer.config.ts     # Vite bundler config for Renderer React app
└── package.json                # Project dependencies & npm scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

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

---

## 📦 Packaging for Production

To build a standalone executable for Windows (or target OS):

```bash
npm run package
```

The compiled binary will be placed inside the `out/Muthu-win32-x64/` directory:
```
out/Muthu-win32-x64/muthu.exe
```

---

## ⌨️ Address Bar Keyword Shortcuts

Type any of the following terms in the address bar and press `Enter`:

| Keyword | Target URL |
| :--- | :--- |
| `amazon` | `https://www.amazon.com` |
| `amazon.in` | `https://www.amazon.in` |
| `flipkart` | `https://www.flipkart.com` |
| `claude` | `https://claude.ai` |
| `chatgpt` | `https://chatgpt.com` |
| `youtube` | `https://www.youtube.com` |
| `github` | `https://github.com` |
| `reddit` | `https://www.reddit.com` |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/muthuvel-24">Muthuvel</a>
</p>
