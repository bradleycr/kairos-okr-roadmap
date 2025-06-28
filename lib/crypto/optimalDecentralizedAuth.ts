/**
 * 🌐 Optimal Decentralized NFC Authentication for Thousands of Users
 * 
 * ARCHITECTURE FOR SCALE:
 * ✅ NFC Chip: Only public data (chipUID, publicKey, deviceID)
 * ✅ Private Keys: Derived from chipUID + PIN (never stored)
 * ✅ ESP32s: Cache public keys locally, verify offline
 * ✅ Public Key Registry: Decentralized discovery (3-phase evolution)
 * ✅ Cross-Platform: Works on phones, browsers, ESP32s
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { hkdf } from '@noble/hashes/hkdf';
import { P2PIPFSRegistry, IPFSIdentityRecord } from './p2pIPFSRegistry'

// Enable synchronous methods for ESP32 compatibility
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

// --- Core Interfaces ---

export interface NFCPendantData {
  chipUID: string;           // Hardware identifier (burned into NFC)
  publicKey: string;         // Ed25519 public key (safe to store on chip)
  deviceID: string;          // Unique device identifier
  authURL: string;           // Authentication endpoint template
  registryHash: string;      // Hash for integrity verification
  // ❌ NO PRIVATE KEY - This is the key security principle
}

export interface DecentralizedIdentity {
  chipUID: string;
  publicKey: Uint8Array;
  deviceID: string;
  did: string;              // Decentralized identifier
  registeredAt: number;     // Registration timestamp
  lastSeen: number;         // Last activity timestamp
}

export interface ESP32PublicKeyCache {
  [chipUID: string]: {
    publicKey: Uint8Array;
    did: string;
    cachedAt: number;
    verified: boolean;
  }
}

// --- Optimal Cryptographic Functions ---

/**
 * 🔑 Derive Private Key from ChipUID + PIN
 * This is the core security principle - private key is COMPUTED, never stored
 */
export function derivePrivateKeyFromChipAndPIN(chipUID: string, pin: string): Uint8Array {
  // Create deterministic but secure private key
  const seedMaterial = `KairOS-Secure-v2:${chipUID}:pin:${pin}`;
  const salt = new TextEncoder().encode('KairOS-Auth-Salt-2025');
  const info = new TextEncoder().encode(`device:${chipUID}`);
  
  // Use HKDF for proper key derivation
  const seedBytes = new TextEncoder().encode(seedMaterial);
  const derivedKey = hkdf(sha512, seedBytes, salt, info, 32);
  
  // Ensure valid Ed25519 private key
  const privateKey = new Uint8Array(32);
  privateKey.set(derivedKey);
  
  // Ed25519 key clamping
  privateKey[0] &= 248;
  privateKey[31] &= 127;
  privateKey[31] |= 64;
  
  return privateKey;
}

/**
 * 🔐 Generate Public Key from ChipUID (for NFC storage)
 * This can be computed independently and stored on the NFC chip
 */
export async function generatePublicKeyForChip(chipUID: string): Promise<Uint8Array> {
  // Use a deterministic but PIN-independent derivation for public key
  const publicSeed = `KairOS-Public-v2:${chipUID}:public-derivation`;
  const salt = new TextEncoder().encode('KairOS-Public-Salt-2025');
  const info = new TextEncoder().encode(`public:${chipUID}`);
  
  const seedBytes = new TextEncoder().encode(publicSeed);
  const derivedSeed = hkdf(sha512, seedBytes, salt, info, 32);
  
  // Generate deterministic private key for public key derivation
  const tempPrivateKey = new Uint8Array(32);
  tempPrivateKey.set(derivedSeed);
  tempPrivateKey[0] &= 248;
  tempPrivateKey[31] &= 127;
  tempPrivateKey[31] |= 64;
  
  // Derive public key
  return await ed.getPublicKeyAsync(tempPrivateKey);
}

/**
 * 🎯 Authentication Challenge-Response
 * User proves they know the PIN by signing a challenge
 */
export async function proveIdentityWithPIN(
  chipUID: string, 
  pin: string, 
  challenge: string
): Promise<{ signature: Uint8Array; publicKey: Uint8Array }> {
  
  // Derive private key from chip + PIN
  const privateKey = derivePrivateKeyFromChipAndPIN(chipUID, pin);
  
  // Sign the challenge
  const challengeBytes = new TextEncoder().encode(challenge);
  const challengeHash = sha512(challengeBytes);
  const signature = await ed.signAsync(challengeHash, privateKey);
  
  // Get corresponding public key
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  return { signature, publicKey };
}

/**
 * ✅ Verify Identity (works on ESP32s offline)
 * ESP32 can verify without knowing the PIN or private key
 */
