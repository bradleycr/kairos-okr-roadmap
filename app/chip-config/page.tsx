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
import { Progress } from '@/components/ui/progress'
import { 
  NfcIcon, 
  CopyIcon, 
  KeyIcon,
  QrCodeIcon,
  SmartphoneIcon,
  CheckIcon,
  RefreshCwIcon,
  InfoIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  ZapIcon,
  TrendingDownIcon,
  GaugeIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateiPhoneNFCUrl } from '@/lib/url-shortener'

// --- Types ---
interface NTAG424Config {
  chipId: string
  chipUID: string
  did: string
  signature: string
  publicKey: string
  privateKey: string
  nfcUrl: string
  testUrl: string
  createdAt: string
  challengeMessage: string
  urlAnalysis: {
    bytes: number
    chars: number
    compatibility: Record<string, string>
  }
}

// --- Utility Functions ---
function generateRandomHex(bytes: number): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function generateChipUID(): string {
  // Generate realistic NTAG424 DNA UID (7 bytes)
  return [
    '04', // NXP manufacturer byte
    generateRandomHex(1),
    generateRandomHex(1), 
    generateRandomHex(1),
    generateRandomHex(1),
    generateRandomHex(1),
    generateRandomHex(1)
  ].join(':').toUpperCase()
}

// --- Real Ed25519 Cryptography Functions ---
async function generateRealEd25519KeyPair(chipUID: string): Promise<{ 
  privateKey: string, 
  publicKey: string, 
  signature: string,
  privateKeyBytes: Uint8Array,
  publicKeyBytes: Uint8Array,
  challengeMessage: string,
  did: string
}> {
  // Call the server to generate real crypto
  const response = await fetch('/api/crypto/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chipUID })
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate cryptographic keys')
  }
  
  const data = await response.json()
  
  return {
    privateKey: data.privateKey,
    publicKey: data.publicKey,
    signature: data.signature,
    privateKeyBytes: new Uint8Array(data.privateKeyBytes),
    publicKeyBytes: new Uint8Array(data.publicKeyBytes),
    challengeMessage: data.challengeMessage,
    did: data.did
  }
}

// --- iPhone NFC URL Generation ---
function generateOptimizedNFCUrl(
  chipUID: string,
  signature: string,
  publicKey: string,
  did: string,
  baseUrl: string,
  chipType: string
): {
  nfcUrl: string
  urlAnalysis: { bytes: number; chars: number; compatibility: Record<string, string> }
  compressionLevel: string
} {
  return generateiPhoneNFCUrl(
    chipUID,
    signature,
    publicKey,
    did,
    baseUrl,
    chipType as 'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA'
  )
}

