import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const kv = await getKV()
    
    if (kv) {
      // Test database connection
      await kv.get('health-check')
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          available: true,
          provider: process.env.STORAGE_KV_REST_API_URL ? 'upstash-redis' : 
                   process.env.UPSTASH_REDIS_REST_URL ? 'upstash-redis-manual' :
                   'vercel-kv',
          error: null
        }
      })
    } else {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          available: false,
          provider: 'memory-fallback',
          error: 'No database credentials configured'
        }
      })
    }
  } catch (error) {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        available: false,
        provider: 'error',
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    })
  }
} 