/**
 * NFCWelcomeScreen Component
 * 
 * Minimal welcome interface matching the holographic KairOS aesthetic
 * Elegant guidance for cryptographic key authentication and pendant setup
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ZapIcon, ScanLineIcon, SettingsIcon, ChevronUpIcon, ChevronDownIcon, SmartphoneIcon } from 'lucide-react'

// Animated NFC Instruction Component
function AnimatedNFCInstruction() {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  useEffect(() => {
    // Detect device type - mobile first, then OS
    const userAgent = navigator.userAgent.toLowerCase()
    
    // Check if it's a mobile device first
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent) ||
                     (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform))
    
    if (!isMobile) {
      setDeviceType('desktop')
      return
    }

    // Now check mobile OS type
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      setDeviceType('ios')
    } else if (userAgent.includes('android')) {
      setDeviceType('android')
    } else {
      setDeviceType('unknown')
    }
  }, [])

  const getInstructionText = () => {
    switch (deviceType) {
      case 'ios':
        return 'Hold pendant near the TOP of your iPhone'
      case 'android':
        return 'Hold pendant against the MIDDLE BACK of your Android'
      case 'desktop':
        return 'Open this page on your mobile device to use NFC'
      default:
        return 'Hold pendant near your phone (top for iPhone, middle back for Android)'
    }
  }

  const getTapZonePosition = () => {
    switch (deviceType) {
      case 'ios':
        return 'top-2' // Top of phone for iPhone
      case 'android':
        return 'top-1/2 -translate-y-1/2' // Middle for Android
      case 'desktop':
        return 'top-1/3' // Generic position for desktop
      default:
        return 'top-1/3' // Default position
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Device-specific instruction text */}
      <p className="text-sm sm:text-base text-muted-foreground/80 font-mono max-w-xs mx-auto leading-relaxed px-2 text-center">
        {getInstructionText()}
      </p>

      {/* Animated Phone Diagram */}
      <div className="relative flex justify-center py-4">
        {/* Phone Body */}
        <div className="relative w-28 h-40 sm:w-32 sm:h-44 bg-gradient-to-b from-muted/30 to-muted/20 rounded-2xl border-2 border-muted-foreground/20 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg">
          
          {/* Screen */}
          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-card/40 rounded-lg border border-muted-foreground/10 flex items-center justify-center relative overflow-hidden">
            <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
            
            {/* Screen glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-accent/5 rounded-lg animate-pulse"></div>
          </div>

          {/* Home indicator (modern phones) */}
          <div className="w-8 h-1 bg-muted-foreground/20 rounded-full mt-2"></div>

          {/* NFC Tap Zone Indicator */}
          <div className={`absolute ${getTapZonePosition()} left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14`}>
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDelay: '1s' }}></div>
            
            {/* Center indicator */}
            <div className="absolute inset-0 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/40 flex items-center justify-center">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Back panel indicator for Android */}
          {deviceType === 'android' && (
            <>
              {/* Back panel visualization */}
              <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary/20 -translate-x-1 translate-y-1 -z-10 bg-muted/10"></div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-x-1 translate-y-1 text-[10px] font-mono text-primary/60 bg-background/80 px-1 rounded">
                BACK
              </div>
            </>
          )}
        </div>

        {/* Floating pendant animation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-8 h-8 sm:w-10 sm:h-10">
          {/* Pendant */}
          <div className="w-full h-full bg-gradient-to-br from-accent/80 to-secondary/80 rounded-full border-2 border-accent/40 flex items-center justify-center shadow-lg animate-bounce">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          {/* Connection lines */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-primary/60 to-transparent animate-pulse"></div>
          
          {/* Floating sparkles */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping"></div>
          <div className="absolute -top-2 left-0 w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-secondary rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
        </div>

        {/* Scanning waves */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-primary/20 animate-ping"></div>
          <div className="absolute w-40 h-40 sm:w-44 sm:h-44 rounded-full border border-accent/15 animate-ping" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute w-48 h-48 sm:w-52 sm:h-52 rounded-full border border-secondary/10 animate-ping" style={{ animationDelay: '1.6s' }}></div>
        </div>
      </div>

      {/* Device type indicator */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/60">
        <SmartphoneIcon className="w-3 h-3" />
        <span>
          {deviceType === 'ios' && 'iPhone detected'}
          {deviceType === 'android' && 'Android detected'}
          {deviceType === 'desktop' && 'Desktop browser - use mobile for NFC'}
          {deviceType === 'unknown' && 'Mobile device - hold near NFC area'}
        </span>
      </div>
    </div>
  )
}

export function NFCWelcomeScreen() {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (route: string) => {
    setShowDropdown(false)
    router.push(route)
  }

  return (
    <div className="text-center w-full max-w-sm mx-auto px-4">
      {/* Key Authentication Message - Better mobile spacing */}
      <div className="space-y-8 mb-16">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-mono font-light text-foreground/90 leading-tight">
            Connect your key
          </h2>
        </div>

        {/* Animated NFC Instruction */}
        <AnimatedNFCInstruction />
      </div>

      {/* More Options Dropdown - Better mobile positioning */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-muted-foreground hover:text-foreground font-mono text-sm px-4 py-3 h-auto flex items-center gap-2 transition-colors duration-200 hover:bg-muted/20 rounded-lg"
        >
          More options
          {showDropdown ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </Button>

        {/* Dropdown Menu - Improved mobile layout */}
        {showDropdown && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 sm:w-80 bg-card/96 backdrop-blur-lg border border-muted-foreground/20 rounded-xl shadow-xl shadow-primary/10 z-50 overflow-hidden">
            {/* Run Simulation */}
            <button
              onClick={() => handleOptionClick('/nfc-test')}
              className="w-full px-5 py-4 text-left hover:bg-muted/20 transition-colors duration-200 flex items-center gap-4 border-b border-muted-foreground/10"
            >
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <ZapIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium text-foreground">
                  Run simulation
                </div>
                <div className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                  Test the authentication flow
                </div>
              </div>
            </button>

            {/* Tap Unprogrammed Card */}
            <button
              onClick={() => handleOptionClick('/nfc/scan')}
              className="w-full px-5 py-4 text-left hover:bg-muted/20 transition-colors duration-200 flex items-center gap-4 border-b border-muted-foreground/10"
            >
              <div className="p-2.5 bg-secondary/10 rounded-lg">
                <ScanLineIcon className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium text-foreground">
                  Tap unprogrammed card
                </div>
                <div className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                  Scan and identify NFC chips
                </div>
              </div>
            </button>

            {/* Configure a Card */}
            <button
              onClick={() => handleOptionClick('/chip-config')}
              className="w-full px-5 py-4 text-left hover:bg-muted/20 transition-colors duration-200 flex items-center gap-4"
            >
              <div className="p-2.5 bg-accent/10 rounded-lg">
                <SettingsIcon className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium text-foreground">
                  Configure a card
                </div>
                <div className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                  Program new NFC pendants
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 