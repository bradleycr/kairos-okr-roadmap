import { NextRequest, NextResponse } from 'next/server'
import { generateKeypair, createDIDFromPublicKey, signMessage } from '@/lib/crypto/server'

// --- POST: Generate Ed25519 Keypair and Signature ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chipUID } = body
    
    if (!chipUID) {
      return NextResponse.json({
        success: false,
        error: 'chipUID is required'
      }, { status: 400 })
    }
    
    // Generate real Ed25519 keypair using @noble/ed25519
    const { privateKey, publicKey } = await generateKeypair()
    
    // Create a challenge message to sign (proves ownership of private key)
    // This MUST match the format expected by the verification API
    const challengeMessage = `KairOS_NFC_Challenge_${chipUID}`
    
    // Sign the challenge with the private key
    const signatureBytes = await signMessage(challengeMessage, privateKey)
    
    // Create DID from public key
    const did = createDIDFromPublicKey(publicKey)
    
    return NextResponse.json({
      success: true,
      chipUID,
      privateKey: Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      publicKey: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      signature: Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
      privateKeyBytes: Array.from(privateKey),
      publicKeyBytes: Array.from(publicKey),
      challengeMessage,
      did,
      timestamp: Date.now()
    })
    
  } catch (error) {
    console.error('Crypto generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 