/**
 * Installation Administration Panel
 * Interface for creating and managing art installations
 * Configures subdomain routing, custom auth flows, and theming
 */

"use client"

import { useState, useEffect } from 'react'
import { Plus, Settings, Globe, Copy, ExternalLink, CheckCircle, Palette, Users, RefreshCw, Smartphone, Download, QrCode, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { installationManager } from '@/lib/installation/installationManager'
import { InstallationConfig } from '@/lib/installation/types'

interface NFCURLConfig {
  chipUID: string
  pin: string
  testUrl: string
  productionUrl: string
  installationUrl: string
  simulationUrl: string
}

export default function InstallationAdmin() {
  const { toast } = useToast()
  const [installations, setInstallations] = useState<InstallationConfig[]>([])
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationConfig | null>(null)
  const [nfcConfigDialog, setNfcConfigDialog] = useState(false)
  const [generatedURLs, setGeneratedURLs] = useState<NFCURLConfig | null>(null)
  const [isGeneratingURLs, setIsGeneratingURLs] = useState(false)

  useEffect(() => {
    loadInstallations()
  }, [])

  const loadInstallations = async () => {
    try {
      const allInstallations = await installationManager.getAllInstallations()
      setInstallations(allInstallations)
    }
  }

  const clearAndReload = () => {
    // Clear localStorage to fix duplicates
    localStorage.removeItem('kairos-installations')
    localStorage.removeItem('kairos-installation-interactions')
    localStorage.removeItem('kairos-installation-stats')
    
    // Reload page to reinitialize
    window.location.reload()
  }

  const copyInstallationUrl = (installationId: string) => {
    const url = `https://kair-os.vercel.app/installation/${installationId}`
    navigator.clipboard.writeText(url)
    toast({
      title: "✨ URL Copied!",
      description: `Installation URL copied: ${url}`,
    })
  }

  const visitInstallation = (installationId: string) => {
    const url = `/installation/${installationId}`
    window.open(url, '_blank')
  }

  const simulateInstallation = (installationId: string) => {
    // Generate test parameters for simulation
    const testChipUID = `04:${Math.random().toString(16).substr(2, 12).toUpperCase().match(/.{2}/g)?.join(':')}`
    const simulationUrl = `/installation/${installationId}?chipUID=${encodeURIComponent(testChipUID)}&pin=1234&test=true`
    window.open(simulationUrl, '_blank')
    
    toast({
      title: "🎭 Simulation Started!",
      description: `Opening ${installationId} with test NFC parameters`,
    })
  }

  const generateNFCURLs = async (installation: InstallationConfig) => {
    setIsGeneratingURLs(true)
    try {
      // Generate random test chipUID
      const chipUID = `04:${Array.from({length: 6}, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
      ).join(':')}`
      
      const pin = '1234' // Default PIN for testing
      const baseUrl = 'https://kair-os.vercel.app'
      
      // Import NFC authentication engine
      const { NFCAuthenticationEngine } = await import('@/app/nfc/utils/nfc-authentication')
      
      // Generate DID:Key NFC URL (what goes on the physical chip)
      const didKeyUrl = await NFCAuthenticationEngine.generateNFCURL(chipUID, pin, baseUrl)
      
      // Create installation-specific URLs
      const installationUrl = `${baseUrl}/installation/${installation.id}`
      const testUrl = `${installationUrl}?chipUID=${encodeURIComponent(chipUID)}&pin=${pin}&test=true`
      const simulationUrl = `${installationUrl}?simulate=true&chipUID=${encodeURIComponent(chipUID)}`
      
      const config: NFCURLConfig = {
        chipUID,
        pin,
        testUrl,
        productionUrl: didKeyUrl,
        installationUrl,
        simulationUrl
      }
      
      setGeneratedURLs(config)
      
      toast({
        title: "🔗 URLs Generated!",
        description: `NFC URLs created for ${installation.name}`,
      })
      
    } catch (error) {
      console.error('Failed to generate NFC URLs:', error)
      toast({
        title: "❌ Generation Failed",
        description: "Failed to generate NFC URLs. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingURLs(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "📋 Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const downloadAsText = (urls: NFCURLConfig, installationName: string) => {
    const content = `
# NFC URLs for ${installationName}
Generated: ${new Date().toISOString()}

## Chip Configuration
ChipUID: ${urls.chipUID}
PIN: ${urls.pin}

## URLs

### Production URL (Program to NFC Chip)
${urls.productionUrl}

### Installation Direct Link
${urls.installationUrl}

### Test URL (With Parameters)
${urls.testUrl}

### Simulation URL (No Authentication)
${urls.simulationUrl}

## Usage Instructions

1. **For NFC Chips**: Use the Production URL
   - Program this URL onto your NFC chip using NFC Tools or similar app
   - Users tap chip → authenticate with PIN → access installation

2. **For Testing**: Use the Test URL
   - Opens installation with pre-filled authentication parameters
   - Good for testing without physical NFC chips

3. **For Demos**: Use the Simulation URL
   - Opens installation in demo mode
   - No authentication required

4. **Direct Access**: Use the Installation Link
   - Direct browser access to the installation
   - Requires manual authentication
`.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${installationName.toLowerCase().replace(/\s+/g, '-')}-nfc-urls.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "💾 Downloaded!",
      description: `NFC configuration saved as text file`,
    })
  }

  const getInstallationIcon = (installationId: string) => {
    switch (installationId) {
      case 'way-of-flowers':
        return '🌸'
      case 'civic-portraits':
        return '🏛️'
      default:
        return '🎨'
    }
  }

  const getThemeColors = (theme: any) => {
    if (!theme) return 'from-blue-500/20 to-purple-500/20'
    
    // Convert hex colors to appropriate gradients
    const primary = theme.primaryColor || '#3B82F6'
    const secondary = theme.secondaryColor || '#8B5CF6'
    
    // Create a gradient class based on the colors
    if (primary.includes('22C55E')) return 'from-green-500/20 to-emerald-500/20'
    if (primary.includes('059669')) return 'from-emerald-600/20 to-teal-500/20'
    
    return 'from-blue-500/20 to-purple-500/20'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Installation Manager
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage art installations with custom authentication flows and NFC integration
          </p>
        </div>
        
        {/* Alert Banner */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Globe className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Each installation gets its own dedicated URL with custom auth flows and NFC chip support.</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={clearAndReload}
              className="ml-4 h-8"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reset Data
            </Button>
          </AlertDescription>
        </Alert>

        {/* Installation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installations.map((installation) => (
            <Card key={installation.id} className="group hover:shadow-lg transition-all duration-300 border-border/40 hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getInstallationIcon(installation.id)}</div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{installation.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{installation.artist}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {installation.description}
                </p>
                
                {/* URL Display */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4 border border-border/30">
                  <code className="text-sm font-mono flex-1 text-foreground/80">
                    /installation/{installation.id}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyInstallationUrl(installation.id)}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Theme Preview */}
                <div className={`h-2 rounded-full mb-4 bg-gradient-to-r ${getThemeColors(installation.theme)}`} />
                
                {/* Installation Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {installation.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    {installation.features?.length || 0} features
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-3">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => visitInstallation(installation.id)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateInstallation(installation.id)}
                    className="px-3"
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="px-3"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>

                {/* NFC Configuration Button */}
                <Dialog open={nfcConfigDialog && selectedInstallation?.id === installation.id} onOpenChange={(open) => {
                  setNfcConfigDialog(open)
                  if (open) {
                    setSelectedInstallation(installation)
                    setGeneratedURLs(null)
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedInstallation(installation)}
                    >
                      <Smartphone className="w-3 h-3 mr-2" />
                      Configure NFC
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        NFC Configuration - {installation.name}
                      </DialogTitle>
                      <DialogDescription>
                        Generate URLs for NFC chips and testing. Create physical interactions with your installation.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {!generatedURLs ? (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">📱</div>
                          <h3 className="text-lg font-semibold mb-2">Ready to Generate NFC URLs</h3>
                          <p className="text-muted-foreground mb-6">
                            Create test and production URLs for "{installation.name}" installation
                          </p>
                          <Button 
                            onClick={() => generateNFCURLs(installation)}
                            disabled={isGeneratingURLs}
                            size="lg"
                          >
                            {isGeneratingURLs ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <QrCode className="w-4 h-4 mr-2" />
                            )}
                            Generate NFC URLs
                          </Button>
                        </div>
                      ) : (
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="production">Production</TabsTrigger>
                            <TabsTrigger value="testing">Testing</TabsTrigger>
                            <TabsTrigger value="simulation">Simulation</TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">Chip Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm">Chip UID:</Label>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">{generatedURLs.chipUID}</code>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm">PIN:</Label>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">{generatedURLs.pin}</code>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => window.open(generatedURLs.simulationUrl, '_blank')}
                                  >
                                    <Play className="w-3 h-3 mr-2" />
                                    Test Simulation
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => downloadAsText(generatedURLs, installation.name)}
                                  >
                                    <Download className="w-3 h-3 mr-2" />
                                    Download Config
                                  </Button>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="production" className="space-y-4">
                            <Alert>
                              <Smartphone className="h-4 w-4" />
                              <AlertDescription>
                                This URL should be programmed onto physical NFC chips using NFC Tools or similar apps.
                              </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-3">
                              <Label>Production NFC URL (Program to Chip)</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={generatedURLs.productionUrl} 
                                  readOnly 
                                  className="font-mono text-xs"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => copyToClipboard(generatedURLs.productionUrl, 'Production URL')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Program this URL onto NFC chips. Users tap chip → enter PIN → access installation.
                              </p>
                            </div>
                          </TabsContent>

                          <TabsContent value="testing" className="space-y-4">
                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                              <ExternalLink className="h-4 w-4" />
                              <AlertDescription>
                                Test URLs include authentication parameters for easy testing without physical chips.
                              </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <Label>Test URL (With Auth Parameters)</Label>
                                <div className="flex gap-2">
                                  <Input 
                                    value={generatedURLs.testUrl} 
                                    readOnly 
                                    className="font-mono text-xs"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => copyToClipboard(generatedURLs.testUrl, 'Test URL')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(generatedURLs.testUrl, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <Label>Direct Installation Link</Label>
                                <div className="flex gap-2">
                                  <Input 
                                    value={generatedURLs.installationUrl} 
                                    readOnly 
                                    className="font-mono text-xs"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => copyToClipboard(generatedURLs.installationUrl, 'Installation URL')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(generatedURLs.installationUrl, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="simulation" className="space-y-4">
                            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                              <Play className="h-4 w-4" />
                              <AlertDescription>
                                Simulation URLs bypass authentication for demos and development.
                              </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-3">
                              <Label>Simulation URL (No Auth Required)</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={generatedURLs.simulationUrl} 
                                  readOnly 
                                  className="font-mono text-xs"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => copyToClipboard(generatedURLs.simulationUrl, 'Simulation URL')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(generatedURLs.simulationUrl, '_blank')}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Test Now
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                For demos, development, and testing without NFC hardware.
                              </p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!installations.length && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">No Installations Found</h3>
            <p className="text-muted-foreground mb-6">
              Create your first art installation to get started with KairOS.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Installation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 