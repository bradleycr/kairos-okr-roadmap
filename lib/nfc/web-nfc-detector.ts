/**
 * 🌐 Web NFC Capability Detection for KairOS
 * 
 * Provides detection of Web NFC API support across browsers and devices.
 * Implements progressive enhancement patterns to gracefully fallback when unsupported.
 * 
 * @author KairOS Team  
 * @version 1.0.0
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API
 */

// --- Browser & Device Support Matrix ---
interface NFCSupport {
  hasNDEFReader: boolean
  isSupportedBrowser: boolean  
  isSupportedPlatform: boolean
  hasSecureContext: boolean
  estimatedReliability: 'high' | 'medium' | 'low' | 'none'
}

interface NFCCompatibility {
  supported: boolean
  reason?: string
  recommendations: string[]
  fallbackRequired: boolean
}

export interface NFCListeningSession {
  isListening: boolean
  startedAt?: number
  timeout?: NodeJS.Timeout
  purpose: 'auth' | 'confirmation' | 'transaction'
  onSuccess?: (chipUID: string) => void
  onError?: (error: Error) => void
}

/**
 * 🔍 Web NFC Capability Detector
 * 
 * Provides comprehensive detection of Web NFC support with detailed
 * compatibility information and user-friendly recommendations.
 */
export class WebNFCDetector {
  
  /**
   * 🎯 Primary Support Detection
   * 
   * Performs comprehensive check for Web NFC API availability
   * across different browsers and platforms.
   */
  static async detectSupport(): Promise<NFCSupport> {
    const hasNDEFReader = 'NDEFReader' in window
    const isSecureContext = window.isSecureContext
    
    // Browser detection with pattern matching
    const userAgent = navigator.userAgent.toLowerCase()
    const isSupportedBrowser = this.checkBrowserSupport(userAgent)
    const isSupportedPlatform = this.checkPlatformSupport(userAgent)
    
    return {
      hasNDEFReader,
      isSupportedBrowser,
      isSupportedPlatform, 
      hasSecureContext: isSecureContext,
      estimatedReliability: this.calculateReliability(
        hasNDEFReader, 
        isSupportedBrowser, 
        isSupportedPlatform, 
        isSecureContext
      )
    }
  }

  /**
   * 🚀 Complete Compatibility Assessment
   * 
   * Provides detailed compatibility analysis with actionable recommendations
   * for users on different platforms and browsers.
   */
  static async checkCompatibility(): Promise<NFCCompatibility> {
    const support = await this.detectSupport()
    
    // Full support - ready to use! 🎉
    if (support.estimatedReliability === 'high') {
      return {
        supported: true,
        recommendations: [
          '✅ Your browser fully supports Web NFC writing',
          '📱 Direct NFC tag writing is available',
          '⚡ Fastest workflow for programming NFC tags'
        ],
        fallbackRequired: false
      }
    }
    
    // Partial support - might work 🤞
    if (support.estimatedReliability === 'medium') {
      return {
        supported: true,
        reason: 'Limited Web NFC support detected',
        recommendations: [
          '⚠️ Web NFC may work but could be unreliable',
          '📋 Copy-paste method recommended as backup',
          '🔄 Try both methods to see what works best'
        ],
        fallbackRequired: true
      }
    }
    
    // No support - graceful degradation 📱
    return {
      supported: false,
      reason: this.getUnsupportedReason(support),
      recommendations: this.getUnsupportedRecommendations(support),
      fallbackRequired: true
    }
  }

