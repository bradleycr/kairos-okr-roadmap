// ZK Proof Archive API - Privacy-Preserving Bond Analytics
// Stores only public proof data for research and community insights

import { NextRequest, NextResponse } from 'next/server'

// Try to import KV, but handle gracefully if not available
let kv: any = null
try {
  kv = require('@vercel/kv').kv
} catch (error) {
  console.log('⚠️  Vercel KV not available, using in-memory storage for development')
}

// In-memory storage for development when KV is not available
const memoryStore = new Map<string, any>()
const memoryCounters = new Map<string, number>()

// KV-compatible interface for development
const kvInterface = {
  async set(key: string, value: any) {
    if (kv) return kv.set(key, value)
    memoryStore.set(key, value)
    return 'OK'
  },
  
  async get(key: string) {
    if (kv) return kv.get(key)
    return memoryStore.get(key)
  },
  
  async mget(...keys: string[]) {
    if (kv) return kv.mget(...keys)
    return keys.map(key => memoryStore.get(key))
  },
  
  async keys(pattern: string) {
    if (kv) return kv.keys(pattern)
    const regex = new RegExp(pattern.replace('*', '.*'))
    return Array.from(memoryStore.keys()).filter(key => regex.test(key))
  },
  
  async incr(key: string) {
    if (kv) return kv.incr(key)
    const current = memoryCounters.get(key) || 0
    const newValue = current + 1
    memoryCounters.set(key, newValue)
    return newValue
  },
  
  async expire(key: string, seconds: number) {
    if (kv) return kv.expire(key, seconds)
    // In memory, we'll just ignore expiration for development
    return true
  }
}

// ZK Proof Archive Entry - Only Public Data
export interface ZKProofArchiveEntry {
  // Proof Metadata (Public)
  proofId: string                    // Unique proof identifier
  proofType: 'bonding' | 'moment_count' | 'presence'
  timestamp: number                  // When proof was generated
  verificationStatus: 'verified' | 'pending' | 'failed'
  
  // Public Signals (What the proof reveals)
  publicSignals: {
    bondHash?: string                // Unique bond identifier (if bonding proof)
    participantCount?: number        // Number of participants
    locationHash?: string            // Hashed location identifier
    timeWindow?: string              // Time period (e.g., "2024-01-15-afternoon")
    proofValidUntil?: number         // Proof expiration
  }
  
  // Aggregate Analytics (Privacy-Safe)
  analytics: {
    geographicRegion?: string        // City/state level (not precise location)
    eventType?: string               // "conference" | "meetup" | "casual" | "unknown"
    networkSize?: number             // Size of local bonding network
    isFirstTimeUser?: boolean        // New to the system
    deviceType?: string              // "mobile" | "wearable" | "embedded"
  }
  
  // Technical Metadata
  technical: {
    circuitVersion: string           // Which circuit version was used
    provingTime: number              // How long proof took to generate (ms)
    proofSize: number                // Size of proof in bytes
    verificationTime?: number        // How long verification took (ms)
    gasUsed?: number                 // If verified on-chain
  }
  
  // Research Flags (For Community Analysis)
  research: {
    contributes_to_social_graph: boolean
    demonstrates_privacy_preservation: boolean
    shows_authentic_human_interaction: boolean
    enables_community_insights: boolean
  }
}

// Archive Statistics for Community Insights
export interface ZKArchiveStats {
  totalProofs: number
  proofsLast24h: number
  proofsLast7d: number
  proofsLast30d: number
  
  // Geographic Distribution (Privacy-Safe)
  regionDistribution: Record<string, number>
  
  // Temporal Patterns
  hourlyActivity: number[]           // 24-hour activity pattern
  dailyActivity: number[]            // 7-day activity pattern
  
  // Network Effects
  averageNetworkSize: number
  largestNetwork: number
  totalUniqueParticipants: number    // Estimated from proof hashes
  
  // Technology Adoption
  circuitVersions: Record<string, number>
  deviceTypes: Record<string, number>
  averageProvingTime: number
  
