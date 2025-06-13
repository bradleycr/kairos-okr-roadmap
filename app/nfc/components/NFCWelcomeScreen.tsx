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
import { ZapIcon, ScanLineIcon, SettingsIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'

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
    <div className="text-center w-full max-w-sm mx-auto">
      {/* Key Authentication Message */}
      <div className="space-y-6 mb-12">
        <div className="space-y-3">
          <h2 className="text-xl font-mono font-light text-foreground/80">
            Connect your key
          </h2>
          <p className="text-sm text-muted-foreground/70 font-mono max-w-xs mx-auto leading-relaxed">
            Bring your MELD pendant near your phone (top for iPhone, middle for Android) to authenticate
          </p>
        </div>

        {/* Phone/Device Visual */}
        <div className="flex justify-center">
          <div className="w-20 h-28 bg-muted/20 rounded-xl border border-muted-foreground/10 flex items-center justify-center relative">
            <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-muted-foreground/20"></div>
            </div>
            {/* NFC indicator */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* More Options Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-muted-foreground hover:text-foreground font-mono text-sm px-0 h-auto flex items-center gap-2 transition-colors duration-200"
        >
          More options
          {showDropdown ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </Button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-card/95 backdrop-blur-sm border border-muted-foreground/20 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Run Simulation */}
            <button
              onClick={() => handleOptionClick('/nfc-test')}
              className="w-full px-4 py-3 text-left hover:bg-muted/20 transition-colors duration-200 flex items-center gap-3 border-b border-muted-foreground/10"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <ZapIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-medium text-foreground">
                  Run simulation
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  Test the authentication flow
                </div>
              </div>
            </button>

            {/* Tap Unprogrammed Card */}
            <button
              onClick={() => handleOptionClick('/nfc/scan')}
              className="w-full px-4 py-3 text-left hover:bg-muted/20 transition-colors duration-200 flex items-center gap-3 border-b border-muted-foreground/10"
            >
              <div className="p-2 bg-secondary/10 rounded-lg">
                <ScanLineIcon className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-medium text-foreground">
                  Tap unprogrammed card
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  Scan and identify NFC chips
                </div>
              </div>
            </button>

            {/* Configure a Card */}
            <button
              onClick={() => handleOptionClick('/chip-config')}
              className="w-full px-4 py-3 text-left hover:bg-muted/20 transition-colors duration-200 flex items-center gap-3"
            >
              <div className="p-2 bg-accent/10 rounded-lg">
                <SettingsIcon className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-medium text-foreground">
                  Configure a card
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
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