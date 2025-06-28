'use client'

/**
 * 🌌 KairOS 404 - Lost in the Digital Realm
 * 
 * Beautiful, interactive 404 page with holographic aesthetic
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  NfcIcon, 
  HomeIcon, 
  RefreshCwIcon,
  SearchIcon,
  WifiOffIcon,
  ZapIcon,
  ArrowLeftIcon,
  ScanLineIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const [isScanning, setIsScanning] = useState(false)
  const [pulseCount, setPulseCount] = useState(0)
  const [glitchText, setGlitchText] = useState('404')

  // Glitch effect for 404 text
  useEffect(() => {
    const glitchTexts = ['404', '4Ø4', '4∅4', '404', 'N0T', '404']
    const interval = setInterval(() => {
      setGlitchText(glitchTexts[Math.floor(Math.random() * glitchTexts.length)])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Pulse counter for scanning animation
  useEffect(() => {
    if (isScanning) {
      const timeout = setTimeout(() => {
        setPulseCount(prev => prev + 1)
        if (pulseCount > 3) {
          setIsScanning(false)
          setPulseCount(0)
        }
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [isScanning, pulseCount])

  const handleScan = () => {
    setIsScanning(true)
    setPulseCount(0)
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-background via-muted/10 to-accent/5 relative overflow-hidden">
      {/* Enhanced Holographic Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(245,181,145,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(144,193,196,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_45deg,transparent,rgba(var(--primary),0.1),transparent)]"></div>
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{ 
            backgroundPosition: ['0px 0px', '40px 40px']
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(var(--primary), 0.3) 1px, transparent 1px),
              linear-gradient(rgba(var(--primary), 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
        
        {/* Floating NFC Icon with Scan Animation */}
        <motion.div
          className="mb-8 relative"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="relative p-6 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <NfcIcon className="h-16 w-16 text-primary" />
            
            {/* Scanning Ripples */}
            <AnimatePresence>
              {isScanning && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 border-2 border-primary/50 rounded-full"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ 
                        scale: [1, 2.5, 4], 
                        opacity: [0.7, 0.3, 0] 
                      }}
                      transition={{ 
                        duration: 2, 
                        delay: i * 0.3,
                        repeat: pulseCount < 3 ? Infinity : 0 
                      }}
                      exit={{ opacity: 0 }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Glitchy 404 Text */}
        <motion.div
          className="mb-6"
          animate={{ opacity: [1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.h1 
            key={glitchText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-8xl md:text-9xl font-mono font-bold text-primary mb-4 select-none"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(var(--primary), 0.5))',
              textShadow: '0 0 10px rgba(var(--primary), 0.8)'
            }}
          >
            {glitchText}
          </motion.h1>
        </motion.div>

        {/* Title and Description */}
        <motion.div 
          className="space-y-4 mb-8 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground/90">
            Signal Lost
          </h2>
          <div className="flex items-center justify-center gap-2 text-xl text-muted-foreground">
            <WifiOffIcon className="h-5 w-5" />
            <span className="font-mono">Connection to this reality not found</span>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The NFC chip you're looking for has drifted into the void. 
            Perhaps it was never programmed, or maybe it exists in a parallel dimension.
          </p>
        </motion.div>

        {/* Interactive Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/">
            <Button 
              size="lg" 
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-mono"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <HomeIcon className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </Link>

          <Button 
            variant="outline" 
            size="lg"
            onClick={handleScan}
            disabled={isScanning}
            className="group border-primary/30 hover:border-primary/50 hover:bg-primary/10 px-8 py-4 text-lg font-mono"
          >
            <motion.div
              animate={isScanning ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isScanning ? Infinity : 0, ease: 'linear' }}
            >
              <ScanLineIcon className="mr-2 h-5 w-5" />
            </motion.div>
            {isScanning ? 'Scanning...' : 'Scan for Signal'}
          </Button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Link 
            href="/nfc" 
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-primary/5"
          >
            <NfcIcon className="h-4 w-4 group-hover:animate-pulse" />
            <span className="font-mono">NFC Gateway</span>
          </Link>
          
          <Link 
            href="/profile" 
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-primary/5"
          >
            <ZapIcon className="h-4 w-4 group-hover:animate-pulse" />
            <span className="font-mono">Your Profile</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-primary/5"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:animate-pulse" />
            <span className="font-mono">Go Back</span>
          </button>
        </motion.div>

        {/* Ambient Status Bar */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/20 backdrop-blur-sm px-4 py-2 rounded-full border border-muted/30">
            <motion.div
              className="w-2 h-2 bg-red-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>STATUS: DISCONNECTED</span>
            <span className="text-primary">•</span>
            <span>REALITY: KAIROS</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 