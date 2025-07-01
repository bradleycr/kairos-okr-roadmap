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
    <div className="min-h-screen bg-background flex items-start justify-center pt-24 pb-8 px-4">
      <Card className="w-full max-w-md mx-auto bg-card border border-border shadow-md rounded-xl">
        <CardContent className="p-6 space-y-6">
          {/* Header: Icon and title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Sprout className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-light text-foreground">
                {isNewUser ? 'Begin Your Journey' : 'Welcome Back'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {isNewUser 
                  ? 'Plant your first digital seed and watch it grow through conservation choices'
                  : 'Continue nurturing your garden or plant a new seed'
                }
              </p>
            </div>
          </div>

          {/* Actions: Create new path and show existing paths */}
          <div className="space-y-4">
            {/* Create New Path */}
            <Button
              onClick={onCreateNewPath}
              disabled={isProcessing}
              className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg rounded-lg text-base sm:text-lg"
            >
              <div className="flex items-center gap-3">
                <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Plant New Seed</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </Button>

            {/* Existing Paths */}
            {userPaths.length > 0 && (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
                    Your Growing Gardens
                  </p>
                </div>
                {userPaths.slice(0, 3).map((path) => (
                  <Button
                    key={path.id}
                    variant="outline"
                    onClick={() => onSelectExistingPath(path)}
                    className="w-full h-12 sm:h-14 border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-lg text-base sm:text-lg"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Flower2 className="w-4 h-4 text-primary" />
                        <div className="text-left">
                          <p className="text-sm sm:text-base font-medium text-foreground">
                            {path.name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {path.choices.length} choices • {path.currentStage}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Status: Processing indicator */}
          {isProcessing && (
            <div className="text-center">
              <p className="text-sm sm:text-base text-primary animate-pulse">
                Preparing your garden...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 