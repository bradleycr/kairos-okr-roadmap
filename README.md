# KairOS

> **Wearable protocols towards a new civics**

KairOS is a web application and open protocol for deterministic NFC authentication, enabling you to access your cryptographic identity anywhere with just a tap and a PIN.  
It demonstrates a privacy-first, cross-device authentication system—no keys stored, no vendor lock-in, and no platform dependencies.

**Vision:**  
KairOS is building the foundation for a new class of "votive devices"—wearables and tools for sovereign, collective intelligence. Our goal is to empower communities with democratic cryptography and privacy-preserving social computing, while always being transparent about what's implemented and what's experimental.

[![MIT License](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org/)
[![Ed25519](https://img.shields.io/badge/Crypto-Ed25519-green.svg)](https://ed25519.cr.yp.to/)
[![wagmi](https://img.shields.io/badge/Web3-wagmi_v2-purple.svg)](https://wagmi.sh/)

## 🎯 **What is KairOS?**

KairOS is a **decentralized NFC authentication system** that demonstrates cryptographic authentication using NFC devices. 
Built with modern web technologies, it showcases **Ed25519 cryptography**, **DID:Key standards**, **Web NFC integration**, and **Web3 wallet connectivity**.

**Currently implemented as a production-ready web application with comprehensive authentication flows.**

---

## 🚀 **Current Implementation Status**

### **✅ Production Ready Features**
- **🔐 DID:Key Authentication** - W3C standards-compliant cryptographic authentication
- **📱 Web NFC Integration** - Browser-based NFC card reading and authentication  
- **💳 Web3 Wallet Integration** - wagmi v2 with MetaMask, WalletConnect, Coinbase Wallet
- **🎨 Modern UI** - Responsive design with holographic aesthetic
- **⚡ Multi-format Support** - Legacy card compatibility with modern crypto
- **💾 Account Management** - Secure local storage with PIN-based encryption
- **🔄 Session Management** - Cross-device session handling with device fingerprinting
- **🎯 ESP32 Simulation** - Complete hardware simulation in browser
- **🎵 Audio Processing** - Voice transcription and morning ritual generation
- **👥 User Profiles** - Rich profile management with stats and moments

### **🚧 In Development**
- **🤖 ESP32 Firmware** - Hardware implementation (simulation complete)
- **⚗️ ZK Proof System** - Zero-knowledge authentication (structure in place)
- **🌐 P2P Network** - Decentralized identity registry (experimental)

### **📋 Planned Features**
- **🔗 Physical MELD Nodes** - Distributed ESP32 hardware network
- **⌚ NFC Pendant Production** - Metal cryptographic pendants
- **📁 Private File Servers** - Cryptographically secured file access
- **🏛️ Installation Framework** - Art gallery deployment system

---

## ⚡ **Quick Start**

### **Prerequisites**
- Node.js 18+ (recommend Node 20+)
- pnpm (preferred) or npm
- Modern browser with Web NFC support (Chrome, Edge on Android)

### **Installation**
```bash
git clone https://github.com/BradleyRoyes/KairOS.git
cd KairOS
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and try the authentication flow.

### **Key Demo Features**
1. 🔧 **Chip Configuration** → `/chip-config` - Generate NFC URLs and test cryptography
2. 🧪 **NFC Authentication** → `/nfc` - Main authentication flow
3. 👤 **User Profile** → `/profile` - Account management with Web3 wallet connection
4. 🎨 **Installation Designer** → `/ritual-designer` - ESP32 hardware simulation
5. 🌅 **Morning Eight** → `/morning-eight` - AI-powered morning rituals
6. 🏛️ **Admin Panel** → `/admin/installations` - Installation management

---

## 🏗️ **Architecture**

### **Frontend (Next.js 15 + TypeScript)**
```
app/
├── nfc/                     # Core NFC authentication system  
│   ├── components/          # React components
│   ├── hooks/              # Authentication hooks
│   ├── utils/              # Business logic & crypto operations
│   └── types/              # TypeScript interfaces
├── profile/                # User profile & wallet management
├── morning-eight/          # AI voice processing features
├── installation/           # Art installation framework
├── admin/                  # Installation management
└── api/                   # Edge API routes
```

### **Core Libraries**
```
lib/
├── crypto/                # Ed25519 cryptography
│   ├── simpleDecentralizedAuth.ts    # Main DID:Key authentication
│   ├── decentralizedNFC.ts          # Legacy authentication support  
│   └── portableCrypto.ts            # Cross-platform crypto utilities
├── nfc/                   # Web NFC integration
│   ├── accountManager.ts             # Account & session management
│   └── sessionManager.ts            # Secure session handling
└── nillion/               # AI processing (experimental)
```

### **Web3 Integration**
```
app/
├── providers.tsx          # wagmi configuration with multi-wallet support
└── profile/page.tsx       # Wallet connection UI

Supported Wallets:
├── MetaMask               # Most popular browser wallet
├── WalletConnect          # Mobile wallet protocol 
├── Coinbase Wallet        # Coinbase's web3 wallet
└── Injected Wallets       # Other browser-based wallets
```

---

## 🔐 **Security & Cryptography**

### **Authentication Stack**
- **Core Crypto**: `@noble/ed25519` v2.2.3 (audited implementation)
- **Web3 Integration**: `wagmi` v2.15+ with React Query
- **Standards**: W3C DID:Key, RFC 8032 Ed25519 signatures
- **Private Keys**: 32 bytes, never stored, PIN-derived
- **Signatures**: 64 bytes, quantum-resistant
- **Sessions**: Device fingerprinting + encrypted local storage

### **Wallet Security**
- **Multi-Chain Support**: Ethereum, Polygon, Optimism, Arbitrum, Base
- **ENS Integration**: Automatic ENS name and avatar resolution
- **Connection Security**: Account verification with signature challenges
- **Privacy**: No wallet data stored without explicit user consent

### **Threat Model & Protection**
| Attack Vector | Protection Method | Status |
|---------------|-------------------|--------|
| **NFC Cloning** | Only public keys on chip | ✅ Implemented |
| **Replay Attacks** | Challenge-response authentication | ✅ Implemented |
| **MITM** | Ed25519 signature verification | ✅ Implemented |
| **Physical Theft** | PIN-based key derivation | ✅ Implemented |
| **Session Hijacking** | Device fingerprinting | ✅ Implemented |
| **Wallet Spoofing** | Signature verification | ✅ Implemented |

---

## 🎨 **Design System**

### **KairOS Brand**
```css
/* Core brand colors */
--primary: 245 181 145;        /* Warm peach */
--accent: 144 193 196;         /* Dusty teal */
--success: 149 189 152;        /* Sage green */
--background: 252 250 247;     /* Warm white */
```

### **UI Philosophy**
- **Simplicity** - Clean, intuitive interfaces
- **Responsiveness** - Mobile-first design with desktop enhancement
- **Accessibility** - ARIA compliant with keyboard navigation  
- **Performance** - Optimized loading with efficient state management

---

## 🧪 **Development & Testing**

### **Development Commands**
```bash
# Start development server
pnpm dev

# Build for production  
pnpm build

# Lint and fix code
pnpm lint:fix

# Run type checking
pnpm type-check
```

### **Testing the System**
1. **Visit `/nfc`** - Test main authentication flow
2. **Visit `/chip-config`** - Generate NFC URLs for real chips
3. **Visit `/profile`** - Test wallet connection and profile management
4. **Visit `/morning-eight`** - Try AI voice processing features
5. **Visit `/admin/installations`** - Test installation management

---

## 🌍 **Deployment**

### **Production Deployment** 
- **Platform**: Vercel Edge Functions
- **Production**: https://kair-os.vercel.app
- **Auto-deploy**: Connected to GitHub main branch
- **Edge Regions**: Global CDN for optimal performance
- **Environment**: No sensitive environment variables required for core functionality

### **Wallet Configuration**
```bash
# Optional: For WalletConnect functionality
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## 📱 **Web3 Wallet Integration**

### **Supported Wallets**
- **MetaMask** - Browser extension and mobile app
- **WalletConnect** - Protocol for mobile wallet connections
- **Coinbase Wallet** - Coinbase's self-custody wallet
- **Injected Wallets** - Any browser-based web3 wallet

### **Features**
- **Multi-chain Support** - Ethereum mainnet and L2s (Polygon, Optimism, Arbitrum, Base)
- **ENS Integration** - Automatic ENS name and avatar display
- **Account Switching** - Seamless account switching with automatic reconnection
- **Mobile Optimization** - Touch-friendly wallet connection flow

### **Implementation**
The wallet integration uses wagmi v2 with React Query for optimal performance:
- **Persistent connections** - Automatic reconnection on page refresh
- **Type-safe hooks** - Full TypeScript support for all wallet operations
- **Error handling** - Comprehensive error states with user-friendly messages
- **Performance** - Efficient state management with minimal re-renders

---

## 🤝 **Contributing**

### **Areas for Contribution**
- **🔧 Hardware Development** - ESP32 firmware and circuit design
- **🎨 UI/UX Design** - Interface improvements and accessibility
- **🔐 Security Auditing** - Cryptographic implementation review
- **📱 Mobile Testing** - Cross-device compatibility testing
- **📚 Documentation** - Technical documentation and tutorials

### **Getting Started**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 **Links**

- **Production App**: https://kair-os.vercel.app
- **GitHub Repository**: https://github.com/BradleyRoyes/KairOS
- **Technical Documentation**: See `/docs` directory
- **Hardware Guides**: `/docs/HARDWARE.md`
- **API Documentation**: `/docs/API.md`

---

*Built with ❤️ for a more sovereign, private, and democratic future.*
