/**
 * 🔗 Ultra-Short NFC URL Handler
 * 
 * Handles /n/[id] routes for maximum NFC URL compression.
 * Expands short IDs back to full authentication parameters.
 */

import { NextRequest, NextResponse } from 'next/server'
import { expandShortNFCUrl } from '@/lib/url-shortener'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id || id.length < 4) {
      return NextResponse.redirect(new URL('/nfc?error=invalid_id', request.url))
    }
    
    // Expand the short URL to full authentication data
    const expandedData = expandShortNFCUrl(id)
    
    if (!expandedData) {
      return NextResponse.redirect(new URL('/nfc?error=not_found', request.url))
    }
    
    // Redirect to NFC verification with full parameters
    const nfcUrl = new URL('/nfc', request.url)
    nfcUrl.searchParams.set('did', expandedData.did)
    nfcUrl.searchParams.set('signature', expandedData.signature)
    nfcUrl.searchParams.set('publicKey', expandedData.publicKey)
    nfcUrl.searchParams.set('uid', expandedData.chipUID)
    nfcUrl.searchParams.set('source', 'short_url')
    nfcUrl.searchParams.set('timestamp', expandedData.timestamp.toString())
    
    return NextResponse.redirect(nfcUrl, { status: 302 })
    
  } catch (error) {
    console.error('Short URL expansion failed:', error)
    return NextResponse.redirect(new URL('/nfc?error=expansion_failed', request.url))
  }
} 