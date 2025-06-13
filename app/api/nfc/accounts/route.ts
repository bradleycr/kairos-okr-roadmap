/**
 * 🔐 Privacy-First NFC Account API
 * 
 * Handles MINIMAL account recognition data only:
 * ✅ chipUID -> accountID mapping
 * ✅ Basic timestamps for cross-device recognition  
 * ❌ NO private keys, personal details, or sensitive data
 * 
 * Database stores only what's needed for "does this account exist elsewhere?"
 */

import { NextRequest, NextResponse } from 'next/server'
import type { DatabaseAccountRecord } from '@/lib/nfc/accountManager'

// --- Vercel KV Storage Interface ---
async function getKV() {
  try {
    // Check for Upstash Redis environment variables (Vercel auto-generated names)
    if (process.env.STORAGE_KV_REST_API_URL && process.env.STORAGE_KV_REST_API_TOKEN) {
      console.log('🔗 Using Upstash Redis with Vercel auto-generated credentials')
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({
        url: process.env.STORAGE_KV_REST_API_URL,
        token: process.env.STORAGE_KV_REST_API_TOKEN,
      })
      return redis
    }
    // Fallback to manual Upstash setup
    else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log('🔗 Using Upstash Redis with manual credentials')
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      return redis
    }
    // Fallback to legacy Vercel KV if available
    else if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      console.log('🔗 Using legacy Vercel KV with provided credentials')
      const { kv } = await import('@vercel/kv')
      return kv
    } else {
      console.log('⚠️ No database credentials found:', {
        hasStorageUrl: !!process.env.STORAGE_KV_REST_API_URL,
        hasStorageToken: !!process.env.STORAGE_KV_REST_API_TOKEN,
        hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        hasKvUrl: !!process.env.KV_REST_API_URL,
        hasKvToken: !!process.env.KV_REST_API_TOKEN,
        nodeEnv: process.env.NODE_ENV
      })
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
  }
  return null
}

// Import shared storage for consistency across endpoints
import { getSharedMemoryStorage } from '@/lib/nfc/sharedStorage'

// Get the shared memory storage instance
const getMemoryStorage = () => getSharedMemoryStorage()

// --- Storage Functions ---
async function saveAccountRecord(record: DatabaseAccountRecord): Promise<boolean> {
  console.log(`💾 Saving account record for chipUID: ${record.chipUID}`)
  
  try {
    const kv = await getKV()
    if (kv) {
      // Store by chipUID for primary lookup
      await kv.set(`nfc:account:${record.chipUID}`, record)
      // Also store by accountId for alternative lookup
      await kv.set(`nfc:account:id:${record.accountId}`, record)
      // Set reasonable expiration (1 year)
      await kv.expire(`nfc:account:${record.chipUID}`, 60 * 60 * 24 * 365)
      await kv.expire(`nfc:account:id:${record.accountId}`, 60 * 60 * 24 * 365)
      
      console.log(`✅ Account record saved to KV storage`)
      return true
    } else {
      // Fallback to shared memory storage
      const memoryStorage = getMemoryStorage()
      memoryStorage.set(record.chipUID, record)
      memoryStorage.set(`id:${record.accountId}`, record)
      console.log(`✅ Account record saved to memory storage (fallback)`)
      return true
    }
  } catch (error) {
    console.error('Failed to save account record:', error)
    return false
  }
}

async function getAccountRecord(chipUID: string): Promise<DatabaseAccountRecord | null> {
  console.log(`🔍 Looking up account for chipUID: ${chipUID}`)
  
  try {
    const kv = await getKV()
    if (kv) {
      const record = await kv.get(`nfc:account:${chipUID}`) as DatabaseAccountRecord | null
      console.log(`${record ? '✅ Found' : '❌ Not found'} in KV storage`)
      return record
    } else {
      // Fallback to shared memory storage
      const memoryStorage = getMemoryStorage()
      const record = memoryStorage.get(chipUID) || null
      console.log(`${record ? '✅ Found' : '❌ Not found'} in memory storage`)
      return record
    }
  } catch (error) {
    console.error('Failed to get account record:', error)
    return null
  }
}

async function updateAccountRecord(chipUID: string, updates: Partial<DatabaseAccountRecord>, incrementVerification: boolean = false): Promise<boolean> {
  console.log(`🔄 Updating account record for chipUID: ${chipUID}`)
  
  try {
    const existing = await getAccountRecord(chipUID)
    if (!existing) {
      console.log('❌ Account not found for update')
      return false
    }

    const updated: DatabaseAccountRecord = {
      ...existing,
      ...updates,
      lastSeen: new Date().toISOString(), // Always update lastSeen
      verificationCount: incrementVerification ? existing.verificationCount + 1 : existing.verificationCount
    }
    
    return await saveAccountRecord(updated)
  } catch (error) {
    console.error('Failed to update account record:', error)
    return false
  }
}

// --- API Routes ---

/**
 * GET /api/nfc/accounts
 * Lookup account by chipUID (via header)
 */
