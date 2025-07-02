/**
 * WoF Ecosystem Choices Stage
 * Features nature-based ecosystem selection with loading states
 * Matches the beautiful minimal design from screenshots
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TreePine, Mountain, Flower2, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface WoFEcosystemChoicesStageProps {
  onEcosystemSelect?: (ecosystem: string) => void
  isLoading?: boolean
}

export function WoFEcosystemChoicesStage({ 
  onEcosystemSelect,
  isLoading = false
}: WoFEcosystemChoicesStageProps) {
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleSelection = (ecosystem: string) => {
    setSelectedOption(ecosystem)
    onEcosystemSelect?.(ecosystem)
  }

  if (isLoading) {
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

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          
          <div className="text-center space-y-4">
            <h1 className="text-xl font-light text-gray-900 font-mono">
              READY TO<br />
              CHOOSE?
            </h1>
            
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
            
            <p className="text-sm text-gray-600">
              Please wait...
            </p>
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
        
        {/* Blooming Status */}
        <div className="flex gap-4">
          <Card className="flex-1 p-6 bg-white border border-gray-200 shadow-sm">
            <div className="text-center">
              <h1 className="text-lg font-medium text-gray-900 leading-tight">
                NATURE'S<br />
                DIGITAL<br />
                ESSENCE<br />
                UNFOLDS<br />
                BEAUTY<br />
                BLOOMING
              </h1>
            </div>
          </Card>
          
          <Card className="w-24 h-24 p-4 bg-white border border-gray-200 shadow-sm flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Poetic text &nbsp;&nbsp;&nbsp;&nbsp; Loading graphic rotating
          </p>
        </div>

        {/* Ecosystem Choices */}
        <div className="space-y-4">
          
          {/* Option A */}
          <Card 
            className={`p-6 border-2 cursor-pointer transition-all ${
              selectedOption === 'temperate' 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => handleSelection('temperate')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mountain className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Option A</h3>
                  <p className="text-sm text-gray-600">TEMPELHOF BERLIN</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Option B */}
          <Card 
            className={`p-6 border-2 cursor-pointer transition-all ${
              selectedOption === 'tropical' 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => handleSelection('tropical')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                  <TreePine className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Option B</h3>
                  <p className="text-sm text-gray-600">WALKER'S PRESERVE, BARBADOS</p>
                </div>
              </div>
            </div>
          </Card>

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