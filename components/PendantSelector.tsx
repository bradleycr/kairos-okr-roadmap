// --- MELD Pendant Selector: Minimal Design ---
// Pendant selection with glass morphism and earth tones
// Supports multiple pendant identities for comprehensive testing

"use client"

import { useState, useEffect } from 'react'
import { generateKeypair, createDIDFromPublicKey } from '@/lib/crypto/keys'
import { PendantIdentity } from '@/lib/hal/simulateTap'
import { Plus, Zap, Shuffle, Download, Upload, Circle, Grid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PendantSelectorProps {
  selectedPendant: PendantIdentity | null
  onPendantChange: (pendant: PendantIdentity) => void
  className?: string
}

// --- Generate Test Pendant Pool with Earth-Tone Aesthetic ---
const generateTestPendants = (count: number = 24): Omit<PendantIdentity, 'publicKey' | 'privateKey'>[] => {
  const pendantStyles = [
    { shape: '⬢', color: '#9db59d', material: 'sage ceramic' },      // Hexagon - Sage ceramic
    { shape: '●', color: '#b09d87', material: 'sand metal' },        // Circle - Sand metal
    { shape: '◆', color: '#dc764f', material: 'terracotta glass' },  // Diamond - Terracotta glass
    { shape: '▲', color: '#a892c4', material: 'lavender wood' },     // Triangle - Lavender wood
    { shape: '■', color: '#c2b5a3', material: 'natural resin' },     // Square - Natural resin
    { shape: '◉', color: '#769676', material: 'sage stone' },        // Dot circle - Sage stone
    { shape: '◈', color: '#efbaa0', material: 'warm crystal' },      // Diamond dot - Warm crystal
    { shape: '▼', color: '#c1b0d6', material: 'soft polymer' },      // Down triangle - Soft polymer
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

const TEST_PENDANTS = generateTestPendants(16)

export default function PendantSelector({ 
  selectedPendant, 
  onPendantChange,
  className = "" 
}: PendantSelectorProps) {
  const [pendants, setPendants] = useState<PendantIdentity[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Initialize test pendants with crypto keys
  useEffect(() => {
    const initializePendants = async () => {
      try {
        const initializedPendants: PendantIdentity[] = []
        
        for (const testPendant of TEST_PENDANTS) {
          const { privateKey, publicKey } = await generateKeypair()
          
          // Validate generated keys
          if (!(privateKey instanceof Uint8Array) || privateKey.length !== 32) {
            console.error('Invalid private key generated:', privateKey)
            continue
          }
          
          if (!(publicKey instanceof Uint8Array) || publicKey.length !== 32) {
            console.error('Invalid public key generated:', publicKey)
            continue
          }
          
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
            onPendantChange(initializedPendants[0])
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
      
      // Validate generated keys
      if (!(privateKey instanceof Uint8Array) || privateKey.length !== 32) {
        throw new Error('Invalid private key generated')
      }
      
      if (!(publicKey instanceof Uint8Array) || publicKey.length !== 32) {
        throw new Error('Invalid public key generated')
      }
      
      const did = createDIDFromPublicKey(publicKey)
      
      const pendantNum = String(pendants.length + 1).padStart(3, '0')
      const styles = [
        { shape: '⬡', color: '#9db59d', material: 'sage titanium' },
        { shape: '◎', color: '#dc764f', material: 'warm ceramic' },
        { shape: '◇', color: '#a892c4', material: 'soft carbon' },
        { shape: '⬟', color: '#b09d87', material: 'earth polymer' },
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
      onPendantChange(newPendant)
      
    } catch (error) {
      console.error('Failed to generate new pendant:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={cn("glass-card rounded-2xl p-6 sm:p-8", className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shadow-minimal">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-800">Physical Pendants</h3>
            <p className="text-sm text-neutral-500">{pendants.length} available for testing</p>
          </div>
        </div>
        
        <button
          onClick={generateNewPendant}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-2 glass-button text-muted-foreground rounded-lg hover:text-foreground disabled:opacity-50 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {isGenerating ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Selected Pendant Display - Compact */}
      {selectedPendant && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-5 glass-card rounded-xl border transition-all duration-300"
             style={{ 
               borderColor: selectedPendant.color + '40',
               backgroundColor: selectedPendant.color + '08'
             }}>
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-minimal border"
              style={{ 
                backgroundColor: selectedPendant.color + '20',
                borderColor: selectedPendant.color + '40',
                color: selectedPendant.color
              }}
            >
              {selectedPendant.icon}
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-neutral-800">{selectedPendant.name}</h4>
              <p className="text-sm text-neutral-600">{selectedPendant.material}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Pendant Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4">
        {pendants.map((pendant, index) => {
          const isSelected = selectedPendant?.id === pendant.id
          
          return (
            <button
              key={pendant.id}
              onClick={() => onPendantChange(pendant)}
              className={cn(
                "relative p-3 rounded-xl border transition-all duration-200 interactive focus-ring group",
                isSelected
                  ? "border-2 shadow-minimal bg-white scale-105"
                  : "border glass-button hover:shadow-minimal hover:scale-102"
              )}
              style={{
                borderColor: isSelected ? pendant.color : undefined,
                backgroundColor: isSelected ? pendant.color + '08' : undefined,
                animationDelay: `${index * 20}ms`
              }}
              title={`${pendant.name} - ${pendant.material}`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Circle className="w-2 h-2 text-white fill-current" />
                </div>
              )}
              
              {/* Pendant Visual */}
              <div 
                className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-lg font-bold border transition-transform group-hover:scale-110"
                style={{ 
                  backgroundColor: pendant.color + '20',
                  borderColor: pendant.color + '40',
                  color: pendant.color
                }}
              >
                {pendant.icon}
              </div>
              
              <div className="text-xs text-neutral-600 text-center mt-2 font-medium">
                {pendant.name.split('-')[1]}
              </div>
            </button>
          )
        })}
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 glass-card rounded-lg">
            <div className="w-3 h-3 bg-primary rounded-full animate-gentle-pulse"></div>
            <span className="text-neutral-700 text-sm">Generating keys...</span>
          </div>
        </div>
      )}
    </div>
  )
} 