  // Community Insights
  privacyPreservationRate: number    // % of interactions that stayed private
  authenticInteractionRate: number   // % verified as authentic
  socialCohesionIndex: number        // Network connectivity metric
}

// Store a ZK proof in the archive
export async function POST(request: NextRequest) {
  try {
    const proofData: ZKProofArchiveEntry = await request.json()
    
    // Validate proof data
    if (!proofData.proofId || !proofData.proofType || !proofData.timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required proof fields' },
        { status: 400 }
      )
    }
    
    // Ensure we're only storing public data
    const sanitizedProof: ZKProofArchiveEntry = {
      proofId: proofData.proofId,
      proofType: proofData.proofType,
      timestamp: proofData.timestamp,
      verificationStatus: proofData.verificationStatus || 'pending',
      publicSignals: proofData.publicSignals || {},
      analytics: {
        geographicRegion: proofData.analytics?.geographicRegion || 'unknown',
        eventType: proofData.analytics?.eventType || 'unknown',
        networkSize: proofData.analytics?.networkSize || 1,
        isFirstTimeUser: proofData.analytics?.isFirstTimeUser || false,
        deviceType: proofData.analytics?.deviceType || 'unknown'
      },
      technical: {
        circuitVersion: proofData.technical?.circuitVersion || '1.0.0',
        provingTime: proofData.technical?.provingTime || 0,
        proofSize: proofData.technical?.proofSize || 0,
        verificationTime: proofData.technical?.verificationTime,
        gasUsed: proofData.technical?.gasUsed
      },
      research: {
        contributes_to_social_graph: proofData.research?.contributes_to_social_graph || true,
        demonstrates_privacy_preservation: proofData.research?.demonstrates_privacy_preservation || true,
        shows_authentic_human_interaction: proofData.research?.shows_authentic_human_interaction || true,
        enables_community_insights: proofData.research?.enables_community_insights || true
      }
    }
    
    // Store in archive with timestamp-based key
    const archiveKey = `zkproof:archive:${proofData.timestamp}:${proofData.proofId}`
    await kvInterface.set(archiveKey, sanitizedProof)
    
    // Update daily statistics
    const today = new Date().toISOString().split('T')[0]
    const dailyKey = `zkproof:daily:${today}`
    await kvInterface.incr(dailyKey)
    await kvInterface.expire(dailyKey, 60 * 60 * 24 * 90) // Keep for 90 days
    
    // Update hourly statistics
    const hour = new Date().getHours()
    const hourlyKey = `zkproof:hourly:${hour}`
    await kvInterface.incr(hourlyKey)
    await kvInterface.expire(hourlyKey, 60 * 60 * 24 * 7) // Keep for 7 days
    
    console.log(`📊 Archived ZK proof: ${proofData.proofId} (${proofData.proofType})`)
    
    return NextResponse.json({
      success: true,
      proofId: proofData.proofId,
      archivedAt: new Date().toISOString(),
      message: 'Proof archived successfully'
    })
    
  } catch (error) {
    console.error('❌ Error archiving ZK proof:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to archive proof' },
      { status: 500 }
    )
  }
}

// Retrieve archive statistics and recent proofs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const proofType = searchParams.get('type')
    const timeRange = searchParams.get('range') || '7d'
    
    // Calculate time range
    const now = Date.now()
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }
    const timeWindow = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['7d']
    const startTime = now - timeWindow
    
    // Get all proof keys in time range
    const allKeys = await kvInterface.keys('zkproof:archive:*')
    const recentKeys = allKeys.filter(key => {
      const timestamp = parseInt(key.split(':')[2])
      return timestamp >= startTime
    }).sort((a, b) => {
      const timestampA = parseInt(a.split(':')[2])
      const timestampB = parseInt(b.split(':')[2])
      return timestampB - timestampA // Most recent first
    }).slice(0, limit)
    
    // Fetch proof data
    const proofs: ZKProofArchiveEntry[] = []
    if (recentKeys.length > 0) {
      const proofData = await kvInterface.mget(...recentKeys)
      proofs.push(...proofData.filter(Boolean) as ZKProofArchiveEntry[])
    }
    
    // Filter by proof type if specified
    const filteredProofs = proofType 
      ? proofs.filter(proof => proof.proofType === proofType)
      : proofs
    
    // Calculate statistics
    const stats = await calculateArchiveStats(filteredProofs, timeWindow)
    
    return NextResponse.json({
      success: true,
      proofs: filteredProofs,
      stats,
      timeRange,
      totalReturned: filteredProofs.length,
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error retrieving ZK archive:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve archive' },
      { status: 500 }
    )
  }
}

