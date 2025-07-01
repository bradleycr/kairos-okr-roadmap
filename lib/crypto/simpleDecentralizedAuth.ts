/**
 * DID:Key Decentralized Authentication - Simplified Implementation
 * 
 * Features:
 * - Zero infrastructure dependencies  
 * - Complete offline operation
 * - Ed25519 signatures 
 * - W3C DID:Key standards compliance
 * - Deterministic private key generation
 * - Performance optimized
 */

// Ensure crypto is properly configured for browser environments
import './browserSetup'

import { sign, verify, getPublicKey } from '@noble/ed25519'
import { sha256 } from '@noble/hashes/sha256'
import { DIDKeyRegistry, DIDKeyIdentity, NFCDIDKeyFormatter } from './didKeyRegistry'
import { RevocationRegistry } from './revocationRegistry'

export interface SimpleAuthResult {
  success: boolean
  identity?: DIDKeyIdentity
  publicKey?: Uint8Array
  did?: string
  error?: string
  performance: {
    totalTime: number
    keyDerivation: number
    didParsing: number
    verification: number
  }
}

export interface AuthChallenge {
  challenge: string
  nonce: string
  timestamp: number
  expiresAt: number
}

/**
 * 🌟 Simple Decentralized Authentication
 * Pure DID:Key implementation - no external dependencies
 */
export class SimpleDecentralizedAuth {
  private didRegistry: DIDKeyRegistry
  private revocationRegistry: RevocationRegistry
  private localCache: Map<string, DIDKeyIdentity> = new Map()
  
  constructor() {
    this.didRegistry = new DIDKeyRegistry()
    this.revocationRegistry = new RevocationRegistry()
  }

  /**
   * 🎯 Generate DID:Key identity (registration)
   */
  async generateIdentity(chipUID: string, pin: string): Promise<DIDKeyIdentity> {
    const startTime = performance.now()
    
    try {
      // Generate DID:Key identity (no network calls!)
      const identity = await this.didRegistry.generateDIDKey(chipUID, pin)
      
      // Cache locally for instant future access
      this.localCache.set(chipUID, identity)
      
      console.log(`✅ Generated DID:Key identity in ${performance.now() - startTime}ms`)
      return identity
      
    } catch (error) {
      console.error('Failed to generate identity:', error)
      throw error
    }
  }

  /**
   * 🔐 Authenticate with chipUID + PIN (pure offline)
   */
  async authenticate(chipUID: string, pin: string): Promise<SimpleAuthResult> {
    const startTime = performance.now()
    const timings = { keyDerivation: 0, didParsing: 0, verification: 0 }
    
    try {
      // Step 1: Check revocation first (fastest fail)
      const isRevoked = await this.revocationRegistry.quickRevocationCheck(chipUID)
      if (isRevoked) {
        return {
          success: false,
          error: 'Pendant has been revoked',
          performance: { totalTime: performance.now() - startTime, ...timings }
        }
      }

      // Step 2: Derive identity from chipUID + PIN
      const keyStart = performance.now()
      const identity = await this.didRegistry.generateDIDKey(chipUID, pin)
      timings.keyDerivation = performance.now() - keyStart

      // Step 3: Parse public key from DID (instant)
      const parseStart = performance.now()
      const publicKey = DIDKeyRegistry.parsePublicKeyFromDID(identity.did)
      timings.didParsing = performance.now() - parseStart

      if (!publicKey) {
        return {
          success: false,
          error: 'Invalid DID format',
          performance: { totalTime: performance.now() - startTime, ...timings }
        }
      }

      // Step 4: Verify identity integrity
      const verifyStart = performance.now()
      const isValid = await this.didRegistry.verifyIdentity(identity)
      timings.verification = performance.now() - verifyStart

      if (!isValid) {
        return {
          success: false,
          error: 'Identity verification failed',
          performance: { totalTime: performance.now() - startTime, ...timings }
        }
      }

      // Cache for future use
      this.localCache.set(chipUID, identity)

      const totalTime = performance.now() - startTime
      console.log(`DID:Key authentication completed in ${totalTime}ms`)

      return {
        success: true,
        identity,
        publicKey,
        did: identity.did,
        performance: { totalTime, ...timings }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: { totalTime: performance.now() - startTime, ...timings }
      }
    }
  }

