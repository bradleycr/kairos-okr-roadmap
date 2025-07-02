/**
 * WoF Connect Seed Stage
 * Mobile-optimized NFC connection screen matching screenshot design
 * Features minimal UI with seed icon and connection instructions
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, MoreHorizontal } from 'lucide-react'

interface WoFConnectSeedStageProps {
  onConnected?: () => void
  isConnecting?: boolean
}

export function WoFConnectSeedStage({ onConnected, isConnecting = false }: WoFConnectSeedStageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Status Bar */}
      <div className="flex justify-between items-center p-4 text-sm">
        <span className="font-medium">11:33</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 bg-black rounded-sm" />
          <div className="w-1 h-1 bg-black rounded-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light text-gray-900">
            Connect your seed
          </h1>
          <p className="text-sm text-gray-600">
            Hold your seed tag flat against the back of<br />
            your device until it stops vibrating
          </p>
        </div>

        {/* Seed Icon */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center ${
            isConnecting ? 'animate-pulse' : ''
          }`}>
            <Leaf className="w-10 h-10 text-gray-600" />
          </div>
          {isConnecting && (
            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping" />
          )}
        </div>

        {/* Options Button */}
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-500 text-sm"
          onClick={() => {
            // Handle more options if needed
          }}
        >
          More options
        </Button>

      </div>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex justify-center">
          <div className="w-32 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>

    </div>
  )
} 