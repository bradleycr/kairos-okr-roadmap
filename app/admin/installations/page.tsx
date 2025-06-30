/**
 * Installation Administration Panel
 * Beautiful interface for creating and managing art installations
 * Configures subdomain routing, custom auth flows, and theming
 */

"use client"

import { useState, useEffect } from 'react'
import { Plus, Settings, Globe, Copy, ExternalLink, CheckCircle, Palette, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { installationManager } from '@/lib/installation/installationManager'
import { InstallationConfig } from '@/lib/installation/types'

export default function InstallationAdmin() {
  const { toast } = useToast()
  const [installations, setInstallations] = useState<InstallationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInstallations()
  }, [])

  const loadInstallations = async () => {
    try {
      const allInstallations = await installationManager.getAllInstallations()
      setInstallations(allInstallations)
    } finally {
      setIsLoading(false)
    }
  }

  const copySubdomainUrl = (installationId: string) => {
    const url = `https://${installationId}.kair-os.vercel.app`
    navigator.clipboard.writeText(url)
    toast({
      title: "URL Copied!",
      description: `Subdomain URL copied: ${url}`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Installation Manager</h1>
        
        <Alert className="mb-6">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            Each installation gets its own subdomain with custom auth flows and theming.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-12">Loading installations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {installations.map((installation) => (
              <Card key={installation.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{installation.name}</h3>
                  <p className="text-sm text-neutral-600 mb-4">{installation.description}</p>
                  
                  <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg mb-4">
                    <code className="text-sm font-mono flex-1">
                      {installation.id}.kair-os.vercel.app
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copySubdomainUrl(installation.id)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 