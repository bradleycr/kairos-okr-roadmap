/**
 * 🔑 DID:Key Registry - Self-Contained Identity
 * 
 * Alternative to IPFS: No external storage, no pinning, no gateways
 * Trade-off: No service endpoints, no easy revocation (addressed separately)
 */

// Ensure crypto is properly configured for browser environments
import './browserSetup'

import { sign, verify, getPublicKey } from '@noble/ed25519'
import { sha256 } from '@noble/hashes/sha256'

export interface DIDKeyIdentity {
  chipUID: string
  did: string           // did:key:z6Mk... (contains public key)
  publicKey: Uint8Array // Extracted from DID
  deviceID: string
  registeredAt: number
  signature?: string    // Optional self-signature for integrity
}

/**
 * 🎯 Pure DID:Key Implementation - Zero Infrastructure
 */
export class DIDKeyRegistry {
  private localCache: Map<string, DIDKeyIdentity> = new Map()
  
  /**
   * 🔑 Generate DID:Key from chipUID + PIN
   */
  async generateDIDKey(chipUID: string, pin: string): Promise<DIDKeyIdentity> {
    // Derive private key (same as IPFS version for compatibility)
    const privateKey = await this.derivePrivateKey(chipUID, pin)
    const publicKey = await getPublicKey(privateKey)
    
    // Create did:key (RFC 8037 format)
    const did = this.publicKeyToDIDKey(publicKey)
    
    const identity: DIDKeyIdentity = {
      chipUID,
      did,
      publicKey,
      deviceID: `kairos-pendant-${chipUID.replace(/:/g, '')}`,
      registeredAt: Date.now()
    }
    
    // Optional: Self-sign for integrity verification
    identity.signature = await this.signIdentity(identity, privateKey)
    
    // Cache locally
    this.localCache.set(chipUID, identity)
    
    return identity
  }
  
  /**
   * 🔍 Lookup public key from DID:Key (instant, no network)
   */
  async lookupPublicKey(chipUID: string): Promise<Uint8Array | null> {
    // Check local cache first
    const cached = this.localCache.get(chipUID)
    if (cached) return cached.publicKey
    
    // For DID:Key, we need the DID to extract the key
    // This comes from NFC tag or previous registration
    return null
  }
  
  /**
   * 🔗 Convert Ed25519 public key to did:key format
   */
  private publicKeyToDIDKey(publicKey: Uint8Array): string {
    // Multibase/multicodec encoding for did:key
    // 0xed = Ed25519 public key type
    // z = base58btc encoding
    const multicodec = new Uint8Array([0xed, 0x01, ...publicKey])
    const base58 = this.base58Encode(multicodec)
    return `did:key:z${base58}`
  }
  
  /**
   * 🔑 Extract public key from did:key
   */
  static parsePublicKeyFromDID(did: string): Uint8Array | null {
    if (!did.startsWith('did:key:z')) return null
    
    try {
      const base58Part = did.slice(9) // Remove "did:key:z"
      const decoded = DIDKeyRegistry.base58Decode(base58Part)
      
      // Skip multicodec prefix (0xed, 0x01)
      if (decoded[0] !== 0xed || decoded[1] !== 0x01) return null
      
      return decoded.slice(2) // Return 32-byte Ed25519 public key
    } catch (error) {
      return null
    }
  }
  
  /**
   * 📋 Generate W3C-compliant DID Document
   */
  generateDIDDocument(identity: DIDKeyIdentity): any {
    return {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/multikey/v1"
      ],
      "id": identity.did,
      "controller": identity.did,
      "verificationMethod": [{
        "id": `${identity.did}#key-1`,
        "type": "Multikey",
        "controller": identity.did,
        "publicKeyMultibase": identity.did.slice(8) // Remove "did:key:"
      }],
      "assertionMethod": [`${identity.did}#key-1`],
      "authentication": [`${identity.did}#key-1`],
      // KairOS extensions
      "service": [{
        "id": `${identity.did}#kairos`,
        "type": "KairOSPendant", 
        "serviceEndpoint": {
          "chipUID": identity.chipUID,
          "deviceID": identity.deviceID,
          "registeredAt": identity.registeredAt
        }
      }]
    }
  }
  
  /**
   * 🔐 Sign identity for integrity verification
   */
  private async signIdentity(identity: DIDKeyIdentity, privateKey: Uint8Array): Promise<string> {
    const { signature: _, ...identityData } = identity
    const message = JSON.stringify(identityData, Object.keys(identityData).sort())
    const messageBytes = new TextEncoder().encode(message)
    const signature = await sign(messageBytes, privateKey)
    return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * ✅ Verify identity signature
   */
  async verifyIdentity(identity: DIDKeyIdentity): Promise<boolean> {
    if (!identity.signature) return false
    
    try {
      const { signature, ...identityData } = identity
      const message = JSON.stringify(identityData, Object.keys(identityData).sort())
      const messageBytes = new TextEncoder().encode(message)
      const signatureBytes = new Uint8Array(signature.match(/.{2}/g)!.map(hex => parseInt(hex, 16)))
      
      return await verify(signatureBytes, messageBytes, identity.publicKey)
    } catch (error) {
      return false
    }
  }
  
  /**
   * 🔑 Derive private key (same as IPFS version)
   */
  private async derivePrivateKey(chipUID: string, pin: string): Promise<Uint8Array> {
    const input = chipUID + pin
    const hash1 = sha256(new TextEncoder().encode(input))
    const hash2 = sha256(hash1)
    return hash2.slice(0, 32)
  }
  
  /**
   * 🔢 Base58 encoding utilities
   */
  private base58Encode(bytes: Uint8Array): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
    
    if (num === 0n) return '1'
    
    let result = ''
    while (num > 0n) {
      result = alphabet[Number(num % 58n)] + result
      num = num / 58n
    }
    
    // Add leading 1s for leading zero bytes
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      result = '1' + result
    }
    
    return result
  }
  
  private static base58Decode(str: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let num = 0n
    
    for (const char of str) {
      const index = alphabet.indexOf(char)
      if (index === -1) throw new Error('Invalid base58 character')
      num = num * 58n + BigInt(index)
    }
    
    const hex = num.toString(16)
    const bytes = hex.length % 2 === 0 ? hex : '0' + hex
    const result = new Uint8Array(bytes.length / 2)
    
    for (let i = 0; i < bytes.length; i += 2) {
      result[i / 2] = parseInt(bytes.slice(i, i + 2), 16)
    }
    
    return result
  }
}

/**
 * 🎯 NFC Tag DID:Key Format
 * 
 * For offline scenarios: Pack full DID document on NTAG215 (540 bytes)
 */
export class NFCDIDKeyFormatter {
  /**
   * 📱 Pack minimal DID data for NFC tag
   */
  static packForNFC(identity: DIDKeyIdentity): string {
    // Minimal format for NTAG215: chipUID + DID (fits in 540 bytes)
    const data = {
      c: identity.chipUID,
      d: identity.did,
      t: identity.registeredAt
    }
    
    return JSON.stringify(data)
  }
  
  /**
   * 📖 Unpack DID data from NFC tag
   */
  static unpackFromNFC(nfcData: string): DIDKeyIdentity | null {
    try {
      const data = JSON.parse(nfcData)
      const publicKey = DIDKeyRegistry.parsePublicKeyFromDID(data.d)
      
      if (!publicKey) return null
      
      return {
        chipUID: data.c,
        did: data.d,
        publicKey,
        deviceID: `kairos-pendant-${data.c.replace(/:/g, '')}`,
        registeredAt: data.t || Date.now()
      }
    } catch (error) {
      return null
    }
  }
} 