/**
 * Installation Experience Page
 * Serves as the main interface for specific art installations
 * Provides custom auth flows, branding, and interactions per installation
 */

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Frame, 
  Palette, 
  Users, 
  Heart, 
  Crown,
  Eye,
  MapPin,
  Info,
  Zap,
  ArrowRight,
  ChevronDown
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NFCAuthFlow } from '@/app/nfc/components/NFCAuthFlow'
import { installationManager } from '@/lib/installation/installationManager'
import { InstallationConfig, InstallationTheme } from '@/lib/installation/types'
import { cn } from '@/lib/utils'

export default function InstallationExperience() {
  const params = useParams()
  const router = useRouter()
  const installationId = params.installationId as string
  
  const [installation, setInstallation] = useState<InstallationConfig | null>(null)
  const [theme, setTheme] = useState<InstallationTheme | null>(null)

  useEffect(() => {
    loadInstallation()
  }, [installationId])

  const loadInstallation = async () => {
    try {
      const config = await installationManager.getInstallation(installationId)
      if (config) {
        setInstallation(config)
        setTheme(config.theme)
        
        // Apply custom CSS variables for theming
        applyInstallationTheme(config.theme)
      } else {
        // Installation not found - redirect to main app
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to load installation:', error)
      router.push('/')
    }
  }

  const applyInstallationTheme = (theme: InstallationTheme) => {
    const root = document.documentElement
    
    // Apply custom CSS variables
    root.style.setProperty('--installation-primary', theme.primaryColor)
    root.style.setProperty('--installation-secondary', theme.secondaryColor)
    root.style.setProperty('--installation-accent', theme.accentColor)
    
    // Update favicon and title if needed
    if (theme.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon) favicon.href = theme.favicon
    }
    
    if (installation?.name) {
      document.title = `${installation.name} - KairOS Art Installation`
    }
  }

  if (!installation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Frame className="w-12 h-12 mx-auto text-neutral-400" />
          <h2 className="text-2xl font-bold text-neutral-900">Installation Not Found</h2>
          <p className="text-neutral-600">This art installation is not available.</p>
          <Button onClick={() => router.push('/')}>
            Return to KairOS
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{installation.name}</h1>
          <p className="text-xl text-neutral-600">{installation.description}</p>
        </div>
      </div>
    </div>
  )
} 