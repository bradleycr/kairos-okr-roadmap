/**
 * 🔐 User Sessions API
 * 
 * Manages active user sessions to track who is currently logged in on each device
 */

import { NextRequest, NextResponse } from 'next/server'

export interface UserSession {
  sessionId: string
  chipUID: string
  deviceInfo: string
  createdAt: string
  lastActivity: string
  expiresAt: string
  isActive: boolean
  deviceFingerprint?: string
}

// --- Vercel KV Storage Interface ---
async function getKV() {
  try {
    if (process.env.STORAGE_KV_REST_API_URL && process.env.STORAGE_KV_REST_API_TOKEN) {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({
        url: process.env.STORAGE_KV_REST_API_URL,
        token: process.env.STORAGE_KV_REST_API_TOKEN,
      })
      return redis
    }
    else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      return redis
    }
    else if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv')
      return kv
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
  }
  return null
}

// Import shared storage for consistency
import { getStorageItem, setStorageItem } from '@/lib/nfc/sharedStorage'
// Remove this line as we're using direct storage functions now

// --- Storage Functions ---
async function saveSession(session: UserSession): Promise<boolean> {
  console.log(`💾 Saving session: ${session.sessionId} for chipUID: ${session.chipUID}`)
  
  try {
    const kv = await getKV()
    if (kv) {
      // Store session by ID
      await kv.set(`nfc:session:${session.sessionId}`, session)
      // Store active session for device
      await kv.set(`nfc:active-session:${session.deviceFingerprint}`, session.sessionId)
      
      // Set expiration based on session expiry
      const expiryTime = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
      if (expiryTime > 0) {
        await kv.expire(`nfc:session:${session.sessionId}`, expiryTime)
        await kv.expire(`nfc:active-session:${session.deviceFingerprint}`, expiryTime)
      }
      
      return true
    } else {
      // Fallback to memory storage
      setStorageItem(`session:${session.sessionId}`, session)
      setStorageItem(`active-session:${session.deviceFingerprint}`, session.sessionId)
      return true
    }
  } catch (error) {
    console.error('Failed to save session:', error)
    return false
  }
}

async function getSession(sessionId: string): Promise<UserSession | null> {
  try {
    const kv = await getKV()
    if (kv) {
      const session = await kv.get(`nfc:session:${sessionId}`) as UserSession | null
      
      // Check if session is expired
      if (session && new Date(session.expiresAt) < new Date()) {
        await kv.del(`nfc:session:${sessionId}`)
        return null
      }
      
      return session
    } else {
      const memoryStorage = getMemoryStorage()
      const session = memoryStorage.get(`session:${sessionId}`) as UserSession | null
      
      // Check if session is expired
      if (session && new Date(session.expiresAt) < new Date()) {
        memoryStorage.delete(`session:${sessionId}`)
        return null
      }
      
      return session
    }
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

async function getActiveSession(deviceFingerprint: string): Promise<UserSession | null> {
  try {
    const kv = await getKV()
    if (kv) {
      const sessionId = await kv.get(`nfc:active-session:${deviceFingerprint}`) as string | null
      if (sessionId) {
        return await getSession(sessionId)
      }
          } else {
        const sessionId = getStorageItem<string>(`active-session:${deviceFingerprint}`)
        if (sessionId) {
          return await getSession(sessionId)
        }
      }
    return null
  } catch (error) {
    console.error('Failed to get active session:', error)
    return null
  }
}

async function clearSession(sessionId: string): Promise<boolean> {
  try {
    const kv = await getKV()
    if (kv) {
      const session = await getSession(sessionId)
      if (session) {
        await kv.del(`nfc:session:${sessionId}`)
        await kv.del(`nfc:active-session:${session.deviceFingerprint}`)
      }
      return true
          } else {
        const session = getStorageItem<UserSession>(`session:${sessionId}`)
        if (session) {
          // Note: Direct storage functions don't have delete, would need to implement
          console.log('⚠️ Memory storage session cleanup not fully implemented')
        }
        return true
      }
  } catch (error) {
    console.error('Failed to clear session:', error)
    return false
  }
}

// --- API Routes ---

/**
 * GET /api/nfc/sessions
 * Get active session for device
 */
export async function GET(request: NextRequest) {
  try {
    const deviceFingerprint = request.headers.get('X-Device-Fingerprint')
    const sessionId = request.headers.get('X-Session-ID')
    
    if (sessionId) {
      // Get specific session
      const session = await getSession(sessionId)
      return NextResponse.json({
        success: true,
        session: session
      })
    } else if (deviceFingerprint) {
      // Get active session for device
      const session = await getActiveSession(deviceFingerprint)
      return NextResponse.json({
        success: true,
        session: session
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing X-Device-Fingerprint or X-Session-ID header'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('GET /api/nfc/sessions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/nfc/sessions
 * Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.chipUID || !body.deviceInfo || !body.deviceFingerprint) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: chipUID, deviceInfo, deviceFingerprint'
      }, { status: 400 })
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000)) // 24 hours
    
    const session: UserSession = {
      sessionId,
      chipUID: body.chipUID,
      deviceInfo: body.deviceInfo,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      deviceFingerprint: body.deviceFingerprint
    }
    
    const success = await saveSession(session)
    
    if (success) {
      return NextResponse.json({
        success: true,
        session: session
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create session'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('POST /api/nfc/sessions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/nfc/sessions
 * Update session activity
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing sessionId'
      }, { status: 400 })
    }
    
    const session = await getSession(body.sessionId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }
    
    const updatedSession: UserSession = {
      ...session,
      lastActivity: new Date().toISOString()
    }
    
    const success = await saveSession(updatedSession)
    
    if (success) {
      return NextResponse.json({
        success: true,
        session: updatedSession
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update session'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('PUT /api/nfc/sessions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/nfc/sessions
 * Clear/logout session
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get('X-Session-ID')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing X-Session-ID header'
      }, { status: 400 })
    }
    
    const success = await clearSession(sessionId)
    
    return NextResponse.json({
      success: success
    })
    
  } catch (error) {
    console.error('DELETE /api/nfc/sessions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 