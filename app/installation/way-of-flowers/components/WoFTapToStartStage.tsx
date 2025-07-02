/**
 * WoF Tap to Start Stage
 * Minimal initial screen matching the beautiful screenshot design
 * Features clean typography and simple card layout
 */

'use client'

import { Card } from '@/components/ui/card'
import { Smartphone, Zap } from 'lucide-react'

interface WoFTapToStartStageProps {
  onTapDetected?: () => void
  isListening?: boolean
}

export function WoFTapToStartStage({ onTapDetected, isListening = false }: WoFTapToStartStageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Main Instruction Card */}
        <div className="flex gap-4">
          {/* Text Card */}
          <Card className="flex-1 p-6 bg-white border border-gray-200 shadow-sm">
            <div className="text-center">
              <h1 className="text-lg font-medium text-gray-900 leading-tight">
                TAP<br />
                TO MAKE<br />
                THE FIRST<br />
                CHARGES ON<br />
                THE WAY
              </h1>
            </div>
          </Card>
          
          {/* NFC Indicator Card */}
          <Card className="w-24 h-24 p-4 bg-white border border-gray-200 shadow-sm flex items-center justify-center">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ${
                isListening ? 'animate-pulse' : ''
              }`}>
                <Zap className="w-6 h-6 text-gray-400" />
              </div>
              {isListening && (
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
              )}
            </div>
          </Card>
        </div>

        {/* Instruction Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Pulsing tap button to<br />
            show action
          </p>
        </div>

        {/* Development Note */}
        <div className="text-center pt-8">
          <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">
            TEXT AND STYLISTIC<br />
            ELEMENTS TO BE<br />
            WORKED ON IN<br />
            COLLABORATION WITH<br />
            CROSSLUCID
          </p>
        </div>

      </div>
    </div>
  )
} 