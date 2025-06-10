import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/nfc/accounts/all
 * 
 * Production endpoint to retrieve ALL NFC accounts from Vercel KV database
 * This is for admin monitoring dashboard to see global account usage
 */

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

interface DatabaseAccountRecord {
  accountId: string
  chipUID: string
  publicKey: string
  did: string
  createdAt: string
  lastSeen: string
  verificationCount: number
  hasPIN: boolean
  encryptedPIN?: string
  pinSalt?: string
}

// Import shared storage to ensure consistency across API endpoints
import { getAllAccountsFromMemory, getMemoryStorageStats } from '@/lib/nfc/sharedStorage'

export async function GET() {
  try {
    console.log('🔍 GET /api/nfc/accounts/all - Fetching all accounts from database')
    
    const kv = await getKV()
    let allAccounts: DatabaseAccountRecord[] = []
    let dataSource = 'memory-fallback'
    
    if (kv) {
      try {
        // Get all keys that start with our account prefix
        const keys = await kv.keys('nfc:account:*')
        console.log(`📊 Found ${keys.length} account keys in Vercel KV`)
        
        if (keys.length > 0) {
          // Fetch all accounts in parallel
          const accounts = await Promise.all(
            keys.map(async (key) => {
              try {
                const account = await kv.get(key)
                return account as DatabaseAccountRecord
              } catch (error) {
                console.warn(`Failed to fetch account for key ${key}:`, error)
                return null
              }
            })
          )
          
          // Filter out null results
          allAccounts = accounts.filter(account => account !== null) as DatabaseAccountRecord[]
          console.log(`✅ Successfully fetched ${allAccounts.length} accounts from Vercel KV`)
          dataSource = 'vercel-kv'
        }
        
      } catch (error) {
        console.error('❌ Failed to fetch from Vercel KV:', error)
        // Continue with fallback instead of throwing
      }
    }
    
    // Always try memory fallback if KV failed or isn't available
    if (allAccounts.length === 0) {
      console.log('💾 Using shared in-memory storage fallback')
      allAccounts = getAllAccountsFromMemory()
      const storageStats = getMemoryStorageStats()
      console.log(`📊 Memory storage stats:`, storageStats)
      dataSource = 'memory-fallback'
    }
    
    // Sort by creation date (newest first)
    allAccounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Calculate summary statistics
    const stats = {
      totalAccounts: allAccounts.length,
      accountsWithPIN: allAccounts.filter(acc => acc.hasPIN).length,
      totalVerifications: allAccounts.reduce((sum, acc) => sum + acc.verificationCount, 0),
      oldestAccount: allAccounts.length > 0 ? allAccounts[allAccounts.length - 1].createdAt : null,
      newestAccount: allAccounts.length > 0 ? allAccounts[0].createdAt : null,
      last24Hours: allAccounts.filter(acc => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return new Date(acc.createdAt) > yesterday
      }).length
    }
    
    console.log(`📈 Database Stats:`, stats)
    
    return NextResponse.json({
      success: true,
      accounts: allAccounts,
      stats,
      dataSource,
      kvAvailable: !!kv,
      timestamp: new Date().toISOString(),
      message: kv ? 'Using Vercel KV database' : 'Using memory fallback - accounts will not persist across deployments'
    })
    
  } catch (error) {
    console.error('❌ GET /api/nfc/accounts/all error:', error)
    
    // Return a graceful error response instead of 500
    return NextResponse.json({
      success: false,
      accounts: [],
      stats: {
        totalAccounts: 0,
        accountsWithPIN: 0,
        totalVerifications: 0,
        oldestAccount: null,
        newestAccount: null,
        last24Hours: 0
      },
      dataSource: 'error-fallback',
      kvAvailable: false,
      error: 'Database temporarily unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 200 }) // Return 200 instead of 500 for graceful degradation
  }
}

// Also support HEAD requests for health checking
export async function HEAD() {
  try {
    const kv = await getKV()
    const dataSource = kv ? 'vercel-kv' : 'memory-fallback'
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Data-Source': dataSource,
        'X-Timestamp': new Date().toISOString()
      }
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
} 