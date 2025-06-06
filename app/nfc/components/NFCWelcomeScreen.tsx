/**
 * NFCWelcomeScreen Component
 * 
 * Elegant welcome interface for manual NFC page access
 * Guides users to pendant configuration and scanning options
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  WifiIcon,
  ScanIcon
} from 'lucide-react'

export function NFCWelcomeScreen() {
  const router = useRouter()

  return (
    <Card className="border border-border shadow-lg bg-card/80 backdrop-blur-sm animate-[fadeIn_0.8s_ease-out]">
      <CardHeader className="text-center pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
          <div className="relative">
            <WifiIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <span className="font-mono tracking-wide">PENDANT.SETUP</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Configure or scan your MELD pendant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <WifiIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground font-mono">
              Setup Required
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Programmed pendants auto-authenticate when tapped
            </p>
          </div>
          
          <div className="flex flex-col gap-3 pt-3 max-w-xs mx-auto">
            <Button 
              onClick={() => router.push('/chip-config')} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
            >
              <WifiIcon className="h-4 w-4 mr-2" />
              Configure Pendant
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/nfc/scan')}
              className="w-full border-primary/30 text-primary hover:bg-primary/5 font-mono"
            >
              <ScanIcon className="h-4 w-4 mr-2" />
              Scan Raw Pendant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 