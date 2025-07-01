# KairOS

> **Wearable protocols towards a new civics**

A web application demonstrating deterministic NFC authentication using modern cryptography. Tap an NFC card, enter a PIN, and access your cryptographic identity across any device.

[![MIT License](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org/)

## What is KairOS?

KairOS implements **deterministic NFC authentication** - your private keys are computed from your PIN + NFC chip ID, never stored anywhere. Same PIN + same chip = same cryptographic identity, every time.

**Live demo**: https://kair-os.vercel.app

### Key Features

- ✅ **NFC Authentication** - Browser-based NFC card reading
- ✅ **Deterministic Keys** - Ed25519 cryptography with PIN-based derivation
- ✅ **Cross-Device Access** - Same identity on any device with your card + PIN
- ✅ **Wallet Integration** - Connect wallets for donations in Way of Flowers installation
- ✅ **Local Privacy** - Rich profiles stored only in your browser

## How It Works

1. **Tap NFC card** → Browser reads chip ID
2. **Enter PIN** → Compute private key from `HKDF(chipID + PIN)`
3. **Sign in** → Ed25519 signatures prove identity
4. **Access profile** → Create moments, manage data locally

```typescript
// Your identity is deterministic mathematics
const privateKey = HKDF(chipUID + PIN)
const publicKey = ed25519.getPublicKey(privateKey)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Modern browser with Web NFC (Chrome/Edge on Android)
- NFC card or use the simulator

### Installation
```bash
git clone https://github.com/bradleycr/KairOS.git
cd KairOS
pnpm install
pnpm dev
```

### Try It
- **Full flow**: http://localhost:3000/nfc
- **No NFC device?**: http://localhost:3000/nfc-test
- **Way of Flowers**: http://localhost:3000/installation/way-of-flowers

## Installations

### Way of Flowers
A contemplative experience connecting intention with conservation through digital presence.

**Features**:
- Multi-stage guided journey
- Wallet integration for conservation donations
- Modular component architecture
- Clean state management with custom hooks

**Demo**: `/installation/way-of-flowers`

## Architecture

```
┌─ NFC Card ─────────┬─ Browser ──────────┬─ Storage ──────┐
│ • Chip UID only    │ • Key derivation   │ • Profile data │
│ • No secrets       │ • Ed25519 crypto   │ • Browser only │
└────────────────────┴────────────────────┴────────────────┘
```

### Security Model
- **NFC chips** store only public chip IDs
- **Private keys** computed on-demand, never stored
- **Profiles** stored locally in browser storage
- **Sessions** managed with device fingerprinting

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Crypto**: @noble/ed25519, @noble/hashes (audited libraries)
- **Styling**: Tailwind CSS, Framer Motion, shadcn/ui
- **NFC**: Web NFC API
- **Wallets**: Integration for donations in installations

## Development

### Project Structure
```
app/
├── nfc/                    # Core authentication
├── installation/           # Interactive experiences
│   └── way-of-flowers/     # Conservation installation
├── chip-config/            # NFC programming tools
└── nfc-test/              # Testing suite

lib/
├── crypto/                 # Cryptographic operations
├── nfc/                   # Account & session management
└── installation/          # Installation framework
```

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Current priorities**:
- Test coverage expansion
- Mobile browser compatibility
- Installation framework improvements
- Documentation enhancements

## Why Deterministic Keys?

Traditional systems lock your identity to specific devices or require corporate platforms for syncing. KairOS uses mathematical determinism - the same inputs always produce the same cryptographic identity.

**Benefits**:
- **Cross-device**: Works on any browser immediately
- **No vendor lock-in**: Pure mathematics, no platform dependencies  
- **Simple recovery**: Just need your card + PIN
- **Privacy-first**: Rich data stays local to your device

## License

MIT License - see [LICENSE](LICENSE) for details.

## Learn More

- [Project Status](docs/PROJECT_STATUS.md) - What's implemented vs planned
- [Architecture](docs/ARCHITECTURE.md) - Technical deep dive
- [Security](docs/SECURITY.md) - Cryptographic implementation details

---

*Built with ❤️ for the data commons*