export default function ChipConfigPage() {
  const { toast } = useToast()
  
  // --- State Management ---
  const [configs, setConfigs] = useState<NTAG424Config[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [chipName, setChipName] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('https://kair-os.vercel.app')
  const [selectedChipType, setSelectedChipType] = useState<'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA'>('NTAG213')
  
  // --- Generate New NTAG424 DNA Configuration ---
  const generateNTAG424Config = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      const chipId = chipName || `KAIROS_${generateRandomHex(4).toUpperCase()}`
      const chipUID = generateChipUID()
      
      const keyPair = await generateRealEd25519KeyPair(chipUID)
      const did = keyPair.did
      
      // Generate optimized URL for iPhone NFC apps
      const { nfcUrl, urlAnalysis, compressionLevel } = generateOptimizedNFCUrl(
        chipUID,
        keyPair.signature,
        keyPair.publicKey,
        did,
        customBaseUrl,
        selectedChipType
      )
      
      // Create full test URL for verification
      const testUrl = `${customBaseUrl}/nfc?did=${encodeURIComponent(did)}&signature=${keyPair.signature}&publicKey=${keyPair.publicKey}&uid=${chipUID}&challenge=${encodeURIComponent(keyPair.challengeMessage)}`
      
      const config: NTAG424Config = {
        chipId,
        chipUID,
        did,
        signature: keyPair.signature,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        nfcUrl,
        testUrl,
        createdAt: new Date().toISOString(),
        challengeMessage: keyPair.challengeMessage,
        urlAnalysis
      }
      
      setConfigs(prev => [config, ...prev])
      setChipName('')
      
      toast({
        title: "✅ iPhone NFC URL Generated",
        description: `${config.chipId} ready - ${urlAnalysis.bytes} bytes (${compressionLevel} compression)`,
      })
      
    } catch (error) {
      console.error('❌ Configuration generation failed:', error)
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : "Unable to generate chip configuration",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [chipName, customBaseUrl, selectedChipType, toast])
  
  // --- Copy to Clipboard ---
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "📋 Copied!",
        description: `${label} copied to clipboard - ready for iPhone NFC Tools`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      })
    }
  }, [toast])

  // --- Test NFC URL ---
  const testNFCUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/30 dark:to-indigo-900/30">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur-lg opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                <SmartphoneIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                NFC URL Generator
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                Generate <span className="font-semibold text-purple-600">copy-paste URLs</span> for NFC programming apps
              </p>
            </div>
          </div>
          
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <SmartphoneIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-gray-800 dark:text-gray-200">
              <strong>📱 Universal Workflow:</strong> Generate URL → Copy → Open NFC Tools app → Paste into "URL/URI" → Write to NFC tag. Works on iPhone, Android & other NFC programming tools!
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Generator */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-200 dark:border-purple-700 shadow-lg bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/10">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-600/20 dark:to-blue-600/20">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                  NFC URL Generator
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Create URLs optimized for NFC programming apps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="chipName" className="text-gray-800 dark:text-gray-200 font-medium">Chip Name (Optional)</Label>
                  <Input
                    id="chipName"
                    placeholder="e.g., KAIROS_CHIP_01"
                    value={chipName}
                    onChange={(e) => setChipName(e.target.value)}
                    className="text-gray-800 dark:text-gray-200 border-purple-200 focus:border-purple-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chipType" className="text-gray-800 dark:text-gray-200 font-medium">NFC Chip Type</Label>
                  <select
                    id="chipType"
                    value={selectedChipType}
                    onChange={(e) => setSelectedChipType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-purple-200 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-purple-400"
                  >
                    <option value="NTAG213">NTAG213 (137 bytes) - Ultra Cheap</option>
                    <option value="NTAG215">NTAG215 (492 bytes) - Standard</option>
                    <option value="NTAG216">NTAG216 (900 bytes) - Large</option>
                    <option value="NTAG424_DNA">NTAG424 DNA (256 bytes) - Secure</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-gray-800 dark:text-gray-200 font-medium">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://kair-os.vercel.app"
                    className="text-gray-800 dark:text-gray-200 border-purple-200 focus:border-purple-400"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 Use your live domain: kair-os.vercel.app
                  </p>
                </div>
                
                <Button 
                  onClick={generateNTAG424Config}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating URL...
                    </>
                  ) : (
                    <>
                      <SmartphoneIcon className="h-4 w-4 mr-2" />
                      Generate NFC URL
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Chip Specifications */}
            <Card className="border-indigo-200 dark:border-indigo-700 shadow-lg bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-800 dark:to-indigo-900/10">
              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-600/20 dark:to-purple-600/20">
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <GaugeIcon className="h-5 w-5 text-indigo-600" />
                  {selectedChipType} Specs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm">
                  {(() => {
                    const chipSpecs = {
                      'NTAG213': { memory: 137, price: '$0.15', compression: 'Ultra' },
                      'NTAG215': { memory: 492, price: '$0.25', compression: 'Standard' },
                      'NTAG216': { memory: 900, price: '$0.35', compression: 'Full' },
                      'NTAG424_DNA': { memory: 256, price: '$1.50', compression: 'Standard' }
                    }
                    const spec = chipSpecs[selectedChipType]
                    const urlLength = customBaseUrl.length + 35 // Estimate
                    const utilizationPercent = Math.round((urlLength / spec.memory) * 100)
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Memory:</span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">{spec.memory}B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Price:</span>
                            <span className="font-mono text-green-600 dark:text-green-400">{spec.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Compression:</span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">{spec.compression}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Est. Usage:</span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">{utilizationPercent}%</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 dark:text-gray-300 text-xs">URL Fit Analysis:</span>
                            <span className="text-xs font-mono">
                              ~{urlLength}/{spec.memory}B
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(utilizationPercent, 100)} 
                            className="h-2"
                          />
                          <div className="flex items-center gap-1 mt-1">
                            {utilizationPercent <= 70 ? (
                              <CheckCircleIcon className="h-3 w-3 text-green-500" />
                            ) : utilizationPercent <= 90 ? (
                              <AlertTriangleIcon className="h-3 w-3 text-yellow-500" />
                            ) : (
                              <AlertTriangleIcon className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {utilizationPercent <= 70 ? 'Perfect fit for NFC programming' : 
                               utilizationPercent <= 90 ? 'Should work fine' : 'May need shorter URL'}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Configurations */}
          <div className="lg:col-span-2">
            {configs.length === 0 ? (
              <Card className="border-gray-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full">
                      <SmartphoneIcon className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    No NFC URLs Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                    Generate your first URL optimized for NFC programming apps. Works with NFC Tools, TagWriter, and other apps!
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                    <CopyIcon className="h-4 w-4" />
                    <span>Simple copy-paste workflow</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {configs.map((config, index) => (
                  <Card key={index} className="border-blue-200 dark:border-blue-700 shadow-lg bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-600/20 dark:to-blue-600/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                            {config.chipId}
                          </CardTitle>
                          <CardDescription className="text-gray-700 dark:text-gray-300">
                            Created {new Date(config.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                          {config.urlAnalysis.bytes} bytes
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Tabs defaultValue="url" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="url">📱 NFC URL</TabsTrigger>
                          <TabsTrigger value="instructions">📋 How to Use</TabsTrigger>
                          <TabsTrigger value="config">🔧 Details</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="url" className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Copy this URL into NFC programming apps</Label>
                            <div className="mt-2">
                              <Textarea 
                                value={config.nfcUrl}
                                readOnly
                                className="font-mono text-sm h-20 text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 border-blue-200"
                              />
                              <div className="flex gap-2 mt-3">
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  onClick={() => copyToClipboard(config.nfcUrl, 'NFC URL')}
                                >
                                  <CopyIcon className="h-4 w-4 mr-2" />
                                  Copy for NFC Tools
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => testNFCUrl(config.nfcUrl)}
                                >
                                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                                  Test
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-sm">
                            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">📊 Compatibility Analysis:</h4>
                            <div className="grid grid-cols-2 gap-2 text-green-700 dark:text-green-300 text-xs">
                              {Object.entries(config.urlAnalysis.compatibility).map(([chip, status]) => (
                                <div key={chip} className="flex justify-between">
                                  <span>{chip}:</span>
                                  <span>{status}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700 text-green-600 dark:text-green-400">
                              <strong>Total size:</strong> {config.urlAnalysis.bytes} bytes ({config.urlAnalysis.chars} characters)
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="instructions" className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm space-y-3">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200">📱 Universal NFC Programming Steps:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300">
                              <li>Copy the URL above using the "Copy" button</li>
                              <li>Download <strong>"NFC Tools"</strong> (free on iOS/Android)</li>
                              <li>Open your NFC app and tap <strong>"Write"</strong></li>
                              <li>Select <strong>"Add a record"</strong> → <strong>"URL/URI"</strong></li>
                              <li>Paste the copied URL into the text field</li>
                              <li>Tap <strong>"Write"</strong> and hold your NFC tag near your phone</li>
                              <li>Wait for the success sound/vibration</li>
                              <li>Test by tapping the tag - it should open the URL in your browser</li>
                            </ol>
                          </div>
                          
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-sm space-y-3">
                            <h4 className="font-medium text-amber-800 dark:text-amber-200">💡 Universal NFC Tips:</h4>
                            <ul className="space-y-1 text-amber-700 dark:text-amber-300 text-xs">
                              <li>• <strong>iPhone:</strong> NFC antenna is near the top back (camera area)</li>
                              <li>• <strong>Android:</strong> NFC antenna is usually in the center back</li>
                              <li>• <strong>Writing distance:</strong> Hold tag within 1-2cm of phone</li>
                              <li>• <strong>If write fails:</strong> Try "Erase tag" first, then write</li>
                              <li>• <strong>Alternative apps:</strong> TagWriter by NXP, Trigger, etc.</li>
                              <li>• <strong>Testing:</strong> Written tags work on any NFC-enabled phone</li>
                            </ul>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="config" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-gray-700 dark:text-gray-300">Chip UID</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input 
                                  value={config.chipUID} 
                                  readOnly 
                                  className="font-mono text-xs text-gray-800 dark:text-gray-200"
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(config.chipUID, 'Chip UID')}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-700 dark:text-gray-300">DID Identity</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input 
                                  value={config.did} 
                                  readOnly 
                                  className="font-mono text-xs text-gray-800 dark:text-gray-200"
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(config.did, 'DID')}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <Label className="text-sm text-gray-700 dark:text-gray-300">Full Test URL (for debugging)</Label>
                            <div className="mt-2">
                              <Textarea 
                                value={config.testUrl}
                                readOnly
                                className="font-mono text-xs h-24 text-gray-800 dark:text-gray-200"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="mt-2"
                                onClick={() => copyToClipboard(config.testUrl, 'Test URL')}
                              >
                                <CopyIcon className="h-3 w-3 mr-2" />
                                Copy Test URL
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 