"use client"

import { useState, useEffect } from "react"
import { HAL } from "@/lib/hardwareAbstraction"
import { sampleInstallations, type PendantInstallation, NFC_Simulation } from "@/lib/sampleInstallations"
import { useCryptoIdentity } from "@/lib/crypto/keys"
import { Shield, Wifi, Hash, Check, Key } from 'lucide-react'

interface WearableDeviceProps {
  text: string
  onTap: () => void
  disabled: boolean
  state: "default" | "identity" | "moment"
  screen?: string
  screenData?: any
}

export default function WearableDevice({ 
  text, 
  onTap, 
  disabled, 
  state, 
  screen = "main", 
  screenData 
}: WearableDeviceProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPendant, setSelectedPendant] = useState<PendantInstallation | null>(null)
  const [nearbyPendants, setNearbyPendants] = useState<PendantInstallation[]>([])
  const [zkScreen, setZkScreen] = useState<'main' | 'scanning' | 'pendant-select' | 'moment-saving' | 'success' | 'identity-setup'>('main')
  const [savedMomentsCount, setSavedMomentsCount] = useState(0)
  
  // Crypto Identity Integration
  const { identity, isReady, generateNewIdentity } = useCryptoIdentity()

  // --- E-ink/Kindle inspired palette ---
  const epaperBg = "#f5f5ec"
  const epaperBorder = "#b8b5a1"
  const epaperScreen = "#eae7df"
  const epaperText = "#44423a"
  const epaperShadow = "0 2px 12px 0 #b8b5a133"

  // --- Dot grid CSS pattern for e-ink realism ---
  const dotGrid = `repeating-radial-gradient(circle, #d6d3c2 0.5px, transparent 1.5px, transparent 8px)`

  // --- E-ink slow refresh animation ---
  const triggerRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 480) // ~0.5s e-ink refresh
  }

  // --- Setup crypto identity if needed ---
  const setupIdentity = async () => {
    setZkScreen('identity-setup')
    triggerRefresh()
    
    try {
      await generateNewIdentity()
      setTimeout(() => {
        setZkScreen('main')
        triggerRefresh()
      }, 1500)
    } catch (error) {
      console.error('Failed to generate identity:', error)
      setZkScreen('main')
      triggerRefresh()
    }
  }

  // --- NFC Scanning Simulation ---
  const scanForPendants = async () => {
    setZkScreen('scanning')
    triggerRefresh()
    
    // Simulate NFC scanning delay
    setTimeout(async () => {
      const pendants = await NFC_Simulation.scanForTags()
      setNearbyPendants(pendants)
      if (pendants.length > 0) {
        setZkScreen('pendant-select')
      } else {
        setZkScreen('main')
      }
      triggerRefresh()
    }, 1500)
  }

  // --- Pendant Selection and Moment Saving ---
  const selectPendant = async (pendant: PendantInstallation) => {
    setSelectedPendant(pendant)
    setZkScreen('moment-saving')
    triggerRefresh()
    
    try {
      if (!identity) {
        throw new Error('No crypto identity available')
      }

      // Simulate creating a cryptographically signed ZK moment
      const momentData = {
        pendantId: pendant.id,
        pendantDID: pendant.did,
        userDID: identity.did,
        timestamp: Date.now(),
        location: pendant.location,
        description: pendant.description
      }

      // Create hash of moment data (in real ZK system, this would be privacy-preserving)
      const momentHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(momentData))
      )

      // Simulate saving to device storage
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Increment saved moments count
      setSavedMomentsCount(prev => prev + 1)
      
      setZkScreen('success')
      triggerRefresh()
      
      // Return to main after success
      setTimeout(() => {
        setZkScreen('main')
        setSelectedPendant(null)
        setNearbyPendants([])
        triggerRefresh()
      }, 2000)
      
    } catch (error) {
      console.error('Failed to save ZK moment:', error)
      setZkScreen('main')
      triggerRefresh()
    }
  }

  // Handle tap for default/identity/moment screens
  const handleTap = () => {
    if (disabled) return
    setIsAnimating(true)
    triggerRefresh()
    HAL.vibration.vibrate([50, 30, 100])
    HAL.display.show({ type: 'text', text })
    
    // For auth screen, don't call onTap (emoji selection handles it)
    if (screen !== 'auth') {
      onTap()
    }
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 400)
  }

  // Dynamic Screen Content Based on State
  let displayContent: React.ReactNode = null
  let isMenuScreen = screen === "momentOptions" || screen === "userConflict" || screen === "processing" || zkScreen !== 'main'

  // Processing screen for crypto authentication
  if (screen === 'processing') {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="mb-4 animate-pulse">
          <Shield className="w-8 h-8" style={{ color: epaperText }} />
        </div>
        <div className="text-center font-mono leading-relaxed" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          {text}
        </div>
      </div>
    )
  }
  // Success screen
  else if (screen === 'success') {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in">
        <div className="mb-3 animate-bounce">
          <Check className="w-12 h-12 p-2 rounded-full bg-green-100" style={{ color: '#178a5c' }} />
        </div>
        <div className="text-center font-mono leading-relaxed" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          {text}
        </div>
      </div>
    )
  }
  // ZK Identity setup screen
  else if (zkScreen === 'identity-setup') {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="mb-4 animate-pulse">
          <Key className="w-8 h-8" style={{ color: epaperText }} />
        </div>
        <span className="text-lg font-bold mb-2 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          Setting up identity...
        </span>
        <span className="text-sm font-mono" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          Generating Ed25519 keys
        </span>
      </div>
    )
  } else if (zkScreen === 'scanning') {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="mb-4 animate-pulse">
          <Wifi className="w-8 h-8" style={{ color: epaperText }} />
        </div>
        <span className="text-lg font-bold mb-2 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          Scanning for NFC...
        </span>
        <span className="text-sm font-mono" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          Hold pendants near device
        </span>
      </div>
    )
  } else if (zkScreen === 'pendant-select') {
    displayContent = (
      <div className="flex flex-col items-center w-full">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5" style={{ color: epaperText }} />
          <span className="text-sm font-bold tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
            Select Pendant
          </span>
        </div>
        <div className="flex flex-col gap-2 w-full max-h-48 overflow-y-auto">
          {nearbyPendants.map((pendant) => (
            <button
              key={pendant.id}
              className="px-3 py-2 rounded text-sm font-mono w-full text-left border transition-colors hover:bg-white/20"
              style={{
                background: epaperScreen,
                borderColor: epaperBorder,
                color: epaperText,
                fontFamily: 'DM Mono, Courier, monospace',
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                selectPendant(pendant)
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: pendant.color }}>{pendant.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{pendant.name}</div>
                  <div className="text-xs opacity-75 truncate">{pendant.location}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          className="px-3 py-1 rounded text-sm font-mono mt-3 border"
          style={{
            background: epaperScreen,
            borderColor: epaperBorder,
            color: epaperText,
            fontFamily: 'DM Mono, Courier, monospace',
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setZkScreen('main')
            triggerRefresh()
          }}
        >
          Cancel
        </button>
      </div>
    )
  } else if (zkScreen === 'moment-saving') {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="mb-4 animate-pulse">
          <Hash className="w-8 h-8" style={{ color: epaperText }} />
        </div>
        <span className="text-lg font-bold mb-2 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
          Saving Moment...
        </span>
        {selectedPendant && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span style={{ color: selectedPendant.color }}>{selectedPendant.icon}</span>
              <span className="text-sm font-mono font-bold" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
                {selectedPendant.name}
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
              {selectedPendant.location}
            </span>
          </div>
        )}
      </div>
    )
  } else if (state === "default" || screen === "main") {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-4xl font-extrabold tracking-widest mb-2" style={{ letterSpacing: '0.12em', color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>MELD_</span>
        <div className="flex items-center gap-2 mt-2">
          <Shield className="w-4 h-4" style={{ color: epaperText }} />
          <span className="text-base font-mono tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
            {!identity && isReady ? 'tap to setup' : identity ? 'tap for ZK moment' : 'initializing...'}
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="text-xs font-mono opacity-75" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
            {savedMomentsCount} moments saved
          </div>
          {identity && (
            <div className="text-xs font-mono opacity-50 mt-1" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>
              {identity.did.substring(0, 20)}...
            </div>
          )}
        </div>
      </div>
    )
  } else if (state === "identity" || state === "moment") {
    displayContent = (
      <div className="text-sm whitespace-pre-wrap font-medium leading-relaxed" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>{text}</div>
    )
  }

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 w-[360px] h-[360px] -translate-x-2.5 -translate-y-2.5 bg-gradient-radial from-teal-200/20 via-transparent to-transparent rounded-full blur-xl"></div>

      {/* Outer device frame with recycled texture */}
      <div className="w-[340px] h-[340px] rounded-3xl shadow-2xl p-5 relative overflow-hidden bg-gradient-to-br from-slate-300 to-slate-400">
        {/* Recycled plastic texture background */}
        <div
          className="absolute inset-0 rounded-3xl opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: `url('/images/recycled-texture.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        {/* Additional texture overlays for depth */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500/30 via-blue-500/20 to-emerald-500/25 mix-blend-overlay"></div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>

        {/* Subtle surface imperfections */}
        <div className="absolute top-8 right-12 w-3 h-1 bg-teal-600/20 rounded-full blur-sm"></div>
        <div className="absolute bottom-16 left-16 w-2 h-2 bg-blue-600/15 rounded-full blur-sm"></div>
        <div className="absolute top-20 left-8 w-1 h-3 bg-emerald-600/20 rounded-full blur-sm"></div>

        {/* Premium edge highlight */}
        <div className="absolute inset-2 rounded-2xl border border-white/30 pointer-events-none"></div>

        {/* Inner e-ink screen area */}
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{
            width: 300,
            height: 300,
            transform: 'translate(-50%, -50%)',
            background: epaperScreen,
            borderRadius: 20,
            border: `1.5px solid ${epaperBorder}`,
            boxShadow: 'inset 0 2px 8px 0 #b8b5a122',
            overflow: 'hidden',
            position: 'absolute',
            zIndex: 2,
            backgroundImage: dotGrid,
            backgroundBlendMode: 'multiply',
            transition: 'filter 0.5s cubic-bezier(.4,2,.6,1)',
            filter: refreshing ? 'invert(1) brightness(1.2)' : 'none',
          }}
        >
          {/* E-paper display - clickable or menu */}
          {isMenuScreen ? (
            <div
              className="w-full h-full rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden border"
              style={{
                borderColor: epaperBorder,
                background: 'transparent',
                fontFamily: 'DM Mono, Courier, monospace',
                color: epaperText,
                letterSpacing: '0.01em',
              }}
            >
              <div className="relative z-10 font-mono text-center leading-relaxed select-none" style={{ color: epaperText }}>
                {displayContent}
              </div>
            </div>
          ) : (
            <button
              onClick={handleTap}
              disabled={disabled}
              className={`w-full h-full rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300 border ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                borderColor: epaperBorder,
                background: 'transparent',
                fontFamily: 'DM Mono, Courier, monospace',
                color: epaperText,
                letterSpacing: '0.01em',
              }}
            >
              <div className="relative z-10 font-mono text-center leading-relaxed select-none" style={{ color: epaperText }}>
                {displayContent}
              </div>
              {/* E-ink slow refresh animation: invert screen */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: refreshing ? '#44423a' : 'transparent',
                  opacity: refreshing ? 0.85 : 0,
                  transition: 'opacity 0.45s cubic-bezier(.4,2,.6,1)',
                  zIndex: 20,
                }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

