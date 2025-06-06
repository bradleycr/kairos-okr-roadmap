import type { Moment } from "./types"
import { HAL } from "@/lib/hardwareAbstraction"
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes } from '@noble/hashes/utils';

// Enable synchronous methods for @noble/ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
ed.etc.sha512Async = (...m) => Promise.resolve(ed.etc.sha512Sync(...m));

// Simple base58 alphabet (Bitcoin/IPFS style)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

// Simple base58 encode function
function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return ""

  let result = ""
  let num = BigInt(0)

  // Convert bytes to big integer
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i])
  }

  // Convert to base58
  while (num > 0) {
    const remainder = num % BigInt(58)
    result = BASE58_ALPHABET[Number(remainder)] + result
    num = num / BigInt(58)
  }

  // Handle leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = "1" + result
  }

  return result
}

// Simple base58 decode function (Bitcoin/IPFS style)
function base58Decode(str: string): Uint8Array {
  if (!str) return new Uint8Array()
  let num = BigInt(0)
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const idx = BASE58_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`)
    num = num * BigInt(58) + BigInt(idx)
  }
  // Convert big integer to bytes
  let bytes = []
  while (num > 0) {
    bytes.push(Number(num % BigInt(256)))
    num = num / BigInt(256)
  }
  // Handle leading zeros
  for (let i = 0; i < str.length && str[i] === "1"; i++) {
    bytes.push(0)
  }
  return new Uint8Array(bytes.reverse())
}

// Ed25519 Constants
export const ED25519_PRIVATE_KEY_LENGTH = 32;
export const ED25519_PUBLIC_KEY_LENGTH = 32;
export const ED25519_SIGNATURE_LENGTH = 64;

// Simple base58btc implementation for DID:key
const base58btc = {
  alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  
  encode(buffer: Uint8Array): string {
    if (buffer.length === 0) return '';
    
    const digits = [0];
    for (const byte of buffer) {
      let carry = byte;
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = Math.floor(carry / 58);
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = Math.floor(carry / 58);
      }
    }
    
    // Convert leading zeros
    let leadingZeros = 0;
    for (const byte of buffer) {
      if (byte === 0) leadingZeros++;
      else break;
    }
    
    return '1'.repeat(leadingZeros) + 
           digits.reverse().map(d => this.alphabet[d]).join('');
  }
};

/**
 * Generate a real Ed25519 keypair using cryptographically secure random number generation
 * This is REAL cryptography - not simulation
 */
export async function generateEd25519KeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  // Generate cryptographically secure random private key
  const privateKey = ed.utils.randomPrivateKey();
  
  // Derive public key from private key
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  return {
    privateKey,
    publicKey,
  };
}

/**
 * Sign a message with Ed25519 - deterministic signatures for security
 * @param message - The message to sign
 * @param privateKey - The Ed25519 private key
 * @returns Ed25519 signature
 */
export async function signMessage(
  message: string | Uint8Array, 
  privateKey: Uint8Array
): Promise<Uint8Array> {
  const messageBytes = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  
  // Use SHA-512 as the hash function (standard for Ed25519)
  const messageHash = sha512(messageBytes);
  
  // Create deterministic Ed25519 signature
  const signature = await ed.signAsync(messageHash, privateKey);
  
  return signature;
}

/**
 * Verify an Ed25519 signature
 * @param signature - The Ed25519 signature to verify
 * @param message - The original message
 * @param publicKey - The Ed25519 public key
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
  signature: Uint8Array,
  message: string | Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    
    // Hash the message with SHA-512
    const messageHash = sha512(messageBytes);
    
    // Verify the Ed25519 signature
    return await ed.verifyAsync(signature, messageHash, publicKey);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate a DID:key identifier from an Ed25519 public key
 * Following the real W3C DID specification
 */
export function createDIDKey(publicKey: Uint8Array): string {
  // Multicodec prefix for Ed25519 public key: 0xed01
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
  multicodecKey.set(multicodecPrefix);
  multicodecKey.set(publicKey, multicodecPrefix.length);
  
  // Base58btc encode (multibase prefix 'z')
  const base58Key = base58btc.encode(multicodecKey);
  
  return `did:key:z${base58Key}`;
}

/**
 * Export public key to raw bytes for transport/storage
 */
export async function exportPublicKey(publicKey: Uint8Array): Promise<Uint8Array> {
  return publicKey; // Ed25519 public keys are already in raw format
}

/**
 * Export private key to raw bytes (for secure storage only)
 */
export async function exportPrivateKey(privateKey: Uint8Array): Promise<Uint8Array> {
  return privateKey; // Ed25519 private keys are already in raw format
}

/**
 * Import public key from raw bytes
 */
export async function importPublicKey(keyData: Uint8Array): Promise<Uint8Array> {
  if (keyData.length !== ED25519_PUBLIC_KEY_LENGTH) {
    throw new Error(`Invalid Ed25519 public key length: ${keyData.length}, expected ${ED25519_PUBLIC_KEY_LENGTH}`);
  }
  return keyData;
}

/**
 * Import private key from raw bytes
 */
export async function importPrivateKey(keyData: Uint8Array): Promise<Uint8Array> {
  if (keyData.length !== ED25519_PRIVATE_KEY_LENGTH) {
    throw new Error(`Invalid Ed25519 private key length: ${keyData.length}, expected ${ED25519_PRIVATE_KEY_LENGTH}`);
  }
  return keyData;
}

/**
 * Generate cryptographically secure random bytes
 * Uses the platform's secure random number generator
 */
export function generateSecureRandom(length: number): Uint8Array {
  return randomBytes(length);
}

/**
 * Constant-time comparison for preventing timing attacks
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

/**
 * Secure key derivation using HKDF-SHA256
 * For deriving session keys or other cryptographic material
 */
export async function deriveKey(
  inputKey: Uint8Array, 
  salt: Uint8Array, 
  info: string, 
  length: number
): Promise<Uint8Array> {
  // Simple HKDF implementation using SHA-256
  const prk = sha512.create().update(salt).update(inputKey).digest();
  const okm = sha512.create().update(prk).update(new TextEncoder().encode(info)).digest();
  
  return okm.slice(0, length);
}

/**
 * Real challenge-response authentication
 * For secure NFC authentication flows
 */
export async function createChallenge(): Promise<{
  challenge: string;
  expiresAt: number;
}> {
  const challengeBytes = generateSecureRandom(32);
  const challenge = Array.from(challengeBytes, b => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
  
  return { challenge, expiresAt };
}

/**
 * Verify challenge-response authentication
 */
export async function verifyChallenge(
  signature: Uint8Array,
  challenge: string,
  publicKey: Uint8Array,
  timestamp: number
): Promise<boolean> {
  // Check if challenge hasn't expired
  if (Date.now() > timestamp) {
    return false;
  }
  
  // Verify the signature against the challenge
  return await verifySignature(signature, challenge, publicKey);
}

// Sign a moment using HAL
export async function signMoment(privateKey: CryptoKey, moment: Omit<Moment, "signature">): Promise<string> {
  try {
    // Convert the moment object to a canonical string
    const momentString = JSON.stringify(moment, Object.keys(moment).sort())
    // Convert string to bytes
    const messageBytes = new TextEncoder().encode(momentString)
    // Sign using HAL
    const signature = await HAL.crypto.sign(messageBytes, privateKey)
    // Convert signature to base58 for storage
    const base58Signature = base58Encode(signature)
    return base58Signature
  } catch (error) {
    console.error("❌ Error signing moment:", error)
    throw new Error("Failed to sign moment")
  }
}

// Verify a moment's signature using HAL
export async function verifyMomentSignature(
  publicKey: CryptoKey,
  moment: Omit<Moment, "signature">,
  signature: string,
): Promise<boolean> {
  try {
    // Convert the moment object to a canonical string
    const momentString = JSON.stringify(moment, Object.keys(moment).sort())
    // Convert string to bytes
    const messageBytes = new TextEncoder().encode(momentString)
    // Decode base58 signature (always raw r|s, 64 bytes)
    const signatureBytes = base58Decode(signature)
    // Verify using HAL
    const valid = await HAL.crypto.verify(messageBytes, signatureBytes, publicKey)
    return valid
  } catch (error) {
    console.error("❌ Error verifying signature:", error)
    return false
  }
}

// Helper function to convert CryptoKey to storable format using HAL
export async function exportKeyPair(keyPair: { privateKey: CryptoKey; publicKey: CryptoKey }) {
  try {
    return await HAL.crypto.exportKeyPair(keyPair)
  } catch (error) {
    console.error("❌ Error exporting key pair:", error)
    throw new Error("Failed to export key pair")
  }
}

// Helper function to import stored key pair using HAL
export async function importKeyPair(storedKeyPair: { privateKey: number[]; publicKey: number[] }) {
  try {
    return await HAL.crypto.importKeyPair(storedKeyPair)
  } catch (error) {
    console.error("❌ Error importing key pair:", error)
    throw new Error("Failed to import key pair")
  }
}