export async function GET(request: NextRequest) {
  try {
    const chipUID = request.headers.get('X-Chip-UID')
    
    if (!chipUID) {
      return NextResponse.json({
        success: false,
        error: 'Missing X-Chip-UID header'
      }, { status: 400 })
    }
    
    console.log(`🔍 GET request for chipUID: ${chipUID}`)
    
    const account = await getAccountRecord(chipUID)
    
    return NextResponse.json({
      success: true,
      exists: !!account,
      account: account || null
    })
    
  } catch (error) {
    console.error('GET /api/nfc/accounts error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/nfc/accounts
 * Create new account record (minimal data only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DatabaseAccountRecord
    
    // Validate required fields
    if (!body.chipUID || !body.accountId || !body.publicKey || !body.did) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: chipUID, accountId, publicKey, did'
      }, { status: 400 })
    }
    
    console.log(`📝 POST request to create account for chipUID: ${body.chipUID}`)
    
    // Check if account already exists
    const existing = await getAccountRecord(body.chipUID)
    if (existing) {
      console.log('⚠️ Account already exists, updating lastSeen only')
      const updated = await updateAccountRecord(body.chipUID, {
        lastSeen: new Date().toISOString(),
        // Update profile info if provided
        displayName: body.displayName || existing.displayName,
        username: body.username || existing.username,
        bio: body.bio || existing.bio,
        deviceName: body.deviceName || existing.deviceName,
        // Update setup completion status if provided
        setupCompleted: body.setupCompleted ?? existing.setupCompleted,
        ritualFlowCompleted: body.ritualFlowCompleted ?? existing.ritualFlowCompleted
      }, false) // Don't increment verification for simple profile updates
      
      return NextResponse.json({
        success: true,
        created: false,
        updated: updated,
        message: 'Account already exists, updated profile info'
      })
    }
    
    // Create new account record
    const newRecord: DatabaseAccountRecord = {
      accountId: body.accountId,
      chipUID: body.chipUID,
      publicKey: body.publicKey,
      did: body.did,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      verificationCount: 1,
      hasPIN: body.hasPIN || false,
      encryptedPIN: body.encryptedPIN,
      pinSalt: body.pinSalt,
      // 🆕 Basic profile info
      displayName: body.displayName,
      username: body.username,
      bio: body.bio,
      deviceName: body.deviceName,
      // Setup completion status
      setupCompleted: body.setupCompleted ?? false,
      ritualFlowCompleted: body.ritualFlowCompleted ?? false
    }
    
    const saved = await saveAccountRecord(newRecord)
    
    if (saved) {
      console.log(`✅ Created new account record for chipUID: ${body.chipUID}`)
      return NextResponse.json({
        success: true,
        created: true,
        account: newRecord
      })
    } else {
      console.log(`❌ Failed to save account record for chipUID: ${body.chipUID}`)
      return NextResponse.json({
        success: false,
        error: 'Failed to save account record'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('POST /api/nfc/accounts error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/nfc/accounts  
 * Update existing account record (via chipUID header)
 */
export async function PUT(request: NextRequest) {
  try {
    const chipUID = request.headers.get('X-Chip-UID')
    
    if (!chipUID) {
      return NextResponse.json({
        success: false,
        error: 'Missing X-Chip-UID header'
      }, { status: 400 })
    }
    
    const updates = await request.json()
    
    // Check if this is an authentication event vs a profile update
    const isAuthEvent = updates.isAuthenticationEvent === true
    const shouldIncrementVerification = isAuthEvent
    
    // Remove the flag from updates so it doesn't get stored
    delete updates.isAuthenticationEvent
    
    console.log(`🔄 PUT request to update chipUID: ${chipUID} (auth event: ${isAuthEvent})`)
    
    const updated = await updateAccountRecord(chipUID, updates, shouldIncrementVerification)
    
    if (updated) {
      console.log(`✅ Updated account record for chipUID: ${chipUID}`)
      return NextResponse.json({
        success: true,
        updated: true
      })
    } else {
      console.log(`❌ Failed to update account record for chipUID: ${chipUID}`)
      return NextResponse.json({
        success: false,
        error: 'Account not found or update failed'
      }, { status: 404 })
    }
    
  } catch (error) {
    console.error('PUT /api/nfc/accounts error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/nfc/accounts
 * Remove account record (for testing/cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const chipUID = request.headers.get('X-Chip-UID')
    
    if (!chipUID) {
      return NextResponse.json({
        success: false,
        error: 'Missing X-Chip-UID header'
      }, { status: 400 })
    }
    
    console.log(`🗑️ DELETE request for chipUID: ${chipUID}`)
    
    const kv = await getKV()
    if (kv) {
      // Get account first to get accountId
      const account = await getAccountRecord(chipUID)
      
      // Remove both keys
      await kv.del(`nfc:account:${chipUID}`)
      if (account) {
        await kv.del(`nfc:account:id:${account.accountId}`)
      }
      
      console.log(`✅ Deleted account record from KV storage`)
    } else {
      // Remove from memory storage
      const memoryStorage = getMemoryStorage()
      const account = memoryStorage.get(chipUID)
      memoryStorage.delete(chipUID)
      if (account) {
        memoryStorage.delete(`id:${account.accountId}`)
      }
      
      console.log(`✅ Deleted account record from memory storage`)
    }
    
    return NextResponse.json({
      success: true,
      deleted: true
    })
    
  } catch (error) {
    console.error('DELETE /api/nfc/accounts error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 