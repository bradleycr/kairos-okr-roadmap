# Contributing to KairOS

Thank you for your interest in contributing to KairOS. We're building deterministic NFC authentication for a more open web.

## What is KairOS?

KairOS is a **web application** that demonstrates how deterministic cryptography can solve identity problems. Tap an NFC card, enter a PIN, and access the same cryptographic identity on any device.

**What actually works**:
- ✅ NFC authentication in browsers
- ✅ Ed25519 cryptography with deterministic key derivation
- ✅ Way of Flowers installation with wallet integration
- ✅ Cross-device identity access with PIN + NFC

**What's planned for community development**:
- Hardware implementations (ESP32 firmware)
- Additional interactive installations
- Enhanced mobile browser support
- Security auditing and testing

## Getting Started

### Prerequisites
- Node.js 18+
- Modern browser with Web NFC (Chrome/Edge on Android recommended)
- Basic familiarity with TypeScript and React

### Setup
```bash
git clone https://github.com/bradleycr/KairOS.git
cd KairOS
pnpm install
pnpm dev
```

### Try the Working Features
- **Main auth flow**: http://localhost:3000/nfc
- **Testing tools**: http://localhost:3000/nfc-test
- **Way of Flowers**: http://localhost:3000/installation/way-of-flowers
- **Chip configuration**: http://localhost:3000/chip-config

## How to Contribute

### 🐛 Bug Reports
Found something broken? Please report it with:
- Steps to reproduce
- Browser and device info
- Expected vs actual behavior

### ✨ Feature Requests
Ideas for improvement? Consider:
- Does it fit the core mission (simple, deterministic authentication)?
- Is it something that enhances what already works?
- Would it benefit the open source community?

### 🔨 Code Contributions

#### Areas We Need Help With
1. **Testing & Quality** - Expand test coverage for crypto operations
2. **Mobile Browser Support** - Improve NFC compatibility across devices
3. **Installation Framework** - Enhance the system used by Way of Flowers
4. **Documentation** - Clear guides and accurate examples
5. **Security Review** - Audit cryptographic implementations

#### Pull Request Guidelines
- Fork and create a feature branch
- One feature/fix per PR
- Include tests for new functionality
- Update documentation if needed
- Follow existing code patterns

#### Code Standards
- TypeScript for all new code
- Use Prettier formatting (runs automatically)
- Follow existing file structure
- Write clear commit messages

## Project Structure

```
app/
├── nfc/                    # Core authentication system
├── installation/           # Interactive experiences
│   └── way-of-flowers/     # Conservation installation with wallet integration
├── chip-config/            # NFC programming tools
└── nfc-test/              # Testing and validation

lib/
├── crypto/                 # Cryptographic operations
├── nfc/                   # Account and session management
├── installation/          # Installation framework
└── utils.ts               # Shared utilities

components/
├── ui/                    # Design system components
└── [feature].tsx          # Feature-specific components
```

## Technology Stack

**Core**:
- Next.js 15 with App Router
- React 19 with TypeScript
- @noble/ed25519 for cryptography
- Web NFC API for card reading

**UI**:
- Tailwind CSS for styling
- Framer Motion for animations
- shadcn/ui component library

**Integration**:
- Wallet connections (for installations)
- Browser storage for local data
- Session management

## Development Guidelines

### Testing
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Manual testing
# Visit /nfc-test for crypto validation
# Visit /nfc for full auth flow
```

### Working with NFC
- Use Chrome/Edge on Android for real NFC testing
- Test with the simulator on other browsers
- Validate crypto operations independently in /nfc-test

### Security First
- Never store private keys
- Use audited crypto libraries (@noble/*)
- Validate all user inputs
- Clear sensitive data after use

## Current Priorities

### High Priority
- [ ] Expand test coverage for authentication flows
- [ ] Improve error handling and user messaging
- [ ] Enhance mobile browser compatibility
- [ ] Document the installation framework better

### Medium Priority
- [ ] Add more interactive installations
- [ ] Improve accessibility compliance
- [ ] Cross-browser NFC testing
- [ ] Performance optimizations

### Future Work
- [ ] ESP32 firmware development
- [ ] Hardware abstraction layer
- [ ] P2P networking features
- [ ] Additional cryptographic protocols

## Questions or Help?

- Check existing issues for similar questions
- Review the [Project Status](docs/PROJECT_STATUS.md) for current implementation details
- Look at [Architecture](docs/ARCHITECTURE.md) for technical deep dive

## Code of Conduct

We're building for the commons. Be respectful, constructive, and focused on the shared goal of better digital tools for everyone.

---

*Together we're building wearable protocols towards a new civics* 