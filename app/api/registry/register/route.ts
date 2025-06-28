/**
 * 📚 Public Key Registry API - Phase 1 (Central Server)
 * 
 * This API allows registration and lookup of public keys for NFC pendants
 * Will evolve to blockchain and P2P in later phases
 */

import { NextRequest, NextResponse } from 'next/server'

interface RegistryEntry {
  chipUID: string
  publicKey: number[]      // Uint8Array serialized
  deviceID: string
  did: string
  registeredAt: number
  lastSeen: number
}

// In-memory registry (replace with database in production)
const publicKeyRegistry = new Map<string, RegistryEntry>()

/**
 * POST: Register a new public key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chipUID, publicKey, deviceID, did } = body
    
    if (!chipUID || !publicKey || !deviceID) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: chipUID, publicKey, deviceID'
      }, { status: 400 })
    }
    
    // Validate public key format (Ed25519 = 32 bytes)
    if (!Array.isArray(publicKey) || publicKey.length !== 32) {
      return NextResponse.json({
        success: false,
        error: 'Invalid public key format - must be 32-byte array'
      }, { status: 400 })
    }
    
    // Check if already registered
    if (publicKeyRegistry.has(chipUID)) {
      // Update last seen
      const existing = publicKeyRegistry.get(chipUID)!
      existing.lastSeen = Date.now()
      publicKeyRegistry.set(chipUID, existing)
      
      return NextResponse.json({
        success: true,
        message: 'Public key updated',
        chipUID
      })
    }
    
    // Register new public key
    const entry: RegistryEntry = {
      chipUID,
      publicKey,
      deviceID,
      did: did || `did:key:z${chipUID}`,
      registeredAt: Date.now(),
      lastSeen: Date.now()
    }
    
    publicKeyRegistry.set(chipUID, entry)
    
    console.log(`✅ Registered public key for chipUID: ${chipUID}`)
    
    return NextResponse.json({
      success: true,
      message: 'Public key registered successfully',
      chipUID,
      did: entry.did
    })
    
  } catch (error) {
    console.error('Registry registration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    }, { status: 500 })
  }
}

/**
 * GET: List all registered public keys (for debugging)
 */
export async function GET() {
  try {
    const entries = Array.from(publicKeyRegistry.entries()).map(([chipUID, entry]) => ({
      chipUID,
      deviceID: entry.deviceID,
      did: entry.did,
      registeredAt: entry.registeredAt,
      lastSeen: entry.lastSeen,
      publicKeyHash: Array.from(entry.publicKey.slice(0, 4))
        .map(b => b.toString(16).padStart(2, '0')).join('') + '...'
    }))
    
    return NextResponse.json({
      success: true,
      totalEntries: entries.length,
      entries
    })
    
  } catch (error) {
    console.error('Registry list error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list entries'
    }, { status: 500 })
  }
} 