// --- Enhanced Cryptographic Key Management for KairOS ---
// This module provides true Ed25519 keypairs using @noble/ed25519
// Designed for seamless ESP32 porting - replace localStorage with EEPROM/Flash
// All functions are async to match future hardware I/O patterns

// Import browser setup first to ensure crypto environment is configured
import './browserSetup'

import { getPublicKey, sign, verify } from '@noble/ed25519'
import { randomBytes } from '@noble/hashes/utils'
import { sha512 } from '@noble/hashes/sha512'
import { useEffect, useState, useCallback } from 'react'

// --- Configure @noble/ed25519 for browser environment ---
// This is required for @noble/ed25519 to work in browsers
import * as ed25519 from '@noble/ed25519'

// Set up SHA-512 for ed25519 (required for browser environments)
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m))

// --- Types for Enhanced Crypto Identity ---
export interface CryptoIdentity {
  privateKey: Uint8Array
  publicKey: Uint8Array
  did: string
}

export interface CryptoKeyManager {
  identity: CryptoIdentity | null
  isReady: boolean
  generateNewIdentity: () => Promise<void>
  signMessage: (message: string | Uint8Array) => Promise<Uint8Array>
  exportIdentity: () => string | null
  importIdentity: (exported: string) => Promise<void>
  clearIdentity: () => void
}

// --- Storage Keys (ESP32: Replace with EEPROM addresses) ---
const STORAGE_KEY = 'kairos_crypto_identity'

// --- Core Crypto Functions (ESP32-Ready) ---

/**
 * Generate a new Ed25519 keypair from secure random entropy
 * @note ESP32: Use hardware RNG via esp_random() or mbedTLS
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
 * @note ESP32: Same logic, use base58 encoding library
 */
export function createDIDFromPublicKey(publicKey: Uint8Array): string {
  // Ed25519 multicodec prefix (0xed01)
  const multicodecPrefix = new Uint8Array([0xed, 0x01])
  
  // Combine prefix with public key
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length)
  multicodecKey.set(multicodecPrefix)
  multicodecKey.set(publicKey, multicodecPrefix.length)
  
  // Simple base58 encoding (ESP32: use dedicated base58 library)
  const base58Key = base58Encode(multicodecKey)
  
  return `did:key:z${base58Key}`
}

/**
 * Sign a message using Ed25519
 * @note ESP32: Use mbedTLS or libsodium ed25519 signing
 */
export async function signMessage(message: string | Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  return await sign(messageBytes, privateKey)
}

/**
 * Verify an Ed25519 signature
 * @note ESP32: Use mbedTLS or libsodium ed25519 verification
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

// --- Storage Functions (ESP32: Replace with EEPROM/Flash) ---

/**
 * Save identity to localStorage
 * @note ESP32: Save to EEPROM/Flash
 */
function saveIdentityToStorage(identity: CryptoIdentity): void {
  if (typeof window === 'undefined') return
  
  const exported = {
    privateKey: Array.from(identity.privateKey),
    publicKey: Array.from(identity.publicKey),
    did: identity.did
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exported))
}

/**
 * Load identity from localStorage
 * @note ESP32: Load from EEPROM/Flash
 */
function loadIdentityFromStorage(): CryptoIdentity | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return {
      privateKey: new Uint8Array(parsed.privateKey),
      publicKey: new Uint8Array(parsed.publicKey),
      did: parsed.did
    }
  } catch (error) {
    console.warn('Failed to load identity from storage:', error)
    return null
  }
}

/**
 * Clear stored identity
 * @note ESP32: Clear EEPROM section
 */
function clearIdentityFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// --- React Hook for Crypto Identity Management ---

/**
 * React hook for managing cryptographic identity
 * @note ESP32: Convert to C++ class with similar interface
 */
export function useCryptoIdentity(): CryptoKeyManager {
  const [identity, setIdentity] = useState<CryptoIdentity | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Load existing identity on mount
  useEffect(() => {
    const loadExistingIdentity = async () => {
      const stored = loadIdentityFromStorage()
      if (stored) {
        setIdentity(stored)
      }
      setIsReady(true)
    }
    
    loadExistingIdentity()
  }, [])

  // Generate new identity
  const generateNewIdentity = useCallback(async () => {
    const { privateKey, publicKey } = await generateKeypair()
    const did = createDIDFromPublicKey(publicKey)
    
    const newIdentity: CryptoIdentity = { privateKey, publicKey, did }
    
    setIdentity(newIdentity)
    saveIdentityToStorage(newIdentity)
  }, [])

  // Sign message with current identity
  const signMessageWithIdentity = useCallback(async (message: string | Uint8Array): Promise<Uint8Array> => {
    if (!identity) {
      throw new Error('No crypto identity available. Generate one first.')
    }
    return await signMessage(message, identity.privateKey)
  }, [identity])

  // Export identity as base64 string
  const exportIdentity = useCallback((): string | null => {
    if (!identity) return null
    
    const exported = {
      privateKey: Array.from(identity.privateKey),
      publicKey: Array.from(identity.publicKey),
      did: identity.did
    }
    
    return btoa(JSON.stringify(exported))
  }, [identity])

  // Import identity from base64 string
  const importIdentity = useCallback(async (exported: string): Promise<void> => {
    try {
      const parsed = JSON.parse(atob(exported))
      const importedIdentity: CryptoIdentity = {
        privateKey: new Uint8Array(parsed.privateKey),
        publicKey: new Uint8Array(parsed.publicKey),
        did: parsed.did
      }
      
      setIdentity(importedIdentity)
      saveIdentityToStorage(importedIdentity)
    } catch (error) {
      throw new Error('Invalid identity export format')
    }
  }, [])

  // Clear current identity
  const clearIdentity = useCallback(() => {
    setIdentity(null)
    clearIdentityFromStorage()
  }, [])

  return {
    identity,
    isReady,
    generateNewIdentity,
    signMessage: signMessageWithIdentity,
    exportIdentity,
    importIdentity,
    clearIdentity
  }
}

// --- Utility Functions ---

// Simple base58 encoding (Bitcoin alphabet)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return ''

  let result = ''
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
    result = '1' + result
  }

  return result
} 