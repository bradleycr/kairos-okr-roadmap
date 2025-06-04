"use client"

// --- ZK Moments: Privacy-Preserving Event Experience ---
// Beautiful interface for collecting moments and generating ZK proofs
// Cross-platform design ready for ESP32 companion app

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCryptoIdentity } from '@/lib/crypto/keys'
import { useZKMomentManager } from '@/lib/moment/zkMomentManager'
import { useZKProofSystem } from '@/hooks/useZKProofSystem'
import type { MomentInstallation, ZKMomentProof } from '@/lib/types'
import { Sparkles, Zap, Music, Palette, Coffee, Users, Star, Shield, Clock, Hash } from 'lucide-react'

// --- Sample Event Configuration ---
const SAMPLE_INSTALLATIONS: MomentInstallation[] = [
  { id: 'art_1', name: 'Digital Dreams', location: 'Gallery A', category: 'art', isActive: true },
  { id: 'music_1', name: 'Sonic Waves', location: 'Stage B', category: 'music', isActive: true },
  { id: 'food_1', name: 'Fusion Kitchen', location: 'Food Court', category: 'food', isActive: true },
  { id: 'social_1', name: 'Connection Hub', location: 'Lounge C', category: 'social', isActive: true },
  { id: 'art_2', name: 'Light Sculptures', location: 'Garden D', category: 'art', isActive: true },
  { id: 'experience_1', name: 'VR Portal', location: 'Tech Zone', category: 'experience', isActive: true },
]

// --- Category Icons ---
const CATEGORY_ICONS = {
  art: Palette,
  music: Music,
  food: Coffee,
  social: Users,
  experience: Star,
  other: Sparkles
}

