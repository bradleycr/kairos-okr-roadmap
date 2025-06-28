/**
 * ⚡ Rate Limiting & Replay Protection
 * 
 * Protects against:
 * - BroadcastChannel flooding
 * - ESP32 replay attacks
 * - DoS via excessive requests
 */

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  debounceMs: number    // Debounce delay between messages
}

export interface ReplayGuard {
  chipUID: string
  lastNonce: string
  timestamp: number
  challengeCount: number
}

/**
 * 🛡️ Rate Limiter - Per Origin Protection
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private config: RateLimitConfig
  
  constructor(config: RateLimitConfig = {
    windowMs: 60 * 1000,    // 1 minute window
    maxRequests: 100,       // 100 requests per minute
    debounceMs: 1000        // 1 second between messages
  }) {
    this.config = config
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }
  
  /**
   * ✅ Check if request is allowed
   */
  isAllowed(origin: string): boolean {
    const now = Date.now()
    const key = this.getOriginKey(origin)
    
    // Get or create request history
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const requests = this.requests.get(key)!
    
    // Remove old requests outside window
    const cutoff = now - this.config.windowMs
    const recentRequests = requests.filter(timestamp => timestamp > cutoff)
    
    // Check rate limit
    if (recentRequests.length >= this.config.maxRequests) {
      console.warn(`🚫 Rate limit exceeded for origin: ${origin}`)
      return false
    }
    
    // Check debounce (minimum time between requests)
    const lastRequest = recentRequests[recentRequests.length - 1]
    if (lastRequest && (now - lastRequest) < this.config.debounceMs) {
      console.warn(`⏱️ Debounce violation for origin: ${origin}`)
      return false
    }
    
    // Record this request
    recentRequests.push(now)
    this.requests.set(key, recentRequests)
    
    return true
  }
  
  /**
   * 📊 Get rate limit status
   */
  getStatus(origin: string): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const key = this.getOriginKey(origin)
    const requests = this.requests.get(key) || []
    const now = Date.now()
    const cutoff = now - this.config.windowMs
    const recentRequests = requests.filter(timestamp => timestamp > cutoff)
    
    return {
      allowed: recentRequests.length < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - recentRequests.length),
      resetTime: now + this.config.windowMs
    }
  }
  
  /**
   * 🧹 Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.config.windowMs
    
    for (const [key, requests] of this.requests.entries()) {
      const recent = requests.filter(timestamp => timestamp > cutoff)
      if (recent.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, recent)
      }
    }
  }
  
  /**
   * 🔑 Generate origin key
   */
  private getOriginKey(origin: string): string {
    // Use origin or IP address as key
    return origin || 'unknown'
  }
}

/**
 * 🔄 Replay Attack Protection
 */
export class ReplayProtection {
  private nonces: Map<string, ReplayGuard> = new Map()
  private maxAge: number = 60 * 1000  // 60 seconds max nonce age
  
  constructor(maxAge?: number) {
    this.maxAge = maxAge || 60 * 1000
    
    // Cleanup expired nonces every 30 seconds
    setInterval(() => this.cleanupExpired(), 30 * 1000)
  }
  
  /**
   * ✅ Validate nonce (prevents replay)
   */
  validateNonce(chipUID: string, nonce: string, challenge: string): boolean {
    const guard = this.nonces.get(chipUID)
    const now = Date.now()
    
    // Check if nonce is too old
    if (this.isNonceExpired(nonce)) {
      console.warn(`⏰ Expired nonce for ${chipUID}: ${nonce}`)
      return false
    }
    
    // Check for replay (same nonce used twice)
    if (guard && guard.lastNonce === nonce) {
      console.warn(`🔄 Replay attack detected for ${chipUID}: ${nonce}`)
      return false
    }
    
    // Check challenge freshness (must be recent)
    const challengeTimestamp = this.extractTimestampFromChallenge(challenge)
    if (challengeTimestamp && (now - challengeTimestamp) > this.maxAge) {
      console.warn(`⏰ Stale challenge for ${chipUID}: ${challenge}`)
      return false
    }
    
    // Update guard
    this.nonces.set(chipUID, {
      chipUID,
      lastNonce: nonce,
      timestamp: now,
      challengeCount: (guard?.challengeCount || 0) + 1
    })
    
    return true
  }
  
  /**
   * 🎲 Generate secure nonce
   */
  generateNonce(): string {
    const timestamp = Date.now()
    const random = Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    
    return `${timestamp}-${random}`
  }
  
  /**
   * 🎯 Generate time-bound challenge
   */
  generateChallenge(chipUID: string): string {
    const timestamp = Date.now()
    const random = this.generateNonce()
    return `KairOS-Auth-${chipUID}-${timestamp}-${random}`
  }
  
  /**
   * ⏰ Check if nonce is expired
   */
  private isNonceExpired(nonce: string): boolean {
    const timestamp = this.extractTimestampFromNonce(nonce)
    if (!timestamp) return true
    
    return (Date.now() - timestamp) > this.maxAge
  }
  
  /**
   * 📅 Extract timestamp from nonce
   */
  private extractTimestampFromNonce(nonce: string): number | null {
    const parts = nonce.split('-')
    if (parts.length >= 1) {
      const timestamp = parseInt(parts[0])
      return isNaN(timestamp) ? null : timestamp
    }
    return null
  }
  