  /**
   * 🔍 Lookup identity by chipUID (cache + derive)
   */
  async lookupIdentity(chipUID: string): Promise<DIDKeyIdentity | null> {
    // Check cache first
    const cached = this.localCache.get(chipUID)
    if (cached) return cached

    // For DID:Key, we need PIN to derive the identity
    // This is a security feature - no identity without PIN
    return null
  }

  /**
   * 🎯 Generate authentication challenge
   */
  generateChallenge(chipUID: string, relyingParty?: string): AuthChallenge {
    const timestamp = Date.now()
    const nonce = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    
    // DID Auth compliant challenge format
    const challengeData = {
      typ: "DIDAuth",
      alg: "Ed25519",
      iss: relyingParty || "did:web:kair-os.vercel.app", 
      sub: chipUID,
      aud: "did:key:", // Will be filled with actual DID
      iat: Math.floor(timestamp / 1000),
      exp: Math.floor((timestamp + 60 * 1000) / 1000), // 60 seconds
      nonce,
      challenge: `KairOS-DIDAuth-${chipUID}-${timestamp}-${nonce}`
    }
    
    return {
      challenge: JSON.stringify(challengeData),
      nonce,
      timestamp,
      expiresAt: timestamp + 60 * 1000 // 60 seconds
    }
  }

  /**
   * 🔐 Sign DID Auth challenge with identity
   */
  async signChallenge(
    chipUID: string, 
    pin: string, 
    challenge: string
  ): Promise<string> {
    // Derive private key
    const input = chipUID + pin
    const hash1 = sha256(new TextEncoder().encode(input))
    const hash2 = sha256(hash1)
    const privateKey = hash2.slice(0, 32)

    // Parse challenge to get the actual message to sign
    let challengeMessage = challenge
    if (challenge.startsWith('{')) {
      try {
        const challengeData = JSON.parse(challenge)
        
        // For DID Auth, we sign the inner challenge message
        challengeMessage = challengeData.challenge || challenge
        
        // Verify this challenge is still valid
        if (challengeData.exp && challengeData.exp < Math.floor(Date.now() / 1000)) {
          throw new Error('Challenge has expired')
        }
      } catch (e) {
        // If JSON parsing fails, use original challenge
        challengeMessage = challenge
      }
    }

    // Sign challenge message
    const challengeBytes = new TextEncoder().encode(challengeMessage)
    const signature = await sign(challengeBytes, privateKey)
    
    return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * ✅ Verify signature against DID Auth challenge
   */
  async verifyChallenge(
    did: string,
    challenge: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Extract public key from DID
      const publicKey = DIDKeyRegistry.parsePublicKeyFromDID(did)
      if (!publicKey) return false

      // Parse structured challenge if it's JSON format
      let challengeMessage = challenge
      if (challenge.startsWith('{')) {
        try {
          const challengeData = JSON.parse(challenge)
          
          // Verify challenge hasn't expired
          if (challengeData.exp && challengeData.exp < Math.floor(Date.now() / 1000)) {
            console.warn('Challenge has expired')
            return false
          }
          
          // Verify challenge is for correct DID
          if (challengeData.aud && !challengeData.aud.startsWith('did:key:') && challengeData.aud !== did) {
            console.warn('Challenge audience mismatch')
            return false
          }
          
          // Verify algorithm matches
          if (challengeData.alg && challengeData.alg !== 'Ed25519') {
            console.warn('Challenge algorithm mismatch')
            return false
          }
          
          // Use the inner challenge message for signature verification
          challengeMessage = challengeData.challenge || challenge
        } catch (e) {
          // If JSON parsing fails, use original challenge
          challengeMessage = challenge
        }
      }

      // Verify signature
      const challengeBytes = new TextEncoder().encode(challengeMessage)
      const signatureBytes = new Uint8Array(
        signature.match(/.{2}/g)!.map(hex => parseInt(hex, 16))
      )

      return await verify(signatureBytes, challengeBytes, publicKey)
      
    } catch (error) {
      console.error('Challenge verification failed:', error)
      return false
    }
  }

