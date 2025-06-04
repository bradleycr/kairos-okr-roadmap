// --- ZK Moment Manager for KairOS ---
// Privacy-preserving moment collection with ZK proof capabilities
// Designed for seamless ESP32 porting

import { sha256 } from '@noble/hashes/sha256'
import { randomBytes } from '@noble/hashes/utils'
import { signMessage } from '../crypto/keys'
import { 
  ZKMoment, 
  ZKMomentProof, 
  ZKSession, 
  MomentInstallation, 
  MomentTapResult,
  EventConfig
} from '../types'
import { CryptoIdentity } from '../crypto/keys'

// --- Session Storage Keys (ESP32: Replace with EEPROM addresses) ---
const SESSION_STORAGE_KEY = 'kairos_zk_session'
const INSTALLATIONS_STORAGE_KEY = 'kairos_installations'

// --- ZK Moment Manager Class ---
export class ZKMomentManager {
  private currentSession: ZKSession | null = null
  private installations: MomentInstallation[] = []
  private eventConfig: EventConfig | null = null

  constructor() {
    this.loadSessionFromStorage()
    this.loadInstallationsFromStorage()
  }

  // --- Session Management ---

  /**
   * Start a new ZK moment collection session
   * @note ESP32: Initialize session in RAM, set RTC alarm for auto-save
   */
  async startSession(userDID: string, eventConfig?: EventConfig): Promise<ZKSession> {
    const sessionId = this.generateSessionId()
    
    this.currentSession = {
      sessionId,
      userDID,
      startTime: Date.now(),
      moments: [],
      totalMoments: 0,
      uniqueInstallations: [],
      proofs: []
    }

    if (eventConfig) {
      this.eventConfig = eventConfig
      this.installations = eventConfig.installations
      this.saveInstallationsToStorage()
    }

    this.saveSessionToStorage()
    return this.currentSession
  }

  /**
   * End the current session
   * @note ESP32: Persist final session data to Flash/EEPROM
   */
  async endSession(): Promise<ZKSession | null> {
    if (!this.currentSession) return null

    this.currentSession.endTime = Date.now()
    this.saveSessionToStorage()
    
    const finalSession = { ...this.currentSession }
    this.currentSession = null
    
    return finalSession
  }

  /**
   * Get current active session
   */
  getCurrentSession(): ZKSession | null {
    return this.currentSession
  }

  // --- Moment Creation & Management ---

  /**
   * Save a moment when user taps an installation
   * @note ESP32: Trigger via NFC tap ISR, use hardware RTC for timestamp
   */
  async saveMoment(
    momentId: string, 
    cryptoIdentity: CryptoIdentity,
    metadata?: { location?: string; eventName?: string; description?: string }
  ): Promise<MomentTapResult> {
    if (!this.currentSession) {
      return {
        success: false,
        error: 'No active session. Start a session first.',
        isNewInstallation: false,
        totalMomentsInSession: 0
      }
    }

    try {
      // Generate moment with privacy-preserving properties
      const moment = await this.createZKMoment(momentId, cryptoIdentity, metadata)
      
      // Add to current session
      this.currentSession.moments.push(moment)
      this.currentSession.totalMoments++
      
      // Track unique installations
      const isNewInstallation = !this.currentSession.uniqueInstallations.includes(momentId)
      if (isNewInstallation) {
        this.currentSession.uniqueInstallations.push(momentId)
      }

      // Update installation tap count
      this.updateInstallationTapCount(momentId)

      // Persist session
      this.saveSessionToStorage()

      return {
        success: true,
        moment,
        isNewInstallation,
        totalMomentsInSession: this.currentSession.totalMoments
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isNewInstallation: false,
        totalMomentsInSession: this.currentSession.totalMoments
      }
    }
  }

