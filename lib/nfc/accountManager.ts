/**
 * 🔐 Privacy-First NFC Account Manager
 * 
 * PRIVACY MODEL:
 * ✅ Sensitive data stays on-device (private keys, personal details)
 * ✅ Database stores only minimal recognition data (chipUID -> accountID mapping)
 * ✅ Deterministic generation ensures same chip = same account
 * ✅ Cross-device recognition without compromising privacy
 * ✅ Rich profiles stored locally per device
 */

import { createDIDKey } from '@/lib/crypto'

// --- Types ---
export interface BaseAccount {
  accountId: string      // Deterministic ID derived from chipUID
  chipUID: string        // NFC chip identifier  
  publicKey: string      // Ed25519 public key (safe to share)
  did: string           // Decentralized identifier
  createdAt: string     // ISO timestamp
  lastSeen: string      // ISO timestamp
}

export interface LocalAccountProfile extends BaseAccount {
  // Rich local data (never sent to database)
  displayName: string
  username: string
  bio: string
  deviceName: string
  privateKey: string    // NEVER send to database
  encryptedSeed?: string
  // PIN status (local knowledge only)
  hasPIN: boolean
  pinSetupPrompted: boolean
  // Setup status for ritual flow optimization
  setupCompleted: boolean
  ritualFlowCompleted: boolean
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
  }
  stats: {
    totalSessions: number
    totalMoments: number
    firstSession: string
    favoriteLocations: string[]
  }
  moments: LocalMoment[]
}

export interface LocalMoment {
  id: string
  timestamp: string
  type: 'nfc_authentication' | 'ritual_completion' | 'memory_created'
  location?: string
  deviceInfo?: string
  data?: any
}

// Database record (minimal data only)
export interface DatabaseAccountRecord {
  accountId: string
  chipUID: string
  publicKey: string
  did: string
  createdAt: string
  lastSeen: string
  verificationCount: number
  // PIN protection for cross-device access
  encryptedPIN?: string // AES-encrypted PIN for device verification
  pinSalt?: string      // Salt used for PIN encryption
  hasPIN: boolean       // Quick check if PIN is set up
  // 🆕 Basic profile info (safe for cross-device sync)
  displayName?: string  // User's chosen display name
  username?: string     // User's chosen username
  bio?: string         // User's bio/description
  deviceName?: string  // Primary device name
  // Setup completion status
  setupCompleted?: boolean      // Has the user completed initial setup
  ritualFlowCompleted?: boolean // Has the user completed the ritual flow
}

// --- Constants ---
const ACCOUNT_STORAGE_PREFIX = 'kairos:account:'
const PROFILE_STORAGE_PREFIX = 'kairos:profile:'
const CURRENT_ACCOUNT_KEY = 'kairos:current-account'
const SESSION_STORAGE_PREFIX = 'kairos:session:'
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

// Deduplication cache to prevent multiple simultaneous account operations
const OPERATION_CACHE = new Map<string, Promise<any>>()
const CACHE_TIMEOUT = 5000 // 5 seconds

// --- Session Management ---
interface DeviceSession {
  chipUID: string
  deviceFingerprint: string
  lastAuthenticated: string
  pinEntered: boolean
  autoLoginUntil: string
}

// --- Core Account Manager ---
export class NFCAccountManager {
  
  /**
   * 🎯 Main Authentication Flow
   * Handles both new and returning accounts with cross-device recognition
   */
  static async authenticateOrCreateAccount(chipUID: string): Promise<{
    account: LocalAccountProfile
    isNewAccount: boolean
    isNewDevice: boolean
  }> {
    console.log(`🔐 Authenticating chipUID: ${chipUID}`)
    
    // Check for ongoing operation for this chipUID
    const cacheKey = `auth:${chipUID}`
    if (OPERATION_CACHE.has(cacheKey)) {
      console.log(`⏳ Authentication already in progress for ${chipUID}, waiting...`)
      return await OPERATION_CACHE.get(cacheKey)!
    }
    
    // Create the authentication promise and cache it
    const authPromise = this.performAuthentication(chipUID)
    OPERATION_CACHE.set(cacheKey, authPromise)
    
    // Clean up the cache after completion or timeout
    setTimeout(() => {
      OPERATION_CACHE.delete(cacheKey)
    }, CACHE_TIMEOUT)
    
    try {
      const result = await authPromise
      OPERATION_CACHE.delete(cacheKey) // Clean up immediately on success
      return result
    } catch (error) {
      OPERATION_CACHE.delete(cacheKey) // Clean up immediately on error
      throw error
    }
  }
  
