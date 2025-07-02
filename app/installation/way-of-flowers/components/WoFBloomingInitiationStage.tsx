/**
 * WoF Blooming Initiation Stage
 * Features the "Welcome Back" card with ecosystem selection
 * Matches the beautiful minimal design from screenshots
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, TreePine, Flower, Globe } from 'lucide-react'

interface WoFBloomingInitiationStageProps {
  onEcosystemChoice?: (ecosystem: string) => void
  userDisplayName?: string
  supportedEcosystems?: string[]
}

export function WoFBloomingInitiationStage({ 
  onEcosystemChoice, 
  userDisplayName = "NewAccount",
  supportedEcosystems = ["Barbados", "France", "India", "Sierra Leone", "Costa Rica"]
}: WoFBloomingInitiationStageProps) {
  
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
        
        {/* Welcome Back Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          
          {/* Header Cards */}
          <div className="flex gap-3">
            <Card className="flex-1 p-4 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">WELCOME BACK</span>
              </div>
            </Card>
            
            <Card className="p-4 bg-white border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600">
                You chose to support:<br />
                <span className="font-medium text-gray-900">Barbados</span><br />
                <span className="font-medium text-gray-900">France</span><br />
                <span className="font-medium text-gray-900">India</span><br />
                <span className="font-medium text-gray-900">Sierra Leone</span><br />
                <span className="font-medium text-gray-900">Costa Rica</span>
              </div>
            </Card>
          </div>

          {/* Ecosystem Visualization */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                SEEDING<br />
                BEGINS<br />
                A LIVING<br />
                ECOLOGICAL<br />
                STORY
              </h3>
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                <TreePine className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Welcome NewAccount<br />
              mode
            </p>
          </div>

          {/* Action Text */}
          <p className="text-sm text-gray-600 text-center">
            Seed drops in the earth
          </p>
        </div>

        {/* Mobile Screens Preview */}
        <div className="flex gap-4 justify-center">
          
          {/* Screen 1 - Bird */}
          <div className="w-32 h-48 bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center space-y-2">
            <div className="text-xs text-gray-500 font-mono">
              RISE IN ESSENCE<br />
              AWAKENING<br />
              BLOOM
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Flower className="w-6 h-6 text-gray-600" />
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs text-gray-600"
              onClick={() => onEcosystemChoice?.('bird')}
            >
              Touch to start
            </Button>
          </div>

          {/* Screen 2 - Choices */}
          <div className="w-32 h-48 bg-gray-100 rounded-lg p-4 flex flex-col justify-center space-y-2">
            <div className="text-xs text-gray-500 font-mono text-center">
              In the following pages<br />
              you will have two<br />
              choices that will be<br />
              represented by a change<br />
              in your bloom
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs text-gray-600"
              onClick={() => onEcosystemChoice?.('continue')}
            >
              Continue
            </Button>
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