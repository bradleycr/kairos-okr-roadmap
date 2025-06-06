/**
 * useDeviceDetection Hook
 * 
 * Smart device detection with optimization recommendations
 * Provides seamless UX across different platforms and browsers
 */

import { useState, useEffect, useCallback } from 'react'
import type { DeviceCapabilities } from '../types/nfc.types'
import { DeviceDetector } from '../utils/device-detection'

export function useDeviceDetection() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null)
  const [isDetecting, setIsDetecting] = useState(true)

  useEffect(() => {
    const detector = DeviceDetector.getInstance()
    const caps = detector.detectCapabilities()
    setCapabilities(caps)
    setIsDetecting(false)
  }, [])

  const openInChrome = useCallback(() => {
    if (!capabilities?.canUseIntent) return false

    const detector = DeviceDetector.getInstance()
    const currentUrl = window.location.href
    const intentUrl = detector.generateChromeIntentURL(currentUrl)
    
    try {
      window.location.href = intentUrl
      return true
    } catch (error) {
      console.warn('Chrome intent failed:', error)
      return false
    }
  }, [capabilities])

  const getOptimizationRecommendations = useCallback(() => {
    if (!capabilities) return null

    const detector = DeviceDetector.getInstance()
    return detector.getOptimizationRecommendations()
  }, [capabilities])

  const isOptimalEnvironment = useCallback(() => {
    if (!capabilities) return false

    const detector = DeviceDetector.getInstance()
    return detector.isOptimalNFCEnvironment()
  }, [capabilities])

  return {
    capabilities,
    isDetecting,
    openInChrome,
    getOptimizationRecommendations,
    isOptimalEnvironment
  }
} 