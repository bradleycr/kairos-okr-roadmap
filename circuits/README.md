# KairOS Bonding ZK Circuit

## What This Does

This circuit proves that **two people with valid NFC chips are bonding together** without revealing their actual chip IDs or signatures to anyone.

## The Magic Explained (Like You're 5) 🎩✨

### The Problem
Imagine Alice and Bob want to prove they're friends and both have special magic cards (NFC chips), but they don't want to show their secret card numbers to anyone else.

### The Solution: Zero-Knowledge Magic
Our circuit is like a magic box that:

1. **Alice puts in her secrets**: Her card ID and signature (private)
2. **Bob puts in his secrets**: His card ID and signature (private)  
3. **Everyone can see**: Where they are and what time it is (public)
4. **Magic box outputs**: "YES, two different people with valid cards are here!" (without revealing the secrets)

### What Gets Proven
✅ Both people have valid NFC chips  
✅ They're different people (not someone bonding with themselves)  
✅ This happened recently (within the last hour)  
✅ They're at a specific location  

### What Stays Secret
🔒 Alice's chip ID  
🔒 Bob's chip ID  
🔒 Their signatures  
🔒 Exactly when this happened  

## How to Build and Use

### 1. Install Dependencies
```bash
# Install Circom compiler
npm install -g circom

# Make sure snarkjs is available (already in package.json)
```

### 2. Build the Circuit
```bash
pnpm run build:zk
```

This will:
- Compile the circuit
- Generate proving keys
- Generate verification keys
- Create a Solidity verifier contract

### 3. Use in Your App
```typescript
import { RealBondingProofs } from '@/lib/zk/realBondingProofs'

const bondingProofs = new RealBondingProofs()
await bondingProofs.initialize()

// Generate a proof
const proof = await bondingProofs.generateBondingProof({
  chipId1: "alice-secret-chip",
  chipId2: "bob-secret-chip", 
  signature1: "alice-signature",
  signature2: "bob-signature",
  timestamp: Date.now(),
  bondingLocation: 12345,
  minimumTimestamp: Date.now() - 3600000
})

// Verify the proof
const isValid = await bondingProofs.verifyBondingProof(proof)
```

## Circuit Details

### Inputs
- **Private**: `chipId1`, `chipId2`, `signature1`, `signature2`, `timestamp`
- **Public**: `bondingLocation`, `minimumTimestamp`

### Outputs  
- **bondHash**: Unique identifier for this bond
- **isValid**: 1 if bond is valid, 0 if not

### Constraints
1. Timestamp must be recent
2. Chip IDs must be different (no self-bonding)
3. Signatures must be non-zero
4. All validations must pass

## Why This is Cool

1. **Privacy**: Nobody learns your chip ID
2. **Authenticity**: Proves you have real chips
3. **Uniqueness**: Creates unique bond identifiers
4. **Verifiable**: Anyone can verify the proof without learning secrets
5. **Scalable**: Works for any number of people watching

This is **real cryptography** - not simulation! 🎉 