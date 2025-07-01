# 🚀 KairOS Development Setup Guide

## Quick Start (10 minutes)

Get KairOS running locally in under 10 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/KairOS.git
cd KairOS

# 2. Install dependencies (requires Node.js 18+ and pnpm)
pnpm install

# 3. Setup environment
cp .env.example .env.local

# 4. Add your API keys to .env.local (see Environment Setup below)

# 5. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the KairOS interface!

---

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Git** - [Download here](https://git-scm.com/)

### Optional (for full development)
- **MetaMask Browser Extension** - For testing wallet integration
- **NFC-enabled device** - For testing NFC authentication
- **VS Code** - Recommended editor with TypeScript support

### Check Your Setup
```bash
node --version    # Should be 18.0.0 or higher
pnpm --version    # Should be 8.0.0 or higher
git --version     # Any recent version
```

---

## 🔧 Environment Setup

### 1. Create Environment File
```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI API (Required for Morning Eight voice processing)
OPENAI_API_KEY=your_openai_api_key_here

# Vercel KV Database (Required for NFC account storage)
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# Optional: Additional AI providers
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

### 3. Getting API Keys

#### OpenAI API Key (Required)
1. Go to [OpenAI API Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Add to `.env.local` as `OPENAI_API_KEY`

#### Vercel KV Database (Required)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create new project or use existing
3. Add KV Database in Storage tab
4. Copy connection details to `.env.local`

#### Other API Keys (Optional)
- **Anthropic**: For Claude AI features
- **Perplexity**: For research capabilities

---

## 🏗️ Project Structure

```
KairOS/
├── app/                          # Next.js App Router
│   ├── nfc/                     # Core NFC authentication
│   ├── installation/           # Interactive experiences
│   │   └── way-of-flowers/     # Conservation installation
│   ├── morning-eight/          # Voice-driven morning rituals
│   └── api/                    # API routes
├── src/features/               # Feature modules
│   └── morningEight/          # Morning Eight feature
├── lib/                        # Shared utilities
│   ├── crypto/                # Cryptographic operations
│   ├── nfc/                   # NFC account management
│   └── installation/         # Installation framework
├── components/                 # Reusable UI components
│   └── ui/                    # shadcn/ui components
└── docs/                      # Documentation
```

---

## 🚀 Development Commands

```bash
# Start development server
pnpm dev

# Start with Turbo (faster development)
pnpm dev:fast

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Clean build cache
pnpm clean
```

---

## 🧪 Testing Your Setup

### 1. Basic Functionality Test
1. Navigate to [http://localhost:3000](http://localhost:3000)
2. You should see the KairOS landing page
3. Click "More options" → "Run simulation"
4. Complete the simulated NFC authentication flow

### 2. Way of Flowers Test
1. Go to [http://localhost:3000/installation/way-of-flowers](http://localhost:3000/installation/way-of-flowers)
2. Click "Simulate Flow" 
3. Walk through the conservation choice experience
4. Test wallet connection (requires MetaMask)

### 3. Morning Eight Test
1. Go to [http://localhost:3000/morning-eight](http://localhost:3000/morning-eight)
2. Try recording a voice dump
3. Generate a morning routine
4. Test the 8-minute ritual experience

### 4. NFC Authentication (Real Hardware)
If you have an NFC-enabled device and programmed NFC card:
1. Go to [http://localhost:3000/nfc](http://localhost:3000/nfc)
2. Tap your NFC card
3. Enter your PIN
4. Access your profile

---

## 🛠️ Common Issues & Solutions

### Issue: `pnpm install` fails
**Solution**: 
```bash
# Clear cache and try again
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: "Module not found" errors
**Solution**:
```bash
# Restart TypeScript server in VS Code
# Or restart development server
pnpm dev
```

### Issue: Environment variables not working
**Solution**:
1. Ensure `.env.local` exists in project root
2. Restart development server after adding variables
3. Check variable names match `.env.example`

### Issue: API calls failing
**Solution**:
1. Verify API keys are correct in `.env.local`
2. Check API key permissions and credits
3. Look at browser console for specific error messages

### Issue: NFC not working
**Solution**:
1. Ensure using HTTPS (required for Web NFC API)
2. Use supported browser (Chrome/Edge on Android)
3. Check NFC is enabled on device
4. Try NFC simulation mode for development

---

## 📱 Mobile Development

### Testing on Mobile Devices
1. **Find your local IP**: Run `ipconfig getifaddr en0` (macOS) or `ipconfig` (Windows)
2. **Access via IP**: Go to `http://YOUR_IP:3000` on mobile device
3. **Enable NFC**: Make sure NFC is enabled in device settings
4. **Use HTTPS**: For real NFC testing, deploy to Vercel or use ngrok

### Mobile-Specific Features
- **NFC Authentication**: Requires HTTPS and supported browser
- **Voice Recording**: Uses Web Audio API for Morning Eight
- **Wallet Integration**: MetaMask mobile app or browser extension

---

## 🎨 Design System

### Color Palette
- **Primary**: Warm orange (`#F5B591`) - Her movie inspired
- **Secondary**: Sage green (`#95BD98`) - Sophisticated retro
- **Accent**: Dusty teal (`#90C1C4`) - Complement colors
- **Background**: Warm whites and deep grays

### Typography
- **Display**: Inter font family
- **Monospace**: SF Mono for technical elements
- **Sizing**: Mobile-first responsive scale

### Components
Built on **shadcn/ui** with custom KairOS styling:
- Consistent spacing and border radius
- Dark/light theme support
- Mobile-optimized touch targets
- Accessibility compliant

---

## 🔐 Security & Privacy

### Privacy-First Architecture
- **Sensitive Data**: Stays on-device (private keys, personal details)
- **Database**: Only minimal recognition data (chipUID → accountID)
- **Deterministic**: Same chip + PIN = same account across devices
- **No Tracking**: No analytics or user tracking

### Cryptographic Foundation
- **Ed25519**: Industry-standard elliptic curve cryptography
- **HKDF**: Key derivation for deterministic account generation
- **Zero-Knowledge**: Proofs for privacy-preserving interactions

---

## 🤝 Contributing

### Before You Start
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
2. Check existing [Issues](https://github.com/your-org/KairOS/issues) and [PRs](https://github.com/your-org/KairOS/pulls)
3. Join our [Discord](https://discord.gg/your-discord) for discussion

### Development Workflow
1. **Fork** the repository
2. **Create branch**: `git checkout -b feature/your-feature-name`
3. **Make changes**: Follow code style guidelines
4. **Test locally**: Ensure all flows work correctly
5. **Submit PR**: Include clear description and testing notes

### Code Style
- **TypeScript**: Comprehensive type safety
- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **Comments**: JSDoc for all exported functions

### Testing Guidelines
1. **Manual Testing**: Test all affected user flows
2. **Mobile Testing**: Verify responsive behavior
3. **Error Cases**: Test error handling and recovery
4. **Performance**: Check for memory leaks and performance issues

---

## 📚 Learning Resources

### Understanding KairOS
- [Architecture Overview](docs/ARCHITECTURE.md) - System design and data flow
- [Privacy Model](docs/PRIVACY_FIRST_ACCOUNTS.md) - Privacy-first account system
- [NFC Authentication](docs/DID_KEY_ARCHITECTURE_COMPLETE.md) - Deterministic key derivation

### Technologies Used
- [Next.js 15](https://nextjs.org/docs) - React framework
- [TypeScript](https://www.typescriptlang.org/docs/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Framer Motion](https://www.framer.com/motion/) - Animations

### Crypto & NFC
- [Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API) - NFC in browsers
- [Ed25519](https://ed25519.cr.yp.to/) - Cryptographic signature scheme
- [DID Core](https://www.w3.org/TR/did-core/) - Decentralized identifiers

---

## 🆘 Getting Help

### Quick Help
1. **Check Issues**: Search existing GitHub issues
2. **Documentation**: Browse `/docs` folder
3. **Code Comments**: Look for inline documentation
4. **Console Logs**: Check browser console for debug info

### Community Support
- **Discord**: Join our community chat
- **GitHub Discussions**: Ask questions and share ideas
- **Issue Tracker**: Report bugs and request features

### Debugging Tools
KairOS includes built-in debug utilities accessible in browser console:
```javascript
// Debug NFC sessions
KairOSDebug.checkSession("your-chip-uid")

// Clear all sessions
KairOSDebug.clearAllSessions()

// Show device fingerprint
KairOSDebug.showFingerprint()
```

---

## 🎉 Welcome to KairOS!

You're now ready to contribute to the future of civic technology! KairOS combines:

- **🔐 Privacy-First Authentication** - Deterministic NFC-based identity
- **🌍 Environmental Impact** - Way of Flowers conservation experiences  
- **🧘 Personal Growth** - Morning Eight voice-driven rituals
- **🤝 Community Building** - Platform for civic engagement

Start exploring the codebase, try the different experiences, and join us in building technology that serves humanity and the planet.

**Happy coding!** 🚀 