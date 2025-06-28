# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x.x   | Yes       |
| < 1.0   | No        |

## Reporting Vulnerabilities

**Do not report security issues through public GitHub issues.**

### How to Report
Email security issues to: **security@kairos.dev**

Include:
- Issue type and description
- Affected source files and locations
- Reproduction steps
- Proof-of-concept (if available)
- Impact assessment

### Response Timeline
- **Initial response:** 48 hours
- **Status updates:** Weekly
- **Resolution target:** 30 days for critical issues

## Security Architecture

### Cryptographic Foundation
- **Ed25519 signatures** via @noble/ed25519
- **Private keys** remain on user nodes
- **Decentralized authentication** with challenge-response
- **Replay attack protection**

### NFC Security Model
- **Public data only** on NFC chips
- **Device-specific key derivation**
- **Signature verification** for all operations
- **No sensitive data transmission**

### Web Security
- HTTPS-only communication
- Content Security Policy headers
- Secure authentication flows
- Input validation and sanitization

## Best Practices

### For Community Members
- Never share private keys
- Verify signatures before trusting data
- Keep software updated
- Use secure networks

### For Contributors
- Follow secure coding practices
- Validate all inputs
- Implement proper authentication
- Regular security reviews

## Security Testing

We encourage testing of:
- Cryptographic implementations
- Authentication flows
- Timing attack resistance
- Signature verification
- NFC security protocols

## Responsible Disclosure

We commit to:
- Acknowledge contributions
- Coordinate resolution
- Provide progress updates
- Credit researchers (unless anonymous preferred)

---

Thank you for helping secure KairOS and our community. 