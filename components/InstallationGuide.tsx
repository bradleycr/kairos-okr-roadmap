// --- Installation Guide Redirect Component ---
// Redirects to the new full-page installation guide

"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ritual } from '@/lib/ritual/types'

interface InstallationGuideProps {
  currentRitual?: Ritual | null
  onClose?: () => void
}

export default function InstallationGuide({ currentRitual, onClose }: InstallationGuideProps) {
  const router = useRouter()
  
  useEffect(() => {
    // Automatically redirect to full-page guide
    const params = new URLSearchParams()
    if (currentRitual?.id) {
      params.set('ritual', currentRitual.id)
    }
    
    const url = `/installation-guide${params.toString() ? `?${params.toString()}` : ''}`
    
    // Open in new tab to preserve current workflow
    window.open(url, '_blank', 'noopener,noreferrer')
    
    // Close the modal since we're redirecting
    if (onClose) {
      setTimeout(onClose, 100)
    }
  }, [currentRitual, onClose, router])
  
  // Render nothing since we're redirecting
  return null
} 