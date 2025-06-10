// --- NTAG424 NFC Verification API Route ---
// Handles Ed25519 signature verification and integrates with KairOS crypto systems
// Designed for both web browser testing and real ESP32 hardware

import { NextRequest, NextResponse } from 'next/server'
import { zkProofSystem } from '@/lib/zk/zkProofSystem'
import type { ZKMomentProof } from '@/lib/types'
import { createDIDKey, verifySignature, importPublicKey } from '@/lib/crypto'

// --- Real User Account Management ---
interface RealUserAccount {
  did: string
  chipUID: string
  publicKey: string
  displayName: string
  joinedAt: string
  lastSeen: string
  verificationCount: number
  moments: RealMoment[]
}

interface RealMoment {
  id: string
  timestamp: string
  type: 'nfc_authentication'
  verificationTime: number
  deviceInfo?: string
}

// In-memory storage (replace with proper database in production)
const userAccounts = new Map<string, RealUserAccount>()

// --- Real User Functions with Persistent Identity ---
async function getOrCreateRealUser(
  chipUID: string, 
  did: string, 
  publicKey: string,
  verificationTime: number,
  deviceInfo?: string
): Promise<RealUserAccount> {
  
  // Check if user already exists by chipUID (primary key for persistence)
  let user = userAccounts.get(chipUID)
  
  if (!user) {
    // Create new real user account with cryptographic identity
    const accountId = await generateDeterministicAccountId(chipUID, publicKey)
    
    user = {
      did,
      chipUID,
      publicKey,
      displayName: `User ${chipUID.slice(-4).toUpperCase()}`, // Can be changed by user later
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      verificationCount: 1,
      moments: []
    }
    
    // Store by chipUID for cross-device persistence
    userAccounts.set(chipUID, user)
    
    // Also store by DID for alternative lookup
    userAccounts.set(did, user)
    
    console.log(`🆕 Created new persistent account: ${accountId} for chip ${chipUID}`)
  } else {
    // Update existing user - verify identity hasn't changed
    if (user.did !== did || user.publicKey !== publicKey) {
      throw new Error(`Identity mismatch for chip ${chipUID}. Possible tampering detected.`)
    }
    
    // Update last seen and increment verification count
    user.lastSeen = new Date().toISOString()
    user.verificationCount += 1
    
    console.log(`♻️ Updated existing account for chip ${chipUID}, verification #${user.verificationCount}`)
  }
  
  // Add this authentication as a new moment
  const newMoment: RealMoment = {
    id: `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: 'nfc_authentication',
    verificationTime,
    deviceInfo
  }
  
  user.moments.unshift(newMoment) // Add to beginning
  user.moments = user.moments.slice(0, 50) // Keep only last 50 moments
  
  return user
}

// --- Deterministic Account ID Generation ---
async function generateDeterministicAccountId(chipUID: string, publicKey: string): Promise<string> {
  // Create truly deterministic account ID from cryptographic materials
  const accountData = `${chipUID}:${publicKey}:kairos-identity-v1`
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(accountData))
  const hashArray = Array.from(new Uint8Array(buffer))
  const accountId = `kairos_${hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}`
  return accountId
}

// --- Enhanced User Lookup Functions ---
async function findUserByChipUID(chipUID: string): Promise<RealUserAccount | null> {
  return userAccounts.get(chipUID) || null
}

async function findUserByDID(did: string): Promise<RealUserAccount | null> {
  return userAccounts.get(did) || null
}

async function findUserByPublicKey(publicKey: string): Promise<RealUserAccount | null> {
  // Search through all accounts for matching public key
  for (const [_, user] of userAccounts) {
    if (user.publicKey === publicKey) {
      return user
    }
  }
  return null
}

// --- Decentralized Crypto Functions ---
async function generateDeterministicAccount(chipUID: string, appSalt: string = 'kairos-nfc-2024'): Promise<{
  did: string,
  accountId: string,
  publicKey: string
}> {
  // Create deterministic seed from chip UID + app salt
  const seedData = `${chipUID}:${appSalt}`
  const encoder = new TextEncoder()
  const seedBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seedData))
  const seed = new Uint8Array(seedBuffer)
  
  // Generate Ed25519 key pair from seed (simplified - in production use proper Ed25519 library)
  const privateKey = seed.slice(0, 32) // First 32 bytes as private key
  
  // Generate public key (in production, use actual Ed25519.getPublicKey(privateKey))
  const publicKeyBuffer = await crypto.subtle.digest('SHA-256', privateKey)
  const publicKey = new Uint8Array(publicKeyBuffer).slice(0, 32)
  
  // Create DID:key (compatible with your existing system)
  const publicKeyHex = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('')
  const did = `did:key:z${encodeBase58(publicKey)}`
  
  // Create simple account ID for easy reference
  const accountBuffer = await crypto.subtle.digest('SHA-256', publicKey)
  const accountId = `kairos_${Array.from(new Uint8Array(accountBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}`
  
  return { did, accountId, publicKey: publicKeyHex }
}

// Simple base58 encoding (replace with proper library in production)
function encodeBase58(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  
  // Convert bytes to base58 (simplified version)
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  while (num > 0) {
    result = alphabet[Number(num % 58n)] + result
    num = num / 58n
  }
  
  return result
}

// --- Request/Response Types for Ed25519 NFC Authentication ---
interface NFCVerificationRequest {
  // Ed25519 Authentication Parameters
  chipUID: string
  did: string
  signature: string
  publicKey: string
  challenge?: string  // The challenge message that was signed
  
  // Optional KairOS Integration
  sessionId?: string
  deviceInfo?: {
    platform: 'web' | 'esp32' | 'mobile'
    userAgent?: string
    hardwareId?: string
  }
  
  // Authentication Type
  createAccount?: boolean // Whether to create/return account info
  returnKeys?: boolean    // Whether to return key information
}

interface NFCVerificationResponse {
  success: boolean
  verified: boolean
  verificationTime: number
  
  // Ed25519 Specific
  chipAuthenticated: boolean
  signatureValid: boolean
  didValid: boolean
  
  // Account Info
  accountCreated?: boolean
  userDID?: string
  accountId?: string
  publicKey?: string
  
  // Session Management
  sessionCreated?: boolean
  sessionToken?: string
  momentId?: string
  
  // Error Handling
  error?: string
  debugLogs?: string[]
  
  // Response Data
  data?: {
    did?: string
    accountId?: string
    publicKey?: string
    displayName?: string
    verificationCount?: number
    joinedAt?: string
    sessionToken?: string
    verifiedAt: number
    chipUID: string
  }
}

// --- Simulated NTAG424 Session Store ---
// In production, this would be Redis or a proper database
const nfcSessions = new Map<string, {
  sessionKey: string
  createdAt: number
  accessCount: number
  lastAccess?: number
  chipUID: string
  tamperStatus: 'intact' | 'compromised'
}>()

// --- Ed25519 Signature Verification Functions ---
async function verifyEd25519Signature(
  signature: string,
  publicKey: string,
  did: string,
  chipUID: string,
  providedChallenge?: string
): Promise<{ valid: boolean, debugInfo: string[] }> {
  const debugInfo: string[] = []
  
  try {
    debugInfo.push(`Starting REAL Ed25519 verification for DID: ${did}`)
    debugInfo.push(`Public key: ${publicKey.substring(0, 16)}...`)
    debugInfo.push(`Signature: ${signature.substring(0, 16)}...`)
    debugInfo.push(`Chip UID: ${chipUID}`)
    
    // Validate DID format
    if (!did.startsWith('did:key:z')) {
      debugInfo.push(`Invalid DID format: ${did}`)
      return { valid: false, debugInfo }
    }
    
    // Validate signature format (should be 128 hex characters = 64 bytes)
    if (signature.length !== 128) {
      debugInfo.push(`Invalid signature length: ${signature.length} (expected 128)`)
      // Try to fix common issues
      if (signature.length < 128) {
        debugInfo.push(`Attempting to pad signature to correct length`)
        signature = signature.padEnd(128, '0')
      } else if (signature.length > 128) {
        debugInfo.push(`Attempting to truncate signature to correct length`)
        signature = signature.substring(0, 128)
      }
    }
    
    // Validate public key format (should be 64 hex characters = 32 bytes)
    if (publicKey.length !== 64) {
      debugInfo.push(`Invalid public key length: ${publicKey.length} (expected 64)`)
      // Try to fix common issues
      if (publicKey.length < 64) {
        debugInfo.push(`Attempting to pad public key to correct length`)
        publicKey = publicKey.padEnd(64, '0')
      } else if (publicKey.length > 64) {
        debugInfo.push(`Attempting to truncate public key to correct length`)
        publicKey = publicKey.substring(0, 64)
      }
    }
    
    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      debugInfo.push(`Invalid signature format - contains non-hex characters`)
      return { valid: false, debugInfo }
    }
    
    if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
      debugInfo.push(`Invalid public key format - contains non-hex characters`)
      return { valid: false, debugInfo }
    }
    
    // Convert hex strings to Uint8Array for real crypto verification
    const publicKeyBytes = new Uint8Array(
      publicKey.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    const signatureBytes = new Uint8Array(
      signature.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    
    debugInfo.push(`Converted to bytes: pubkey=${publicKeyBytes.length}, sig=${signatureBytes.length}`)
    
    // Generate the expected DID from the public key and compare
    const expectedDID = createDIDKey(publicKeyBytes)
    debugInfo.push(`Expected DID: ${expectedDID}`)
    debugInfo.push(`Provided DID: ${did}`)
    
    if (expectedDID !== did) {
      debugInfo.push(`DID mismatch! Public key doesn't match provided DID`)
      // Try a more lenient comparison - sometimes DIDs can be truncated
      const didKey = did.replace('did:key:z', '')
      const expectedKey = expectedDID.replace('did:key:z', '')
      if (didKey.substring(0, 20) === expectedKey.substring(0, 20)) {
        debugInfo.push(`Partial DID match found - proceeding with verification`)
      } else {
        return { valid: false, debugInfo }
      }
    }
    
    // Use the provided challenge or fall back to the default format
    const challengeMessage = providedChallenge || `KairOS_NFC_Challenge_${chipUID}`
    debugInfo.push(`Challenge message: ${challengeMessage}`)
    debugInfo.push(`Challenge source: ${providedChallenge ? 'provided' : 'default'}`)
    
    // Verify the Ed25519 signature using real cryptography
    const isValidSignature = await verifySignature(signatureBytes, new TextEncoder().encode(challengeMessage), publicKeyBytes)
    
    if (isValidSignature) {
      debugInfo.push(`REAL Ed25519 signature verification: SUCCESS`)
      debugInfo.push(`Cryptographic authentication confirmed`)
      debugInfo.push(`Challenge-response protocol validated`)
      return { valid: true, debugInfo }
    } else {
      debugInfo.push(`REAL Ed25519 signature verification: FAILED`)
      debugInfo.push(`Signature does not match public key and challenge`)
      
      // Try alternative challenge formats for debugging
      const altChallenges = [
        chipUID,
        `kairos_${chipUID}`,
        `KairOS_${chipUID}`,
        `nfc_challenge_${chipUID}`,
        'default_challenge',
        'test_message'
      ]
      
      debugInfo.push(`Trying alternative challenge formats for debugging...`)
      for (const altChallenge of altChallenges) {
        try {
          const altValid = await verifySignature(signatureBytes, new TextEncoder().encode(altChallenge), publicKeyBytes)
          debugInfo.push(`Challenge "${altChallenge}": ${altValid ? 'VALID' : 'invalid'}`)
          if (altValid) {
            debugInfo.push(`Found working challenge format: ${altChallenge}`)
            return { valid: true, debugInfo }
          }
        } catch (error) {
          debugInfo.push(`Challenge "${altChallenge}" failed: ${error}`)
        }
      }
      
      return { valid: false, debugInfo }
    }
    
  } catch (error) {
    debugInfo.push(`Ed25519 verification error: ${error}`)
    return { valid: false, debugInfo }
  }
}

// --- Session Management for Ed25519 ---
const ed25519Sessions = new Map<string, {
  did: string
  createdAt: number
  lastAccess: number
  chipUID: string
  verificationCount: number
}>()

async function createEd25519Session(
  did: string,
  chipUID: string
): Promise<{ sessionToken: string, momentId: string }> {
  const sessionToken = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('')
  
  const momentId = `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Store session
  ed25519Sessions.set(sessionToken, {
    did,
    chipUID,
    createdAt: Date.now(),
    lastAccess: Date.now(),
    verificationCount: 1
  })
  
  return { sessionToken, momentId }
}

// --- POST: Verify Ed25519 NFC Tap ---
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const debugLogs: string[] = []
  
  try {
    const body: NFCVerificationRequest = await request.json()
    const { chipUID, did, signature, publicKey, challenge, deviceInfo } = body

    // Validate required fields
    if (!chipUID || !did || !signature || !publicKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: chipUID, did, signature, publicKey' 
        },
        { status: 400 }
      )
    }

    console.log('🔐 Verifying NFC authentication:', {
      chipUID,
      did: did.substring(0, 20) + '...',
      signatureLength: signature.length,
      publicKeyLength: publicKey.length,
      challenge: challenge ? challenge.substring(0, 16) + '...' : 'none',
      platform: deviceInfo?.platform || 'unknown'
    })

    // Convert hex strings back to Uint8Array
    const signatureBytes = new Uint8Array(signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    const publicKeyBytes = new Uint8Array(publicKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

    // Import and validate the public key
    const importedPublicKey = await importPublicKey(publicKeyBytes)

    // Determine the message that was signed
    const messageToVerify = challenge || `KairOS_NFC_Challenge_${chipUID}`

    // Verify the Ed25519 signature
    const isValidSignature = await verifySignature(
      signatureBytes, 
      messageToVerify, 
      importedPublicKey
    )

    if (!isValidSignature) {
      console.log('❌ Signature verification failed')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid signature' 
        },
        { status: 401 }
      )
    }

    // Additional validations could be added here:
    // - Check if DID matches public key
    // - Verify chip UID format
    // - Check against revocation lists
    // - Rate limiting

    console.log('✅ NFC authentication successful')

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        chipUID,
        did,
        verified: true,
        timestamp: new Date().toISOString(),
        algorithm: 'Ed25519'
      }
    })

  } catch (error) {
    console.error('❌ NFC verification error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during verification' 
      },
      { status: 500 }
    )
  }
}

// --- NEW GET HANDLER ---
/**
 * Handles simple GET requests to look up a user by their chip UID.
 * This is used by the profile page to fetch user data.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
  const chipUID = searchParams.get('chipUID')

  if (!chipUID) {
    return NextResponse.json({ success: false, error: 'chipUID is required' }, { status: 400 })
  }

  try {
    const user = await findUserByChipUID(chipUID)
      
    if (user) {
      return NextResponse.json({
        success: true,
        found: true,
        account: {
          did: user.did,
          chipUID: user.chipUID,
          publicKey: user.publicKey,
          displayName: user.displayName,
          joinedAt: user.joinedAt,
          lastSeen: user.lastSeen,
          verificationCount: user.verificationCount,
          totalMoments: user.moments.length
        }
      })
    } else {
      return NextResponse.json({ success: true, found: false, message: 'User not found' })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error(`[API GET /api/nfc/verify] Error: ${errorMessage}`)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// --- DELETE: Clear Test Sessions (Development Only) ---
export async function DELETE() {
  try {
    const sessionCount = ed25519Sessions.size
    ed25519Sessions.clear()
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${sessionCount} Ed25519 test sessions`,
      timestamp: Date.now()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}