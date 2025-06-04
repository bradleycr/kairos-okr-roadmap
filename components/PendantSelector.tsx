// --- MELD Pendant Selector Component ---
// Physical pendant simulation with numbered identities for event testing
// Supports 20-30+ pendants for large-scale event simulation

"use client"

import { useState, useEffect } from 'react'
import { generateKeypair, createDIDFromPublicKey } from '@/lib/crypto/keys'
import { PendantIdentity } from '@/lib/hal/simulateTap'
import { Plus, Zap, Shuffle, Download, Upload, Circle } from 'lucide-react'

interface PendantSelectorProps {
  selectedPendant: PendantIdentity | null
  onPendantSelect: (pendant: PendantIdentity) => void
  className?: string
}

// --- Generate Test Pendant Pool (20-30 for events) ---
const generateTestPendants = (count: number = 24): Omit<PendantIdentity, 'publicKey' | 'privateKey'>[] => {
  const pendantStyles = [
    { shape: '⬢', color: '#FF6B6B', material: 'ceramic' },    // Hexagon - Red ceramic
    { shape: '●', color: '#4ECDC4', material: 'metal' },      // Circle - Teal metal
    { shape: '◆', color: '#45B7D1', material: 'glass' },      // Diamond - Blue glass
    { shape: '▲', color: '#96CEB4', material: 'wood' },       // Triangle - Green wood
    { shape: '■', color: '#FFEAA7', material: 'plastic' },    // Square - Yellow plastic
    { shape: '◉', color: '#DDA0DD', material: 'stone' },      // Dot circle - Purple stone
    { shape: '◈', color: '#98D8C8', material: 'crystal' },    // Diamond dot - Mint crystal
    { shape: '▼', color: '#F7DC6F', material: 'resin' },      // Down triangle - Gold resin
  ]
  
  return Array.from({ length: count }, (_, i) => {
    const pendantNum = String(i + 1).padStart(3, '0')
    const style = pendantStyles[i % pendantStyles.length]
    
    return {
      id: `pendant-${pendantNum}`,
      name: `PENDANT-${pendantNum}`,
      did: `did:key:z6Mk${Math.random().toString(36).substring(2, 50)}`,
      color: style.color,
      icon: style.shape,
      material: style.material
    }
  })
}

const TEST_PENDANTS = generateTestPendants(24)

