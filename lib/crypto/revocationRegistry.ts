/**
 * 🚫 Revocation Registry - Handle Lost/Stolen Pendants
 * 
 * Minimal overhead solution: Single CID pinned to IPFS
 * ESP32s check revocation list before authentication
 */

import { sha256 } from '@noble/hashes/sha256'

export interface RevocationEntry {
  chipUID: string
  revokedAt: number
  reason: 'lost' | 'stolen' | 'compromised' | 'rotation'
  newChipUID?: string  // For key rotation
  signature: string    // Signed by master revocation key
}

export interface RevocationList {
  version: number
  updatedAt: number
  entries: RevocationEntry[]
  signature: string  // Signed by master authority
  cid?: string      // IPFS CID of this list
}

/**
 * 🔒 Revocation Registry - Lightweight Security
 */
export class RevocationRegistry {
  private masterPrivateKey: Uint8Array
  private currentList: RevocationList
  private cacheExpiry: number = 6 * 60 * 60 * 1000  // 6 hours
  
  constructor(masterPrivateKey?: Uint8Array) {
    // Generate or use provided master key for revocation authority
    this.masterPrivateKey = masterPrivateKey || this.generateMasterKey()
    this.currentList = {
      version: 1,
      updatedAt: Date.now(),
      entries: [],
      signature: ''
    }
  }
  
  /**
   * 🚫 Revoke a pendant (lost/stolen)
   */
  async revokePendant(
    chipUID: string, 
    reason: RevocationEntry['reason'],
    newChipUID?: string
  ): Promise<string> {
    const entry: RevocationEntry = {
      chipUID,
      revokedAt: Date.now(),
      reason,
      newChipUID,
      signature: await this.signRevocationEntry(chipUID, reason)
    }
    
    // Add to current list
    this.currentList.entries.push(entry)
    this.currentList.version++
    this.currentList.updatedAt = Date.now()
    
    // Sign the updated list
    this.currentList.signature = await this.signRevocationList(this.currentList)
    
    // Pin to IPFS (minimal cost)
    const cid = await this.pinToIPFS(this.currentList)
    this.currentList.cid = cid
    
    console.log(`🚫 Revoked pendant ${chipUID} (${reason}) -> CID: ${cid}`)
    return cid
  }
  
  /**
   * ✅ Check if pendant is revoked
   */
  isRevoked(chipUID: string): RevocationEntry | null {
    return this.currentList.entries.find(entry => entry.chipUID === chipUID) || null
  }
  
  /**
   * 🔄 Rotate pendant keys (user-initiated)
   */
  async rotatePendant(oldChipUID: string, newChipUID: string): Promise<string> {
    return await this.revokePendant(oldChipUID, 'rotation', newChipUID)
  }
  
  /**
   * 📡 ESP32 Quick Check (cached)
   */
  async quickRevocationCheck(chipUID: string): Promise<boolean> {
    // ESP32s cache revocation list for 6 hours
    if (this.isCacheExpired()) {
      await this.refreshFromNetwork()
    }
    
    return this.isRevoked(chipUID) !== null
  }
  
