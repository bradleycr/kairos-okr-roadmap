# Contributing to KairOS

Thank you for joining the KairOS collective! We're building the future of decentralized authentication together.

## How to Contribute

### Types of Contributions
- **Bug Reports** - Help us identify issues
- **Feature Requests** - Suggest new capabilities
- **Documentation** - Improve our guides
- **Code** - Submit fixes and enhancements
- **Design** - Enhance user experience
- **Security** - Strengthen our cryptographic foundation

### Before You Start
1. Check existing [issues](https://github.com/BradleyRoyes/KairOS/issues) and [pull requests](https://github.com/BradleyRoyes/KairOS/pulls)
2. Open an issue for major changes to discuss approach
3. Ensure changes align with decentralized architecture principles

## Getting Started

### Development Setup
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/KairOS.git
   cd KairOS
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Workflow
1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes following our standards
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create a pull request

**Note: Main branch is protected - all changes require pull request approval.**

## Code Standards

### TypeScript & Quality
- Use TypeScript for all new code
- Follow ESLint rules (`pnpm lint`)
- Use Prettier for formatting
- Write type-safe code with proper interfaces
- Add JSDoc comments for complex functions

### Architecture Principles
- Create modular, reusable components
- Use custom hooks for business logic
- Follow app routing pattern (never page routing)
- Design for cross-platform with elegant mobile styling
- Write beautiful, descriptive comments

### File Organization
```
app/                    # App router pages
├── feature/           # Feature-specific pages
│   ├── components/    # Feature components
│   ├── hooks/         # Feature hooks
│   ├── utils/         # Feature utilities
│   └── types/         # Feature types
components/            # Shared UI components
├── ui/               # shadcn/ui components
lib/                  # Core libraries
hooks/                # Shared hooks
```

### Naming Conventions
- **Components**: PascalCase (`NFCAuthFlow.tsx`)
- **Hooks**: camelCase with `use` (`useNFCAuthentication.ts`)
- **Utilities**: kebab-case (`nfc-authentication.ts`)
- **Types**: PascalCase (`nfc.types.ts`)

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint

# Test cryptographic operations
pnpm test:crypto

# Test NFC functionality (if applicable)
pnpm test:nfc
```

### Writing Tests
- Test all new features
- Include unit tests for utilities and hooks
- Add integration tests for API routes
- Thoroughly test Ed25519 operations
- Test authentication flows

## Design Guidelines

### UI/UX Principles
- **Sophisticated Simplicity** - Clean, uncluttered interfaces
- **Professional Polish** - Enterprise-grade visual design
- **Cross-Platform** - Elegant mobile and desktop experience
- **Accessibility** - WCAG 2.1 AA compliance

### Component Guidelines
- Use shadcn/ui components as foundation
- Follow Tailwind CSS conventions
- Ensure mobile responsiveness
- Test across multiple device sizes
- Maintain accessibility standards

### Brand Compliance
- Never use emojis in application UI
- Use only Lucide icons throughout
- Follow established color palette
- Maintain consistent typography

## Security Guidelines

### Cryptographic Operations
- Use @noble/ed25519 for all cryptographic functions
- Never store private keys outside user nodes
- Follow decentralized architecture principles
- Test all crypto operations with real data

### NFC Security
- Store only public data on NFC chips
- Implement replay attack protection
- Use challenge-response authentication
- Verify signatures on all operations

### Reporting Security Issues
If you discover a vulnerability:
1. **Do not** open a public issue
2. Email: security@kairos.dev
3. Include detailed vulnerability information
4. Allow time for coordinated disclosure

## Pull Request Process

### Before Submitting
- All tests pass
- Code follows style guidelines
- Documentation updated
- Changes thoroughly tested
- Descriptive commit messages

### Review Process
- Maintainers review within 48 hours
- Address requested changes promptly
- Stay open to feedback and collaboration
- Approved PRs will be merged by maintainers

## Documentation

### Updating Documentation
- Update relevant docs for changes
- Add code comments for complex logic
- Update API docs for new endpoints
- Include examples for new features

### Documentation Files
- `README.md` - Project overview and quick start
- `docs/ARCHITECTURE.md` - System design and components
- `docs/SECURITY.md` - Security model and analysis
- `docs/BRAND_GUIDE.md` - Design system and guidelines

## Recognition

Significant contributors will be:
- Added to contributors list in README
- Mentioned in release notes
- Invited to join core collective (for ongoing contributors)

## Community Standards

### Code of Conduct
We foster an inclusive environment for all community members:
- Be respectful and professional
- Help others learn and grow
- Celebrate diverse perspectives
- Focus on collaborative intelligence

### Getting Help
- **GitHub Discussions** - Questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Email** - Direct maintainer contact

## What's Next

Check our [roadmap](https://github.com/BradleyRoyes/KairOS/projects) to see upcoming features. Help us build the future of decentralized authentication.

---

Thank you for contributing to KairOS! Together, we're creating privacy-first, decentralized authentication for everyone. 