// Calculate comprehensive statistics for community insights
async function calculateArchiveStats(proofs: ZKProofArchiveEntry[], timeWindow: number): Promise<ZKArchiveStats> {
  const now = Date.now()
  const oneDayAgo = now - (24 * 60 * 60 * 1000)
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000)
  
  // Basic counts
  const totalProofs = proofs.length
  const proofsLast24h = proofs.filter(p => p.timestamp >= oneDayAgo).length
  const proofsLast7d = proofs.filter(p => p.timestamp >= oneWeekAgo).length
  const proofsLast30d = proofs.filter(p => p.timestamp >= oneMonthAgo).length
  
  // Geographic distribution (privacy-safe)
  const regionDistribution: Record<string, number> = {}
  proofs.forEach(proof => {
    const region = proof.analytics.geographicRegion || 'unknown'
    regionDistribution[region] = (regionDistribution[region] || 0) + 1
  })
  
  // Temporal patterns
  const hourlyActivity = new Array(24).fill(0)
  const dailyActivity = new Array(7).fill(0)
  proofs.forEach(proof => {
    const date = new Date(proof.timestamp)
    hourlyActivity[date.getHours()]++
    dailyActivity[date.getDay()]++
  })
  
  // Network effects
  const networkSizes = proofs.map(p => p.analytics.networkSize || 1)
  const averageNetworkSize = networkSizes.reduce((a, b) => a + b, 0) / networkSizes.length || 0
  const largestNetwork = Math.max(...networkSizes, 0)
  
  // Estimate unique participants from bond hashes
  const uniqueBondHashes = new Set(
    proofs
      .filter(p => p.publicSignals.bondHash)
      .map(p => p.publicSignals.bondHash)
  )
  const totalUniqueParticipants = uniqueBondHashes.size * 2 // Each bond involves 2 people
  
  // Technology adoption
  const circuitVersions: Record<string, number> = {}
  const deviceTypes: Record<string, number> = {}
  let totalProvingTime = 0
  
  proofs.forEach(proof => {
    const version = proof.technical.circuitVersion
    circuitVersions[version] = (circuitVersions[version] || 0) + 1
    
    const device = proof.analytics.deviceType || 'unknown'
    deviceTypes[device] = (deviceTypes[device] || 0) + 1
    
    totalProvingTime += proof.technical.provingTime
  })
  
  const averageProvingTime = totalProofs > 0 ? totalProvingTime / totalProofs : 0
  
  // Community insights
  const privacyPreservingProofs = proofs.filter(p => p.research.demonstrates_privacy_preservation).length
  const authenticProofs = proofs.filter(p => p.research.shows_authentic_human_interaction).length
  
  const privacyPreservationRate = totalProofs > 0 ? privacyPreservingProofs / totalProofs : 0
  const authenticInteractionRate = totalProofs > 0 ? authenticProofs / totalProofs : 0
  
  // Social cohesion index (based on network connectivity)
  const socialCohesionIndex = averageNetworkSize / Math.max(largestNetwork, 1)
  
  return {
    totalProofs,
    proofsLast24h,
    proofsLast7d,
    proofsLast30d,
    regionDistribution,
    hourlyActivity,
    dailyActivity,
    averageNetworkSize,
    largestNetwork,
    totalUniqueParticipants,
    circuitVersions,
    deviceTypes,
    averageProvingTime,
    privacyPreservationRate,
    authenticInteractionRate,
    socialCohesionIndex
  }
} 