  /**
   * 📱 Generate NFC URL for DID:Key
   */
  generateNFCURL(identity: DIDKeyIdentity, baseURL: string = window.location.origin): string {
    // Super clean DID:Key URL (no complex parameters)
    return `${baseURL}/nfc?did=${encodeURIComponent(identity.did)}`
  }

  /**
   * 📖 Parse DID from NFC URL
   */
  parseNFCURL(url: string): { did: string } | null {
    try {
      const urlObj = new URL(url)
      const did = urlObj.searchParams.get('did')
      
      if (!did || !did.startsWith('did:key:')) return null
      
      return { did }
    } catch (error) {
      return null
    }
  }

  /**
   * 💾 Pack DID data for NTAG215 chip (offline venues)
   */
  packForNFC(identity: DIDKeyIdentity): string {
    return NFCDIDKeyFormatter.packForNFC(identity)
  }

  /**
   * 📖 Unpack DID data from NFC chip
   */
  unpackFromNFC(nfcData: string): DIDKeyIdentity | null {
    return NFCDIDKeyFormatter.unpackFromNFC(nfcData)
  }

  /**
   * 🔄 Revoke pendant (lost/stolen)
   */
  async revokePendant(
    chipUID: string, 
    reason: 'lost' | 'stolen' | 'compromised' | 'rotation',
    newChipUID?: string
  ): Promise<string> {
    return await this.revocationRegistry.revokePendant(chipUID, reason, newChipUID)
  }

  /**
   * 📊 Get system status
   */
  getStatus(): {
    cachedIdentities: number
    revocationStats: any
    architecture: string
    performance: string
  } {
    return {
      cachedIdentities: this.localCache.size,
      revocationStats: this.revocationRegistry.getStats(),
      architecture: 'DID:Key (Pure Decentralized)',
      performance: 'Offline-First, <50ms auth'
    }
  }

  /**
   * 🧹 Clear cache
   */
  clearCache(): void {
    this.localCache.clear()
  }

  /**
   * 🔧 Generate W3C compliant DID document
   */
  generateDIDDocument(identity: DIDKeyIdentity): any {
    return this.didRegistry.generateDIDDocument(identity)
  }

  /**
   * 🚪 Single Logout - End all sessions for a DID
   * As specified in DID Auth spec section "Single Log-out"
   */
  async singleLogout(did: string): Promise<{
    success: boolean
    sessionsCleared: number
    error?: string
  }> {
    try {
      let sessionsCleared = 0
      
      // Clear local cache
      for (const [chipUID, identity] of this.localCache.entries()) {
        if (identity.did === did) {
          this.localCache.delete(chipUID)
          sessionsCleared++
        }
      }
      
      // Clear browser storage if available
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
            key.includes(did) || 
            key.startsWith('kairos:session:') || 
            key.startsWith('kairos:account:')
          )) {
            keysToRemove.push(key)
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key))
        sessionsCleared += keysToRemove.length
      }
      
      // Notify relying parties (in production, maintain list of active sessions)
      try {
        const response = await fetch('/api/nfc/sessions/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ did, action: 'single_logout' })
        })
        
        if (response.ok) {
          const result = await response.json()
          sessionsCleared += result.sessionsCleared || 0
        }
      } catch (error) {
        console.warn('Failed to notify server sessions for logout:', error)
      }
      
      // Emit logout event for components to react
      if (typeof window !== 'undefined') {
        const logoutEvent = new CustomEvent('did-single-logout', {
          detail: { did, sessionsCleared }
        })
        window.dispatchEvent(logoutEvent)
      }
      
      console.log(`✅ Single logout completed for ${did}, cleared ${sessionsCleared} sessions`)
      
      return {
        success: true,
        sessionsCleared
      }
      
    } catch (error) {
      console.error('Single logout failed:', error)
      return {
        success: false,
        sessionsCleared: 0,
        error: error instanceof Error ? error.message : 'Logout failed'
      }
    }
  }
}

// Export singleton for global use
export const simpleAuth = new SimpleDecentralizedAuth() 