export default function PendantSelector({ 
  selectedPendant, 
  onPendantSelect,
  className = "" 
}: PendantSelectorProps) {
  const [pendants, setPendants] = useState<PendantIdentity[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // Initialize test pendants with crypto keys
  useEffect(() => {
    const initializePendants = async () => {
      try {
        const initializedPendants: PendantIdentity[] = []
        
        for (const testPendant of TEST_PENDANTS) {
          const { privateKey, publicKey } = await generateKeypair()
          const did = createDIDFromPublicKey(publicKey)
          
          initializedPendants.push({
            ...testPendant,
            publicKey,
            privateKey,
            did
          })
        }
        
        setPendants(initializedPendants)
        
        // Auto-select first pendant if none selected
        if (initializedPendants.length > 0) {
          setTimeout(() => {
            onPendantSelect(initializedPendants[0])
          }, 100)
        }
      } catch (error) {
        console.error('Failed to initialize pendants:', error)
      }
    }
    
    initializePendants()
  }, [])

  // Generate a new numbered pendant
  const generateNewPendant = async () => {
    setIsGenerating(true)
    
    try {
      const { privateKey, publicKey } = await generateKeypair()
      const did = createDIDFromPublicKey(publicKey)
      
      const pendantNum = String(pendants.length + 1).padStart(3, '0')
      const styles = [
        { shape: '⬡', color: '#FF8A80', material: 'titanium' },
        { shape: '◎', color: '#82B1FF', material: 'ceramic' },
        { shape: '◇', color: '#A5D6A7', material: 'carbon' },
        { shape: '⬟', color: '#FFAB91', material: 'polymer' },
      ]
      const style = styles[Math.floor(Math.random() * styles.length)]
      
      const newPendant: PendantIdentity = {
        id: `pendant-${pendantNum}`,
        name: `PENDANT-${pendantNum}`,
        publicKey,
        privateKey,
        did,
        color: style.color,
        icon: style.shape,
        material: style.material
      }
      
      setPendants(prev => [...prev, newPendant])
      onPendantSelect(newPendant)
      
    } catch (error) {
      console.error('Failed to generate new pendant:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate batch of pendants for event testing
  const generateBatch = async (count: number) => {
    setIsGenerating(true)
    
    try {
      const newPendants: PendantIdentity[] = []
      
      for (let i = 0; i < count; i++) {
        const { privateKey, publicKey } = await generateKeypair()
        const did = createDIDFromPublicKey(publicKey)
        
        const pendantNum = String(pendants.length + i + 1).padStart(3, '0')
        const styles = TEST_PENDANTS
        const style = styles[Math.floor(Math.random() * styles.length)]
        
        newPendants.push({
          id: `pendant-${pendantNum}`,
          name: `PENDANT-${pendantNum}`,
          publicKey,
          privateKey,
          did,
          color: style.color,
          icon: style.icon,
          material: style.material || 'synthetic'
        })
      }
      
      setPendants(prev => [...prev, ...newPendants])
      
    } catch (error) {
      console.error('Failed to generate pendant batch:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/40 p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white font-mono">Physical Pendants</h3>
          <span className="text-sm text-gray-400 font-mono bg-slate-700/50 px-3 py-1 rounded-full">({pendants.length} active)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors font-mono bg-slate-700/50 hover:bg-slate-700 px-3 py-1 rounded-md"
          >
            {view === 'grid' ? 'list' : 'grid'}
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors font-mono bg-slate-700/50 hover:bg-slate-700 px-3 py-1 rounded-md"
          >
            {showAdvanced ? 'basic' : 'debug'}
          </button>
        </div>
      </div>

      {/* Selected Pendant Display - Physical pendant style */}
      {selectedPendant && (
        <div 
          className="p-5 rounded-xl border-2 mb-5 transition-all bg-slate-900/60 backdrop-blur-sm"
          style={{ 
            borderColor: selectedPendant.color,
            boxShadow: `0 0 20px ${selectedPendant.color}20`
          }}
        >
          <div className="flex items-center gap-4">
            {/* Physical pendant representation */}
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg border-2"
                style={{ 
                  backgroundColor: selectedPendant.color,
                  borderColor: `${selectedPendant.color}50`,
                  boxShadow: `0 4px 12px ${selectedPendant.color}40, inset 0 2px 4px rgba(255,255,255,0.2)`
                }}
              >
                {selectedPendant.icon}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white font-mono text-lg mb-1">{selectedPendant.name}</div>
              <div className="text-sm text-gray-400 font-mono mb-1">
                {(selectedPendant as any).material || 'ceramic'} • NFC Type-4
              </div>
              <div className="text-xs text-gray-500 font-mono truncate">
                DID: {selectedPendant.did.substring(0, 35)}...
              </div>
            </div>
            
            {showAdvanced && (
              <div className="text-right">
                <div className="text-xs text-gray-400 font-mono">Signal: -42dBm</div>
                <div className="text-xs text-gray-400 font-mono">Range: 4cm</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pendant Grid/List */}
      {view === 'grid' ? (
        <div className="grid grid-cols-6 lg:grid-cols-8 gap-2 mb-5 max-h-48 overflow-y-auto p-1">
          {pendants.map((pendant) => (
            <button
              key={pendant.id}
              onClick={() => onPendantSelect(pendant)}
              className={`relative group p-2 rounded-lg transition-all hover:scale-105 ${
                selectedPendant?.id === pendant.id
                  ? 'ring-2 ring-current shadow-lg'
                  : 'hover:shadow-md'
              }`}
              style={{
                ringColor: selectedPendant?.id === pendant.id ? pendant.color : undefined,
              }}
              title={`${pendant.name} - ${(pendant as any).material || 'ceramic'}`}
            >
              {/* Physical pendant mini representation */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm mx-auto border"
                style={{ 
                  backgroundColor: pendant.color,
                  borderColor: `${pendant.color}50`,
                  boxShadow: `0 2px 6px ${pendant.color}30`
                }}
              >
                {pendant.icon}
              </div>
              <div className="text-xs font-mono text-gray-300 mt-1 text-center">
                {pendant.name.split('-')[1]}
              </div>
              
              {/* Active indicator */}
              {selectedPendant?.id === pendant.id && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-slate-800"></div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
          {pendants.map((pendant) => (
            <button
              key={pendant.id}
              onClick={() => onPendantSelect(pendant)}
              className={`w-full p-2 rounded-lg border transition-all text-left ${
                selectedPendant?.id === pendant.id
                  ? 'border-current bg-slate-700/50'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
              }`}
              style={{
                borderColor: selectedPendant?.id === pendant.id ? pendant.color : undefined
              }}
            >
              <div className="flex items-center gap-3">
                <Circle 
                  className="w-3 h-3" 
                  style={{ color: pendant.color }}
                  fill="currentColor"
                />
                <span className="font-mono text-sm text-white">{pendant.name}</span>
                <span className="text-xs text-gray-400 font-mono">
                  {(pendant as any).material || 'ceramic'}
                </span>
                <div className="flex-1"></div>
                {selectedPendant?.id === pendant.id && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={generateNewPendant}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-mono"
        >
          {isGenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              sync...
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              +1
            </>
          )}
        </button>
        
        <button
          onClick={() => generateBatch(10)}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm font-mono"
        >
          <Plus className="w-3 h-3" />
          +10
        </button>
        
        <button
          onClick={() => {
            const shuffled = [...pendants].sort(() => Math.random() - 0.5)
            if (shuffled.length > 0) {
              onPendantSelect(shuffled[0])
            }
          }}
          className="px-3 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors"
          title="Random pendant"
        >
          <Shuffle className="w-3 h-3" />
        </button>
      </div>

      {/* Advanced Debug Section */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="text-sm text-gray-300 space-y-2 font-mono">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-cyan-400">Active Pendants:</span> {pendants.length}
              </div>
              <div>
                <span className="text-purple-400">Crypto Engine:</span> Ed25519
              </div>
              <div>
                <span className="text-emerald-400">NFC Protocol:</span> ISO 14443-4
              </div>
              <div>
                <span className="text-yellow-400">Identity System:</span> DID:key
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-3">
              Physical pendants contain secure cryptographic identities for event authentication.
              Each pendant simulates real NFC hardware with unique material properties.
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 