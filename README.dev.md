# KairOS ZK Moments System - Developer Documentation

## 🎯 Overview

The KairOS ZK Moments system enables privacy-preserving event experiences where users can collect "moments" at various installations and later generate zero-knowledge proofs about their participation without revealing specific details.

## 🏗 Architecture

### Core Components

```
lib/
├── crypto/
│   ├── keys.ts              # Ed25519 keypair management with React hooks
│   └── portableCrypto.ts    # Legacy crypto utilities
├── moment/
│   └── zkMomentManager.ts   # Session and moment collection management
├── zk/
│   └── zkProofSystem.ts     # ZK proof generation and verification
├── types.ts                 # Enhanced type definitions for ZK system
└── hardwareAbstraction.ts   # HAL for cross-platform compatibility

app/
├── zkMoments/
│   └── page.tsx             # Main ZK moments UI
└── api/
    └── zk/
        └── verify-proof/
            └── route.ts     # Backend proof verification endpoint
```

## 🔐 Cryptographic Flow

### 1. Identity Generation
```typescript
// Browser: Uses @noble/ed25519 for true Ed25519
const { privateKey, publicKey } = await generateKeypair()
const did = createDIDFromPublicKey(publicKey)

// ESP32: Will use mbedTLS or libsodium
// esp_err_t generate_keypair(uint8_t private_key[32], uint8_t public_key[32])
```

### 2. Moment Collection
```typescript
// Browser: SHA256 + Ed25519 signing
const hash = sha256(momentId + timestamp + nonce)
const signature = await sign(hash, privateKey)

// ESP32: Same logic with hardware crypto
// mbedtls_sha256(input, input_len, hash)
// mbedtls_ecdsa_sign(hash, private_key, signature)
```

### 3. ZK Proof Generation
```typescript
// Current: Simulated proofs for development
const proof = generateSimulatedProof(moments, threshold, publicKey)

// Future: Real Circom circuits
// snarkjs.groth16.fullProve(inputs, circuit, provingKey)
```

## 🔄 ESP32 Porting Strategy

### Storage Migration
| Browser | ESP32 | Notes |
|---------|-------|-------|
| `localStorage` | NVS (Non-Volatile Storage) | Key-value persistence |
| `sessionStorage` | RAM variables | Session-only data |
| JSON serialization | CBOR or protobuf | Efficient binary encoding |

### Crypto Library Migration
| Browser | ESP32 | Implementation |
|---------|-------|---------------|
| `@noble/ed25519` | mbedTLS | `mbedtls_ecdsa_*` functions |
| `@noble/hashes` | mbedTLS | `mbedtls_sha256` |
| `crypto.getRandomValues()` | `esp_random()` | Hardware RNG |

### Network Communication
```cpp
// ESP32 HTTP client for proof verification
esp_http_client_config_t config = {
    .url = "https://api.kairos.com/zk/verify-proof",
    .method = HTTP_METHOD_POST,
    .cert_pem = root_cert_pem_start,
};
```

## 🧪 Testing & Simulation

### Current Simulation Features
- ✅ Ed25519 keypair generation and signing
- ✅ Privacy-preserving moment hashing
- ✅ Session management with persistence
- ✅ Mock ZK proof generation and verification
- ✅ Backend API for proof verification
- ✅ Cross-platform UI components

### Ready for ESP32
- ✅ All crypto functions use portable interfaces
- ✅ Storage abstracted through HAL
- ✅ Network requests use standard HTTP
- ✅ Binary data handling with Uint8Array
- ✅ Modular architecture for easy porting

## 🎮 Usage Guide

### 1. Start the Development Server
```bash
npm run dev
# or
pnpm dev
```

### 2. Navigate to ZK Moments
Visit `http://localhost:3000/zkMoments`

### 3. Generate Identity
The app will automatically generate an Ed25519 keypair and DID on first visit.

### 4. Collect Moments
Tap on installation cards to simulate NFC interactions and collect moments.