  /**
   * 🔐 Permission & Access Verification
   * 
   * Tests actual NFC permissions and hardware availability
   * with timeout and error handling.
   */
  static async verifyNFCAccess(timeoutMs: number = 3000): Promise<boolean> {
    try {
      // Create abort controller for graceful timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      const reader = new NDEFReader()
      
      // Test scan ability (this triggers permission prompt if needed)
      await reader.scan({ signal: controller.signal })
      
      // If we get here, permissions are granted
      clearTimeout(timeoutId)
      controller.abort() // Stop scanning
      
      return true
      
    } catch (error: any) {
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        console.warn('🚫 NFC permission denied by user')
      } else if (error.name === 'NotSupportedError') {
        console.warn('🔧 NFC hardware not available')
      } else if (error.name === 'AbortError') {
        console.warn('⏱️ NFC access verification timed out')
      } else {
        console.warn('❓ Unknown NFC error:', error.message)
      }
      
      return false
    }
  }

  // --- Private Support Detection Methods ---
  
  private static checkBrowserSupport(userAgent: string): boolean {
    // Web NFC is supported in Chrome, Edge, and other Chromium-based browsers
    return (
      userAgent.includes('chrome') || 
      userAgent.includes('edg/') || 
      userAgent.includes('chromium') ||
      userAgent.includes('opera')
    ) && !userAgent.includes('ios') // Exclude Chrome iOS (uses Safari engine)
  }
  
  private static checkPlatformSupport(userAgent: string): boolean {
    // Primary support is Android, but allow desktop for development and testing
    const isAndroid = userAgent.includes('android')
    const isDesktop = !userAgent.includes('mobile') && !userAgent.includes('tablet')
    
    // Return true for Android (full support) or desktop (limited support for testing)
    return isAndroid || isDesktop
  }
  
  private static calculateReliability(
    hasAPI: boolean, 
    browserOK: boolean, 
    platformOK: boolean, 
    secureContext: boolean
  ): NFCSupport['estimatedReliability'] {
    
    if (!hasAPI || !secureContext) return 'none'
    
          // Optimal conditions: Chrome/Edge on Android with HTTPS
    if (browserOK && platformOK) return 'high'
    
    // Partial support: Right browser but wrong platform, or vice versa
    if (browserOK || platformOK) return 'medium'
    
    // API exists but suboptimal conditions
    return 'low'
  }
  
  private static getUnsupportedReason(support: NFCSupport): string {
    if (!support.hasSecureContext) {
      return 'Web NFC requires HTTPS (secure context)'
    }
    
    if (!support.hasNDEFReader) {
      return 'Browser does not support Web NFC API'
    }
    
    if (!support.isSupportedBrowser && !support.isSupportedPlatform) {
      return 'Web NFC works best on Chrome/Edge browsers on Android devices'
    }
    
    if (!support.isSupportedBrowser) {
      return 'Chrome or Edge browser recommended for Web NFC'
    }
    
    if (!support.isSupportedPlatform) {
      return 'Android devices have the best Web NFC support'
    }
    
    return 'Web NFC support is limited on this device/browser combination'
  }
  
  private static getUnsupportedRecommendations(support: NFCSupport): string[] {
    const recommendations: string[] = []
    
    if (!support.hasSecureContext) {
      recommendations.push('🔒 Access site via HTTPS for Web NFC support')
    }
    
    if (!support.isSupportedBrowser) {
      recommendations.push('🌐 Try Chrome or Edge browser for best NFC support')
    }
    
    if (!support.isSupportedPlatform) {
      recommendations.push('📱 Android devices have the most reliable Web NFC')
    }
    
    // Always include copy-paste as reliable fallback
    recommendations.push('📋 Use copy-paste method with NFC Tools app (works everywhere!)')
    recommendations.push('🛠️ Download "NFC Tools" from your app store for universal NFC writing')
    
    return recommendations
  }
}

/**
 * 🎨 NFC Support Status Indicator
 * 
 * Provides visual status indicators for different support levels
      * with emoji and color coding.
 */
export class NFCStatusIndicator {
  
  static getStatusEmoji(reliability: NFCSupport['estimatedReliability']): string {
    const emojiMap = {
      high: '🚀',    // Full speed ahead!
      medium: '⚠️',  // Proceed with caution
      low: '🔧',     // Might need some work
      none: '📋'     // Use the copy-paste method
    }
    
    return emojiMap[reliability]
  }
  
