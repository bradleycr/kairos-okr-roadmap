// --- Dynamic Installation Guide Component ---
// Comprehensive setup guide with wiring diagrams and step-by-step instructions
// Updates dynamically based on current ritual configuration and sketch exports

"use client"

import React, { useState, useEffect } from 'react'
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
  Cpu as HardwareIcon,
  Wrench,
  DollarSign,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Ritual } from '@/lib/ritual/types'

interface InstallationGuideProps {
  currentRitual?: Ritual | null
  onClose?: () => void
}

interface GuideSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  content: React.ReactNode
  estimatedTime?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export default function InstallationGuide({ currentRitual, onClose }: InstallationGuideProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(label)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
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

  // Dynamic hardware requirements based on current ritual
  const getHardwareRequirements = () => {
    const baseRequirements = [
      {
        item: 'ESP32 Development Board',
        cost: '$8-12',
        link: 'https://www.amazon.com/s?k=ESP32+development+board',
        required: true
      },
      {
        item: 'MFRC522 NFC Reader Module',
        cost: '$3-5',
        link: 'https://www.amazon.com/s?k=MFRC522+NFC+RFID+module',
        required: true
      },
      {
        item: '296x296 E-Paper Display (Waveshare)',
        cost: '$15-25',
        link: 'https://www.waveshare.com/2.9inch-e-paper-module.htm',
        required: true
      },
      {
        item: 'Passive Buzzer Module',
        cost: '$1-2',
        link: 'https://www.amazon.com/s?k=passive+buzzer+arduino',
        required: false,
        note: 'For audio feedback'
      },
      {
        item: 'NTAG213 NFC Tags (100 pack)',
        cost: '$15-25',
        link: 'https://www.amazon.com/s?k=NTAG213+NFC+tags',
        required: true,
        note: 'For pendants/user authentication'
      },
      {
        item: 'Dupont Jumper Wires',
        cost: '$5-8',
        link: 'https://www.amazon.com/s?k=dupont+jumper+wires+arduino',
        required: true
      },
      {
        item: 'Breadboard or Perfboard',
        cost: '$3-5',
        link: 'https://www.amazon.com/s?k=breadboard+electronics',
        required: true
      }
    ]

    // Add ritual-specific requirements
    if (currentRitual?.nodes) {
      const hasVoting = currentRitual.nodes.some(n => n.behavior.includes('vote'))
      const hasTipping = currentRitual.nodes.some(n => n.behavior === 'send_tip')
      const hasLighting = currentRitual.nodes.some(n => n.behavior === 'trigger_light')
      
      if (hasVoting) {
        baseRequirements.push({
          item: 'LED indicators for voting options',
          cost: '$2-3',
          link: 'https://www.amazon.com/s?k=LED+module+arduino',
          required: false,
          note: 'Visual feedback for vote confirmation'
        })
      }
      
      if (hasTipping) {
        baseRequirements.push({
          item: 'Additional LED or LCD for tip amounts',
          cost: '$3-5',
          link: 'https://www.amazon.com/s?k=LCD+display+arduino',
          required: false,
          note: 'Display tip amount confirmations'
        })
      }
      
      if (hasLighting) {
        baseRequirements.push({
          item: 'Relay module for external lighting',
          cost: '$5-8',
          link: 'https://www.amazon.com/s?k=relay+module+arduino',
          required: false,
          note: 'Control external lighting systems'
        })
      }
    }

    return baseRequirements
  }

  // Dynamic wiring diagram based on configuration
  const getWiringDiagram = () => {
    return `
// ESP32 to MFRC522 NFC Reader Wiring
ESP32 Pin    MFRC522 Pin    Function
---------    -----------    --------
21           SDA/SS         Chip Select
22           RST            Reset
18           SCK            SPI Clock  
23           MOSI           Master Out Slave In
19           MISO           Master In Slave Out
3.3V         3.3V           Power
GND          GND            Ground

// ESP32 to E-Paper Display Wiring
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

// Optional: Buzzer for Audio Feedback
ESP32 Pin    Buzzer Pin     Function
---------    ----------     --------
22           Positive       Audio Signal
GND          Negative       Ground

// Power Supply
- Use USB cable for development/testing
- For production: 5V power supply with 3.3V regulator
- Expected power consumption: ~200mA during operation
    `
  }

  // Dynamic library requirements based on current features
  const getLibraryRequirements = () => {
    const baseLibs = [
      {
        name: 'ArduinoJson',
        purpose: 'JSON parsing and serialization for ritual data',
        install: 'Library Manager > Search "ArduinoJson" > Install latest version'
      },
      {
        name: 'MFRC522',
        purpose: 'NFC reader communication',
        install: 'Library Manager > Search "MFRC522" > Install by GithubCommunity'
      },
      {
        name: 'GxEPD2',
        purpose: 'E-paper display driver',
        install: 'Library Manager > Search "GxEPD2" > Install by Jean-Marc Zingg'
      },
      {
        name: 'ESP32Time',
        purpose: 'Real-time clock functionality',
        install: 'Library Manager > Search "ESP32Time" > Install by fbiego'
      }
    ]

    // Add cryptographic libraries for production mode
    baseLibs.push(
      {
        name: 'Ed25519 (Production Mode)',
        purpose: 'Cryptographic signature verification',
        install: 'Library Manager > Search "Ed25519" > Install by Frank Boesing'
      },
      {
        name: 'Base58 (Production Mode)',
        purpose: 'DID encoding/decoding',
        install: 'Library Manager > Search "Base58" > Install by Arvind Sanjeev'
      }
    )

    return baseLibs
  }

  // Dynamic cost calculation
  const getTotalCost = () => {
    const hardware = getHardwareRequirements()
    const totalRequired = hardware
      .filter(item => item.required)
      .reduce((sum, item) => {
        const cost = parseFloat(item.cost.replace('$', '').split('-')[1] || item.cost.replace('$', ''))
        return sum + cost
      }, 0)
    
    const totalOptional = hardware
      .filter(item => !item.required)
      .reduce((sum, item) => {
        const cost = parseFloat(item.cost.replace('$', '').split('-')[1] || item.cost.replace('$', ''))
        return sum + cost
      }, 0)

    return { required: totalRequired, optional: totalOptional }
  }

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: 'Project Overview',
      icon: BookOpen,
      estimatedTime: '5 min read',
      difficulty: 'beginner',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-300 mb-2">What You're Building</h4>
            <p className="text-gray-300">
              A physical MELD node that authenticates NFC pendants using Ed25519 cryptography and executes ritual behaviors. 
              Each device features a 296x296 pixel e-paper display for clear visual feedback and NFC reading capabilities.
            </p>
          </div>
          
          {currentRitual && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-300 mb-2">Current Ritual: {currentRitual.name}</h4>
              <div className="space-y-2">
                {currentRitual.nodes.map(node => (
                  <div key={node.nodeId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{node.label}</span>
                    <span className="px-2 py-1 bg-purple-500/20 rounded text-purple-300 font-mono">
                      {node.behavior}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h5 className="font-medium text-white">Setup Time</h5>
              <p className="text-sm text-gray-400">2-4 hours total</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h5 className="font-medium text-white">Total Cost</h5>
              <p className="text-sm text-gray-400">${getTotalCost().required} required</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <Wrench className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <h5 className="font-medium text-white">Difficulty</h5>
              <p className="text-sm text-gray-400">Intermediate</p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'hardware',
      title: 'Hardware Requirements',
      icon: HardwareIcon,
      estimatedTime: '10 min',
      difficulty: 'beginner',
      content: (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-gray-300">Component</th>
                  <th className="text-left py-2 text-gray-300">Cost</th>
                  <th className="text-left py-2 text-gray-300">Required</th>
                  <th className="text-left py-2 text-gray-300">Notes</th>
                </tr>
              </thead>
              <tbody>
                {getHardwareRequirements().map((item, index) => (
                  <tr key={index} className="border-b border-slate-800">
                    <td className="py-2">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {item.item}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-2 text-green-400 font-mono">{item.cost}</td>
                    <td className="py-2">
                      {item.required ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-500" />
                      )}
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{item.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h5 className="font-medium text-amber-300">Cost Summary</h5>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Required components:</span>
                <span className="text-green-400 font-mono">${getTotalCost().required.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Optional components:</span>
                <span className="text-gray-400 font-mono">${getTotalCost().optional.toFixed(2)}</span>
              </div>
              <hr className="border-slate-700 my-2" />
              <div className="flex justify-between font-medium">
                <span className="text-white">Total maximum cost:</span>
                <span className="text-cyan-400 font-mono">${(getTotalCost().required + getTotalCost().optional).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'wiring',
      title: 'Wiring Diagram',
      icon: Zap,
      estimatedTime: '30 min',
      difficulty: 'intermediate',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-white">Pin Connections</h5>
              <button
                onClick={() => copyToClipboard(getWiringDiagram(), 'wiring')}
                className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded flex items-center gap-1 hover:bg-cyan-500/30"
              >
                <Copy className="w-3 h-3" />
                {copiedCode === 'wiring' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
              {getWiringDiagram()}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h5 className="font-medium text-blue-300 mb-2">NFC Reader (MFRC522)</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Uses SPI communication protocol</li>
                <li>• 3.3V power supply required</li>
                <li>• Reset pin enables/disables module</li>
                <li>• Range: ~3cm for most NFC tags</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h5 className="font-medium text-purple-300 mb-2">E-Paper Display</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 296x296 pixel resolution</li>
                <li>• Low power consumption</li>
                <li>• Excellent outdoor visibility</li>
                <li>• ~650ms refresh time</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h5 className="font-medium text-red-300">Important Wiring Notes</h5>
            </div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Double-check 3.3V connections - 5V will damage components</li>
              <li>• Use solid breadboard connections to prevent intermittent issues</li>
              <li>• Keep wires short to minimize interference</li>
              <li>• Test each connection with a multimeter before powering on</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'software',
      title: 'Software Setup',
      icon: Cpu,
      estimatedTime: '45 min',
      difficulty: 'intermediate',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <h5 className="font-medium text-white">1. Install Arduino IDE</h5>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <ol className="text-sm text-gray-300 space-y-2">
                <li>1. Download Arduino IDE 2.0+ from <a href="https://www.arduino.cc/en/software" target="_blank" className="text-cyan-400 hover:text-cyan-300">arduino.cc</a></li>
                <li>2. Install ESP32 board package: File → Preferences → Additional Board Manager URLs</li>
                <li>3. Add: <code className="bg-slate-800 px-1 rounded text-cyan-300">https://dl.espressif.com/dl/package_esp32_index.json</code></li>
                <li>4. Tools → Board Manager → Search "ESP32" → Install "ESP32 by Espressif"</li>
                <li>5. Select Board: "ESP32 Dev Module"</li>
              </ol>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-white">2. Install Required Libraries</h5>
            <div className="space-y-2">
              {getLibraryRequirements().map((lib, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-medium text-gray-200">{lib.name}</h6>
                      <p className="text-xs text-gray-400">{lib.purpose}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded">Required</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2 font-mono bg-slate-900 p-2 rounded">
                    {lib.install}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-white">3. Download & Flash Sketch</h5>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <ol className="text-sm text-gray-300 space-y-2">
                <li>1. Export sketch files from the KairOS platform</li>
                <li>2. Open the .ino file in Arduino IDE</li>
                <li>3. Connect ESP32 via USB cable</li>
                <li>4. Select correct COM port: Tools → Port</li>
                <li>5. Click Upload (or Ctrl+U)</li>
                <li>6. Open Serial Monitor (115200 baud) to see debug output</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'nfc-setup',
      title: 'NFC Tag Programming',
      icon: Wifi,
      estimatedTime: '20 min per tag',
      difficulty: 'intermediate',
      content: (
        <div className="space-y-4">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <h5 className="font-medium text-cyan-300 mb-2">Tag Specifications</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h6 className="font-medium text-white">NTAG213 (Recommended)</h6>
                <ul className="text-gray-300 space-y-1">
                  <li>• 180 bytes user memory</li>
                  <li>• Perfect for signatures</li>
                  <li>• $0.15-0.30 each</li>
                  <li>• ISO14443 Type A</li>
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-white">NTAG215</h6>
                <ul className="text-gray-300 space-y-1">
                  <li>• 924 bytes user memory</li>
                  <li>• Extra metadata space</li>
                  <li>• $0.20-0.35 each</li>
                  <li>• Good for complex data</li>
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-white">NTAG216</h6>
                <ul className="text-gray-300 space-y-1">
                  <li>• 8KB user memory</li>
                  <li>• Overkill but compatible</li>
                  <li>• $0.25-0.45 each</li>
                  <li>• Future-proof option</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-white">Programming Steps</h5>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <ol className="text-sm text-gray-300 space-y-3">
                <li>
                  <strong className="text-white">1. Install NFC Tools App</strong>
                  <div className="ml-4 mt-1">
                    <p>• Download "NFC Tools" from App Store/Google Play</p>
                    <p>• Free app with read/write capabilities</p>
                  </div>
                </li>
                <li>
                  <strong className="text-white">2. Generate Cryptographic Data</strong>
                  <div className="ml-4 mt-1 bg-slate-800 p-3 rounded">
                    <p className="text-cyan-300 mb-2">Use the KairOS platform to generate:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Ed25519 private/public key pair</li>
                      <li>• DID identifier in W3C format</li>
                      <li>• Challenge-response signature</li>
                      <li>• Export as hex data for programming</li>
                    </ul>
                  </div>
                </li>
                <li>
                  <strong className="text-white">3. Write to Tag Blocks</strong>
                  <div className="ml-4 mt-1">
                    <div className="bg-slate-800 p-3 rounded font-mono text-xs">
                      <p className="text-gray-400 mb-2">Block Layout (NTAG213):</p>
                      <p>Blocks 4-7:   Ed25519 Signature (64 bytes)</p>
                      <p>Blocks 8-11:  DID Identifier (32 bytes)</p>
                      <p>Blocks 12-15: Challenge Hash (32 bytes)</p>
                      <p>Blocks 16-39: Metadata/NDEF (52 bytes)</p>
                    </div>
                  </div>
                </li>
                <li>
                  <strong className="text-white">4. Test with ESP32</strong>
                  <div className="ml-4 mt-1">
                    <p>• Hold programmed tag near NFC reader</p>
                    <p>• Check Serial Monitor for verification logs</p>
                    <p>• Successful auth should show "✅ Signature Valid"</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h5 className="font-medium text-amber-300">Security Considerations</h5>
            </div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Tags can be read by anyone with NFC-capable device</li>
              <li>• Signatures are public but cryptographically secure</li>
              <li>• Use challenge-response to prevent replay attacks</li>
              <li>• Consider tag write-protection for production use</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'testing',
      title: 'Testing & Troubleshooting',
      icon: CheckCircle,
      estimatedTime: '30 min',
      difficulty: 'intermediate',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <h5 className="font-medium text-white">System Testing Checklist</h5>
            <div className="space-y-2">
              {[
                'Power on ESP32 - check for startup message in Serial Monitor',
                'E-paper display shows "MELD - TAP TO BEGIN" message',
                'NFC reader initializes without errors',
                'Programmed NFC tag triggers detection when brought near reader',
                'Authentication process completes successfully',
                'Ritual behavior executes (check Serial output)',
                'Display updates to show success message',
                'System returns to idle state after 3 seconds'
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-white">Common Issues & Solutions</h5>
            <div className="space-y-3">
              {[
                {
                  issue: 'NFC reader not detected',
                  solutions: [
                    'Check SPI wiring connections',
                    'Verify 3.3V power supply',
                    'Try different ESP32 board',
                    'Check library installation'
                  ]
                },
                {
                  issue: 'E-paper display not updating',
                  solutions: [
                    'Verify display wiring to ESP32',
                    'Check BUSY pin connection',
                    'Ensure correct display model in code',
                    'Try different SPI pins'
                  ]
                },
                {
                  issue: 'NFC tags not reading',
                  solutions: [
                    'Check tag compatibility (NTAG213/215/216)',
                    'Verify tag programming with phone app',
                    'Adjust reader distance (optimal: 1-3cm)',
                    'Try different tags to isolate issue'
                  ]
                },
                {
                  issue: 'Cryptographic verification fails',
                  solutions: [
                    'Verify tag data format matches expected layout',
                    'Check signature generation process',
                    'Ensure correct DID format',
                    'Test with simulation mode first'
                  ]
                }
              ].map((item, index) => (
                <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h6 className="font-medium text-red-300 mb-2">❌ {item.issue}</h6>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {item.solutions.map((solution, i) => (
                      <li key={i}>• {solution}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="font-medium text-green-300 mb-2">✅ Success Indicators</h5>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Serial Monitor shows "MELD Node Ready!" message</li>
              <li>• E-paper display is crisp and readable</li>
              <li>• NFC authentication completes in under 2 seconds</li>
              <li>• Audio feedback (buzzer) confirms interactions</li>
              <li>• Ritual behaviors execute as expected</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'production',
      title: 'Production Deployment',
      icon: Shield,
      estimatedTime: '1-2 hours',
      difficulty: 'advanced',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h5 className="font-medium text-purple-300 mb-2">Production Mode Configuration</h5>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Before deploying to production, make these code changes:</p>
              <div className="bg-slate-900 p-3 rounded font-mono text-xs">
                <p className="text-green-400">// In your sketch, change these settings:</p>
                <p className="text-cyan-300">#define SIMULATION_MODE false</p>
                <p className="text-cyan-300">#define REQUIRE_REAL_SIGNATURES true</p>
                <p className="text-cyan-300">#define DEBUG_OUTPUT false</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h6 className="font-medium text-white mb-2">Security Hardening</h6>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Enable signature verification</li>
                <li>• Implement rate limiting</li>
                <li>• Add device authentication</li>
                <li>• Use HTTPS for API calls</li>
                <li>• Enable OTA update security</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h6 className="font-medium text-white mb-2">Physical Security</h6>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Secure device enclosure</li>
                <li>• Tamper-evident sealing</li>
                <li>• Physical access controls</li>
                <li>• Cable management</li>
                <li>• Environmental protection</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-white">Deployment Checklist</h5>
            <div className="space-y-2">
              {[
                'Load production verification keys',
                'Configure WiFi credentials for event network',
                'Set correct time zone and NTP servers',
                'Test all NFC tags with production authentication',
                'Verify API connectivity and logging',
                'Perform stress testing with multiple rapid taps',
                'Confirm power supply stability under load',
                'Document device IDs and network configuration'
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-slate-800/30 rounded">
                  <input type="checkbox" className="w-4 h-4 text-cyan-500" />
                  <p className="text-sm text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h5 className="font-medium text-blue-300 mb-2">Monitoring & Maintenance</h5>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Set up device health monitoring</li>
              <li>• Configure alert thresholds</li>
              <li>• Plan regular maintenance windows</li>
              <li>• Prepare backup devices</li>
              <li>• Document troubleshooting procedures</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MELD Installation Guide</h2>
              <p className="text-sm text-gray-400">Complete setup instructions for ESP32 nodes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-cyan-400" />
                    <span className="font-medium text-white">{section.title}</span>
                    {section.estimatedTime && (
                      <span className="text-xs px-2 py-1 bg-slate-700 text-gray-300 rounded">
                        {section.estimatedTime}
                      </span>
                    )}
                    {section.difficulty && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        section.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                        section.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {section.difficulty}
                      </span>
                    )}
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.has(section.id) && (
                  <div className="p-6 border-t border-slate-700">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Guide automatically updates based on your ritual configuration
            </div>
            <div className="flex gap-2">
              <a
                href="https://github.com/meldtech/kairos"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Source
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 