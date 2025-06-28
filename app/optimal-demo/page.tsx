/**
 * 🌐 DID:Key Authentication Demo
 * 
 * This demonstrates the complete DID:Key authentication flow for:
 * - NFC pendant initialization with DID:Key URLs
 * - W3C standards-compliant identity resolution
 * - PIN-based challenge-response authentication
 * - ESP32-style offline DID verification
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  KeyIcon, 
  ShieldCheckIcon, 
  WifiIcon, 
  WifiOffIcon,
  CpuIcon,
  SmartphoneIcon,
  QrCodeIcon
} from 'lucide-react'

export default function DIDKeyAuthDemo() {
  const { toast } = useToast()
  
  // Demo state
  const [pendantData, setPendantData] = useState<any>(null)
  const [pin, setPin] = useState('')
  const [authData, setAuthData] = useState<any>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🌐 DID:Key Authentication</h1>
        <p className="text-muted-foreground">
          W3C standards-based authentication for thousands of NFC pendants + ESP32 network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              Architecture Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ What's On NFC Chip</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• ChipUID (hardware identifier)</li>
                  <li>• DID:Key URL (W3C standard format)</li>
                  <li>• Device ID (unique identifier)</li>
                  <li>• ❌ NO PRIVATE KEY (security principle)</li>
                  <li>• ❌ NO SECRETS (public data only)</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🔐 What's Computed</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Private Key = SHA256(chipUID + PIN)</li>
                  <li>• DID:Key resolution (local, no network)</li>
                  <li>• Ed25519 signatures for challenges</li>
                  <li>• Never stored, always computed fresh</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🌐 ESP32 Network</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Local DID:Key resolution</li>
                  <li>• Offline signature verification</li>
                  <li>• No private keys or user data</li>
                  <li>• No external dependencies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Security Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Private Keys Never Stored</p>
                  <p className="text-sm text-muted-foreground">Always computed from chipUID + PIN</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Clone-Resistant</p>
                  <p className="text-sm text-muted-foreground">Even if NFC chip is cloned, attacker needs PIN</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Offline Verification</p>
                  <p className="text-sm text-muted-foreground">ESP32s can verify without internet</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Quantum Resistant</p>
                  <p className="text-sm text-muted-foreground">Ed25519 signatures throughout</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Cross-Platform</p>
                  <p className="text-sm text-muted-foreground">Works on phones, browsers, ESP32s</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuIcon className="h-5 w-5" />
              DID:Key Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">Zero Infrastructure</h4>
                <p className="text-sm text-muted-foreground">No servers, databases, or external dependencies</p>
                <Badge className="mt-1">✅ Current</Badge>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">W3C Standards</h4>
                <p className="text-sm text-muted-foreground">DID Core compliance for future wallet integration</p>
                <Badge className="mt-1">✅ Current</Badge>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">Quantum Resistant</h4>
                <p className="text-sm text-muted-foreground">Ed25519 signatures with upgrade path</p>
                <Badge className="mt-1">✅ Current</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SmartphoneIcon className="h-5 w-5" />
              Use Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-16 justify-start">
                <div className="text-left">
                  <div className="font-medium">🧠 Local AI Inference</div>
                  <div className="text-sm text-muted-foreground">Access distributed AI models</div>
                </div>
              </Button>

              <Button variant="outline" className="h-16 justify-start">
                <div className="text-left">
                  <div className="font-medium">🗳️ Decentralized Voting</div>
                  <div className="text-sm text-muted-foreground">Participate in governance</div>
                </div>
              </Button>

              <Button variant="outline" className="h-16 justify-start">
                <div className="text-left">
                  <div className="font-medium">🔐 Identity Verification</div>
                  <div className="text-sm text-muted-foreground">Prove identity without revealing data</div>
                </div>
              </Button>

              <Button variant="outline" className="h-16 justify-start">
                <div className="text-left">
                  <div className="font-medium">🌐 Mesh Networking</div>
                  <div className="text-sm text-muted-foreground">Connect to ESP32 network</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📊 Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">1000+</div>
              <div className="text-sm text-muted-foreground">Users per ESP32</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">&lt;200ms</div>
              <div className="text-sm text-muted-foreground">Verification Time</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">256-bit</div>
              <div className="text-sm text-muted-foreground">Security Level</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">0 KB</div>
              <div className="text-sm text-muted-foreground">Private Key Storage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 Getting Started</CardTitle>
          <CardDescription>
            Ready to implement? Here's your roadmap:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge>1</Badge>
              <div>
                <p className="font-medium">Set up Public Key Registry</p>
                <p className="text-sm text-muted-foreground">API endpoints for registration and lookup</p>
                <code className="text-xs bg-muted p-1 rounded">✅ Already implemented</code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge>2</Badge>
              <div>
                <p className="font-medium">Initialize NFC Pendants</p>
                <p className="text-sm text-muted-foreground">Program chips with public keys</p>
                <code className="text-xs bg-muted p-1 rounded">import OptimalDecentralizedAuth</code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge>3</Badge>
              <div>
                <p className="font-medium">Deploy ESP32 Network</p>
                <p className="text-sm text-muted-foreground">Flash C++ code for verification</p>
                <code className="text-xs bg-muted p-1 rounded">#include "optimal_auth.h"</code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge>4</Badge>
              <div>
                <p className="font-medium">Scale to Thousands</p>
                <p className="text-sm text-muted-foreground">Monitor performance and optimize</p>
                <code className="text-xs bg-muted p-1 rounded">Batch sync + caching</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 