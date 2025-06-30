'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Cpu, Zap, Eye, Lock, CheckCircle } from 'lucide-react'

/**
 * Nillion SecretLLM Demo Component
 * 
 * Demonstrates private AI analysis using Nillion's TEE
 * Perfect for showcasing ESP32 data analysis and user insights
 */

interface AnalysisResult {
  insights: string
  recommendations: string[]
  privacyScore: number
  confidence: number
  attestation?: string
}

export default function NillionAIDemo() {
  const [loading, setLoading] = useState(false)
  const [esp32Analysis, setESP32Analysis] = useState<AnalysisResult | null>(null)
  const [profileInsights, setProfileInsights] = useState<AnalysisResult | null>(null)
  const [ritualSuggestions, setRitualSuggestions] = useState<any>(null)
  const [attestation, setAttestation] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  // Sample ESP32 data for demonstration
  const sampleESP32Data = {
    deviceId: 'kairos-esp32-001',
    interactions: [
      {
        pendantDID: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
        pendantName: 'Alice\'s Pendant',
        timestamp: Date.now() - 3600000,
        behaviorExecuted: 'save_moment',
        authResult: 'success' as const
      },
      {
        pendantDID: 'did:key:z6MkfrQbzAFckQaLyxVn5jKRy24ySjLzBBqrT5CQdjxcnWqG',
        pendantName: 'Bob\'s Pendant',
        timestamp: Date.now() - 7200000,
        behaviorExecuted: 'ritual_execution',
        authResult: 'success' as const
      },
      {
        pendantDID: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
        pendantName: 'Alice\'s Pendant',
        timestamp: Date.now() - 10800000,
        behaviorExecuted: 'privacy_check',
        authResult: 'failed' as const
      }
    ],
    deviceMetrics: {
      batteryLevel: 85,
      signalStrength: -45,
      totalInteractions: 127,
      uniquePendants: 8
    }
  }

  // Sample user profile data
  const sampleUserProfile = {
    userDID: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    zkMoments: [
      { timestamp: Date.now() - 86400000, type: 'reflection', encrypted: true },
      { timestamp: Date.now() - 172800000, type: 'gratitude', encrypted: true },
      { timestamp: Date.now() - 259200000, type: 'intention', encrypted: false }
    ],
    ritualHistory: [
      { name: 'Morning Reflection', completions: 15, lastExecuted: Date.now() - 86400000 },
      { name: 'Evening Gratitude', completions: 12, lastExecuted: Date.now() - 172800000 },
      { name: 'Weekly Review', completions: 3, lastExecuted: Date.now() - 604800000 }
    ],
    preferences: {
      privacyLevel: 'high',
      notificationFrequency: 'daily',
      ritualComplexity: 'intermediate'
    }
  }

  const testNillionAPI = async () => {
    setLoading(true)
    try {
      // Test the API endpoint
      const response = await fetch('/api/nillion-ai', {
        method: 'GET'
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('API test failed:', error)
      setResult({ error: 'Failed to connect to Nillion API' })
    } finally {
      setLoading(false)
    }
  }

  const analyzeESP32Data = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'esp32_analysis',
          data: sampleESP32Data
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setESP32Analysis(result.analysis)
      }
    } catch (error) {
      console.error('ESP32 analysis failed:', error)
      setResult({ error: 'ESP32 analysis failed' })
    } finally {
      setLoading(false)
    }
  }

  const analyzeUserProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile_insights',
          data: sampleUserProfile
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setProfileInsights(result.insights)
      }
    } catch (error) {
      console.error('Profile analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRitualSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ritual_suggestions',
          data: { userProfile: sampleUserProfile }
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setRitualSuggestions(result.suggestions)
      }
    } catch (error) {
      console.error('Ritual suggestions failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAttestation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'attestation_check',
          data: {}
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setAttestation(result.attestation)
      }
    } catch (error) {
      console.error('Attestation check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🛡️ Nillion SecretLLM Demo
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Experience private AI analysis using Nillion's Trusted Execution Environment. 
          Your ESP32 data is processed without ever being exposed - perfect for KairOS!
        </p>
        
        {/* Privacy Features */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            TEE Protected
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            🔒 Zero Data Exposure
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            ⚡ Free Tier Available
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            🚀 No Setup Required
          </Badge>
        </div>
      </div>

      {/* Demo Tabs */}
      <Tabs defaultValue="esp32" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="esp32">ESP32 Analysis</TabsTrigger>
          <TabsTrigger value="profile">Profile Insights</TabsTrigger>
          <TabsTrigger value="rituals">Ritual Suggestions</TabsTrigger>
          <TabsTrigger value="attestation">TEE Verification</TabsTrigger>
        </TabsList>

        {/* ESP32 Analysis Tab */}
        <TabsContent value="esp32" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                ESP32 Device Analysis
              </CardTitle>
              <CardDescription>
                Analyze ESP32 interaction patterns privately using Nillion's TEE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample Data Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Sample ESP32 Data:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Device:</strong> {sampleESP32Data.deviceId}</p>
                  <p><strong>Interactions:</strong> {sampleESP32Data.interactions.length}</p>
                  <p><strong>Success Rate:</strong> {Math.round((sampleESP32Data.interactions.filter(i => i.authResult === 'success').length / sampleESP32Data.interactions.length) * 100)}%</p>
                  <p><strong>Battery:</strong> {sampleESP32Data.deviceMetrics.batteryLevel}%</p>
                </div>
              </div>

              <Button 
                onClick={analyzeESP32Data} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Analyzing in TEE...' : 'Analyze ESP32 Data'}
              </Button>

              {esp32Analysis && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Private Analysis Results:</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Insights:</strong> {esp32Analysis.insights}</p>
                    <div>
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {esp32Analysis.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <p><strong>Privacy Score:</strong> {esp32Analysis.privacyScore}/100</p>
                    <p><strong>Confidence:</strong> {Math.round(esp32Analysis.confidence * 100)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Insights Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile Insights</CardTitle>
              <CardDescription>
                Get personalized insights while keeping your data completely private
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Sample Profile Data:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>ZK Moments:</strong> {sampleUserProfile.zkMoments.length}</p>
                  <p><strong>Active Rituals:</strong> {sampleUserProfile.ritualHistory.length}</p>
                  <p><strong>Privacy Level:</strong> {sampleUserProfile.preferences.privacyLevel}</p>
                </div>
              </div>

              <Button 
                onClick={analyzeUserProfile} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Analyzing Privately...' : 'Get Personal Insights'}
              </Button>

              {profileInsights && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Your Private Insights:</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Analysis:</strong> {profileInsights.insights}</p>
                    <div>
                      <strong>Personalized Recommendations:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {profileInsights.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <p><strong>Privacy Score:</strong> {profileInsights.privacyScore}/100</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ritual Suggestions Tab */}
        <TabsContent value="rituals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Ritual Suggestions</CardTitle>
              <CardDescription>
                Get personalized ritual recommendations based on your private data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateRitualSuggestions} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating Suggestions...' : 'Generate Ritual Suggestions'}
              </Button>

              {ritualSuggestions && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Personalized Ritual Suggestions:</h4>
                  <div className="grid gap-4">
                    {ritualSuggestions.suggestions.map((ritual: any, i: number) => (
                      <div key={i} className="border p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">{ritual.name}</h5>
                          <div className="flex gap-2">
                            <Badge variant="outline">{ritual.difficulty}</Badge>
                            <Badge variant="outline">{ritual.privacyLevel}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ritual.description}</p>
                        <p className="text-xs text-gray-500">Frequency: {ritual.frequency}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                    <p className="text-sm"><strong>AI Reasoning:</strong> {ritualSuggestions.reasoning}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attestation Tab */}
        <TabsContent value="attestation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TEE Environment Verification</CardTitle>
              <CardDescription>
                Verify that your data is being processed in a secure Trusted Execution Environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkAttestation} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Verifying TEE...' : 'Verify TEE Environment'}
              </Button>

              {attestation && (
                <div className={`p-4 rounded-lg border ${
                  attestation.verified 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {attestation.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-red-600" />
                    )}
                    <h4 className={`font-semibold ${
                      attestation.verified ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {attestation.verified ? 'TEE Verified' : 'Verification Failed'}
                    </h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Environment:</strong> {attestation.environment}</p>
                    <p><strong>Timestamp:</strong> {new Date(attestation.timestamp).toLocaleString()}</p>
                    <p><strong>Status:</strong> {attestation.verified ? 'Secure' : 'Unverified'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
                        <h3 className="font-semibold mb-2">Free Tier Available!</h3>
          <p className="text-sm text-gray-600 mb-3">
            This demo uses Nillion's free test API key "Nillion2025" - no setup or registration required. 
            Perfect for prototyping your privacy-preserving AI applications.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>No API Key Needed</Badge>
            <Badge>Instant Setup</Badge>
            <Badge>TEE Protected</Badge>
            <Badge>Perfect for Prototyping</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 