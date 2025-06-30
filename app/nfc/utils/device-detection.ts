/**
 * Device Detection & Capability Analysis
 * 
 * Professional-grade device detection for optimal NFC authentication UX
 * Supports Android intent optimization and iOS native NFC reading
 */

import type { DeviceCapabilities } from '../types/nfc.types'

export class DeviceDetector {
  private static instance: DeviceDetector
  private capabilities: DeviceCapabilities | null = null

  public static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector()
    }
    return DeviceDetector.instance
  }

  /**
   * Detect comprehensive device capabilities
   */
  public detectCapabilities(): DeviceCapabilities {
    if (this.capabilities) return this.capabilities

    const userAgent = navigator.userAgent.toLowerCase()
    
    const isAndroid = userAgent.includes('android')
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
    const isIPhone = userAgent.includes('iphone') || userAgent.includes('ipad')
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
    const canUseIntent = isAndroid && typeof window !== 'undefined'
    const supportsWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window

    this.capabilities = {
      isAndroid,
      isChrome,
      isIPhone,
      isSafari,
      canUseIntent,
      supportsWebNFC
    }

    return this.capabilities
  }

  /**
   * Generate Android Chrome intent URL for optimal NFC experience
   */
  public generateChromeIntentURL(httpsUrl: string): string {
    const intentUrl = httpsUrl.replace('https://', '')
    return `intent://${intentUrl}#Intent;scheme=https;package=com.android.chrome;end`
  }

  /**
   * Check if current environment is optimal for NFC operations
   */
  public isOptimalNFCEnvironment(): boolean {
    const caps = this.detectCapabilities()
    
    // Chrome on Android or Safari on iOS are optimal
    return (caps.isAndroid && caps.isChrome) || (caps.isIPhone && caps.isSafari)
  }

  /**
   * Get user-friendly device recommendations
   */
  public getOptimizationRecommendations(): {
    shouldPromptChromeSwitch: boolean
    message: string
    actionText?: string
  } {
    const caps = this.detectCapabilities()

    if (caps.isAndroid && !caps.isChrome) {
      return {
        shouldPromptChromeSwitch: true,
        message: 'Chrome provides better NFC authentication support on Android devices.',
        actionText: 'Open in Chrome'
      }
    }

    if (caps.isIPhone) {
      return {
        shouldPromptChromeSwitch: false,
        message: 'NFC authentication works well on Safari with your iPhone\'s native NFC reading capabilities.'
      }
    }

    return {
      shouldPromptChromeSwitch: false,
      message: 'Your browser supports NFC authentication.'
    }
  }
} 