export async function verifyIdentityChallenge(
  chipUID: string,
  challenge: string,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  
  try {
    const challengeBytes = new TextEncoder().encode(challenge);
    const challengeHash = sha512(challengeBytes);
    
    return await ed.verifyAsync(signature, challengeHash, publicKey);
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
  }

// --- Public Key Registry (3-Phase Evolution) ---

/**
 * 📚 Phase 1: Central Server Registry (Fallback)
 * Simple HTTP API for public key discovery
 */
export class CentralizedPublicKeyRegistry {
  private apiUrl: string;
  
  constructor(apiUrl: string = 'https://kair-os.vercel.app/api') {
    this.apiUrl = apiUrl;
  }
  
  async registerIdentity(identity: DecentralizedIdentity): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/registry/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chipUID: identity.chipUID,
          publicKey: Array.from(identity.publicKey),
          deviceID: identity.deviceID,
          did: identity.did
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }
  
  async lookupPublicKey(chipUID: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch(`${this.apiUrl}/registry/lookup/${chipUID}`);
      const data = await response.json();
      
      if (data.success && data.publicKey) {
        return new Uint8Array(data.publicKey);
      }
      
      return null;
    } catch (error) {
      console.error('Lookup failed:', error);
      return null;
    }
  }
}

/**
 * ⛓️ Phase 2: Blockchain Registry (Future)
 * Store public keys on-chain for decentralized discovery
 */
export class BlockchainPublicKeyRegistry {
  private contractAddress: string;
  
  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }
  
  async registerIdentity(identity: DecentralizedIdentity): Promise<string> {
    // TODO: Implement smart contract interaction
    // Would store: chipUID => publicKey mapping on-chain
    throw new Error('Blockchain registry not yet implemented');
  }
  
  async lookupPublicKey(chipUID: string): Promise<Uint8Array | null> {
    // TODO: Query blockchain for public key
    throw new Error('Blockchain registry not yet implemented');
  }
}

/**
 * 🌍 Phase 3: P2P/IPFS Registry (Ultimate Goal)
 * Fully decentralized discovery via IPFS/libp2p
 */
export class P2PPublicKeyRegistry {
  async registerIdentity(identity: DecentralizedIdentity): Promise<string> {
    // TODO: Implement IPFS storage
    // Would create IPFS record with public key data
    throw new Error('P2P registry not yet implemented');
  }
  
  async lookupPublicKey(chipUID: string): Promise<Uint8Array | null> {
    // TODO: Query IPFS/DHT for public key
    throw new Error('P2P registry not yet implemented');
  }
}

// --- ESP32 Optimizations ---

/**
 * 🔧 ESP32 Public Key Cache Manager
 * Allows ESP32s to verify users offline after initial sync
 */
export class ESP32KeyCacheManager {
  private cache: ESP32PublicKeyCache = {};
  private maxCacheSize: number = 1000; // Configurable for ESP32 memory
  
  /**
   * Cache a public key for offline verification
   */
  async cachePublicKey(
    chipUID: string, 
    publicKey: Uint8Array, 
    did: string
  ): Promise<void> {
    
    // Verify public key format
    if (publicKey.length !== 32) {
      throw new Error('Invalid Ed25519 public key length');
    }
    
    // Add to cache
    this.cache[chipUID] = {
      publicKey,
      did,
      cachedAt: Date.now(),
      verified: true
    };
    
    // Manage cache size (ESP32 memory constraints)
    await this.pruneCache();
  }
  
  /**
   * Get cached public key for offline verification
   */
  getCachedPublicKey(chipUID: string): Uint8Array | null {
    const cached = this.cache[chipUID];
    
    if (!cached) return null;
    
    // Check if cache entry is still fresh (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - cached.cachedAt > maxAge) {
      delete this.cache[chipUID];
      return null;
    }
    
    return cached.publicKey;
  }
  
  /**
   * Sync cache with registry (periodic ESP32 task)
   */
  async syncWithRegistry(registry: CentralizedPublicKeyRegistry): Promise<number> {
    let syncCount = 0;
    
    // TODO: Implement batch sync for efficiency
    // ESP32 would call this periodically when connected to WiFi
    
    return syncCount;
  }
  
  /**
   * Prune old cache entries to manage ESP32 memory
   */
  private async pruneCache(): Promise<void> {
    const entries = Object.entries(this.cache);
    
    if (entries.length <= this.maxCacheSize) return;
    
    // Sort by last access time and remove oldest
    const sortedEntries = entries.sort(([,a], [,b]) => a.cachedAt - b.cachedAt);
    const toRemove = sortedEntries.slice(0, entries.length - this.maxCacheSize);
    
    for (const [chipUID] of toRemove) {
      delete this.cache[chipUID];
    }
  }
  
  /**
   * Export cache for ESP32 storage (EEPROM/Flash)
   */
  exportForESP32(): string {
    // Serialize cache to compact format for ESP32 storage
    const compactCache = Object.entries(this.cache).map(([chipUID, data]) => ({
      uid: chipUID,
      key: Array.from(data.publicKey),
      ts: data.cachedAt
    }));
    
    return JSON.stringify(compactCache);
  }
  
  /**
   * Import cache from ESP32 storage
   */
  importFromESP32(serializedCache: string): void {
    try {
      const compactCache = JSON.parse(serializedCache);
      
      this.cache = {};
      for (const entry of compactCache) {
        this.cache[entry.uid] = {
          publicKey: new Uint8Array(entry.key),
          did: `did:key:z${entry.uid}`, // Reconstruct DID
          cachedAt: entry.ts,
          verified: true
        };
      }
    } catch (error) {
      console.error('Failed to import ESP32 cache:', error);
    }
  }
}

