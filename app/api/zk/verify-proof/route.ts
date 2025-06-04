// --- ZK Proof Verification API Route ---
// Backend verification endpoint for ZK moment count proofs
// ESP32-ready: Hardware will POST proofs to this endpoint

import { NextRequest, NextResponse } from 'next/server'
import { zkProofSystem } from '@/lib/zk/zkProofSystem'
import type { ZKMomentProof } from '@/lib/types'

// --- Request/Response Types ---
interface VerifyProofRequest {
  proof: ZKMomentProof
  metadata?: {
    deviceId?: string
    timestamp?: number
    eventId?: string
  }
}

interface VerifyProofResponse {
  success: boolean
  isValid: boolean
  verificationTime: number
  metadata: {
    threshold: number
    timestamp: number
    verifierUsed: string
  }
  error?: string
}

// --- POST: Verify a ZK proof ---
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request body
    const body: VerifyProofRequest = await request.json()
    
    if (!body.proof) {
      return NextResponse.json({
        success: false,
        isValid: false,
        verificationTime: Date.now() - startTime,
        metadata: {
          threshold: 0,
          timestamp: Date.now(),
          verifierUsed: 'none'
        },
        error: 'No proof provided'
      } as VerifyProofResponse, { status: 400 })
    }

    // Verify the proof using our ZK system
    const isValid = await zkProofSystem.verifyMomentCountProof(body.proof)
    const verificationTime = Date.now() - startTime

    // Log verification attempt (ESP32: Send to monitoring system)
    console.log(`[ZK VERIFY] Proof verification: ${isValid ? 'VALID' : 'INVALID'} (${verificationTime}ms)`, {
      threshold: body.proof.threshold,
      actualCount: body.proof.actualCount,
      deviceId: body.metadata?.deviceId,
      eventId: body.metadata?.eventId
    })

    return NextResponse.json({
      success: true,
      isValid,
      verificationTime,
      metadata: {
        threshold: body.proof.threshold,
        timestamp: body.proof.timestamp,
        verifierUsed: zkProofSystem.getConfig().circuitName
      }
    } as VerifyProofResponse)

  } catch (error) {
    console.error('[ZK VERIFY] Error:', error)
    
    return NextResponse.json({
      success: false,
      isValid: false,
      verificationTime: Date.now() - startTime,
      metadata: {
        threshold: 0,
        timestamp: Date.now(),
        verifierUsed: 'error'
      },
      error: error instanceof Error ? error.message : 'Unknown verification error'
    } as VerifyProofResponse, { status: 500 })
  }
}

// --- GET: Get verification system status ---
export async function GET() {
  try {
    const config = zkProofSystem.getConfig()
    
    return NextResponse.json({
      status: 'operational',
      config: {
        maxMoments: config.maxMoments,
        minThreshold: config.minThreshold,
        circuitName: config.circuitName,
        simulationMode: config.simulationMode
      },
      timestamp: Date.now()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 