// --- Category Colors ---
const CATEGORY_COLORS = {
  art: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  music: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  food: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  social: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  experience: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

export default function ZKMomentsPage() {
  const { identity, isReady, generateNewIdentity } = useCryptoIdentity()
  const { 
    currentSession, 
    startSession, 
    endSession, 
    saveMoment, 
    getSessionStats,
    clearAllData 
  } = useZKMomentManager()
  const { 
    generateProof, 
    verifyProof, 
    isGenerating, 
    lastProof,
    getRecommendedThresholds 
  } = useZKProofSystem()

  const [selectedInstallation, setSelectedInstallation] = useState<string | null>(null)
  const [proofs, setProofs] = useState<ZKMomentProof[]>([])
  const [showProofModal, setShowProofModal] = useState(false)
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({})

  // Initialize identity and session
  useEffect(() => {
    if (isReady && !identity) {
      generateNewIdentity()
    }
  }, [isReady, identity, generateNewIdentity])

  useEffect(() => {
    if (identity && !currentSession) {
      startSession(identity.did)
    }
  }, [identity, currentSession, startSession])

  // Set up sample installations
  useEffect(() => {
    // This would normally come from event configuration
    // For now, we'll simulate it by setting installations directly
  }, [])

  // --- Event Handlers ---

  const handleTapInstallation = async (installation: MomentInstallation) => {
    if (!identity || !currentSession) return

    setSelectedInstallation(installation.id)
    
    try {
      const result = await saveMoment(installation.id, identity, {
        location: installation.location,
        eventName: 'KairOS Demo Event',
        description: `Tapped ${installation.name}`
      })

      if (result.success) {
        // Visual feedback for successful tap
        setTimeout(() => setSelectedInstallation(null), 1000)
      }
    } catch (error) {
      console.error('Failed to save moment:', error)
      setSelectedInstallation(null)
    }
  }

  const handleGenerateProofs = async () => {
    if (!identity || !currentSession || currentSession.moments.length === 0) return

    const thresholds = getRecommendedThresholds(currentSession.moments.length)
    const newProofs: ZKMomentProof[] = []

    for (const threshold of thresholds) {
      const result = await generateProof(
        currentSession.moments,
        threshold,
        identity.publicKey
      )

      if (result.success && result.proof) {
        newProofs.push(result.proof)
      }
    }

    setProofs(prev => [...prev, ...newProofs])
    setShowProofModal(true)
  }

  const handleVerifyProof = async (proof: ZKMomentProof) => {
    const isValid = await verifyProof(proof)
    setVerificationResults(prev => ({
      ...prev,
      [proof.proof]: isValid
    }))
  }

  const handleEndSession = async () => {
    await endSession()
    setProofs([])
    setVerificationResults({})
  }

  // --- Render Functions ---

  const renderInstallationCard = (installation: MomentInstallation) => {
    const IconComponent = CATEGORY_ICONS[installation.category]
    const isSelected = selectedInstallation === installation.id
    const momentCount = currentSession?.moments.filter(m => m.momentId === installation.id).length || 0

    return (
      <Card 
        key={installation.id}
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
        }`}
        onClick={() => handleTapInstallation(installation)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${CATEGORY_COLORS[installation.category]}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{installation.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{installation.location}</p>
          </div>
          {momentCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {momentCount}
            </Badge>
          )}
        </div>
        {isSelected && (
          <div className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-medium">Saving moment...</span>
          </div>
        )}
      </Card>
    )
  }

  const renderSessionStats = () => {
    if (!currentSession) return null

    const stats = getSessionStats()
    const sessionDurationHours = stats.sessionDuration / (1000 * 60 * 60)

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalMoments}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Moments</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.uniqueInstallations}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Unique Places</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {sessionDurationHours.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Session Time</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.averageMomentsPerHour.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Moments/Hour</div>
        </Card>
      </div>
    )
  }

  const renderProofCard = (proof: ZKMomentProof, index: number) => {
    const isVerified = verificationResults[proof.proof]
    const hasBeenVerified = proof.proof in verificationResults

    return (
      <Card key={index} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold">Proof #{index + 1}</span>
          </div>
          <Badge variant={hasBeenVerified ? (isVerified ? 'default' : 'destructive') : 'secondary'}>
            {hasBeenVerified ? (isVerified ? 'Valid' : 'Invalid') : 'Unverified'}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Threshold:</span>
            <span className="font-mono">{proof.threshold} moments</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Actual Count:</span>
            <span className="font-mono">{proof.actualCount} moments</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Generated:</span>
            <span className="font-mono">{new Date(proof.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono break-all">
          {proof.proof.substring(0, 60)}...
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full mt-3"
          onClick={() => handleVerifyProof(proof)}
          disabled={hasBeenVerified}
        >
          {hasBeenVerified ? 'Verified' : 'Verify Proof'}
        </Button>
      </Card>
    )
  }

  // --- Main Render ---

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500 dark:text-gray-400">Initializing crypto identity...</p>
        </div>
      </div>
    )
  }

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-bold mb-2">Welcome to ZK Moments</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Generate your cryptographic identity to start collecting privacy-preserving moments.
          </p>
          <Button onClick={generateNewIdentity} className="w-full">
            Generate Identity
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ZK Moments
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Privacy-preserving event experiences with zero-knowledge proofs
          </p>
        </div>

        {/* Identity Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Your Identity</h3>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                {identity.did}
              </p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </Card>

        {/* Session Stats */}
        {currentSession && renderSessionStats()}

        {/* Installation Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Tap to Save Moments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_INSTALLATIONS.map(renderInstallationCard)}
          </div>
        </div>

        {/* Actions */}
        {currentSession && currentSession.moments.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleGenerateProofs}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Proofs...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Generate ZK Proofs
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleEndSession}>
              <Clock className="w-4 h-4 mr-2" />
              End Session
            </Button>
            <Button variant="destructive" onClick={clearAllData}>
              Clear All Data
            </Button>
          </div>
        )}

        {/* Proofs Display */}
        {proofs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Generated Proofs ({proofs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proofs.map(renderProofCard)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
          <p>🔐 All moments are signed locally. Proofs reveal counts without exposing individual moments.</p>
          <p className="mt-1">Ready for ESP32 porting with identical cryptographic guarantees.</p>
        </div>
      </div>
    </div>
  )
} 