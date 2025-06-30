'use client'

/**
 * KairOS Cryptographic Key Management
 * 
 * Simple Ed25519 key generation for NFC authentication
 * Works with Vercel KV database and localStorage architecture
 */

// Ensure crypto is properly configured for browser environments
import './browserSetup'

import { sign as ed25519Sign, verify as ed25519Verify, getPublicKey } from '@noble/ed25519'
import { sha256 } from '@noble/hashes/sha256'
import { randomBytes } from '@noble/hashes/utils'
import { sha512 } from '@noble/hashes/sha512'
import { useEffect, useState, useCallback } from 'react'

// Configure @noble/ed25519 for browser environment
import * as ed25519 from '@noble/ed25519'
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m))

// Import the main crypto functions
export * from './portableCrypto'

// --- Types for Legacy Compatibility ---
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

// --- Storage Keys ---
const STORAGE_KEY = 'kairos_crypto_identity'

/**
 * Generate a new Ed25519 keypair from secure random entropy
 */
export async function generateKeypair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
  const privateKey = randomBytes(32)
  const publicKey = await getPublicKey(privateKey)
  return { privateKey, publicKey }
}

/**
 * Create a DID:key from an Ed25519 public key
 */
export function createDIDFromPublicKey(publicKey: Uint8Array): string {
  const multicodecPrefix = new Uint8Array([0xed, 0x01])
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length)
  multicodecKey.set(multicodecPrefix)
  multicodecKey.set(publicKey, multicodecPrefix.length)
  
  const base58Key = base58Encode(multicodecKey)
  return `did:key:z${base58Key}`
}

/**
 * Sign a message using Ed25519
 */
export async function signMessage(message: string | Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  return await ed25519Sign(messageBytes, privateKey)
}

/**
 * Verify an Ed25519 signature
 */
export async function verifySignature(
  message: string | Uint8Array, 
  signature: Uint8Array, 
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
    return await ed25519Verify(signature, messageBytes, publicKey)
  } catch {
    return false
  }
}

// --- Storage Functions ---
function saveIdentityToStorage(identity: CryptoIdentity): void {
  if (typeof window === 'undefined') return
  
  const exported = {
    privateKey: Array.from(identity.privateKey),
    publicKey: Array.from(identity.publicKey),
    did: identity.did
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exported))
}

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

function clearIdentityFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * React hook for managing cryptographic identity
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

/**
 * Legacy format key generation (for compatibility with existing cards)
 * This generates a random key pair and should be used for new chip programming
 */
export async function generateKeyPair(): Promise<{
  privateKey: string
  publicKey: string
}> {
  // Use the existing generateKeypair function and convert to hex strings
  const keyPair = await generateKeypair()
  
  return {
    privateKey: Array.from(keyPair.privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
    publicKey: Array.from(keyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

/**
 * Sign a message with a private key
 */
export async function sign(message: string, privateKey: string): Promise<string> {
  // Convert hex string to Uint8Array
  const privateKeyBytes = new Uint8Array(privateKey.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || [])
  const messageBytes = new TextEncoder().encode(message)
  
  // Sign with Ed25519
  const signature = await ed25519Sign(messageBytes, privateKeyBytes)
  
  // Convert signature to hex string
  return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a signature
 */
export async function verify(message: string, signature: string, publicKey: string): Promise<boolean> {
  try {
    // Convert hex strings to Uint8Array
    const publicKeyBytes = new Uint8Array(publicKey.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || [])
    const signatureBytes = new Uint8Array(signature.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || [])
    const messageBytes = new TextEncoder().encode(message)
    
    // Verify with Ed25519
    return await ed25519Verify(signatureBytes, messageBytes, publicKeyBytes)
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

// --- Utility Functions ---
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