"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * KairOS Main Landing Page
 * 
 * Minimal holographic interface with sophisticated visual effects
 * Elegant entrance to the cryptographic authentication system
 */
export default function HomePage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse movement for holographic effects (only on hover-capable devices)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.matchMedia('(hover: hover)').matches) {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleTapToBegin = () => {
    console.log('Tap to begin clicked')
    router.push('/nfc')
  }

  const handleMainAction = () => {
    console.log('Main action clicked - going to NFC test')
    router.push('/nfc-test')
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Holographic Background Effects */}
      <div className="absolute inset-0 z-0">
        {/* Primary gradient flows */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse duration-700" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/3 via-transparent to-primary/3 animate-pulse duration-1000" />
        
        {/* Floating holographic particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary/40 rounded-full animate-ping duration-700" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-secondary/40 rounded-full animate-ping duration-1000 delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-accent/40 rounded-full animate-ping duration-700 delay-2000" />
        
        {/* Mouse tracking holographic effect */}
        <div 
          className="absolute inset-0 opacity-40 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,181,145,0.15) 0%, transparent 50%)`
          }}
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(144,193,196,0.12) 0%, transparent 60%)`
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center">
        {/* Logo */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-mono font-light tracking-wider text-foreground">
              kairOS
            </h1>
            <div className="mt-1 mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm text-muted-foreground/60 font-mono tracking-wide">
                by MELD
              </p>
            </div>
            <div className="mt-1 sm:mt-2">
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground/70 font-mono tracking-wide max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed">
                Protocols for collective intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Central Holographic Interface */}
        <div className="mb-8 sm:mb-12 md:mb-16 relative flex-1 flex items-center justify-center">
          {/* Outer holographic rings */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse duration-700" />
          <div className="absolute inset-2 rounded-full border border-secondary/15 animate-pulse duration-1000 delay-500" />
          <div className="absolute inset-4 rounded-full border border-accent/10 animate-pulse duration-700 delay-1000" />
          
          {/* Main interactive area */}
          <button
            onClick={handleTapToBegin}
            onTouchStart={handleTapToBegin}
            className="group relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-muted/5 to-muted/10 border border-muted-foreground/20 hover:border-primary/30 transition-all duration-500 touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-black active:scale-95"
            style={{ minWidth: '224px', minHeight: '224px' }}
            aria-label="Tap to begin authentication"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleTapToBegin()
              }
            }}
          >
            {/* Central void with holographic edge */}
            <div className="absolute inset-6 sm:inset-8 md:inset-10 rounded-full bg-black border border-primary/30 group-hover:border-primary/50 transition-all duration-500">
              {/* Inner holographic glow */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/5 to-secondary/5 animate-pulse duration-500" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-tl from-accent/3 to-primary/3 animate-pulse duration-700 delay-700" />
              
              {/* Tap to begin text */}
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <span className="text-sm sm:text-base md:text-lg font-mono font-light text-foreground/80 group-hover:text-foreground transition-colors duration-300 text-center">
                  Tap to begin
                </span>
              </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-secondary/5 transition-all duration-500" />
          </button>

          {/* Device visualization */}
          <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-muted/10 rounded-lg border border-muted-foreground/20 flex items-center justify-center relative">
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-muted-foreground/30" />
              </div>
              {/* NFC indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-primary/30 rounded-full flex items-center justify-center border border-primary/40 animate-pulse duration-500">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="w-full max-w-xs sm:max-w-sm">
          <Button
            onClick={handleMainAction}
            variant="outline"
            className="font-mono text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 bg-muted/5 border-muted-foreground/20 hover:bg-muted/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-300 w-full sm:w-auto min-h-[48px]"
          >
            <span className="block sm:inline">No NFC device?</span>
            <span className="block sm:inline sm:ml-1">Try simulator</span>
          </Button>
        </div>
      </div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none z-5" />
    </div>
  )
} 