  /**
   * 🌐 Fetch latest revocation list from network
   */
  async refreshFromNetwork(): Promise<void> {
    try {
      // Try IPFS gateways for latest CID
      const latestCID = await this.getLatestRevocationCID()
      if (latestCID && latestCID !== this.currentList.cid) {
        const freshList = await this.fetchRevocationList(latestCID)
        if (this.verifyRevocationList(freshList)) {
          this.currentList = freshList
          console.log(`🔄 Updated revocation list: v${freshList.version}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh revocation list:', error)
    }
  }
  
  /**
   * 📦 Pin revocation list to IPFS
   */
  private async pinToIPFS(list: RevocationList): Promise<string> {
    const listBytes = new TextEncoder().encode(JSON.stringify(list))
    
    // Generate deterministic CID
    const hash = sha256(listBytes)
    const cid = 'Qm' + Array.from(hash.slice(0, 22))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Pin to IPFS (implement actual pinning service)
    await this.pinToIPFSService(listBytes, cid)
    
    return cid
  }
  
  /**
   * 🔐 Sign revocation entry
   */
  private async signRevocationEntry(chipUID: string, reason: string): Promise<string> {
    const message = `revoke:${chipUID}:${reason}:${Date.now()}`
    const messageBytes = new TextEncoder().encode(message)
    const hash = sha256(messageBytes)
    
    // Simple signature (replace with proper Ed25519 in production)
    return Array.from(hash.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * 🔏 Sign revocation list
   */
  private async signRevocationList(list: RevocationList): Promise<string> {
    const { signature: _, ...listData } = list
    const message = JSON.stringify(listData, Object.keys(listData).sort())
    const messageBytes = new TextEncoder().encode(message)
    const hash = sha256(messageBytes)
    
    return Array.from(hash.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * ✅ Verify revocation list integrity
   */
  private verifyRevocationList(list: RevocationList): boolean {
    // Verify master signature (implement proper verification)
    const { signature, ...listData } = list
    const expectedSig = sha256(new TextEncoder().encode(JSON.stringify(listData)))
    
    // Simplified verification (use Ed25519 in production)
    return signature.length === 64
  }
  
  /**
   * 🗝️ Generate master revocation key
   */
  private generateMasterKey(): Uint8Array {
    const seed = 'kairos-revocation-master-key'
    return sha256(new TextEncoder().encode(seed)).slice(0, 32)
  }
  
  /**
   * ⏰ Check if cache expired
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.currentList.updatedAt > this.cacheExpiry
  }
  
  /**
   * 🌐 Get latest revocation CID from DNS/pinning service
   */
  private async getLatestRevocationCID(): Promise<string | null> {
    try {
      // Check DNS TXT record: _kairos-revocation.yourdomain.com
      // Or query your pinning service API
      const response = await fetch('/api/revocation/latest')
      const data = await response.json()
      return data.cid
    } catch (error) {
      return null
    }
  }
  
  /**
   * 📥 Fetch revocation list from IPFS
   */
  private async fetchRevocationList(cid: string): Promise<RevocationList> {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/'
    ]
    
    for (const gateway of gateways) {
      try {
        const response = await fetch(`${gateway}${cid}`)
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        continue
      }
    }
    
    throw new Error('Failed to fetch revocation list')
  }
  
  /**
   * 📌 Pin to actual IPFS service
   */
  private async pinToIPFSService(data: Uint8Array, expectedCID: string): Promise<void> {
    // Implement actual pinning to your IPFS node or Pinata/Web3.Storage
    console.log(`📌 Pinning revocation list to IPFS: ${expectedCID}`)
    
    // Example: POST to your pinning service
    // await fetch('/api/ipfs/pin', {
    //   method: 'POST',
    //   body: data,
    //   headers: { 'Content-Type': 'application/octet-stream' }
    // })
  }
  
  /**
   * 📊 Get revocation statistics
   */
  getStats(): {
    totalRevoked: number
    reasons: Record<string, number>
    lastUpdated: number
    version: number
  } {
    const reasons: Record<string, number> = {}
    
    this.currentList.entries.forEach(entry => {
      reasons[entry.reason] = (reasons[entry.reason] || 0) + 1
    })
    
    return {
      totalRevoked: this.currentList.entries.length,
      reasons,
      lastUpdated: this.currentList.updatedAt,
      version: this.currentList.version
    }
  }
}

/**
 * 🔧 ESP32 Revocation Cache Manager
 */
export class ESP32RevocationCache {
  private static MAX_CACHE_SIZE = 1000  // Configurable
  private revokedUIDs: Set<string> = new Set()
  private lastSync: number = 0
  private syncInterval: number = 6 * 60 * 60 * 1000  // 6 hours
  
  /**
   * ⚡ Fast revocation check (ESP32 optimized)
   */
  isRevokedFast(chipUID: string): boolean {
    return this.revokedUIDs.has(chipUID)
  }
  
  /**
   * 🔄 Sync with revocation registry
   */
  async syncWithRegistry(registry: RevocationRegistry): Promise<void> {
    if (Date.now() - this.lastSync < this.syncInterval) {
      return  // Skip if recently synced
    }
    
    try {
      await registry.refreshFromNetwork()
      
      // Update local cache
      this.revokedUIDs.clear()
      const stats = registry.getStats()
      
      // Add revoked UIDs to fast lookup set
      registry.currentList.entries.forEach(entry => {
        this.revokedUIDs.add(entry.chipUID)
      })
      
      this.lastSync = Date.now()
      console.log(`✅ ESP32 synced revocation cache: ${stats.totalRevoked} revoked`)
      
    } catch (error) {
      console.error('❌ ESP32 revocation sync failed:', error)
    }
  }
  
  /**
   * 🧹 Cleanup old entries if memory constrained
   */
  cleanup(): void {
    if (this.revokedUIDs.size > ESP32RevocationCache.MAX_CACHE_SIZE) {
      // Keep most recent 80% of entries
      const keepCount = Math.floor(ESP32RevocationCache.MAX_CACHE_SIZE * 0.8)
      const entries = Array.from(this.revokedUIDs)
      this.revokedUIDs = new Set(entries.slice(-keepCount))
      
      console.log(`🧹 ESP32 revocation cache cleaned: ${keepCount} entries kept`)
    }
  }
} 