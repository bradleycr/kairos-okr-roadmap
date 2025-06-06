// --- Server-Side Ed25519 Cryptography for KairOS ---
// This module provides Ed25519 functions for API routes (no React hooks)

import { getPublicKey, sign, verify } from '@noble/ed25519'
import { randomBytes } from '@noble/hashes/utils'
import { sha512 } from '@noble/hashes/sha512'

// --- Configure @noble/ed25519 for server environment ---
import * as ed25519 from '@noble/ed25519'

// Set up SHA-512 for ed25519 (required for server environments)
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m))

// --- Server-Side Crypto Functions ---

/**
 * Generate a new Ed25519 keypair from secure random entropy
 * @returns Promise with privateKey and publicKey as Uint8Array
 */
export async function generateKeypair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
  // Generate 32 bytes of cryptographically secure random data
  const privateKey = randomBytes(32)
  
  // Derive public key from private key
  const publicKey = await getPublicKey(privateKey)
  
  return { privateKey, publicKey }
}

/**
 * Create a DID:key from an Ed25519 public key
 * @param publicKey - The Ed25519 public key as Uint8Array
 * @returns DID:key string
 */
export function createDIDFromPublicKey(publicKey: Uint8Array): string {
  // Ed25519 multicodec prefix (0xed01)
  const multicodecPrefix = new Uint8Array([0xed, 0x01])
  
  // Combine prefix with public key
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length)
  multicodecKey.set(multicodecPrefix)
  multicodecKey.set(publicKey, multicodecPrefix.length)
  
  // Simple base58 encoding (server-safe version)
  const base58Key = base58Encode(multicodecKey)
  
  return `did:key:z${base58Key}`
}

/**
 * Sign a message using Ed25519
 * @param message - Message to sign (string or Uint8Array)
 * @param privateKey - Ed25519 private key as Uint8Array
 * @returns Promise with signature as Uint8Array
 */
export async function signMessage(message: string | Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  return await sign(messageBytes, privateKey)
}

/**
 * Verify an Ed25519 signature
 * @param message - Original message (string or Uint8Array)
 * @param signature - Signature to verify as Uint8Array
 * @param publicKey - Ed25519 public key as Uint8Array
 * @returns Promise with boolean verification result
 */
export async function verifySignature(
  message: string | Uint8Array, 
  signature: Uint8Array, 
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
    return await verify(signature, messageBytes, publicKey)
  } catch {
    return false
  }
}

// --- Helper Functions ---

/**
 * Simple base58 encoding for server use
 * @param bytes - Bytes to encode
 * @returns Base58 encoded string
 */
function base58Encode(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  
  // Convert bytes to base58 (simplified but working version)
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  while (num > 0) {
    result = alphabet[Number(num % 58n)] + result
    num = num / 58n
  }
  
  return result
} 