  /**
   * Create a ZK moment with privacy-preserving hash and signature
   * @note ESP32: Use hardware RNG for nonce, RTC for timestamp
   */
  private async createZKMoment(
    momentId: string,
    cryptoIdentity: CryptoIdentity,
    metadata?: { location?: string; eventName?: string; description?: string }
  ): Promise<ZKMoment> {
    const timestamp = Date.now()
    const nonce = randomBytes(16) // 128-bit nonce for privacy
    
    // Create deterministic hash: SHA256(momentId + timestamp + nonce)
    const hashInput = new TextEncoder().encode(`${momentId}${timestamp}`)
    const combinedInput = new Uint8Array(hashInput.length + nonce.length)
    combinedInput.set(hashInput)
    combinedInput.set(nonce, hashInput.length)
    
    const hash = sha256(combinedInput)
    
    // Sign the hash with user's private key
    const signature = await signMessage(hash, cryptoIdentity.privateKey)

    return {
      momentId,
      timestamp,
      hash,
      signature,
      nonce,
      metadata
    }
  }

  // --- Installation Management ---

  /**
   * Add or update moment installations
   * @note ESP32: Load from config file or receive via API
   */
  setInstallations(installations: MomentInstallation[]): void {
    this.installations = installations
    this.saveInstallationsToStorage()
  }

  /**
   * Get all available installations
   */
  getInstallations(): MomentInstallation[] {
    return this.installations
  }

  /**
   * Get installation by ID
   */
  getInstallation(id: string): MomentInstallation | undefined {
    return this.installations.find(inst => inst.id === id)
  }

  /**
   * Update tap count for an installation
   */
  private updateInstallationTapCount(momentId: string): void {
    const installation = this.installations.find(inst => inst.id === momentId)
    if (installation) {
      installation.tapCount = (installation.tapCount || 0) + 1
      this.saveInstallationsToStorage()
    }
  }

  // --- Moment Queries & Analytics ---

  /**
   * Get moments by installation category
   */
  getMomentsByCategory(category: string): ZKMoment[] {
    if (!this.currentSession) return []
    
    return this.currentSession.moments.filter(moment => {
      const installation = this.getInstallation(moment.momentId)
      return installation?.category === category
    })
  }

  /**
   * Get moment count by time range
   */
  getMomentCountInTimeRange(startTime: number, endTime: number): number {
    if (!this.currentSession) return 0
    
    return this.currentSession.moments.filter(
      moment => moment.timestamp >= startTime && moment.timestamp <= endTime
    ).length
  }

  /**
   * Get unique installation count
   */
  getUniqueInstallationCount(): number {
    return this.currentSession?.uniqueInstallations.length || 0
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalMoments: number
    uniqueInstallations: number
    sessionDuration: number
    averageMomentsPerHour: number
    categoryBreakdown: Record<string, number>
  } {
    if (!this.currentSession) {
      return {
        totalMoments: 0,
        uniqueInstallations: 0,
        sessionDuration: 0,
        averageMomentsPerHour: 0,
        categoryBreakdown: {}
      }
    }

    const sessionDuration = (this.currentSession.endTime || Date.now()) - this.currentSession.startTime
    const hours = sessionDuration / (1000 * 60 * 60)
    
    // Category breakdown
    const categoryBreakdown: Record<string, number> = {}
    this.currentSession.moments.forEach(moment => {
      const installation = this.getInstallation(moment.momentId)
      if (installation) {
        categoryBreakdown[installation.category] = (categoryBreakdown[installation.category] || 0) + 1
      }
    })

    return {
      totalMoments: this.currentSession.totalMoments,
      uniqueInstallations: this.currentSession.uniqueInstallations.length,
      sessionDuration,
      averageMomentsPerHour: hours > 0 ? this.currentSession.totalMoments / hours : 0,
      categoryBreakdown
    }
  }

  // --- Storage Functions (ESP32: Replace with EEPROM/Flash) ---