  /**
   * 📅 Extract timestamp from challenge
   */
  private extractTimestampFromChallenge(challenge: string): number | null {
    // Extract from "KairOS-Auth-{chipUID}-{timestamp}-{random}"
    const parts = challenge.split('-')
    if (parts.length >= 4) {
      const timestamp = parseInt(parts[3])
      return isNaN(timestamp) ? null : timestamp
    }
    return null
  }
  
  /**
   * 🧹 Cleanup expired nonces
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const expired: string[] = []
    
    for (const [chipUID, guard] of this.nonces.entries()) {
      if ((now - guard.timestamp) > this.maxAge) {
        expired.push(chipUID)
      }
    }
    
    expired.forEach(chipUID => this.nonces.delete(chipUID))
    
    if (expired.length > 0) {
      console.log(`🧹 Cleaned ${expired.length} expired nonces`)
    }
  }
  
  /**
   * 📊 Get protection statistics
   */
  getStats(): {
    activeNonces: number
    oldestNonce: number | null
    averageChallenges: number
  } {
    const guards = Array.from(this.nonces.values())
    const now = Date.now()
    
    return {
      activeNonces: guards.length,
      oldestNonce: guards.length > 0 ? 
        Math.min(...guards.map(g => now - g.timestamp)) : null,
      averageChallenges: guards.length > 0 ?
        guards.reduce((sum, g) => sum + g.challengeCount, 0) / guards.length : 0
    }
  }
}

/**
 * 📡 BroadcastChannel Rate Limiter
 */
export class BroadcastChannelProtection {
  private rateLimiter: RateLimiter
  private messageHashes: Set<string> = new Set()
  
  constructor() {
    this.rateLimiter = new RateLimiter({
      windowMs: 60 * 1000,   // 1 minute
      maxRequests: 50,       // 50 messages per minute per origin
      debounceMs: 1000       // 1 second between messages
    })
    
    // Cleanup message hashes every 5 minutes
    setInterval(() => this.cleanupMessageHashes(), 5 * 60 * 1000)
  }
  
  /**
   * ✅ Check if message should be processed
   */
  shouldProcessMessage(message: any, origin: string = window.location.origin): boolean {
    // Rate limit check
    if (!this.rateLimiter.isAllowed(origin)) {
      return false
    }
    
    // Duplicate message check
    const messageHash = this.hashMessage(message)
    if (this.messageHashes.has(messageHash)) {
      console.warn(`🔄 Duplicate message detected: ${messageHash.slice(0, 8)}...`)
      return false
    }
    
    // Record message hash
    this.messageHashes.add(messageHash)
    
    return true
  }
  
  /**
   * 🔗 Generate message hash
   */
  private hashMessage(message: any): string {
    const messageStr = JSON.stringify(message, Object.keys(message).sort())
    let hash = 0
    
    for (let i = 0; i < messageStr.length; i++) {
      const char = messageStr.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash  // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16)
  }
  
  /**
   * 🧹 Cleanup old message hashes
   */
  private cleanupMessageHashes(): void {
    // Clear all hashes every 5 minutes (simple approach)
    this.messageHashes.clear()
    console.log('🧹 Cleared message hash cache')
  }
}

/**
 * 🔧 ESP32 Authentication Guard
 */
export class ESP32AuthGuard {
  private replayProtection: ReplayProtection
  private rateLimiter: RateLimiter
  
  constructor() {
    this.replayProtection = new ReplayProtection(60 * 1000)  // 60 second nonce lifetime
    this.rateLimiter = new RateLimiter({
      windowMs: 5 * 60 * 1000,  // 5 minute window
      maxRequests: 20,          // 20 auth attempts per 5 minutes
      debounceMs: 2000          // 2 seconds between attempts
    })
  }
  
  /**
   * 🔐 Validate authentication request
   */
  validateAuthRequest(
    chipUID: string, 
    challenge: string, 
    nonce: string,
    clientIP: string
  ): boolean {
    // Rate limit check
    if (!this.rateLimiter.isAllowed(clientIP)) {
      console.warn(`🚫 Rate limit exceeded for IP: ${clientIP}`)
      return false
    }
    
    // Replay protection
    if (!this.replayProtection.validateNonce(chipUID, nonce, challenge)) {
      console.warn(`🔄 Replay protection failed for ${chipUID}`)
      return false
    }
    
    return true
  }
  
  /**
   * 🎯 Generate secure challenge for ESP32
   */
  generateSecureChallenge(chipUID: string): {
    challenge: string
    nonce: string
    expiresAt: number
  } {
    const challenge = this.replayProtection.generateChallenge(chipUID)
    const nonce = this.replayProtection.generateNonce()
    const expiresAt = Date.now() + 60 * 1000  // 60 seconds
    
    return { challenge, nonce, expiresAt }
  }
  
  /**
   * 📊 Get security statistics
   */
  getSecurityStats(): {
    rateLimitStats: any
    replayStats: any
  } {
    return {
      rateLimitStats: {
        // Add rate limiter stats if needed
      },
      replayStats: this.replayProtection.getStats()
    }
  }
}

// Export singleton instances for global use
export const globalRateLimiter = new RateLimiter()
export const globalReplayProtection = new ReplayProtection()
export const globalBroadcastProtection = new BroadcastChannelProtection()
export const globalESP32Guard = new ESP32AuthGuard() 