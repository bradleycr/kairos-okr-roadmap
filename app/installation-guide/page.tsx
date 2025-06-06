'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Cpu, 
  Zap, 
  Wifi, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Wrench,
  DollarSign,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowLeftIcon,
  NfcIcon,
  LoaderIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Ritual } from '@/lib/ritual/types'

// --- Types ---
interface GuideSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  content: React.ReactNode
  estimatedTime?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

// Wrapper component for useSearchParams
function InstallationGuideContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // --- State ---
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [currentRitual, setCurrentRitual] = useState<Ritual | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // --- Load Ritual Data ---
  useEffect(() => {
    const ritualId = searchParams.get('ritual')
    if (ritualId) {
      // In a real app, fetch from API or context
      // For now, create a mock ritual based on ID
      const mockRitual: Ritual = {
        id: ritualId,
        name: `Installation Guide for ${ritualId}`,
        description: 'Hardware setup and deployment guide',
        nodes: [
          {
            nodeId: 'esp32-001',
            label: 'Main Node',
            x: 100,
            y: 100,
            behavior: 'save_moment',
            isInitiallyActive: true
          }
        ]
      }
      setCurrentRitual(mockRitual)
    }
    setIsLoading(false)
  }, [searchParams])

  // --- Helper Functions ---
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(label)
      toast({
        title: "📋 Copied to Clipboard",
        description: `${label} copied successfully`,
      })
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: "❌ Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // --- Dynamic Content Based on Ritual ---
  const getHardwareRequirements = () => {
    const baseRequirements = [
      {
        item: 'ESP32 Development Board',
        cost: '$8-12',
        link: 'https://www.amazon.com/s?k=ESP32+development+board',
        required: true,
        description: 'Main microcontroller for KairOS nodes'
      },
      {
        item: 'MFRC522 NFC Reader Module',
        cost: '$3-5',
        link: 'https://www.amazon.com/s?k=MFRC522+NFC+RFID+module',
        required: true,
        description: 'NFC authentication and pendant reading'
      },
      {
        item: '296x296 E-Paper Display (Waveshare)',
        cost: '$15-25',
        link: 'https://www.waveshare.com/2.9inch-e-paper-module.htm',
        required: true,
        description: 'High-contrast display for beautiful UI'
      },
      {
        item: 'Passive Buzzer Module',
        cost: '$1-2',
        link: 'https://www.amazon.com/s?k=passive+buzzer+arduino',
        required: false,
        description: 'Audio feedback for interactions'
      },
      {
        item: 'NTAG213 NFC Tags (100 pack)',
        cost: '$15-25',
        link: 'https://www.amazon.com/s?k=NTAG213+NFC+tags',
        required: true,
        description: 'User pendants for authentication'
      },
      {
        item: 'Dupont Jumper Wires',
        cost: '$5-8',
        link: 'https://www.amazon.com/s?k=dupont+jumper+wires+arduino',
        required: true,
        description: 'Connecting components together'
      }
    ]

    // Add ritual-specific requirements
    if (currentRitual?.nodes) {
      const behaviors = currentRitual.nodes.map(n => n.behavior)
      const hasVoting = behaviors.some(b => b.includes('vote'))
      const hasTipping = behaviors.some(b => b === 'send_tip')
      const hasLighting = behaviors.some(b => b === 'trigger_light')
      
      if (hasVoting) {
        baseRequirements.push({
          item: 'LED Indicator Modules',
          cost: '$2-3',
          link: 'https://www.amazon.com/s?k=LED+module+arduino',
          required: false,
          description: 'Visual feedback for voting options'
        })
      }
      
      if (hasTipping) {
        baseRequirements.push({
          item: 'Additional LCD Display',
          cost: '$3-5',
          link: 'https://www.amazon.com/s?k=LCD+display+arduino',
          required: false,
          description: 'Display tip amounts and confirmations'
        })
      }
      
      if (hasLighting) {
        baseRequirements.push({
          item: 'Relay Module',
          cost: '$5-8',
          link: 'https://www.amazon.com/s?k=relay+module+arduino',
          required: false,
          description: 'Control external lighting systems'
        })
      }
    }

    return baseRequirements
  }

  const getWiringDiagram = () => {
    return `
# ESP32 to MFRC522 NFC Reader Wiring
ESP32 Pin    MFRC522 Pin    Function
---------    -----------    --------
21           SDA/SS         Chip Select
22           RST            Reset
18           SCK            SPI Clock  
23           MOSI           Master Out Slave In
19           MISO           Master In Slave Out
3.3V         3.3V           Power
GND          GND            Ground

# ESP32 to E-Paper Display Wiring
ESP32 Pin    Display Pin    Function
---------    -----------    --------
15           CS             Chip Select
27           DC             Data/Command
26           RST            Reset
25           BUSY           Busy Signal
18           CLK            SPI Clock
23           DIN            Data Input
3.3V         VCC            Power (3.3V)
GND          GND            Ground

# Optional: Buzzer for Audio Feedback
ESP32 Pin    Buzzer Pin     Function
---------    ----------     --------
22           Positive       Audio Signal
GND          Negative       Ground

# Power Supply Requirements
- Development: USB cable (5V, 500mA)
- Production: 5V power supply with 3.3V regulator
- Expected consumption: ~200mA during operation
- Peak consumption: ~350mA during NFC + display refresh
    `
  }

  const getLibraryRequirements = () => {
    return [
      {
        name: 'ArduinoJson',
        purpose: 'JSON parsing and serialization for ritual data',
        install: 'Library Manager > Search "ArduinoJson" > Install latest version',
        version: '6.21.0+'
      },
      {
        name: 'ESP32Time',
        purpose: 'Real-time clock and timestamp management',
        install: 'Library Manager > Search "ESP32Time" > Install',
        version: '2.0.0+'
      },
      {
        name: 'MFRC522',
        purpose: 'NFC reader communication and tag detection',
        install: 'Library Manager > Search "MFRC522" > Install',
        version: '1.4.10+'
      },
      {
        name: 'GxEPD2',
        purpose: 'E-paper display driver for beautiful UI',
        install: 'Library Manager > Search "GxEPD2" > Install',
        version: '1.5.0+'
      },
      {
        name: 'Ed25519 (Production)',
        purpose: 'Cryptographic signature verification',
        install: 'Library Manager > Search "Ed25519" by Frank Boesing',
        version: '1.0.0+'
      }
    ]
  }

  const getTotalCost = () => {
    return getHardwareRequirements()
      .filter(item => item.required)
      .reduce((total, item) => {
        const cost = parseInt(item.cost.match(/\d+/)?.[0] || '0')
        return total + cost
      }, 0)
  }

  // --- Dynamic Sections ---
  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: 'Installation Overview',
      icon: BookOpen,
      estimatedTime: '5 min read',
      difficulty: 'beginner',
      content: (
        <div className="space-y-6">
          <div className="retro-card p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Welcome to the KairOS Installation Guide
            </h3>
            <p className="text-muted-foreground mb-4">
              This comprehensive guide will walk you through setting up your KairOS hardware nodes for 
              {currentRitual ? ` the "${currentRitual.name}" ritual` : ' your custom ritual'}. 
              Everything you need to know is here, from ordering components to final deployment.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">Total Cost</span>
                </div>
                <p className="text-2xl font-bold text-primary">${getTotalCost()}-{getTotalCost() + 15}</p>
                <p className="text-xs text-muted-foreground">Per node (required components)</p>
              </div>
              
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">Setup Time</span>
                </div>
                <p className="text-2xl font-bold text-accent">2-4 hrs</p>
                <p className="text-xs text-muted-foreground">Including wiring & testing</p>
              </div>
              
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-success" />
                  <span className="font-medium text-foreground">Difficulty</span>
                </div>
                <p className="text-2xl font-bold text-success">Beginner</p>
                <p className="text-xs text-muted-foreground">No soldering required</p>
              </div>
            </div>

            {currentRitual && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Ritual Configuration</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Name:</strong> {currentRitual.name}</p>
                  <p><strong>Nodes:</strong> {currentRitual.nodes.length}</p>
                  <p><strong>Behaviors:</strong> {currentRitual.nodes.map(n => n.behavior).join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="retro-card p-6">
            <h4 className="font-medium text-foreground mb-3">What You'll Learn</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Hardware selection and ordering
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Wiring ESP32 to NFC and display
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Arduino IDE setup and libraries
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Sketch compilation and upload
                </li>
              </ul>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  NFC tag configuration and testing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Production deployment best practices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Troubleshooting common issues
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Monitoring and maintenance
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'hardware',
      title: 'Hardware Requirements',
      icon: Cpu,
      estimatedTime: '10 min',
      difficulty: 'beginner',
      content: (
        <div className="space-y-6">
          <div className="retro-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Required Components</h3>
            
            <div className="space-y-4">
              {getHardwareRequirements().map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.item}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{item.cost}</p>
                      <Badge variant={item.required ? "default" : "secondary"}>
                        {item.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Shop on Amazon
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
              <h4 className="font-medium text-success mb-2">💡 Shopping Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Buy ESP32 development boards with built-in USB (easier programming)</li>
                <li>• Choose MFRC522 modules with antenna included</li>
                <li>• Waveshare e-paper displays often include connection cables</li>
                <li>• Consider buying components in bulk for multiple nodes</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'wiring',
      title: 'Wiring Diagram',
      icon: Zap,
      estimatedTime: '30-45 min',
      difficulty: 'intermediate',
      content: (
        <div className="space-y-6">
          <div className="retro-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">ESP32 Connections</h3>
            
            <div className="bg-muted rounded-lg p-4 border relative">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-foreground">Wiring Configuration</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getWiringDiagram(), 'Wiring Diagram')}
                  className="h-8"
                >
                  {copiedCode === 'Wiring Diagram' ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                {getWiringDiagram()}
              </pre>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <h4 className="font-medium text-warning mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Double-check power connections (3.3V, not 5V)</li>
                  <li>• Use quality jumper wires to avoid loose connections</li>
                  <li>• Keep wire length under 10cm for reliable SPI communication</li>
                  <li>• Connect GND pins first, power pins last</li>
                </ul>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">🔧 Assembly Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use breadboard for prototyping, perfboard for production</li>
                  <li>• Label your wires with tape for easier troubleshooting</li>
                  <li>• Test NFC reader first, then add display</li>
                  <li>• Secure loose connections with additional dupont connectors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'software',
      title: 'Software Setup',
      icon: Download,
      estimatedTime: '15-20 min',
      difficulty: 'beginner',
      content: (
        <div className="space-y-6">
          <div className="retro-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Arduino IDE Setup</h3>
            
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 border">
                <h4 className="font-medium text-foreground mb-3">1. Install Arduino IDE</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Download and install the latest Arduino IDE (2.0+ recommended) from the official website.
                </p>
                <a
                  href="https://www.arduino.cc/en/software"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 retro-button"
                >
                  <Download className="h-4 w-4" />
                  Download Arduino IDE
                </a>
              </div>

              <div className="bg-muted rounded-lg p-4 border">
                <h4 className="font-medium text-foreground mb-3">2. Add ESP32 Board Support</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Open Arduino IDE and navigate to:</p>
                  <code className="block bg-card p-2 rounded font-mono text-xs">
                    File → Preferences → Additional Board Manager URLs
                  </code>
                  <p>Add this URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-card p-2 rounded font-mono text-xs break-all">
                      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json', 'ESP32 URL')}
                      className="h-8"
                    >
                      {copiedCode === 'ESP32 URL' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 border">
                <h4 className="font-medium text-foreground mb-3">3. Install Required Libraries</h4>
                <div className="space-y-3">
                  {getLibraryRequirements().map((lib, index) => (
                    <div key={index} className="bg-card border border-border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-foreground">{lib.name}</h5>
                          <p className="text-xs text-muted-foreground">{lib.purpose}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {lib.version}
                        </Badge>
                      </div>
                      <code className="text-xs text-muted-foreground">
                        {lib.install}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'deployment',
      title: 'Upload & Test',
      icon: Wrench,
      estimatedTime: '20-30 min',
      difficulty: 'intermediate',
      content: (
        <div className="space-y-6">
          <div className="retro-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sketch Upload Process</h3>
            
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">📥 Download Your Sketch</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Export the ESP32 sketch from the KairOS platform using the "Export to ESP32" button 
                  in the ritual designer.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/?tab=designer')}
                  className="gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Go to Ritual Designer
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Upload Steps:</h4>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium text-foreground">Open Sketch in Arduino IDE</p>
                      <p className="text-sm text-muted-foreground">Double-click the downloaded .ino file to open it in Arduino IDE</p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium text-foreground">Select ESP32 Board</p>
                      <p className="text-sm text-muted-foreground">Tools → Board → ESP32 Arduino → "ESP32 Dev Module"</p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium text-foreground">Connect ESP32 via USB</p>
                      <p className="text-sm text-muted-foreground">Use a quality USB cable and select the correct COM port in Tools → Port</p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="font-medium text-foreground">Upload Sketch</p>
                      <p className="text-sm text-muted-foreground">Click the Upload button (→) or press Ctrl+U. Wait for "Done uploading"</p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <p className="font-medium text-foreground">Test with Serial Monitor</p>
                      <p className="text-sm text-muted-foreground">Open Serial Monitor (115200 baud) to see debug output and test NFC functionality</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <h4 className="font-medium text-success mb-2">✅ Success Indicators</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Serial Monitor shows "KairOS Node Ready!" message</li>
                  <li>• E-paper display shows the MELD idle screen</li>
                  <li>• NFC reader LED blinks when tags are nearby</li>
                  <li>• Audio feedback (buzzer) confirms successful interactions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-foreground">Loading installation guide...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to KairOS
          </Button>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">KairOS Installation Guide</h1>
              <p className="text-lg text-muted-foreground">Complete hardware setup and deployment instructions</p>
            </div>
          </div>
          
          {currentRitual && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <NfcIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Configured for: {currentRitual.name}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`retro-card p-4 text-left transition-all hover:shadow-float ${
                expandedSections.has(section.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <section.icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground text-sm">{section.title}</span>
              </div>
              {section.estimatedTime && (
                <p className="text-xs text-muted-foreground">{section.estimatedTime}</p>
              )}
              {section.difficulty && (
                <Badge 
                  variant="outline" 
                  className={`mt-2 text-xs ${
                    section.difficulty === 'beginner' ? 'border-success text-success' :
                    section.difficulty === 'intermediate' ? 'border-warning text-warning' :
                    'border-destructive text-destructive'
                  }`}
                >
                  {section.difficulty}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className={expandedSections.has(section.id) ? 'block' : 'hidden'}>
              <div className="flex items-center gap-3 mb-6">
                <section.icon className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                {section.estimatedTime && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {section.estimatedTime}
                  </Badge>
                )}
              </div>
              {section.content}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This guide automatically updates based on your ritual configuration
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://github.com/meldtech/kairos"
                target="_blank"
                rel="noopener noreferrer"
                className="retro-button gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Source Code
              </a>
              <Button
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Return to KairOS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function InstallationGuideLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-foreground">Loading installation guide...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function InstallationGuidePage() {
  return (
    <Suspense fallback={<InstallationGuideLoading />}>
      <InstallationGuideContent />
    </Suspense>
  )
} 