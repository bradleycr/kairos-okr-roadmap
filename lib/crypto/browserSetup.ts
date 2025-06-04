// --- Browser Crypto Setup for KairOS ---
// Ensures all @noble crypto libraries are properly configured for browser environments
// This module should be imported early in the application lifecycle

import { sha512 } from '@noble/hashes/sha512'
import * as ed25519 from '@noble/ed25519'

// --- Browser Environment Detection ---
export const isBrowser = typeof window !== 'undefined'
export const isNode = typeof process !== 'undefined' && process.versions?.node

// --- Configure @noble/ed25519 for browser ---
if (isBrowser) {
  // Set up SHA-512 for ed25519 (required for browser environments)
  ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m))
  
  console.log('[CRYPTO] ✅ Ed25519 configured for browser environment')
}

// --- WebCrypto API Availability Check ---
export function checkWebCryptoSupport(): boolean {
  if (!isBrowser) return false
  
  return !!(
    window.crypto &&
    window.crypto.subtle &&
    window.crypto.getRandomValues
  )
}

// --- Crypto Environment Diagnostics ---
export function getCryptoEnvironmentInfo() {
  return {
    isBrowser,
    isNode,
    hasWebCrypto: checkWebCryptoSupport(),
    hasSecureContext: isBrowser ? window.isSecureContext : null,
    ed25519Configured: !!ed25519.etc.sha512Sync,
    userAgent: isBrowser ? navigator.userAgent : null
  }
}

// --- Initialize Crypto Environment ---
export function initializeCryptoEnvironment(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (isBrowser && !checkWebCryptoSupport()) {
        throw new Error('WebCrypto API not available. HTTPS required for crypto operations.')
      }
      
      if (isBrowser && !window.isSecureContext) {
        console.warn('[CRYPTO] ⚠️ Not in secure context. Some crypto operations may fail.')
      }
      
      console.log('[CRYPTO] Environment:', getCryptoEnvironmentInfo())
      resolve()
    } catch (error) {
      console.error('[CRYPTO] ❌ Failed to initialize crypto environment:', error)
      reject(error)
    }
  })
}

// --- Auto-initialize on import ---
if (isBrowser) {
  initializeCryptoEnvironment().catch(console.error)
} 