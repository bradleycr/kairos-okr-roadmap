# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

KairOS takes security seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure Process

1. **Do NOT open a public issue** for security vulnerabilities
2. **Use GitHub Security Advisories**: [Report privately](https://github.com/bradleycr/KairOS/security/advisories/new)
3. **Email**: For urgent issues, contact the maintainers directly

### 📋 What to Include

When reporting a security issue, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)

### ⏰ Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity and complexity

### 🏆 Recognition

We appreciate security researchers who help keep KairOS safe:
- **Credit** in security advisories (if desired)
- **Recognition** in our changelog
- **Collaboration** on fixes when appropriate

## Security Considerations

### Cryptographic Implementation

KairOS uses industry-standard cryptography:
- **Ed25519** signatures via `@noble/ed25519` (audited library)
- **HKDF** key derivation via `@noble/hashes`
- **Deterministic key generation** from PIN + NFC chip ID

### What We DON'T Store

- ❌ Private keys (computed on-demand only)
- ❌ Unencrypted PINs
- ❌ Sensitive cryptographic material

### What We DO Store

- ✅ Public chip IDs (safe if exposed)
- ✅ Encrypted session data in browser storage
- ✅ Public profile information (user controlled)

### Browser Security

- **Same-origin policy** enforced
- **HTTPS required** for NFC operations
- **Local storage** encryption for sensitive data
- **No third-party trackers** or analytics

## Scope

This security policy covers:
- ✅ **Web application** (main focus)
- ✅ **Cryptographic implementations**
- ✅ **NFC authentication flows**
- ✅ **Data handling practices**

Out of scope:
- ❌ Physical NFC card cloning (expected behavior)
- ❌ Browser vulnerabilities (report to browser vendors)
- ❌ Hardware implementation (simulation only)

---

*Thank you for helping keep KairOS secure for everyone.* 