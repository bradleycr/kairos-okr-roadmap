/**
 * DID Auth Service Endpoint
 * 
 * Implements W3C DID Auth specification:
 * - Challenge generation for relying parties
 * - Response verification from identity owners
 * - Session management for authenticated users
 * 
 * Follows DID Auth architectures:
 * - Architecture 3: Web Page and DID Auth Service
 * - Architecture 6: Web Page and Web Browser (via API)
 */

import { NextRequest, NextResponse } from 'next/server'
import { SimpleDecentralizedAuth } from '@/lib/crypto/simpleDecentralizedAuth'

// DID Auth Challenge Request
interface DIDAuthChallengeRequest {
  did?: string           // Optional if identity owner is unknown
  relyingParty?: string  // Relying party identifier
  callbackURL?: string   // Where to send response
  requestedCredentials?: string[] // Optional VC requests
}

// DID Auth Challenge Response
interface DIDAuthChallengeResponse {
  challenge: string
  nonce: string
  expiresAt: string
  callbackURL?: string
  relyingParty?: string
}

// DID Auth Response (from identity owner)
interface DIDAuthResponseRequest {
  did: string
  challenge: string
  signature: string
  nonce: string
  verifiableCredentials?: any[] // Optional VCs
}

// DID Auth Verification Result
interface DIDAuthVerificationResult {
  verified: boolean
  did?: string
  sessionToken?: string
  error?: string
  verifiableCredentials?: any[]
}

const simpleAuth = new SimpleDecentralizedAuth()

// Store active challenges (in production, use Redis)
const activechallenges = new Map<string, {
  challenge: string
  nonce: string
  relyingParty?: string
  callbackURL?: string
  createdAt: number
  expiresAt: number
}>()

/**
 * POST /api/nfc/did-auth
 * Generate DID Auth Challenge (Step 1 - Relying Party requests challenge)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: DIDAuthChallengeRequest = await request.json()
    
    // Generate challenge for the identity owner
    const challengeObj = simpleAuth.generateChallenge(
      body.did || 'unknown',
      body.relyingParty
    )
    
    // Store challenge for verification
    activechallenges.set(challengeObj.nonce, {
      challenge: challengeObj.challenge,
      nonce: challengeObj.nonce,
      relyingParty: body.relyingParty,
      callbackURL: body.callbackURL,
      createdAt: challengeObj.timestamp,
      expiresAt: challengeObj.expiresAt
    })
    
    const response: DIDAuthChallengeResponse = {
      challenge: challengeObj.challenge,
      nonce: challengeObj.nonce,
      expiresAt: new Date(challengeObj.expiresAt).toISOString(),
      callbackURL: body.callbackURL,
      relyingParty: body.relyingParty
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('DID Auth challenge generation failed:', error)
    return NextResponse.json({
      error: 'Failed to generate challenge'
    }, { status: 500 })
  }
}

/**
 * PUT /api/nfc/did-auth
 * Verify DID Auth Response (Step 2 - Identity Owner submits response)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: DIDAuthResponseRequest = await request.json()
    
    // Validate required fields
    if (!body.did || !body.challenge || !body.signature || !body.nonce) {
      return NextResponse.json({
        verified: false,
        error: 'Missing required fields: did, challenge, signature, nonce'
      }, { status: 400 })
    }
    
    // Verify nonce exists and challenge hasn't expired
    const storedChallenge = activechallenges.get(body.nonce)
    if (!storedChallenge) {
      return NextResponse.json({
        verified: false,
        error: 'Challenge not found or expired'
      }, { status: 400 })
    }
    
    // Check expiration
    if (Date.now() > storedChallenge.expiresAt) {
      activechallenges.delete(body.nonce)
      return NextResponse.json({
        verified: false,
        error: 'Challenge has expired'
      }, { status: 400 })
    }
    
    // Verify the signature
    const isValid = await simpleAuth.verifyChallenge(
      body.did,
      body.challenge,
      body.signature
    )
    
    if (!isValid) {
      return NextResponse.json({
        verified: false,
        error: 'Invalid signature'
      }, { status: 401 })
    }
    
    // Clean up used challenge
    activechallenges.delete(body.nonce)
    
    // Generate session token for successful authentication
    const sessionToken = `didauth_${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    // Store session (simplified - use proper session management in production)
    // This would integrate with your existing session management
    
    const result: DIDAuthVerificationResult = {
      verified: true,
      did: body.did,
      sessionToken,
      verifiableCredentials: body.verifiableCredentials
    }
    
    // If callback URL provided, could notify relying party
    if (storedChallenge.callbackURL) {
      // In production, make HTTP POST to callback URL with result
      console.log(`Would notify relying party at: ${storedChallenge.callbackURL}`)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('DID Auth verification failed:', error)
    return NextResponse.json({
      verified: false,
      error: 'Verification failed'
    }, { status: 500 })
  }
}

/**
 * GET /api/nfc/did-auth?nonce=xxx
 * Check challenge status (for polling by relying party)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const nonce = url.searchParams.get('nonce')
    
    if (!nonce) {
      return NextResponse.json({
        error: 'Nonce parameter required'
      }, { status: 400 })
    }
    
    const challenge = activechallenges.get(nonce)
    if (!challenge) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Challenge not found or already completed'
      })
    }
    
    if (Date.now() > challenge.expiresAt) {
      activechallenges.delete(nonce)
      return NextResponse.json({
        status: 'expired',
        message: 'Challenge has expired'
      })
    }
    
    return NextResponse.json({
      status: 'pending',
      expiresAt: new Date(challenge.expiresAt).toISOString(),
      relyingParty: challenge.relyingParty
    })
    
  } catch (error) {
    console.error('DID Auth status check failed:', error)
    return NextResponse.json({
      error: 'Status check failed'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/nfc/did-auth
 * Clean up expired challenges (maintenance endpoint)
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const now = Date.now()
    let cleaned = 0
    
    for (const [nonce, challenge] of activechallenges.entries()) {
      if (now > challenge.expiresAt) {
        activechallenges.delete(nonce)
        cleaned++
      }
    }
    
    return NextResponse.json({
      message: `Cleaned ${cleaned} expired challenges`,
      activeChallenges: activechallenges.size
    })
    
  } catch (error) {
    console.error('Challenge cleanup failed:', error)
    return NextResponse.json({
      error: 'Cleanup failed'
    }, { status: 500 })
  }
} 