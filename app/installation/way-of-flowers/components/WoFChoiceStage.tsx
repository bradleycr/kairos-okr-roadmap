/**
 * WoF Choice Stage
 * Select conservation cause and make optional donation
 */

'use client'

import { TreePine, Waves, Bug, Leaf, Wallet, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type CauseOffering, type FlowerPath } from '@/lib/installation/wayOfFlowers'

interface WoFChoiceStageProps {
  selectedPath: FlowerPath
  availableOfferings: CauseOffering[]
  isProcessing: boolean
  walletConnected: boolean
  onMakeChoice: (offering: CauseOffering) => void
  onConnectWallet: () => void
}

const getCauseIcon = (offering: CauseOffering) => {
  switch (offering.category) {
    case 'restoration': return TreePine
    case 'conservation': return Leaf
    case 'regeneration': return Waves
    case 'protection': return Bug
    default: return Leaf
  }
}

export function WoFChoiceStage({
  selectedPath,
  availableOfferings,
  isProcessing,
  walletConnected,
  onMakeChoice,
  onConnectWallet
}: WoFChoiceStageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-light text-gray-900">
                Choose Your Conservation Path
              </h2>
              <p className="text-sm text-gray-600">
                Each choice shapes your digital creation and supports real conservation
              </p>
            </div>
            
            {/* Path Info */}
            <div className="flex items-center justify-center gap-4 py-2">
              <Badge variant="outline" className="bg-emerald-50 border-emerald-200">
                {selectedPath.name}
              </Badge>
              <Badge variant="outline" className="bg-teal-50 border-teal-200">
                Stage: {selectedPath.currentStage}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection */}
        {!walletConnected && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  Connect Wallet for Donations
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Optional: Connect your wallet to make real conservation donations
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onConnectWallet}
                className="border-blue-200 hover:bg-blue-50"
              >
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Conservation Choices */}
        <div className="grid gap-4">
          {availableOfferings.map((offering) => {
            const IconComponent = getCauseIcon(offering)
            
            return (
              <Card
                key={offering.id}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                onClick={() => onMakeChoice(offering)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: offering.primaryColor + '20' }}
                    >
                      <IconComponent 
                        className="w-6 h-6" 
                        style={{ color: offering.primaryColor }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {offering.name}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: offering.primaryColor + '40',
                            backgroundColor: offering.primaryColor + '10'
                          }}
                        >
                          {offering.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {offering.description}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-gray-500">
                          {offering.impactDescription}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Processing State */}
        {isProcessing && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-emerald-600 animate-pulse">
                Planting your choice in the digital soil...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 