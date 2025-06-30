/**
 * KairOS Installation Middleware
 * Handles subdomain routing for specialized art installations
 * Enables custom auth flows and experiences per installation
 */

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Extract subdomain from hostname
  const subdomain = extractSubdomain(hostname)
  
  // If we have a subdomain (installation), handle it
  if (subdomain && subdomain !== 'www') {
    return handleInstallationRouting(request, subdomain, url)
  }
  
  // Continue with normal routing for main domain
  return NextResponse.next()
}

function extractSubdomain(hostname: string): string | null {
  // Handle different environments
  const isProduction = hostname.includes('kair-os.vercel.app')
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  if (isProduction) {
    // Extract subdomain from production: "wof.kair-os.vercel.app" -> "wof"
    const parts = hostname.split('.')
    if (parts.length > 3) {
      return parts[0]
    }
  } else if (isLocalhost && hostname.includes('.')) {
    // Handle local development: "way-of-flowers.localhost:3000" -> "way-of-flowers"
    const parts = hostname.split('.')
    if (parts.length > 1 && !parts[0].includes(':')) {
      let subdomain = parts[0]
      // Remove port if present
      if (subdomain.includes(':')) {
        subdomain = subdomain.split(':')[0]
      }
      return subdomain
    }
  }
  
  return null
}

function handleInstallationRouting(
  request: NextRequest, 
  installation: string, 
  url: URL
): NextResponse {
  
  // Set installation context in headers for the app to use
  const response = NextResponse.next()
  response.headers.set('x-installation-id', installation)
  response.headers.set('x-installation-context', 'true')
  
  // Rewrite to installation-specific routes if they exist
  const pathname = url.pathname
  
  // Root path goes to installation experience
  if (pathname === '/') {
    url.pathname = `/installation/${installation}`
    return NextResponse.rewrite(url)
  }
  
  // Handle specific known installations
  if (installation === 'wof' || installation === 'way-of-flowers') {
    url.pathname = '/installation/way-of-flowers'
    return NextResponse.rewrite(url)
  }
  
  // NFC routes get installation context
  if (pathname.startsWith('/nfc')) {
    response.headers.set('x-installation-nfc', 'true')
    return response
  }
  
  // API routes get installation context
  if (pathname.startsWith('/api')) {
    response.headers.set('x-installation-api', installation)
    return response
  }
  
  // Continue with normal routing but with installation context
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|manifest.json|sw.js).*)',
  ],
} 