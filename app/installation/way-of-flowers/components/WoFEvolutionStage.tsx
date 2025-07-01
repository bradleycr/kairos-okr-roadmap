/**
 * WoF Evolution Stage
 * Shows the evolution of the digital creation after making a choice
 */

'use client'

import { Sparkles, Flower2, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'

interface WoFEvolutionStageProps {
  selectedPath: FlowerPath
  selectedOffering: CauseOffering | null
}

export function WoFEvolutionStage({
  selectedPath,
  selectedOffering
}: WoFEvolutionStageProps) {
  if (!selectedOffering) return null

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
      <Card className="w-full max-w-lg bg-white/70 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 text-center space-y-8">
          {/* Evolution Animation */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center animate-pulse">
              <div className="text-4xl">
                {getStageEmoji(selectedPath.currentStage)}
              </div>
            </div>
            
            {/* Sparkles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-500 absolute -top-2 -right-2 animate-bounce" />
              <Sparkles className="w-4 h-4 text-teal-500 absolute -bottom-1 -left-1 animate-pulse" />
              <Sparkles className="w-5 h-5 text-emerald-400 absolute top-1 -left-3 animate-bounce delay-300" />
            </div>
          </div>

          {/* Evolution Message */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-light text-gray-900">
                Your Creation Evolves
              </h2>
              <p className="text-sm text-gray-600">
                Your choice to support <span className="font-medium">{selectedOffering.name}</span> has nurtured growth
              </p>
            </div>

            {/* Evolution Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-700">
                  Evolution Score: +{selectedOffering.evolutionEffect.bloomBoost}
                </span>
              </div>
              
              <div className="flex justify-center gap-2">
                <Badge 
                  variant="outline" 
                  className="bg-emerald-50 border-emerald-200"
                >
                  Stage: {selectedPath.currentStage}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-teal-50 border-teal-200"
                >
                  Choices: {selectedPath.choices.length}
                </Badge>
              </div>
            </div>

            {/* Visual Characteristics */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Creation Characteristics
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedPath.characteristics.primaryColor }}
                  ></div>
                  <span className="text-gray-600">Primary tone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedPath.characteristics.secondaryColor }}
                  ></div>
                  <span className="text-gray-600">Accent tone</span>
                </div>
                <div className="text-gray-600 text-left">
                  Bloom: {selectedPath.characteristics.bloomType}
                </div>
                <div className="text-gray-600 text-left">
                  Growth: {selectedPath.characteristics.growthPattern}
                </div>
              </div>
            </div>

            {/* Impact Message */}
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{ 
                borderLeftColor: selectedOffering.primaryColor,
                backgroundColor: selectedOffering.primaryColor + '10'
              }}
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedOffering.impactDescription}
              </p>
            </div>
          </div>

          {/* Transitioning Message */}
          <div className="pt-4">
            <p className="text-xs text-gray-500 animate-pulse">
              Growing into the commons...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 