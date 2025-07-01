/**
 * WoF Welcome Stage
 * Initial landing stage for the Way of Flowers installation
 */

'use client'

import { Flower2, Sparkles, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WoFWelcomeStageProps {
  onSimulateFlow: () => void
}

export function WoFWelcomeStage({ onSimulateFlow }: WoFWelcomeStageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Flower2 className="w-16 h-16 text-emerald-600" />
                <Sparkles className="w-6 h-6 text-teal-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-gray-900">
                Way of Flowers
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                A contemplative journey connecting intention with conservation through digital presence
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-sm font-medium">1</span>
              </div>
              <p className="text-sm text-gray-700">
                Tap your NFC pendant to begin
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-teal-600 text-sm font-medium">2</span>
              </div>
              <p className="text-sm text-gray-700">
                Choose your conservation path
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-sm font-medium">3</span>
              </div>
              <p className="text-sm text-gray-700">
                Watch your digital creation evolve
              </p>
            </div>
          </div>

          {/* NFC Instruction */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">Hold your pendant near your device</span>
            </div>
          </div>

          {/* Development Mode */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={onSimulateFlow}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Demo Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 