  /**
   * Save session to localStorage
   * @note ESP32: Replace with NVS or EEPROM write
   */
  private saveSessionToStorage(): void {
    if (!this.currentSession || typeof window === 'undefined') return
    
    // Convert Uint8Arrays to regular arrays for JSON serialization
    const serializable = {
      ...this.currentSession,
      moments: this.currentSession.moments.map(moment => ({
        ...moment,
        hash: Array.from(moment.hash),
        signature: Array.from(moment.signature),
        nonce: Array.from(moment.nonce)
      }))
    }
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serializable))
  }

  /**
   * Load session from localStorage
   * @note ESP32: Replace with NVS or EEPROM read
   */
  private loadSessionFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return
      
      const parsed = JSON.parse(stored)
      
      // Convert arrays back to Uint8Arrays
      this.currentSession = {
        ...parsed,
        moments: parsed.moments.map((moment: any) => ({
          ...moment,
          hash: new Uint8Array(moment.hash),
          signature: new Uint8Array(moment.signature),
          nonce: new Uint8Array(moment.nonce)
        }))
      }
    } catch (error) {
      console.warn('Failed to load session from storage:', error)
    }
  }

  /**
   * Save installations to localStorage
   * @note ESP32: Replace with program memory or config storage
   */
  private saveInstallationsToStorage(): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(INSTALLATIONS_STORAGE_KEY, JSON.stringify(this.installations))
  }

  /**
   * Load installations from localStorage
   * @note ESP32: Replace with program memory or config read
   */
  private loadInstallationsFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(INSTALLATIONS_STORAGE_KEY)
      if (stored) {
        this.installations = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load installations from storage:', error)
    }
  }

  /**
   * Clear all stored data
   * @note ESP32: Clear EEPROM/NVS sections
   */
  clearAllData(): void {
    this.currentSession = null
    this.installations = []
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem(INSTALLATIONS_STORAGE_KEY)
    }
  }

  // --- Utility Functions ---

  /**
   * Generate a unique session ID
   * @note ESP32: Use hardware MAC address + RTC timestamp
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)
    return `session_${timestamp}_${random}`
  }
}

// --- Export singleton instance ---
export const zkMomentManager = new ZKMomentManager()

// --- React Hook for ZK Moment Management ---
import { useState, useEffect, useCallback } from 'react'

export function useZKMomentManager() {
  const [currentSession, setCurrentSession] = useState<ZKSession | null>(null)
  const [installations, setInstallations] = useState<MomentInstallation[]>([])

  // Sync with manager state
  useEffect(() => {
    const updateState = () => {
      setCurrentSession(zkMomentManager.getCurrentSession())
      setInstallations(zkMomentManager.getInstallations())
    }

    updateState()
    
    // Set up periodic sync (ESP32: use timer interrupt)
    const interval = setInterval(updateState, 1000)
    return () => clearInterval(interval)
  }, [])

  const startSession = useCallback(async (userDID: string, eventConfig?: EventConfig) => {
    const session = await zkMomentManager.startSession(userDID, eventConfig)
    setCurrentSession(session)
    return session
  }, [])

  const endSession = useCallback(async () => {
    const session = await zkMomentManager.endSession()
    setCurrentSession(null)
    return session
  }, [])

  const saveMoment = useCallback(async (
    momentId: string, 
    cryptoIdentity: CryptoIdentity,
    metadata?: { location?: string; eventName?: string; description?: string }
  ) => {
    const result = await zkMomentManager.saveMoment(momentId, cryptoIdentity, metadata)
    if (result.success) {
      setCurrentSession(zkMomentManager.getCurrentSession())
    }
    return result
  }, [])

  return {
    currentSession,
    installations,
    startSession,
    endSession,
    saveMoment,
    getSessionStats: () => zkMomentManager.getSessionStats(),
    getMomentsByCategory: (category: string) => zkMomentManager.getMomentsByCategory(category),
    clearAllData: () => {
      zkMomentManager.clearAllData()
      setCurrentSession(null)
      setInstallations([])
    }
  }
} 