// --- Complete Authentication Flow ---

/**
 * 🎯 Complete Decentralized Authentication
 * Now using P2P IPFS by default! (Phase 3 implementation)
 */
export class OptimalDecentralizedAuth {
  private keyCache: ESP32KeyCacheManager;
  private ipfsRegistry: P2PIPFSRegistry;
  private fallbackRegistry?: CentralizedPublicKeyRegistry;
  
  constructor(
    useIPFS: boolean = true,
    fallbackRegistry?: CentralizedPublicKeyRegistry,
    maxCacheSize: number = 1000
  ) {
    this.keyCache = new ESP32KeyCacheManager();
    
    // 🌐 Use P2P IPFS by default (Phase 3)
    if (useIPFS) {
      this.ipfsRegistry = new P2PIPFSRegistry();
      this.fallbackRegistry = fallbackRegistry || new CentralizedPublicKeyRegistry();
    } else {
      // Fallback to central server if IPFS not available
      this.ipfsRegistry = new P2PIPFSRegistry(); // Still init for future use
      this.fallbackRegistry = fallbackRegistry || new CentralizedPublicKeyRegistry();
    }
  }
  
  /**
   * Authenticate a user with their NFC pendant + PIN
   */
  async authenticate(
    pendantData: NFCPendantData,
    pin: string,
    challenge?: string
  ): Promise<{
    authenticated: boolean;
    did?: string;
    sessionToken?: string;
    error?: string;
  }> {
    
    try {
      // Generate challenge if not provided
      const authChallenge = challenge || `KairOS-Auth-${Date.now()}-${Math.random()}`;
      
      // User proves identity by signing challenge with PIN-derived key
      const { signature, publicKey } = await proveIdentityWithPIN(
        pendantData.chipUID,
        pin,
        authChallenge
      );
      
      // Verify the signature (can be done offline with cached key)
      let cachedPublicKey = this.keyCache.getCachedPublicKey(pendantData.chipUID);
      
      if (!cachedPublicKey) {
        // 🌐 Primary: Lookup from P2P IPFS network
        cachedPublicKey = await this.ipfsRegistry.lookupPublicKey(pendantData.chipUID);
        
        // 📡 Fallback: Try central server if IPFS fails
        if (!cachedPublicKey && this.fallbackRegistry) {
          console.log('🔄 IPFS lookup failed, trying fallback registry...');
          cachedPublicKey = await this.fallbackRegistry.lookupPublicKey(pendantData.chipUID);
        }
        
        if (cachedPublicKey) {
          // Cache for future offline use
          await this.keyCache.cachePublicKey(
            pendantData.chipUID,
            cachedPublicKey,
            `did:key:z${pendantData.chipUID}`
          );
        }
      }
      
      if (!cachedPublicKey) {
        return {
          authenticated: false,
          error: 'Public key not found in registry'
        };
      }
      
      // Verify the signature
      const isValid = await verifyIdentityChallenge(
        pendantData.chipUID,
        authChallenge,
        signature,
        cachedPublicKey
      );
      
      if (!isValid) {
        return {
          authenticated: false,
          error: 'Invalid signature - wrong PIN or compromised chip'
        };
      }
      
      // Generate session token for ESP32 access
      const sessionToken = `kairos_${pendantData.chipUID}_${Date.now()}`;
      
      return {
        authenticated: true,
        did: `did:key:z${pendantData.chipUID}`,
        sessionToken
      };
      
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
  
  /**
   * Initialize a new NFC pendant
   */
  async initializePendant(chipUID: string): Promise<NFCPendantData> {
    // Generate public key for the chip
    const publicKey = await generatePublicKeyForChip(chipUID);
    const publicKeyHex = Array.from(publicKey)
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const deviceID = `kairos-pendant-${chipUID.replace(/:/g, '')}`;
    const authURL = `https://kair-os.vercel.app/auth?chip=${chipUID}&device=${deviceID}`;
    
    // Create integrity hash
    const dataToHash = `${chipUID}:${publicKeyHex}:${deviceID}`;
    const hashBytes = sha512(new TextEncoder().encode(dataToHash));
    const registryHash = Array.from(hashBytes.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const pendantData: NFCPendantData = {
      chipUID,
      publicKey: publicKeyHex,
      deviceID,
      authURL,
      registryHash
    };
    
    // 🌐 Register in P2P IPFS network (Phase 3!)
    const ipfsIdentity: Omit<IPFSIdentityRecord, 'signature' | 'ipfsHash'> = {
      chipUID,
      publicKey,
      deviceID,
      did: `did:key:z${chipUID}`,
      registeredAt: Date.now()
    };
    
    try {
      // Primary: Register in IPFS network
      const ipfsHash = await this.ipfsRegistry.registerIdentity(ipfsIdentity);
      console.log(`🌐 Registered in IPFS: ${ipfsHash}`);
      
      // Also register in fallback for redundancy
      if (this.fallbackRegistry) {
        const fallbackIdentity: DecentralizedIdentity = {
          ...ipfsIdentity,
          lastSeen: Date.now()
        };
        await this.fallbackRegistry.registerIdentity(fallbackIdentity);
        console.log(`📡 Also registered in fallback registry`);
      }
    } catch (error) {
      console.error('IPFS registration failed:', error);
      
      // Fallback to central server
      if (this.fallbackRegistry) {
        const fallbackIdentity: DecentralizedIdentity = {
          ...ipfsIdentity,
          lastSeen: Date.now()
        };
        await this.fallbackRegistry.registerIdentity(fallbackIdentity);
        console.log(`📡 Registered in fallback registry only`);
      }
    }
    
    return pendantData;
  }
  
  /**
   * 📊 Get P2P network status
   */
  getNetworkStatus(): {
    ipfs: {
      connectedPeers: number;
      knownRecords: number;
      ipfsGateways: number;
      peerId: string;
    };
    cache: {
      cachedKeys: number;
      maxSize: number;
    };
    mode: 'p2p-primary' | 'fallback-only';
  } {
    const ipfsStatus = this.ipfsRegistry.getNetworkStatus();
    
    return {
      ipfs: ipfsStatus,
      cache: {
        cachedKeys: Object.keys(this.keyCache['cache'] || {}).length,
        maxSize: this.keyCache['maxCacheSize'] || 1000
      },
      mode: this.fallbackRegistry ? 'p2p-primary' : 'fallback-only'
    };
  }
  
  /**
   * 🧹 Cleanup resources
   */
  destroy(): void {
    this.ipfsRegistry.destroy();
  }
}

// --- ESP32 C++ Integration Helpers ---

/**
 * 🔧 Generate ESP32-compatible code
 */
export function generateESP32CompatibleCode(): string {
  return `
// ESP32 C++ Implementation
#include <ed25519.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// Authentication endpoint for ESP32
void handleAuthentication() {
    // Parse request
    String chipUID = server.arg("chipUID");
    String challenge = server.arg("challenge");
    String signature = server.arg("signature");
    String publicKey = server.arg("publicKey");
    
    // Load cached public key from EEPROM
    uint8_t cachedKey[32];
    bool found = loadCachedPublicKey(chipUID.c_str(), cachedKey);
    
    if (!found) {
        server.send(404, "application/json", 
                   "{\\"error\\": \\"Public key not found\\"}");
        return;
    }
    
    // Verify Ed25519 signature
    uint8_t sigBytes[64];
    hexStringToBytes(signature.c_str(), sigBytes);
    
    uint8_t challengeHash[64];
    sha512((uint8_t*)challenge.c_str(), challenge.length(), challengeHash);
    
    bool isValid = ed25519_verify(sigBytes, challengeHash, 64, cachedKey);
    
    if (isValid) {
        // Generate session token
        String sessionToken = "kairos_" + chipUID + "_" + String(millis());
        
        server.send(200, "application/json", 
                   "{\\"authenticated\\": true, \\"session\\": \\"" + 
                   sessionToken + "\\"}");
        
        // Audio feedback
        tone(BUZZER_PIN, 1000, 200);
    } else {
        server.send(401, "application/json", 
                   "{\\"authenticated\\": false}");
        
        // Error tone
        tone(BUZZER_PIN, 200, 500);
    }
}

// Cache management for ESP32 EEPROM
bool loadCachedPublicKey(const char* chipUID, uint8_t* publicKey) {
    // Implement EEPROM lookup
    // Return true if found, false otherwise
    return false; // Placeholder
}

void syncPublicKeyCache() {
    // Periodic task to sync with registry when WiFi available
    if (WiFi.status() == WL_CONNECTED) {
        // Fetch updates from central registry
        // Update EEPROM cache
    }
}
`;
}

// --- All classes are exported individually where they're defined ---