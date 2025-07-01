/**
 * WoF First Interaction Stage
 * Choose between creating new path or continuing existing ones
 */

'use client'

import { Sprout, Flower2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type FlowerPath } from '@/lib/installation/wayOfFlowers'

interface WoFInteractionStageProps {
  userPaths: FlowerPath[]
  isNewUser: boolean
  isProcessing: boolean
  onCreateNewPath: () => void
  onSelectExistingPath: (path: FlowerPath) => void
}

export function WoFInteractionStage({
  userPaths,
  isNewUser,
  isProcessing,
  onCreateNewPath,
  onSelectExistingPath
}: WoFInteractionStageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Sprout className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-light text-gray-900">
                {isNewUser ? 'Begin Your Journey' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-600">
                {isNewUser 
                  ? 'Plant your first digital seed and watch it grow through conservation choices'
                  : 'Continue nurturing your garden or plant a new seed'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Create New Path */}
            <Button
              onClick={onCreateNewPath}
              disabled={isProcessing}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Sprout className="w-4 h-4" />
                <span>Plant New Seed</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Button>

            {/* Existing Paths */}
            {userPaths.length > 0 && (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Your Growing Gardens
                  </p>
                </div>
                
                {userPaths.slice(0, 3).map((path) => (
                  <Button
                    key={path.id}
                    variant="outline"
                    onClick={() => onSelectExistingPath(path)}
                    className="w-full h-12 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Flower2 className="w-4 h-4 text-emerald-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {path.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {path.choices.length} choices • {path.currentStage}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          {isProcessing && (
            <div className="text-center">
              <p className="text-sm text-emerald-600 animate-pulse">
                Preparing your garden...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 