  /**
   * 🔐 Perform the actual authentication logic
   */
  private static async performAuthentication(chipUID: string): Promise<{
    account: LocalAccountProfile
    isNewAccount: boolean
    isNewDevice: boolean
  }> {
    // Step 1: Generate deterministic account data
    const deterministicData = await this.generateDeterministicAccountData(chipUID)
    
    // Step 2: Check if account exists in database
    const existingAccount = await this.checkAccountInDatabase(chipUID)
    
    // Step 3: Check for local profile on this device
    const localProfile = this.getLocalProfile(chipUID)
    
    // Step 4: Determine the situation and respond accordingly
    if (localProfile) {
      // Account exists locally - check if database needs creation or update
      console.log('✅ Returning user on familiar device')
      const updatedProfile = await this.updateLocalProfile(localProfile, deterministicData)
      
      if (existingAccount) {
        // Database account exists, just update it (this is NOT a new authentication)
        await this.updateAccountInDatabase(chipUID, deterministicData, false)
      } else {
        // Local exists but database doesn't, create database entry (first sync to database)
        console.log('💾 Creating database entry for existing local account')
        await this.saveAccountToDatabase(chipUID, deterministicData, updatedProfile)
      }
      
      return {
        account: updatedProfile,
        isNewAccount: false,
        isNewDevice: false
      }
    } else if (existingAccount) {
      // Account exists in database but not locally - new device (this IS a new authentication)
      console.log('👋 Returning user on new device')
      const newProfile = await this.createLocalProfileFromExisting(chipUID, deterministicData, existingAccount)
      await this.updateAccountInDatabase(chipUID, deterministicData, true)
      
      return {
        account: newProfile,
        isNewAccount: false,
        isNewDevice: true
      }
    } else {
      // Completely new account (this IS a new authentication)
      console.log('🆕 New user - creating fresh account')
      const newProfile = await this.createNewAccount(chipUID, deterministicData)
      await this.saveAccountToDatabase(chipUID, deterministicData, newProfile)
      
      return {
        account: newProfile,
        isNewAccount: true,
        isNewDevice: true
      }
    }
  }
  
  /**
   * 🔐 PIN Security Functions
   */
  private static async encryptPIN(pin: string): Promise<{ encryptedPIN: string; salt: string }> {
    const encoder = new TextEncoder()
    const pinData = encoder.encode(pin)
    
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Generate key from salt
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('kairos-pin-protection'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt PIN
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      pinData
    )
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    const encryptedHex = Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('')
    
    return {
      encryptedPIN: encryptedHex,
      salt: saltHex
    }
  }

  private static async verifyPIN(pin: string, encryptedPIN: string, salt: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder()
      const pinData = encoder.encode(pin)
      
      // Convert hex back to bytes
      const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
      const encryptedBytes = new Uint8Array(encryptedPIN.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
      
      // Extract IV and encrypted data
      const iv = encryptedBytes.slice(0, 12)
      const encrypted = encryptedBytes.slice(12)
      
      // Generate key from salt
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('kairos-pin-protection'),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      )
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )
      