### 5. Generate Proofs
Once you have 3+ moments, generate ZK proofs for different thresholds.

### 6. Verify Proofs
Test the verification system both client-side and via API.

## 🔧 Configuration

### ZK Circuit Configuration
```typescript
const config = {
  maxMoments: 100,        // Maximum moments per proof
  minThreshold: 3,        // Minimum count for proofs
  simulationMode: true,   // Use mock proofs (set false for real circuits)
  circuitName: 'moment_count_verifier'
}
```

### Event Configuration
```typescript
const eventConfig = {
  eventId: 'demo_event_2024',
  installations: [
    {
      id: 'art_1',
      name: 'Digital Dreams',
      location: 'Gallery A',
      category: 'art',
      isActive: true
    }
    // ... more installations
  ]
}
```

## 🚀 Production Deployment

### Environment Variables
```env
# For real ZK circuits (future)
ZK_CIRCUIT_PATH=/circuits/moment_count_verifier.wasm
ZK_PROVING_KEY_PATH=/circuits/moment_count_verifier.zkey
ZK_VERIFICATION_KEY_PATH=/circuits/verification_key.json

# API Configuration
API_BASE_URL=https://api.kairos.com
CORS_ORIGINS=https://kairos.com,https://app.kairos.com
```

### ESP32 Configuration
```cpp
// config.h
#define WIFI_SSID "event_network"
#define API_ENDPOINT "https://api.kairos.com"
#define MAX_MOMENTS 50
#define SESSION_TIMEOUT_MS (4 * 60 * 60 * 1000) // 4 hours
```

## 🔍 API Reference

### POST /api/zk/verify-proof
Verify a ZK moment count proof.

**Request:**
```json
{
  "proof": {
    "proof": "MOCK_PROOF_...",
    "publicSignals": ["5", "1234567890", "1703123456789"],
    "threshold": 5,
    "actualCount": 8,
    "timestamp": 1703123456789,
    "verifierKey": "VK_..."
  },
  "metadata": {
    "deviceId": "esp32_001",
    "eventId": "demo_event_2024"
  }
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "verificationTime": 45,
  "metadata": {
    "threshold": 5,
    "timestamp": 1703123456789,
    "verifierUsed": "moment_count_verifier"
  }
}
```

### GET /api/zk/verify-proof
Get verification system status.

**Response:**
```json
{
  "status": "operational",
  "config": {
    "maxMoments": 100,
    "minThreshold": 3,
    "circuitName": "moment_count_verifier",
    "simulationMode": true
  },
  "timestamp": 1703123456789
}
```

## 🛠 Development Tools

### Crypto Diagnostics
Visit `/cryptoDiagnostics` to test the underlying cryptographic primitives.

### ZK Moments Simulator
Visit `/zkMoments` to experience the full privacy-preserving moment collection flow.

### Browser DevTools
All crypto operations log to console with `[ZK]`, `[CRYPTO]`, or `[MOMENT]` prefixes.

## 🔮 Future Enhancements

### Real ZK Circuits
1. Implement Circom circuit for moment count verification
2. Generate trusted setup ceremony artifacts
3. Integrate snarkjs for real proof generation
4. Add circuit for location privacy (prove "visited area X" without revealing exact spots)

### ESP32 Hardware Features
1. NFC reader integration for real tap interactions
2. E-paper display for moment count and QR codes
3. Hardware security module for key storage
4. LoRaWAN for offline moment collection

### Advanced Privacy Features
1. Ring signatures for group anonymity
2. Merkle tree inclusion proofs for event participation
3. Time-based nullifiers to prevent replay attacks
4. Selective disclosure of moment categories

## 📚 References

- [Ed25519 Specification](https://tools.ietf.org/html/rfc8032)
- [DID:key Method Specification](https://w3c-ccg.github.io/did-method-key/)
- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Library](https://github.com/iden3/snarkjs)
- [ESP32 mbedTLS Guide](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/protocols/mbedtls.html)

---

**Built with ❤️ for privacy-preserving experiences** 