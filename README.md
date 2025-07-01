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

## 🎯 **What is KairOS?**

KairOS is a **decentralized NFC authentication system** that demonstrates cryptographic authentication using NFC devices. 
Built with modern web technologies, it showcases **Ed25519 cryptography**, **DID:Key standards**, and **Web NFC integration**.

**Currently implemented as a web application with ESP32 simulation.**

---

## 🚀 **Current Implementation Status**

### **✅ Working Features**
- **🔐 DID:Key Authentication** - W3C standards-compliant cryptographic authentication
- **📱 Web NFC Integration** - Browser-based NFC card reading and authentication  
- **🎨 UI** - Interface with holographic design system
- **⚡ Multi-format Support** - Legacy card compatibility with modern crypto
- **💾 Account Management** - Local storage with PIN-based encryption
- **🔄 Session Management** - Secure session handling with device fingerprinting
- **🎯 ESP32 Simulation** - Hardware simulation in browser

### **🚧 In Development**
- **🤖 ESP32 Firmware** - Hardware implementation (simulation complete)
- **⚗️ ZK Proof System** - Zero-knowledge authentication (basic structure)
- **🌐 P2P Network** - Decentralized identity registry (partial implementation)

### **📋 Planned Features**
- **🔗 Physical MELD Nodes** - Distributed ESP32 hardware network
- **⌚ NFC Pendant Production** - Metal cryptographic pendants
- **🎵 Audio Transcription** - Local AI transcription services
- **📁 Private File Servers** - Cryptographically secured file access

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

### **Demo Features**
1. 🔧 **Chip Configuration** → `/chip-config` - Generate NFC URLs and test cryptography
2. 🧪 **NFC Test Suite** → `/nfc-test` - Authentication testing
3. 🎨 **Authentication Flow** → `/nfc` - Main UI
4. 🤖 **ESP32 Simulation** → `/ritual-designer` - Hardware simulation

---

## 🏗️ **Current Architecture**

### **Frontend (Next.js 15 + TypeScript)**
```
app/
├── nfc/                     # Core NFC authentication system  
│   ├── components/          # React components
│   ├── hooks/              # Authentication hooks
│   ├── utils/              # Business logic & crypto operations
│   └── types/              # TypeScript interfaces
├── chip-config/            # NFC chip programming tools
├── nfc-test/              # Cryptographic testing suite
├── ritual-designer/       # ESP32 hardware simulation
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
└── hal/                   # Hardware abstraction (simulation)
```

### **Hardware Simulation**
```
src/                       # ESP32 simulation & planned firmware
├── fw/                    # ESP32 firmware (in development)
├── sim/                   # Browser-based hardware simulation
└── wasm/                  # WebAssembly modules (planned)
```

---

## 🔐 **Security & Cryptography**

### **Cryptography**
- **Library**: `@noble/ed25519` v2.2.3 (audited implementation)
- **Standards**: W3C DID:Key, RFC 8032 Ed25519 signatures
- **Private Keys**: 32 bytes, never stored, PIN-derived
- **Signatures**: 64 bytes, quantum-resistant
- **Sessions**: Device fingerprinting + encrypted local storage

### **Threat Model & Protection**
| Attack Vector | Protection Method | Status |
|---------------|-------------------|--------|
| **NFC Cloning** | Only public keys on chip | ✅ Implemented |
| **Replay Attacks** | Challenge-response authentication | ✅ Implemented |
| **MITM** | Ed25519 signature verification | ✅ Implemented |
| **Physical Theft** | PIN-based key derivation | ✅ Implemented |
| **Session Hijacking** | Device fingerprinting | ✅ Implemented |

### **What's Stored Where**
| Component | Data Stored | Security Level |
|-----------|-------------|----------------|
| **📱 User's Browser** | Encrypted profiles, session data | 🔒 Local only |
| **⌚ NFC Card** | Device ID, public key, chip UID | 🔓 Public data only |
| **🤖 ESP32 Simulation** | Nothing persistent | ✅ Stateless verification |

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
- **Simplicity** - Clean interfaces
- **Consistency** - Predictable interactions
- **Cross-Platform** - Mobile and desktop support  
- **Error Handling** - Clear error experiences

---

## 🧪 **Development & Testing**

### **Development Commands**
```bash
# Start development server
pnpm dev

# Fast development with Turbo
pnpm dev:fast

# Build for production  
pnpm build

# Lint and fix code
pnpm lint:fix

# Build ESP32 firmware (when ready)
pnpm build:esp32

# Build WebAssembly modules (planned)
pnpm build:wasm
```

### **Testing the Authentication System**
1. **Visit `/nfc-test`** - Generate test cards and validate cryptography
2. **Visit `/chip-config`** - Create NFC URLs for real chip programming
3. **Test Legacy Cards** - Validate backward compatibility
4. **Try Error Pages** - Visit non-existent URLs to see error handling

---

## 🌍 **Deployment**

### **Current Deployment** 
- **Platform**: Vercel Edge Functions
- **Production**: https://kair-os.vercel.app
- **Auto-deploy**: Connected to GitHub main branch
- **Edge Regions**: Global distribution for low latency

### **Future Hardware Deployment** (Planned)
- **ESP32 MELD Nodes**: Local network devices for file/content serving
- **NFC Pendants**: Metal pocket watches with NFC chips
- **Local AI Services**: Edge computing with cryptographic access control

---

## 🤝 **Contributing**

We welcome contributors to help build decentralized authentication. 

### **How to Contribute**
1. **Fork the repository** and create a feature branch
2. **Read `CONTRIBUTING.md`** for detailed guidelines
3. **Check open issues** for tasks needing help
4. **Focus on documentation** improvements and testing
5. **Submit pull requests** with clear descriptions

### **Priority Contribution Areas**
- 🧪 **Testing & Validation** - Expand test coverage
- 📚 **Documentation** - Improve guides and examples  
- 🎨 **UI/UX Improvements** - Enhance user experience
- 🔐 **Security Review** - Audit cryptographic implementations
- 🤖 **ESP32 Development** - Complete hardware firmware
- 🌐 **P2P Networking** - Advance decentralized features

### **Not Ready Yet**
- ❌ Hardware deployment (simulation only)
- ❌ Production NFC pendant manufacturing
- ❌ Large-scale network deployment

---

## 📊 **Project Status**

**Current Phase**: 🎯 **Web Application Complete**  
**Next Phase**: 🤖 **Hardware Integration**  
**Timeline**: Open source development community-driven

### **Technology Stack**
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, shadcn/ui
- **Crypto**: @noble/ed25519, @noble/hashes
- **Storage**: Browser localStorage, session management
- **Deployment**: Vercel Edge Functions

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

**Built for the open source community**

---

## 🎉 **Built by Visionaries**

KairOS is crafted with love for the standards-based future. Built for users who demand **real privacy**, **beautiful design**, and **professional-grade security**.

> *"The future is decentralized, standards-based, and beautiful."*

**[📧 Contact](mailto:contact@kairos.dev)** • **[🐙 GitHub](https://github.com/BradleyRoyes/KairOS)** %
