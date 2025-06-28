"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * KairOS Main Landing Page
 * 
 * Minimal holographic interface with sophisticated visual effects
 * Elegant entrance to the cryptographic authentication system
 * Enhanced light mode visibility with cream/off-white aesthetics
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
    <div className="h-screen w-screen bg-background overflow-hidden relative touch-none" style={{ position: 'fixed', top: 0, left: 0 }}>
      {/* Enhanced Holographic Background Effects - Much More Visible in Light Mode */}
      <div className="absolute inset-0 z-0">
        {/* Primary gradient flows - Slow breathing-like patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 dark:from-primary/8 dark:to-secondary/8 animate-[breathe_4.5s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/15 via-transparent to-primary/15 dark:from-accent/5 dark:to-primary/5 animate-[breathe_6s_ease-in-out_infinite_1s]" />
        
        {/* Light mode enhanced background texture with warm cream undertones */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-orange-50/30 to-rose-50/40 dark:from-transparent dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-stone-100/20 via-transparent to-amber-50/30 dark:from-transparent dark:to-transparent" />
        
        {/* Floating holographic particles - Slow organic breathing rhythm */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/80 dark:bg-primary/40 rounded-full animate-[breathe-glow_5s_ease-in-out_infinite] shadow-lg shadow-primary/30" />
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-secondary/80 dark:bg-secondary/40 rounded-full animate-[breathe-glow_7s_ease-in-out_infinite_2s] shadow-lg shadow-secondary/30" />
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-accent/80 dark:bg-accent/40 rounded-full animate-[breathe-glow_6s_ease-in-out_infinite_4s] shadow-lg shadow-accent/30" />
        
        {/* Enhanced mouse tracking holographic effect - Much more dramatic in light mode */}
        <div 
          className="absolute inset-0 opacity-60 dark:opacity-40 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,181,145,0.25) 0%, rgba(245,181,145,0.1) 30%, transparent 60%)`
          }}
        />
        <div 
          className="absolute inset-0 opacity-45 dark:opacity-30"
          style={{
            background: `radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(144,193,196,0.20) 0%, rgba(144,193,196,0.08) 40%, transparent 70%)`
          }}
        />
        
        {/* Additional tracking layer for light mode richness */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-0 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 0.8}% ${mousePosition.y * 0.8}%, rgba(168,184,157,0.15) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full w-full flex flex-col justify-between px-4 text-center" style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'max(env(safe-area-inset-bottom), 120px)' 
      }}>
        {/* Top Section - Logo */}
        <div className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-10 md:pb-12 flex-shrink-0">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-mono font-light tracking-wider text-foreground drop-shadow-sm">
              kairOS
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground/80 dark:text-muted-foreground/70 font-mono tracking-wide">
              by MELD
            </p>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground/90 dark:text-muted-foreground/80 font-mono tracking-wide max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed">
              Wearable protocols for a new civics
            </p>
          </div>
        </div>

        {/* Central Section - Main Interface */}
        <div className="flex-1 flex items-center justify-center relative min-h-0">
          {/* Outer holographic rings - Deep breathing rhythm with phase delays */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/50 dark:border-primary/20 animate-[breathe-ring_8s_ease-in-out_infinite] shadow-lg shadow-primary/20 dark:shadow-none" />
          <div className="absolute inset-2 rounded-full border border-secondary/40 dark:border-secondary/15 animate-[breathe-ring_10s_ease-in-out_infinite_1.5s] shadow-md shadow-secondary/15 dark:shadow-none" />
          <div className="absolute inset-4 rounded-full border border-accent/35 dark:border-accent/10 animate-[breathe-ring_12s_ease-in-out_infinite_3s] shadow-sm shadow-accent/10 dark:shadow-none" />
          
          {/* Main interactive area - BLACK HOLE ENTRANCE EFFECT */}
          <button
            onClick={handleTapToBegin}
            onTouchStart={handleTapToBegin}
            className="group relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-stone-50/90 to-amber-50/70 dark:from-muted/5 dark:to-muted/10 border-2 border-border/60 dark:border-border hover:border-primary/60 dark:hover:border-primary/30 transition-all duration-500 touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background active:scale-95 backdrop-blur-sm shadow-xl shadow-stone-200/50 dark:shadow-none"
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
            {/* Central BLACK HOLE VOID - Enhanced depth */}
            <div className="absolute inset-6 sm:inset-8 md:inset-10 rounded-full bg-black/90 dark:bg-black/95 border-2 border-primary/60 dark:border-primary/30 group-hover:border-primary/80 dark:group-hover:border-primary/50 transition-all duration-500 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] dark:shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]">
              {/* Inner event horizon glow - Deep space effect */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 animate-[breathe-inner_9s_ease-in-out_infinite] shadow-[inset_0_0_30px_rgba(0,0,0,0.7)]" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-tl from-accent/15 to-primary/15 dark:from-accent/8 dark:to-primary/8 animate-[breathe-inner_11s_ease-in-out_infinite_2.5s] shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]" />
              
              {/* Tap to begin text - Floating in the void */}
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <span className="text-sm sm:text-base md:text-lg font-mono font-light text-white/90 group-hover:text-white transition-colors duration-300 text-center drop-shadow-lg">
                  Tap to begin
                </span>
              </div>
            </div>

            {/* Enhanced hover glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/15 group-hover:to-secondary/15 dark:group-hover:from-primary/5 dark:group-hover:to-secondary/5 transition-all duration-500" />
          </button>

          {/* Device visualization - Black hole entrance indicator */}
          <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-stone-100/90 dark:bg-muted/10 rounded-lg border-2 border-stone-300/60 dark:border-border flex items-center justify-center relative backdrop-blur-sm shadow-lg shadow-stone-200/30 dark:shadow-none">
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-stone-300/70 dark:bg-muted-foreground/20 flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-stone-500/70 dark:bg-muted-foreground/30" />
              </div>
              {/* NFC indicator - Portal entrance */}
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-primary/70 dark:bg-primary/30 rounded-full flex items-center justify-center border-2 border-primary/80 dark:border-primary/40 animate-[breathe-indicator_4s_ease-in-out_infinite] shadow-lg shadow-primary/30">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Action Button with mobile-safe spacing */}
        <div className="pb-8 sm:pb-12 md:pb-16 flex-shrink-0" style={{ 
          paddingBottom: 'max(32px, env(keyboard-inset-height, 0px))',
          marginBottom: 'max(16px, env(safe-area-inset-bottom, 0px))'
        }}>
          <div className="w-full max-w-xs sm:max-w-sm mx-auto">
            <Button
              onClick={handleMainAction}
              variant="outline"
              className="font-mono text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 bg-stone-50/80 dark:bg-muted/5 border-stone-300/60 dark:border-border hover:bg-stone-100 dark:hover:bg-muted/10 hover:border-primary/50 dark:hover:border-primary/30 text-stone-700 dark:text-muted-foreground hover:text-foreground transition-all duration-300 w-full sm:w-auto min-h-[48px] backdrop-blur-sm shadow-md shadow-stone-200/30 dark:shadow-none"
            >
              <span className="block sm:inline">No NFC device?</span>
              <span className="block sm:inline sm:ml-1">Try simulator</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced subtle overlay for depth with cream tones */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-100/40 via-transparent to-amber-50/30 dark:from-black/20 dark:via-transparent dark:to-black/10 pointer-events-none z-5" />
    </div>
  )
} 