/**
 * WoF Complete Stage
 * Final stage showing the completed journey
 */

'use client'

import { Check, Flower2, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'

interface WoFCompleteStageProps {
  selectedPath: FlowerPath
  selectedOffering: CauseOffering | null
  onStartOver: () => void
}

export function WoFCompleteStage({
  selectedPath,
  selectedOffering,
  onStartOver
}: WoFCompleteStageProps) {
  const getStageEmoji = (stage: FlowerPath['currentStage']) => {
    switch (stage) {
      case 'seeding': return '🌱'
      case 'sprouting': return '🌿'
      case 'blooming': return '🌸'
      case 'fruiting': return '🌺'
      default: return '🌱'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 text-center space-y-8">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            
            {/* Creation Badge */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-white rounded-full border-2 border-emerald-200 flex items-center justify-center">
                <span className="text-lg">
                  {getStageEmoji(selectedPath.currentStage)}
                </span>
              </div>
            </div>
          </div>

          {/* Completion Message */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-light text-gray-900">
                Journey Complete
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your digital creation has been planted in the conservation commons. 
                Thank you for contributing to a more regenerative future.
              </p>
            </div>

            {/* Path Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Flower2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-900">
                  {selectedPath.name}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-medium text-emerald-600">
                    {selectedPath.choices.length}
                  </p>
                  <p className="text-xs text-gray-500">Choices</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-teal-600">
                    {selectedPath.evolutionScore}
                  </p>
                  <p className="text-xs text-gray-500">Evolution</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-emerald-600 capitalize">
                    {selectedPath.currentStage}
                  </p>
                  <p className="text-xs text-gray-500">Stage</p>
                </div>
              </div>
            </div>

            {/* Last Choice */}
            {selectedOffering && (
              <div 
                className="p-3 rounded-lg border-l-4 text-left"
                style={{ 
                  borderLeftColor: selectedOffering.primaryColor,
                  backgroundColor: selectedOffering.primaryColor + '10'
                }}
              >
                <p className="text-sm font-medium text-gray-900">
                  Latest contribution:
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOffering.name}
                </p>
              </div>
            )}
          </div>

          {/* Auto-logout Notice */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Session will end automatically to protect your privacy
            </p>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onStartOver}
              className="border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              New Journey
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 