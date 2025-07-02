/**
 * WoF Wallet Integration Stage
 * Final stage showing completed flow with wallet integration
 * Features user profile and interaction tracking
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Wallet, ArrowRight, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface WoFWalletIntegrationStageProps {
  onComplete?: () => void
  userAddress?: string
  interactionCount?: number
  hasWallet?: boolean
  onConnectWallet?: () => void
}

export function WoFWalletIntegrationStage({ 
  onComplete,
  userAddress,
  interactionCount = 17,
  hasWallet = false,
  onConnectWallet
}: WoFWalletIntegrationStageProps) {
  
  const [isProcessing, setIsProcessing] = useState(false)

  const handleComplete = async () => {
    setIsProcessing(true)
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    onComplete?.()
    setIsProcessing(false)
  }

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
      <div className="flex-1 p-6 space-y-6">
        
        {/* Flow Completion Cards */}
        <div className="space-y-4">
          
          {/* Restoration Options */}
          <div className="flex gap-4">
            
            <Card className="flex-1 p-6 bg-blue-50 border border-blue-200">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-medium text-gray-900">
                  MANGROVE<br />
                  RESTORATION
                </h3>
                <p className="text-xs text-gray-600">
                  User submits<br />
                  credit interaction
                </p>
              </div>
            </Card>

            <Card className="flex-1 p-6 bg-gray-50 border border-gray-200">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-medium text-gray-900">
                  COVER<br />
                  CROPPING
                </h3>
              </div>
            </Card>

          </div>

          {/* API Flow */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Check flow is functioning</span>
            <ArrowRight className="w-3 h-3" />
            <span>Trigger CoinlyUI API</span>
            <ArrowRight className="w-3 h-3" />
            <span>Waiting for TokenMemory approval</span>
          </div>

          {/* Status Display */}
          <Card className="p-6 bg-white border border-gray-200">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-medium text-gray-900">
                NATURE'S<br />
                DIGITAL<br />
                ESSENCE<br />
                UNFOLDS<br />
                BEAUTY<br />
                BLOOMING
              </h2>
              
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                {isProcessing ? (
                  <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Poetic text</p>
                <p>Loading graphic rotating</p>
              </div>
            </div>
          </Card>

          {/* Wallet Responsibility */}
          <Card className="p-6 bg-amber-50 border border-amber-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">
                WoF responsibility:<br />
                Sends updated
              </p>
              <p className="text-xs text-amber-700 font-mono">
                TokenMemory to Generative<br />
                pipeline input (JSON)
              </p>
            </div>
          </Card>

        </div>

        {/* User Profile Section */}
        <Card className="p-6 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">USER</h3>
                <p className="text-sm text-gray-600">
                  C {interactionCount}
                </p>
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="text-sm text-gray-600">
                You chose to support:<br />
                Barbados<br />
                France<br />
                India<br />
                Sierra Leone<br />
                Costa Rica
              </div>
              
              <div className="text-xs text-gray-500">
                Returns new<br />
                <span className="font-mono">GenerationState</span><br />
                for visual update
              </div>
            </div>

          </div>
        </Card>

        {/* Wallet Connection */}
        {!hasWallet ? (
          <Card className="p-6 border border-blue-200 bg-blue-50">
            <div className="text-center space-y-4">
              <Wallet className="w-8 h-8 text-blue-600 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
                <p className="text-sm text-gray-600">
                  Enable conservation donations and track your impact
                </p>
              </div>
              <Button 
                onClick={onConnectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Connect Wallet
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border border-green-200 bg-green-50">
            <div className="text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Wallet Connected</h3>
                <p className="text-sm text-gray-600 font-mono">
                  {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connected'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Completion Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleComplete}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? 'Processing...' : 'Complete Journey'}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Wait 60 Seconds, Then<br />
              reset Meld Node
            </p>
          </div>
        </div>

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