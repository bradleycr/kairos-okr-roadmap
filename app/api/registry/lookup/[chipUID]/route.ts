/**
 * 🔍 Public Key Lookup API
 * 
 * Allows ESP32s and other devices to lookup public keys by chipUID
 * Optimized for fast, frequent ESP32 queries
 */

import { NextRequest, NextResponse } from 'next/server'

// Shared registry (same as register endpoint)
// In production, this would use a proper database
const publicKeyRegistry = new Map<string, any>()

/**
 * GET: Lookup public key by chipUID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chipUID: string } }
) {
  try {
    const chipUID = params.chipUID
    
    if (!chipUID) {
      return NextResponse.json({
        success: false,
        error: 'chipUID parameter is required'
      }, { status: 400 })
    }
    
    // Lookup in registry
    const entry = publicKeyRegistry.get(chipUID)
    
    if (!entry) {
      return NextResponse.json({
        success: false,
        error: 'Public key not found',
        chipUID
      }, { status: 404 })
    }
    
    // Update last seen
    entry.lastSeen = Date.now()
    publicKeyRegistry.set(chipUID, entry)
    
    // Return public key for verification
    return NextResponse.json({
      success: true,
      chipUID,
      publicKey: entry.publicKey,
      deviceID: entry.deviceID,
      did: entry.did,
      registeredAt: entry.registeredAt,
      lastSeen: entry.lastSeen
    })
    
  } catch (error) {
    console.error('Registry lookup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed'
    }, { status: 500 })
  }
}

/**
 * POST: Batch lookup for ESP32 sync
 * ESP32s can request multiple public keys at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chipUIDs, lastSync } = body
    
    if (!Array.isArray(chipUIDs)) {
      return NextResponse.json({
        success: false,
        error: 'chipUIDs must be an array'
      }, { status: 400 })
    }
    
    const results: any[] = []
    
    for (const chipUID of chipUIDs) {
      const entry = publicKeyRegistry.get(chipUID)
      
      if (entry) {
        // Only include if updated since lastSync
        if (!lastSync || entry.lastSeen > lastSync) {
          results.push({
            chipUID,
            publicKey: entry.publicKey,
            deviceID: entry.deviceID,
            did: entry.did,
            lastSeen: entry.lastSeen
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      updated: results.length,
      total: chipUIDs.length,
      syncTimestamp: Date.now(),
      entries: results
    })
    
  } catch (error) {
    console.error('Batch lookup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch lookup failed'
    }, { status: 500 })
  }
} 