  static getStatusMessage(reliability: NFCSupport['estimatedReliability']): string {
    const messageMap = {
      high: 'Direct NFC writing available',
      medium: 'Limited NFC support detected', 
      low: 'Experimental NFC support',
      none: 'Copy-paste method recommended'
    }
    
    return messageMap[reliability]
  }
  
  static getStatusColor(reliability: NFCSupport['estimatedReliability']): string {
    const colorMap = {
      high: 'text-green-600',
      medium: 'text-yellow-600',
      low: 'text-orange-600', 
      none: 'text-gray-600'
    }
    
    return colorMap[reliability]
  }
}

class EnhancedNFCDetector {
  private listeningSession: NFCListeningSession | null = null
  private static instance: EnhancedNFCDetector

  static getInstance(): EnhancedNFCDetector {
    if (!EnhancedNFCDetector.instance) {
      EnhancedNFCDetector.instance = new EnhancedNFCDetector()
    }
    return EnhancedNFCDetector.instance
  }

  // Enhanced method for button-triggered listening
  async startListeningMode(options: {
    purpose: 'auth' | 'confirmation' | 'transaction'
    timeoutMs?: number
    onSuccess?: (chipUID: string) => void
    onError?: (error: Error) => void
  }): Promise<boolean> {
    try {
      // Stop any existing listening session
      await this.stopListening()

      if (!('NDEFReader' in window)) {
        throw new Error('Web NFC not supported on this device')
      }

      const reader = new NDEFReader()
      
      // Request permission first
      await reader.scan()

      // Set up listening session
      this.listeningSession = {
        isListening: true,
        startedAt: Date.now(),
        purpose: options.purpose,
        onSuccess: options.onSuccess,
        onError: options.onError
      }

      // Set timeout (default 40 seconds like Cursive)
      const timeoutMs = options.timeoutMs || 40000
      this.listeningSession.timeout = setTimeout(() => {
        this.stopListening()
        options.onError?.(new Error('NFC listening timeout'))
      }, timeoutMs)

      // Listen for readings
      reader.addEventListener('reading', (event) => {
        this.handleNFCReading(event)
      })

      reader.addEventListener('readingerror', (error) => {
        this.stopListening()
        options.onError?.(error)
      })

      console.log(`🎯 NFC listening started for ${options.purpose}`)
      return true

    } catch (error) {
      console.error('❌ Failed to start NFC listening:', error)
      options.onError?.(error as Error)
      return false
    }
  }

  private async handleNFCReading(event: NDEFReadingEvent) {
    try {
      const { serialNumber } = event
      const chipUID = Array.from(new Uint8Array(serialNumber!))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(':')
        .toUpperCase()

      console.log(`📱 NFC ${this.listeningSession?.purpose} detected:`, chipUID)

      // Call success handler
      this.listeningSession?.onSuccess?.(chipUID)
      
      // Stop listening after successful read
      await this.stopListening()

    } catch (error) {
      console.error('❌ Error processing NFC reading:', error)
      this.listeningSession?.onError?.(error as Error)
      await this.stopListening()
    }
  }

  async stopListening(): Promise<void> {
    if (this.listeningSession?.timeout) {
      clearTimeout(this.listeningSession.timeout)
    }
    
    this.listeningSession = null
    console.log('🛑 NFC listening stopped')
  }

  isCurrentlyListening(): boolean {
    return this.listeningSession?.isListening || false
  }

  getCurrentListeningPurpose(): string | null {
    return this.listeningSession?.purpose || null
  }
}

// Export enhanced detector
export const enhancedNFCDetector = EnhancedNFCDetector.getInstance()

// --- Export Types for TypeScript Excellence ---
export type { NFCSupport, NFCCompatibility } 