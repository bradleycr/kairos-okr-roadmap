'use client'

/**
 * 🌌 KairOS 404 - Lost in the Digital Realm
 * 
 * Interactive 404 page with holographic aesthetic
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
  ScanLineIcon,
  Search,
  Home,
  ArrowLeft
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-background to-blue-100/20">
      <div className="max-w-md mx-auto text-center space-y-6 p-8">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-light text-gray-900">404</h1>
          <h2 className="text-xl font-semibold text-gray-900">Page Not Found</h2>
          <p className="text-sm text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <Link href="/profile">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 