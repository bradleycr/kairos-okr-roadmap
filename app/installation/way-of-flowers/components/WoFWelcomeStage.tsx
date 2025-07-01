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
    <div className="min-h-screen bg-background flex items-start justify-center pt-24 pb-8 px-4">
      <Card className="w-full max-w-md mx-auto bg-card border border-border shadow-md rounded-xl">
        <CardContent className="p-6 text-center space-y-6">
          {/* Header: Icon and title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Flower2 className="w-16 h-16 text-primary" />
                <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-light text-foreground">
                Way of Flowers
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                A contemplative journey connecting intention with conservation through digital presence
              </p>
            </div>
          </div>

          {/* Instructions: Steps for the user */}
          <div className="space-y-4 py-4">
            {[{
              color: 'primary',
              step: 1,
              text: 'Tap your NFC pendant to begin',
            }, {
              color: 'accent',
              step: 2,
              text: 'Choose your conservation path',
            }, {
              color: 'primary',
              step: 3,
              text: 'Watch your digital creation evolve',
            }].map(({ color, step, text }) => (
              <div key={step} className="flex items-center gap-3 text-left">
                <div className={`w-8 h-8 rounded-full bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-${color} text-sm font-medium`}>{step}</span>
                </div>
                <p className="text-sm sm:text-base text-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* NFC Instruction: Visual prompt for NFC action */}
          <div className="bg-muted rounded-lg p-4 border border-border flex items-center justify-center gap-2 text-muted-foreground">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Hold your pendant near your device</span>
          </div>

          {/* Development Mode: Demo button for simulation */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onSimulateFlow}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground rounded-lg px-4 py-2"
            >
              Demo Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 