'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  NfcIcon, 
  CopyIcon, 
  KeyIcon,
  QrCodeIcon,
  SmartphoneIcon,
  CheckIcon,
  RefreshCwIcon,
  InfoIcon,
  ExternalLinkIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// --- Types ---
interface ChipConfig {
  chipId: string
  aesKey: string
  baseUrl: string
  templateUrl: string
  qrCodeData: string
  createdAt: string
}

// --- Utility Functions ---
function generateRandomHex(bytes: number): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function generateChipId(): string {
  return 'KAIROS_' + generateRandomHex(4).toUpperCase()
}

function generateAESKey(): string {
  return generateRandomHex(16) // 128-bit key
}

export default function ChipConfigPage() {
  const { toast } = useToast()
  
  // --- State Management ---
  const [configs, setConfigs] = useState<ChipConfig[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [chipName, setChipName] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('https://kair-os.vercel.app/nfc')
  
  // --- Generate New Chip Configuration ---
  const generateChipConfig = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      const chipId = chipName || generateChipId()
      const aesKey = generateAESKey()
      const baseUrl = customBaseUrl
      
      // NTAG424 Template URL with dynamic parameters
      const templateUrl = `${baseUrl}?s={AES_SECRET}&uid={CHIP_UID}&t={TIMESTAMP}&c={COUNTER}`
      
      // QR Code data for mobile NFC apps
      const qrCodeData = JSON.stringify({
        type: 'NTAG424_CONFIG',
        baseUrl,
        chipId,
        aesKey,
        templateUrl,
        instructions: 'Program this configuration to your NTAG424 chip'
      })
      
      const newConfig: ChipConfig = {
        chipId,
        aesKey,
        baseUrl,
        templateUrl,
        qrCodeData,
        createdAt: new Date().toISOString()
      }
      
      setConfigs(prev => [newConfig, ...prev])
      setChipName('')
      
      toast({
        title: "Chip Configuration Generated",
        description: `New NTAG424 config created for ${chipId}`,
      })
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate chip configuration",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [chipName, customBaseUrl, toast])
  
  // --- Copy to Clipboard ---
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      })
    }
  }, [toast])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <NfcIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                NTAG424 Chip Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Generate URLs and settings for NFC chip programming
              </p>
            </div>
          </div>
          
          <Alert className="border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Web apps cannot directly program NFC chips. Use the generated configuration with mobile NFC programming apps like <strong>TagWriter</strong> or <strong>TagXplorer</strong>.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Generator */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                <CardTitle className="flex items-center gap-2">
                  <KeyIcon className="h-5 w-5 text-purple-600" />
                  Generate Chip Config
                </CardTitle>
                <CardDescription>
                  Create new NTAG424 configuration with AES-128 encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="chipName">Chip Name (Optional)</Label>
                  <Input
                    id="chipName"
                    placeholder="e.g., DJ_BOOTH_01"
                    value={chipName}
                    onChange={(e) => setChipName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={generateChipConfig}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Generate Configuration
                    </>
                  )}
                </Button>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Recommended NFC Apps:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <SmartphoneIcon className="h-3 w-3" />
                      <span><strong>Android:</strong> TagWriter, TagXplorer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SmartphoneIcon className="h-3 w-3" />
                      <span><strong>iOS:</strong> NFC TagInfo, TagWriter</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Generated Configurations */}
          <div className="lg:col-span-2 space-y-6">
            {configs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-500">
                    <NfcIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Configurations Yet</h3>
                    <p className="text-sm">Generate your first NTAG424 chip configuration to get started.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              configs.map((config, index) => (
                <Card key={index} className="border-blue-200 dark:border-blue-800">
                  <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <NfcIcon className="h-5 w-5 text-blue-600" />
                        {config.chipId}
                      </CardTitle>
                      <Badge variant="outline" className="text-blue-600">
                        {new Date(config.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Tabs defaultValue="config" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="config">Configuration</TabsTrigger>
                        <TabsTrigger value="template">Template URL</TabsTrigger>
                        <TabsTrigger value="instructions">Instructions</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="config" className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">AES-128 Key</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                value={config.aesKey} 
                                readOnly 
                                className="font-mono text-xs"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(config.aesKey, 'AES Key')}
                              >
                                <CopyIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-500">Base URL</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                value={config.baseUrl} 
                                readOnly 
                                className="text-xs"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(config.baseUrl, 'Base URL')}
                              >
                                <CopyIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="template" className="space-y-4">
                        <div>
                          <Label className="text-xs text-gray-500">NTAG424 Template URL</Label>
                          <div className="mt-2">
                            <Textarea 
                              value={config.templateUrl}
                              readOnly
                              className="font-mono text-xs h-20"
                            />
                            <Button 
                              size="sm" 
                              className="mt-2 w-full"
                              onClick={() => copyToClipboard(config.templateUrl, 'Template URL')}
                            >
                              <CopyIcon className="h-3 w-3 mr-2" />
                              Copy Template URL
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="instructions" className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-3">
                          <h4 className="font-medium">Programming Steps:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                            <li>Open your NFC programming app (TagWriter, TagXplorer, etc.)</li>
                            <li>Select "Program NTAG424" or "Dynamic NFC"</li>
                            <li>Enter the AES-128 key: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{config.aesKey}</code></li>
                            <li>Set the template URL with dynamic parameters</li>
                            <li>Write the configuration to your NTAG424 chip</li>
                            <li>Test by tapping the chip with your phone!</li>
                          </ol>
                        </div>
                        
                        <Alert className="border-green-200 bg-green-50">
                          <CheckIcon className="h-4 w-4" />
                          <AlertDescription>
                            Once programmed, each tap will generate a unique URL with encrypted parameters that only your KairOS server can verify.
                          </AlertDescription>
                        </Alert>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4">
            <Button 
              variant="outline"
              onClick={() => window.open('https://kair-os.vercel.app/nfc-test', '_blank')}
            >
              <ExternalLinkIcon className="h-4 w-4 mr-2" />
              Test NFC Flow
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('https://kair-os.vercel.app/nfc', '_blank')}
            >
              <NfcIcon className="h-4 w-4 mr-2" />
              NFC Authentication
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 