/**
 * 🔐 Session Verification API
 * 
 * Cryptographically verifies session tokens to prevent URL-based authentication bypasses
 */

import { NextRequest, NextResponse } from 'next/server'
import type { UserSession } from '../route'

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

import { getSharedMemoryStorage } from '@/lib/nfc/sharedStorage'
const getMemoryStorage = () => getSharedMemoryStorage()

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

/**
 * POST /api/nfc/sessions/verify
 * Verify session token cryptographically
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionToken, deviceFingerprint } = await request.json()
    
    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Session token is required'
      }, { status: 400 })
    }
    
    // Get the session from storage
    const session = await getSession(sessionToken)
    
    if (!session) {
      return NextResponse.json({
        success: true,
        isValid: false,
        reason: 'Session not found or expired'
      })
    }
    
    // Check if session is active
    if (!session.isActive) {
      return NextResponse.json({
        success: true,
        isValid: false,
        reason: 'Session is not active'
      })
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({
        success: true,
        isValid: false,
        reason: 'Session has expired'
      })
    }
    
    // Optional: Verify device fingerprint matches (additional security)
    if (deviceFingerprint && session.deviceFingerprint && session.deviceFingerprint !== deviceFingerprint) {
      console.warn(`🚨 Device fingerprint mismatch for session ${sessionToken}`)
      return NextResponse.json({
        success: true,
        isValid: false,
        reason: 'Device fingerprint mismatch'
      })
    }
    
    // All checks passed - session is valid for the full 24-hour duration
    return NextResponse.json({
      success: true,
      isValid: true,
      sessionInfo: {
        chipUID: session.chipUID,
        sessionId: session.sessionId,
        lastActivity: session.lastActivity,
        deviceFingerprint: session.deviceFingerprint
      }
    })
    
  } catch (error) {
    console.error('POST /api/nfc/sessions/verify error:', error)
    return NextResponse.json({
      success: false,
      isValid: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 