      // Decrypt and verify
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      )
      
      const decryptedPin = new TextDecoder().decode(decrypted)
      return decryptedPin === pin
    } catch (error) {
      console.warn('PIN verification failed:', error)
      return false
    }
  }

  /**
   * 🔢 Generate Account Data (DEPRECATED - Use DID:Key System)
   * This method is kept for legacy compatibility but should not be used for new accounts
   * New accounts should use the DID:Key system with chipUID + PIN
   */
  private static async generateDeterministicAccountData(chipUID: string): Promise<{
    accountId: string
    did: string
    keyPair: { privateKey: Uint8Array; publicKey: Uint8Array }
    publicKey: string
    privateKey: string
  }> {
    console.warn('⚠️ DEPRECATED: generateDeterministicAccountData should not be used for new accounts. Use DID:Key system instead.')
    
    try {
      // Import crypto functions
      const { createDIDKey } = await import('@/lib/crypto')
      const { sha512 } = await import('@noble/hashes/sha512')
      const { hkdf } = await import('@noble/hashes/hkdf')
      const { sha256 } = await import('@noble/hashes/sha256')
      
      // Generate DETERMINISTIC Ed25519 keypair from chipUID
      // This ensures the same chip always produces the same keys on any device
      const seedMaterial = `KairOS-NFC-v1:${chipUID}:ed25519-keypair`
      const seedBytes = new TextEncoder().encode(seedMaterial)
      
      // Use HKDF to derive a proper 32-byte seed from chipUID
      const salt = new TextEncoder().encode('KairOS-Ed25519-Salt-v1')
      const info = new TextEncoder().encode(`chipUID:${chipUID}`)
      const derivedSeed = hkdf(sha256, seedBytes, salt, info, 32)
      
             // Generate Ed25519 keypair from deterministic seed
       const ed = await import('@noble/ed25519')
      
      // Clamp the seed to valid Ed25519 private key format
      const privateKey = new Uint8Array(32)
      privateKey.set(derivedSeed)
      
      // Ensure private key is valid for Ed25519 (clamping)
      privateKey[0] &= 248  // Clear bottom 3 bits
      privateKey[31] &= 127 // Clear top bit
      privateKey[31] |= 64  // Set second-to-top bit
      
      // Derive public key from private key
      const publicKey = await ed.getPublicKeyAsync(privateKey)
      
      // Convert keys to hex strings for storage
      const privateKeyHex = Array.from(privateKey)
        .map(b => b.toString(16).padStart(2, '0')).join('')
      const publicKeyHex = Array.from(publicKey)
        .map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Generate account ID from chipUID (consistent per chip)
      const encoder = new TextEncoder()
      const accountData = `kairos-nfc-v1:${chipUID}`
      const accountHash = await crypto.subtle.digest('SHA-256', encoder.encode(accountData))
      const accountId = `kairos_${Array.from(new Uint8Array(accountHash))
        .slice(0, 8)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`
      
      // Create proper DID using your existing system
      const did = createDIDKey(publicKey)
      
      console.log(`🔑 Generated DETERMINISTIC Ed25519 keypair for chipUID: ${chipUID}`)
      console.log(`   AccountID: ${accountId}`)
      console.log(`   PublicKey: ${publicKeyHex.slice(0, 16)}...`)
      console.log(`   DID: ${did}`)
      
      return {
        accountId,
        did,
        keyPair: { privateKey, publicKey },
        publicKey: publicKeyHex,
        privateKey: privateKeyHex
      }
    } catch (error) {
      console.warn('Deterministic Ed25519 crypto failed, using fallback:', error)
      
      // Fallback: Use chipUID hash as seed (less secure but deterministic)
      const encoder = new TextEncoder()
      const chipData = encoder.encode(`kairos-fallback:${chipUID}`)
      const hashBuffer = await crypto.subtle.digest('SHA-256', chipData)
      const hashArray = new Uint8Array(hashBuffer)
      
      // Create deterministic keys from hash
      const privateKey = new Uint8Array(32)
      privateKey.set(hashArray.slice(0, 32))
      
      // Simple deterministic public key derivation
      const publicKey = new Uint8Array(32)
      const publicKeyHash = await crypto.subtle.digest('SHA-256', privateKey)
      publicKey.set(new Uint8Array(publicKeyHash).slice(0, 32))
      
      const accountId = `kairos_${Array.from(hashArray.slice(0, 8))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`
      
      return {
        accountId,
        did: `did:kairos:${accountId.replace('kairos_', '')}`,
        keyPair: { privateKey, publicKey },
        publicKey: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        privateKey: Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('')
      }
    }
  }
  
  /**
   * 🔍 Check Account in Database
   * Minimal lookup to see if account exists elsewhere
   */
  private static async checkAccountInDatabase(chipUID: string): Promise<DatabaseAccountRecord | null> {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'GET',
        headers: { 'X-Chip-UID': chipUID }
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.account || null
      }
      
      return null
    } catch (error) {
      console.warn('Database lookup failed, continuing with local-only:', error)
      return null
    }
  }
  
  /**
   * 💾 Save Account to Database
   * Store minimal recognition data + basic profile info
   */
  private static async saveAccountToDatabase(chipUID: string, accountData: any, profileData?: LocalAccountProfile): Promise<void> {
    try {
      const record: DatabaseAccountRecord = {
        accountId: accountData.accountId,
        chipUID,
        publicKey: accountData.publicKey,
        did: accountData.did,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        verificationCount: 1,
        hasPIN: false,
        encryptedPIN: undefined,
        pinSalt: undefined,
        // 🆕 Include basic profile info for cross-device sync
        displayName: profileData?.displayName,
        username: profileData?.username,
        bio: profileData?.bio,
        deviceName: profileData?.deviceName
      }
      
      await fetch('/api/nfc/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      })
      
      console.log('✅ Account saved to database for cross-device recognition')
    } catch (error) {
      console.warn('Failed to save to database, continuing local-only:', error)
    }
  }
  
  /**
   * 🔄 Update Account in Database
   */
  private static async updateAccountInDatabase(chipUID: string, accountData: any, isAuthenticationEvent: boolean = true): Promise<void> {
    try {
      await fetch('/api/nfc/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': chipUID 
        },
        body: JSON.stringify({
          lastSeen: new Date().toISOString(),
          isAuthenticationEvent: isAuthenticationEvent
        })
      })
    } catch (error) {
      console.warn('Failed to update database record:', error)
    }
  }
  
  /**
   * 📱 Local Profile Management
   */
  private static getLocalProfile(chipUID: string): LocalAccountProfile | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${chipUID}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to load local profile:', error)
      return null
    }
  }
  
  private static saveLocalProfile(profile: LocalAccountProfile): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${profile.chipUID}`, JSON.stringify(profile))
      localStorage.setItem(CURRENT_ACCOUNT_KEY, profile.chipUID)
    } catch (error) {
      console.warn('Failed to save local profile:', error)
    }
  }
  
  /**
   * 🆕 Create New Account (First Time)
   */
  private static async createNewAccount(chipUID: string, accountData: any): Promise<LocalAccountProfile> {
    const profile: LocalAccountProfile = {
      // Base account data
      accountId: accountData.accountId,
      chipUID,
      publicKey: accountData.publicKey,
      did: accountData.did,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      
      // Rich local data
      displayName: `Memory Keeper ${chipUID.slice(-4).toUpperCase()}`,
      username: `keeper_${chipUID.slice(-4).toLowerCase()}`,
      bio: "Weaving threads of collective memory through digital and physical spaces.",
      deviceName: this.detectDeviceName(),
      privateKey: accountData.privateKey,
      
      // PIN status
      hasPIN: false,
      pinSetupPrompted: false,
      
      // Setup status
      setupCompleted: false,
      ritualFlowCompleted: false,
      
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true
      },
      
      stats: {
        totalSessions: 1,
        totalMoments: 0,
        firstSession: new Date().toISOString(),
        favoriteLocations: []
      },
      
      moments: [{
        id: `moment_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'nfc_authentication',
        deviceInfo: navigator.userAgent.substring(0, 100)
      }]
    }
    
    this.saveLocalProfile(profile)
    return profile
  }
  
  /**
   * 👋 Create Local Profile from Existing Account (New Device)
   */
  private static async createLocalProfileFromExisting(
    chipUID: string, 
    accountData: any, 
    existingAccount: DatabaseAccountRecord
  ): Promise<LocalAccountProfile> {
    const profile: LocalAccountProfile = {
      // Base account data (from database)
      accountId: existingAccount.accountId,
      chipUID,
      publicKey: accountData.publicKey,
      did: accountData.did,
      createdAt: existingAccount.createdAt,
      lastSeen: new Date().toISOString(),
      
      // Fresh local data for new device
      displayName: existingAccount.displayName || `Memory Keeper ${chipUID.slice(-4).toUpperCase()}`,
      username: existingAccount.username || `keeper_${chipUID.slice(-4).toLowerCase()}`,
      bio: existingAccount.bio || "Continuing the memory journey on a new device.",
      deviceName: existingAccount.deviceName || this.detectDeviceName(),
      privateKey: accountData.privateKey,
      
      // PIN status (inherit from database)
      hasPIN: existingAccount.hasPIN,
      pinSetupPrompted: existingAccount.hasPIN, // If PIN exists, user has been prompted
      
      // Setup status (inherit from database, default to completed for returning users)
      setupCompleted: existingAccount.setupCompleted ?? true,
      ritualFlowCompleted: existingAccount.ritualFlowCompleted ?? true,
      
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true
      },
      
      stats: {
        totalSessions: 1, // Fresh start on this device
        totalMoments: 0,
        firstSession: new Date().toISOString(),
        favoriteLocations: []
      },
      
      moments: [{
        id: `moment_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'nfc_authentication',
        deviceInfo: navigator.userAgent.substring(0, 100)
      }]
    }
    
    this.saveLocalProfile(profile)
    return profile
  }
  
  /**
   * 🔄 Update Existing Local Profile
   */
  private static async updateLocalProfile(
    existing: LocalAccountProfile, 
    accountData: any
  ): Promise<LocalAccountProfile> {
    const updated: LocalAccountProfile = {
      ...existing,
      lastSeen: new Date().toISOString(),
      stats: {
        ...existing.stats,
        totalSessions: existing.stats.totalSessions + 1
      },
      moments: [
        {
          id: `moment_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'nfc_authentication',
          deviceInfo: navigator.userAgent.substring(0, 100)
        },
        ...existing.moments.slice(0, 49) // Keep last 50 moments
      ]
    }
    
    this.saveLocalProfile(updated)
    return updated
  }
  
  /**
   * 🔧 Utility Functions
   */
  private static detectDeviceName(): string {
    if (typeof window === 'undefined') return 'Unknown Device'
    
    const ua = navigator.userAgent
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('iPad')) return 'iPad'
    if (ua.includes('Android')) return 'Android Device'
    if (ua.includes('Mac')) return 'Mac'
    if (ua.includes('Windows')) return 'Windows PC'
    if (ua.includes('Linux')) return 'Linux Device'
    
    return 'Web Browser'
  }
  
  /**
   * 📊 Get Current Account
   */
  static getCurrentAccount(): LocalAccountProfile | null {
    if (typeof window === 'undefined') return null
    
    try {
      const currentChipUID = localStorage.getItem(CURRENT_ACCOUNT_KEY)
      if (!currentChipUID) return null
      
      return this.getLocalProfile(currentChipUID)
    } catch (error) {
      console.warn('Failed to get current account:', error)
      return null
    }
  }
  
  /**
   * 🔐 Public PIN Methods
   */
  static async setupPIN(chipUID: string, pin: string): Promise<boolean> {
    try {
      // Encrypt the PIN
      const { encryptedPIN, salt } = await this.encryptPIN(pin)
      
      // Update database record
      const response = await fetch('/api/nfc/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': chipUID 
        },
        body: JSON.stringify({
          encryptedPIN,
          pinSalt: salt,
          hasPIN: true
        })
      })
      
      if (response.ok) {
        // Update local profile
        const profile = this.getLocalProfile(chipUID)
        if (profile) {
          profile.hasPIN = true
          profile.pinSetupPrompted = true
          this.saveLocalProfile(profile)
        }
        
        console.log('✅ PIN set up successfully')
        return true
      }
      
      return false
    } catch (error) {
      console.warn('Failed to setup PIN:', error)
      return false
    }
  }

  /**
   * 🆕 Update Basic Profile Info (with database sync)
   * Updates displayName, username, bio, deviceName - syncs across devices
   */
  static async updateBasicProfileInfo(chipUID: string, updates: {
    displayName?: string
    username?: string
    bio?: string
    deviceName?: string
  }): Promise<boolean> {
    try {
      console.log(`🔄 Updating profile info for chipUID: ${chipUID}`)
      
      // Validate inputs (basic sanitization)
      const sanitizedUpdates = {
        displayName: updates.displayName?.trim().substring(0, 50),
        username: updates.username?.trim().toLowerCase().substring(0, 30),
        bio: updates.bio?.trim().substring(0, 200),
        deviceName: updates.deviceName?.trim().substring(0, 50)
      }
      
      // Remove undefined values
      Object.keys(sanitizedUpdates).forEach(key => {
        if (sanitizedUpdates[key as keyof typeof sanitizedUpdates] === undefined) {
          delete sanitizedUpdates[key as keyof typeof sanitizedUpdates]
        }
      })
      
      // Update database too (best effort - failures won't break local updates)
      try {
        await fetch('/api/nfc/accounts', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Chip-UID': chipUID 
          },
          body: JSON.stringify({
            ...sanitizedUpdates,
            isAuthenticationEvent: false // This is a profile update, not an authentication
          })
        })
        console.log('✅ Profile info synced to database')
      } catch (error) {
        console.warn('Failed to sync profile to database (continuing with local-only):', error)
      }
      
      // Update local profile
      const profile = this.getLocalProfile(chipUID)
      if (profile) {
        Object.assign(profile, sanitizedUpdates)
        profile.lastSeen = new Date().toISOString()
        this.saveLocalProfile(profile)
      }
      
      return true
    } catch (error) {
      console.warn('Failed to update profile info:', error)
      return false
    }
  }

  /**
   * 🔄 Sync Profile from Database
   * Pulls latest basic profile info from database (useful for new devices)
   */
  static async syncProfileFromDatabase(chipUID: string): Promise<boolean> {
    try {
      const dbAccount = await this.checkAccountInDatabase(chipUID)
      if (!dbAccount) {
        console.log('No database account found to sync from')
        return false
      }
      
      const localProfile = this.getLocalProfile(chipUID)
      if (localProfile) {
        // Update local profile with database info (but keep local-only data)
        if (dbAccount.displayName) localProfile.displayName = dbAccount.displayName
        if (dbAccount.username) localProfile.username = dbAccount.username
        if (dbAccount.bio) localProfile.bio = dbAccount.bio
        if (dbAccount.deviceName) localProfile.deviceName = dbAccount.deviceName
        
        localProfile.hasPIN = dbAccount.hasPIN
        localProfile.setupCompleted = dbAccount.setupCompleted ?? localProfile.setupCompleted
        localProfile.ritualFlowCompleted = dbAccount.ritualFlowCompleted ?? localProfile.ritualFlowCompleted
        localProfile.lastSeen = new Date().toISOString()
        
        this.saveLocalProfile(localProfile)
        console.log('✅ Profile synced from database')
        return true
      }
      
      return false
    } catch (error) {
      console.warn('Failed to sync profile from database:', error)
      return false
    }
  }

  /**
   * 🎭 Mark Ritual Flow as Completed
   * Updates both local and database records
   */
  static async markRitualFlowCompleted(chipUID: string): Promise<boolean> {
    try {
      console.log(`🎭 Marking ritual flow completed for chipUID: ${chipUID}`)
      
      // Update local profile
      const profile = this.getLocalProfile(chipUID)
      if (profile) {
        profile.ritualFlowCompleted = true
        profile.setupCompleted = true
        profile.lastSeen = new Date().toISOString()
        this.saveLocalProfile(profile)
      }
      
      // Update database too (best effort)
      try {
        await fetch('/api/nfc/accounts', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Chip-UID': chipUID 
          },
          body: JSON.stringify({
            ritualFlowCompleted: true,
            setupCompleted: true,
            isAuthenticationEvent: false
          })
        })
        console.log('✅ Ritual flow completion synced to database')
      } catch (error) {
        console.warn('Failed to sync ritual completion to database (continuing with local-only):', error)
      }
      
      return true
    } catch (error) {
      console.warn('Failed to mark ritual flow completed:', error)
      return false
    }
  }

  /**
   * 🔍 Check if user should see ritual flow
   * Returns true if user is new and hasn't completed the ritual
   */
  static shouldShowRitualFlow(chipUID: string): boolean {
    const profile = this.getLocalProfile(chipUID)
    return !profile?.ritualFlowCompleted
  }

  static async verifyAccountPIN(chipUID: string, pin: string): Promise<boolean> {
    try {
      // Get account from database
      const dbAccount = await this.checkAccountInDatabase(chipUID)
      if (!dbAccount || !dbAccount.hasPIN) {
        return false
      }
      
      // Verify PIN
      return await this.verifyPIN(pin, dbAccount.encryptedPIN!, dbAccount.pinSalt!)
    } catch (error) {
      console.warn('PIN verification failed:', error)
      return false
    }
  }

  static async authenticateWithPIN(chipUID: string, pin: string): Promise<{
    account: LocalAccountProfile
    isValidPIN: boolean
  } | null> {
    try {
      // First verify the PIN
      const isValidPIN = await this.verifyAccountPIN(chipUID, pin)
      
      if (isValidPIN) {
        // Get or create account
        const result = await this.authenticateOrCreateAccount(chipUID)
        return {
          account: result.account,
          isValidPIN: true
        }
      }
      
      return null
    } catch (error) {
      console.warn('Authentication with PIN failed:', error)
      return null
    }
  }

  /**
   * 🧹 Clear Local Data (for testing/reset)
   */
  static clearLocalData(chipUID?: string): void {
    if (typeof window === 'undefined') return
    
    if (chipUID) {
      localStorage.removeItem(`${PROFILE_STORAGE_PREFIX}${chipUID}`)
      localStorage.removeItem(`${ACCOUNT_STORAGE_PREFIX}${chipUID}`)
    } else {
      // Clear all Kairos data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('kairos:')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  /**
   * 🔐 PIN-Gated Authentication with Legacy Support
   */
  static async authenticateWithPINGate(chipUID: string): Promise<{
    account?: LocalAccountProfile
    requiresPIN: boolean
    isNewAccount: boolean
    isNewDevice: boolean
    hasPIN: boolean
    reason?: string
  }> {
    console.log(`🔐 PIN-Gated authentication for chipUID: ${chipUID}`)
    
    // Step 1: Check if account exists (database or local)
    const [existingAccount, localProfile] = await Promise.all([
      this.checkAccountInDatabase(chipUID),
      Promise.resolve(this.getLocalProfile(chipUID))
    ])
    
    const isNewAccount = !existingAccount && !localProfile
    const isNewDevice = !!existingAccount && !localProfile
    const hasPIN = existingAccount?.hasPIN || localProfile?.hasPIN || false
    
    // Step 2: Handle completely new accounts (no PIN required)
    if (isNewAccount) {
      const result = await this.authenticateOrCreateAccount(chipUID)
      return {
        account: result.account,
        requiresPIN: false,
        isNewAccount: true,
        isNewDevice: true,
        hasPIN: false,
        reason: 'new_account'
      }
    }

    // 🔧 LEGACY SUPPORT: Check if this is a legacy account
    const isLegacyAccount = this.isLegacyAccount(existingAccount, localProfile)
    
    if (isLegacyAccount) {
      console.log('⚠️ Legacy account detected - allowing access without PIN')
      const result = await this.authenticateOrCreateAccount(chipUID)
      return {
        account: result.account,
        requiresPIN: false,
        isNewAccount: false,
        isNewDevice: isNewDevice,
        hasPIN: false,
        reason: 'legacy_account'
      }
    }
    
    // Step 3: Check if PIN is required
    if (hasPIN) {
      const session = this.getDeviceSession(chipUID)
      const now = new Date()
      
      // Check if user has a valid session on this device
      if (session && session.pinEntered && new Date(session.autoLoginUntil) > now) {
        console.log('✅ Valid session found, auto-login enabled')
        // Update session and return account
        const result = await this.authenticateOrCreateAccount(chipUID)
        this.updateDeviceSession(chipUID, true)
        return {
          account: result.account,
          requiresPIN: false,
          isNewAccount: false,
          isNewDevice: isNewDevice,
          hasPIN: true,
          reason: 'valid_session'
        }
      } else {
        console.log('🔒 PIN required - no valid session')
        return {
          requiresPIN: true,
          isNewAccount: false,
          isNewDevice: isNewDevice,
          hasPIN: true,
          reason: session ? 'session_expired' : 'new_device'
        }
      }
    }
    
    // Step 4: No PIN set up, allow access
    console.log('⚠️ No PIN protection - direct access granted')
    const result = await this.authenticateOrCreateAccount(chipUID)
    return {
      account: result.account,
      requiresPIN: false,
      isNewAccount: false,
      isNewDevice: isNewDevice,
      hasPIN: false,
      reason: 'no_pin_protection'
    }
  }
  
  /**
   * 🔓 Authenticate after PIN verification
   */
  static async authenticateAfterPIN(chipUID: string, pin: string): Promise<{
    success: boolean
    account?: LocalAccountProfile
    error?: string
  }> {
    try {
      // Verify PIN cryptographically
      const isValidPIN = await this.verifyAccountPIN(chipUID, pin)
      
      if (!isValidPIN) {
        return {
          success: false,
          error: 'Invalid PIN'
        }
      }
      
      // PIN is valid, create account and both session types
      const result = await this.authenticateOrCreateAccount(chipUID)
      
      // 🔐 CRYPTO: Create both session systems for consistency
      console.log('🔐 Creating dual session systems for maximum security')
      
      // 1. Create local device session (for device-specific storage)
      this.createDeviceSession(chipUID, true)
      
      // 2. Create API session (for server validation)
      try {
        const { SessionManager } = await import('@/lib/nfc/sessionManager')
        const apiSession = await SessionManager.createSession(chipUID)
        
        if (!apiSession) {
          console.warn('⚠️ Failed to create API session, but proceeding with device session')
        } else {
          console.log('✅ Dual session systems created successfully')
        }
      } catch (sessionError) {
        console.warn('⚠️ API session creation failed:', sessionError)
        // Don't fail the authentication for session creation issues
      }
      
      return {
        success: true,
        account: result.account
      }
      
    } catch (error) {
      console.error('PIN authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * 📱 Device Session Management
   */
  private static generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server'
    
    // Create a more stable device fingerprint that's less sensitive to minor changes
    // Prioritize stable identifiers over volatile ones
    const stableComponents = [
      // Core browser info (most stable)
      navigator.platform || 'unknown',
      navigator.language || 'en',
      // Screen info - use orientation-independent values
      Math.max(screen.width, screen.height) + 'x' + Math.min(screen.width, screen.height),
      // Hardware concurrency is fairly stable
      navigator.hardwareConcurrency?.toString() || '4',
      // Domain should be stable
      window.location.hostname
    ]
    
    // Simple hash of the stable components
    const fingerprint = stableComponents.join('|')
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `device_${Math.abs(hash).toString(16)}`
  }
  
  /**
   * Check if two fingerprints are "similar enough" (for graceful degradation)
   */
  private static fingerprintsAreSimilar(fp1: string, fp2: string): boolean {
    // If exact match, definitely similar
    if (fp1 === fp2) return true
    
    // Extract the hash part and check if they're close
    const hash1 = fp1.replace('device_', '')
    const hash2 = fp2.replace('device_', '')
    
    // For now, consider fingerprints similar if they're exactly the same
    // In the future, we could implement fuzzy matching here
    return hash1 === hash2
  }
  
  private static getDeviceSession(chipUID: string): DeviceSession | null {
    if (typeof window === 'undefined') return null
    
    try {
      const sessionKey = `${SESSION_STORAGE_PREFIX}${chipUID}`
      const stored = localStorage.getItem(sessionKey)
      
      if (!stored) return null
      
      const session = JSON.parse(stored) as DeviceSession
      
      // Check if session is expired first
      const now = new Date()
      if (new Date(session.autoLoginUntil) < now) {
        console.log('🕐 Device session expired, clearing')
        localStorage.removeItem(sessionKey)
        return null
      }
      
      // Verify device fingerprint matches (with graceful degradation)
      const currentFingerprint = this.generateDeviceFingerprint()
      if (!this.fingerprintsAreSimilar(session.deviceFingerprint, currentFingerprint)) {
        console.log('🔒 Device fingerprint mismatch detected')
        console.log(`   Previous: ${session.deviceFingerprint}`)
        console.log(`   Current:  ${currentFingerprint}`)
        
        // Instead of immediately clearing, check session age
        const sessionAge = now.getTime() - new Date(session.lastAuthenticated).getTime()
        const maxGracePeriod = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
        
        if (sessionAge < maxGracePeriod) {
          console.log('🤝 Session recent enough, updating fingerprint and continuing')
          // Update the fingerprint to current value
          session.deviceFingerprint = currentFingerprint
          localStorage.setItem(sessionKey, JSON.stringify(session))
          return session
        } else {
          console.log('🔒 Session too old with fingerprint mismatch, clearing')
          localStorage.removeItem(sessionKey)
          return null
        }
      }
      
      return session
    } catch (error) {
      console.warn('Failed to get device session:', error)
      return null
    }
  }
  
  private static createDeviceSession(chipUID: string, pinEntered: boolean): void {
    if (typeof window === 'undefined') return
    
    try {
      const now = new Date()
      const autoLoginUntil = new Date(now.getTime() + SESSION_TIMEOUT)
      
      const session: DeviceSession = {
        chipUID,
        deviceFingerprint: this.generateDeviceFingerprint(),
        lastAuthenticated: now.toISOString(),
        pinEntered,
        autoLoginUntil: autoLoginUntil.toISOString()
      }
      
      const sessionKey = `${SESSION_STORAGE_PREFIX}${chipUID}`
      localStorage.setItem(sessionKey, JSON.stringify(session))
      
      console.log(`✅ Device session created, auto-login until: ${autoLoginUntil.toLocaleString()}`)
    } catch (error) {
      console.warn('Failed to create device session:', error)
    }
  }
  
  private static updateDeviceSession(chipUID: string, pinEntered?: boolean): void {
    if (typeof window === 'undefined') return
    
    try {
      const session = this.getDeviceSession(chipUID)
      if (!session) {
        // Create new session if none exists
        this.createDeviceSession(chipUID, pinEntered || false)
        return
      }
      
      const now = new Date()
      const autoLoginUntil = new Date(now.getTime() + SESSION_TIMEOUT)
      
      session.lastAuthenticated = now.toISOString()
      session.autoLoginUntil = autoLoginUntil.toISOString()
      
      if (pinEntered !== undefined) {
        session.pinEntered = pinEntered
      }
      
      const sessionKey = `${SESSION_STORAGE_PREFIX}${chipUID}`
      localStorage.setItem(sessionKey, JSON.stringify(session))
      
      console.log(`🔄 Device session updated, auto-login until: ${autoLoginUntil.toLocaleString()}`)
    } catch (error) {
      console.warn('Failed to update device session:', error)
    }
  }
  
  /**
   * 🚪 Logout - Clear device session
   */
  static logout(chipUID?: string): void {
    if (typeof window === 'undefined') return
    
    try {
      if (chipUID) {
        // Clear specific session
        const sessionKey = `${SESSION_STORAGE_PREFIX}${chipUID}`
        localStorage.removeItem(sessionKey)
        console.log(`🚪 Logged out chipUID: ${chipUID}`)
      } else {
        // Clear all sessions
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(SESSION_STORAGE_PREFIX)) {
            localStorage.removeItem(key)
          }
        })
        
        // Also clear current account
        localStorage.removeItem(CURRENT_ACCOUNT_KEY)
        console.log(`🚪 Logged out all sessions`)
      }
    } catch (error) {
      console.warn('Failed to logout:', error)
    }
  }
  
  /**
   * 🔧 Migrate old sessions to new fingerprinting system
   * Call this to upgrade users from the old unstable fingerprinting
   */
  static migrateSessionsToNewFingerprinting(): void {
    if (typeof window === 'undefined') return
    
    try {
      console.log('🔄 Migrating sessions to new fingerprinting system...')
      const migrationKey = 'kairos:fingerprint-migration-v2'
      
      // Check if migration has already been done
      if (localStorage.getItem(migrationKey)) {
        console.log('✅ Migration already completed')
        return
      }
      
      // Get all session keys
      const sessionKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(SESSION_STORAGE_PREFIX)
      )
      
      const currentFingerprint = this.generateDeviceFingerprint()
      
      sessionKeys.forEach(sessionKey => {
        try {
          const sessionData = localStorage.getItem(sessionKey)
          if (sessionData) {
            const session = JSON.parse(sessionData)
            
            // Update to new fingerprint
            session.deviceFingerprint = currentFingerprint
            
            // Mark as migrated
            session.migrated = true
            session.migrationDate = new Date().toISOString()
            
            localStorage.setItem(sessionKey, JSON.stringify(session))
            console.log(`✅ Migrated session: ${sessionKey}`)
          }
        } catch (error) {
          console.warn(`Failed to migrate session ${sessionKey}:`, error)
          // If we can't migrate it, remove it to prevent issues
          localStorage.removeItem(sessionKey)
        }
      })
      
      // Mark migration as complete
      localStorage.setItem(migrationKey, new Date().toISOString())
      console.log(`🎉 Session migration complete! Updated ${sessionKeys.length} sessions`)
      
    } catch (error) {
      console.warn('Failed to migrate sessions:', error)
    }
  }

  /**
   * 🔍 Check if account is legacy format
   */
  private static isLegacyAccount(existingAccount?: DatabaseAccountRecord | null, localProfile?: LocalAccountProfile | null): boolean {
    // Check for legacy indicators
    if (existingAccount) {
      // Legacy accounts might have specific patterns
      if (existingAccount.did?.includes('legacy')) return true
      if (existingAccount.publicKey === 'legacy-public-key') return true
      if (!existingAccount.hasPIN && !existingAccount.encryptedPIN) return true
      // Old accounts created before PIN system
      if (existingAccount.createdAt && new Date(existingAccount.createdAt) < new Date('2024-01-01')) return true
    }
    
    if (localProfile) {
      // Similar checks for local profiles
      if (localProfile.did?.includes('legacy')) return true
      if (!localProfile.hasPIN && !localProfile.privateKey) return true
    }
    
    return false
  }
} 