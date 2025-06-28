# Contributing to KairOS

Thank you for your interest in contributing to KairOS! We welcome contributions from the community and are excited to see what you'll build.

## 🎯 **How to Contribute**

### **Types of Contributions**

- 🐛 **Bug Reports**: Found a bug? Let us know!
- ✨ **Feature Requests**: Have an idea for a new feature?
- 📝 **Documentation**: Help improve our docs
- 🔧 **Code Contributions**: Submit bug fixes or new features
- 🎨 **Design**: Improve UI/UX components
- 🔐 **Security**: Help us identify and fix security issues

### **Before You Start**

1. Check existing [issues](https://github.com/BradleyRoyes/KairOS/issues) and [pull requests](https://github.com/BradleyRoyes/KairOS/pulls)
2. For major changes, please open an issue first to discuss your ideas
3. Make sure your changes align with the project's goals and architecture

## 🚀 **Getting Started**

### **Development Setup**

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/KairOS.git
   cd KairOS
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser** to [http://localhost:3000](http://localhost:3000)

### **Development Workflow**

1. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit your changes** with a descriptive message
5. **Push to your fork** and create a pull request

## 📋 **Code Standards**

### **TypeScript & Code Quality**

- Use **TypeScript** for all new code
- Follow **ESLint** rules (run `pnpm lint`)
- Use **Prettier** for formatting
- Write **type-safe** code with proper interfaces
- Add **JSDoc comments** for complex functions

### **Component Architecture**

- Create **modular, reusable** components
- Use **custom hooks** for business logic
- Follow the **app routing** pattern (never page routing)
- Design for **cross-platform** with elegant mobile styling
- Write **beautiful comments** in all components

### **File Organization**

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

### **Naming Conventions**

- **Components**: PascalCase (`NFCAuthFlow.tsx`)
- **Hooks**: camelCase starting with `use` (`useNFCAuthentication.ts`)
- **Utilities**: camelCase (`nfc-authentication.ts`)
- **Types**: PascalCase (`nfc.types.ts`)

## 🧪 **Testing**

### **Running Tests**

```bash
# Run all tests
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Test crypto operations
pnpm test:crypto

# Test NFC functionality
pnpm test:nfc
```

### **Writing Tests**

- Write tests for **all new features**
- Include **unit tests** for utilities and hooks
- Add **integration tests** for API routes
- Test **crypto operations** thoroughly
- Include **hardware simulation** tests when applicable

## 🎨 **Design Guidelines**

### **UI/UX Principles**

- **Sophisticated Simplicity**: Clean, uncluttered interfaces
- **Warm Technology**: Human-centered design
- **Retro-Futuristic**: Terminal aesthetics meets modern UX
- **Professional Polish**: Enterprise-grade visual design

### **Brand Colors**

```css
--primary: 245 181 145;        /* Warm peach - main brand */
--accent: 144 193 196;         /* Dusty teal - complement */
--success: 149 189 152;        /* Sage green - status */
--background: 252 250 247;     /* Warm white */
```

### **Component Guidelines**

- Use **shadcn/ui** components as base
- Follow **Tailwind CSS** conventions
- Ensure **mobile responsiveness**
- Test on **multiple device sizes**
- Maintain **accessibility standards**

## 🔐 **Security Considerations**

### **Cryptography**

- Use **@noble/ed25519** for all cryptographic operations
- Never store **private keys** outside user's device
- Follow **zero-database** architecture principles
- Test all crypto operations with **real data**

### **NFC Security**

- Only store **public data** on NFC chips
- Implement **replay attack** protection
- Use **challenge-response** authentication
- Verify **signatures** on all operations

### **Reporting Security Issues**

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to: **security@kairos.dev**
3. Include detailed information about the vulnerability
4. Allow reasonable time for the issue to be addressed

## 📝 **Pull Request Process**

### **Before Submitting**

- ✅ All tests pass
- ✅ Code follows style guidelines
- ✅ Documentation is updated
- ✅ Changes are thoroughly tested
- ✅ Commits have descriptive messages

### **Pull Request Guidelines**

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what changes you made and why
3. **Testing**: Describe how you tested your changes
4. **Screenshots**: Include screenshots for UI changes
5. **Breaking Changes**: Clearly mark any breaking changes

### **Review Process**

- Maintainers will review your PR within **48 hours**
- Address any requested changes promptly
- Be open to feedback and collaboration
- Once approved, your PR will be merged

## 📚 **Documentation**

### **Updating Documentation**

- Update relevant **documentation** for your changes
- Add **code comments** for complex logic
- Update **API documentation** for new endpoints
- Include **examples** for new features

### **Documentation Files**

- `README.md` - Project overview and quick start
- `docs/ARCHITECTURE.md` - System design and components
- `docs/SECURITY.md` - Security model and threat analysis
- `docs/HARDWARE.md` - Hardware setup and configuration
- `docs/DESIGN.md` - Design system and brand guidelines

## 🎉 **Recognition**

Contributors who make significant contributions will be:

- Added to the **contributors list** in README
- Mentioned in **release notes**
- Invited to join the **core team** (for ongoing contributors)
- Featured on the **project website**

## 🤝 **Community**

### **Code of Conduct**

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be **respectful** and **professional**
- **Help others** learn and grow
- **Celebrate diversity** of thought and background
- **Focus on collaboration** over competition

### **Getting Help**

- 💬 **GitHub Discussions**: Ask questions and share ideas
- 🐛 **GitHub Issues**: Report bugs and request features
- 📧 **Email**: Reach out to maintainers directly
- 🐦 **Twitter**: Follow [@kairos_dev](https://twitter.com/kairos_dev) for updates

## 🚀 **What's Next?**

Check out our [roadmap](https://github.com/BradleyRoyes/KairOS/projects) to see what we're working on next. We'd love your help bringing the future of decentralized authentication to life!

---

**Thank you for contributing to KairOS! Together, we're building the future of privacy-first, decentralized authentication.** 🎉 