// --- Ritual Control Panel ---
// Beautiful collapsible panel for ritual configuration and management
// Integrates seamlessly with existing MELD Node simulation

"use client"

import { useState, useEffect } from 'react'
import { Ritual, RitualNodeConfig, NodeBehavior } from '@/lib/ritual/types'
import { ritualManager } from '@/lib/ritual/ritualManager'
import { downloadSketch, generateMultiNodeSketches } from '@/lib/ritual/sketchGenerator'
import { MELD_NODES } from '@/lib/hal/simulateTap'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  ChevronDown, 
  ChevronRight,
  Play,
  Save,
  Copy,
  Code,
  Zap,
  Palette,
  Volume2,
  Lock,
  Hash,
  Heart,
  Vote,
  X,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  Type,
  RefreshCw,
  Wand2,
  BookOpen,
  ExternalLink
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import InstallationGuide from './InstallationGuide'

interface RitualControlPanelProps {
  isOpen: boolean
  onToggle: () => void
  onRitualChange?: (ritual: Ritual | null) => void
}

// Behavior icons mapping with improved accessibility
const BEHAVIOR_ICONS: Record<NodeBehavior, React.ReactNode> = {
  save_moment: <Heart className="w-4 h-4 text-rose-600" />,
  send_tip: <Zap className="w-4 h-4 text-amber-600" />,
  vote_option_a: <Vote className="w-4 h-4 text-blue-600" />,
  vote_option_b: <Vote className="w-4 h-4 text-red-600" />,
  unlock_content: <Lock className="w-4 h-4 text-purple-600" />,
  trigger_light: <Palette className="w-4 h-4 text-pink-600" />,
  play_sound: <Volume2 className="w-4 h-4 text-cyan-600" />,
  increment_counter: <Hash className="w-4 h-4 text-slate-600" />,
  custom: <Code className="w-4 h-4 text-orange-600" />
}

interface DisplayTextConfig {
  waiting_title?: string
  waiting_subtitle?: string
  detected_title?: string
  detected_subtitle?: string
  auth_title?: string
  auth_instruction?: string
  confirm_title?: string
  confirm_button?: string
  success_title?: string
  success_subtitle?: string
  error_title?: string
  error_subtitle?: string
}

export default function RitualControlPanel({ 
  isOpen, 
  onToggle, 
  onRitualChange 
}: RitualControlPanelProps) {
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [activeRitual, setActiveRitual] = useState<Ritual | null>(null)
  const [editingRitual, setEditingRitual] = useState<Ritual | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rituals: true,
    nodeConfig: false,
    export: false,
    settings: false
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showDisplayTextConfig, setShowDisplayTextConfig] = useState(false)
  const [showInstallationGuide, setShowInstallationGuide] = useState(false)
  const [displayTextConfig, setDisplayTextConfig] = useState<DisplayTextConfig>({
    waiting_title: 'MELD',
    waiting_subtitle: 'TAP TO BEGIN',
    detected_title: 'NFC DETECTED',
    detected_subtitle: 'AUTHENTICATING...',
    auth_title: 'AUTHENTICATED',
    auth_instruction: 'TAP AGAIN TO CONFIRM',
    confirm_title: 'CONFIRM MOMENT',
    confirm_button: 'CONFIRM',
    success_title: 'MOMENT SAVED',
    success_subtitle: 'ZK PROOF GENERATED',
    error_title: 'ERROR',
    error_subtitle: 'AUTH FAILED'
  })
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Load ritual data
  useEffect(() => {
    ritualManager.initialize()
    loadRitualData()
  }, [])

  const loadRitualData = () => {
    const allRituals = ritualManager.getAllRituals()
    const currentRitual = ritualManager.getActiveRitual()
    
    setRituals(allRituals)
    setActiveRitual(currentRitual)
    onRitualChange?.(currentRitual)
  }

  const handleRitualSelect = (ritualId: string) => {
    ritualManager.setActiveRitual(ritualId)
    loadRitualData()
  }

  const handleCreateNewRitual = () => {
    const newRitual = ritualManager.createRitual({
      name: 'New Ritual',
      description: 'Custom ritual configuration',
      version: '1.0.0',
      nodes: MELD_NODES.map(node => ({
        nodeId: node.id,
        label: node.name,
        behavior: 'save_moment' as NodeBehavior
      }))
    })
    
    setEditingRitual(newRitual)
    loadRitualData()
  }

  const handleEditRitual = (ritual: Ritual) => {
    setEditingRitual({ ...ritual })
  }

  const handleSaveRitual = async () => {
    if (!editingRitual) return
    
    setSaveStatus('saving')
    
    try {
      ritualManager.updateRitual(editingRitual.id, editingRitual)
      setEditingRitual(null)
      loadRitualData()
      setSaveStatus('saved')
      
      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDeleteRitual = (ritualId: string) => {
    if (confirm('Are you sure you want to delete this ritual?')) {
      ritualManager.deleteRitual(ritualId)
      loadRitualData()
    }
  }

  const updateNodeConfig = (nodeId: string, updates: Partial<RitualNodeConfig>) => {
    if (!editingRitual) return
    
    const updatedNodes = editingRitual.nodes.map(node => 
      node.nodeId === nodeId ? { ...node, ...updates } : node
    )
    
    setEditingRitual({ ...editingRitual, nodes: updatedNodes })
  }

  const handleExportSketch = () => {
    if (!activeRitual) return
    
    const config = {
      ritualId: activeRitual.id,
      includeLibraries: ['ArduinoJson', 'ESP32Time'],
      nfcLibrary: 'MFRC522' as const,
      debugMode: true
    }
    
    // Generate individual sketches for each device in the ritual
    const sketches = generateMultiNodeSketches(activeRitual, config)
    
    // Download each sketch individually
    sketches.forEach((sketch, index) => {
      setTimeout(() => {
        const blob = new Blob([sketch.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = sketch.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      }, index * 500) // Stagger downloads by 500ms to avoid browser issues
    })
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getBehaviorColor = (behavior: NodeBehavior): string => {
    const colors: Record<NodeBehavior, string> = {
      save_moment: '#E11D48',
      send_tip: '#D97706',
      vote_option_a: '#2563EB',
      vote_option_b: '#DC2626',
      unlock_content: '#7C3AED',
      trigger_light: '#DB2777',
      play_sound: '#0891B2',
      increment_counter: '#475569',
      custom: '#EA580C'
    }
    return colors[behavior]
  }

  const getBehaviorLabel = (behavior: NodeBehavior): string => {
    const labels: Record<NodeBehavior, string> = {
      save_moment: 'Save Moment',
      send_tip: 'Send Tip',
      vote_option_a: 'Vote Option A',
      vote_option_b: 'Vote Option B',
      unlock_content: 'Unlock Content',
      trigger_light: 'Trigger Light',
      play_sound: 'Play Sound',
      increment_counter: 'Counter',
      custom: 'Custom'
    }
    return labels[behavior]
  }

  const updateDisplayText = (key: keyof DisplayTextConfig, value: string) => {
    setDisplayTextConfig(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Also update the editing ritual immediately for real-time preview
    if (editingRitual) {
      const updatedNodes = editingRitual.nodes.map(node => ({
        ...node,
        parameters: {
          ...node.parameters,
          displayText: {
            ...node.parameters?.displayText,
            [key]: value
          }
        }
      }))
      
      setEditingRitual({ ...editingRitual, nodes: updatedNodes })
      
      // If this is the active ritual, update it immediately for real-time preview
      if (activeRitual && editingRitual.id === activeRitual.id) {
        const updatedActiveRitual = { ...editingRitual, nodes: updatedNodes }
        ritualManager.updateRitual(editingRitual.id, updatedActiveRitual)
        setActiveRitual(updatedActiveRitual)
        onRitualChange?.(updatedActiveRitual)
        
        // Force emit ritual updated event for real-time updates
        setTimeout(() => {
          console.log('🎭 Display text updated - emitting ritual changed event')
          onRitualChange?.(updatedActiveRitual)
        }, 10)
      }
    } else if (activeRitual) {
      // Update the active ritual directly if not editing
      ritualManager.updateRitualDisplayText(activeRitual.id, { [key]: value })
      const updatedRitual = ritualManager.getActiveRitual()
      if (updatedRitual) {
        setActiveRitual(updatedRitual)
        onRitualChange?.(updatedRitual)
        
        // Force emit ritual updated event for real-time updates
        setTimeout(() => {
          console.log('🎭 Display text updated - emitting ritual changed event')
          onRitualChange?.(updatedRitual)
        }, 10)
      }
    }
  }

  const resetDisplayTextToDefaults = () => {
    const defaults = {
      waiting_title: 'MELD',
      waiting_subtitle: 'TAP TO BEGIN',
      detected_title: 'NFC DETECTED',
      detected_subtitle: 'AUTHENTICATING...',
      auth_title: 'AUTHENTICATED',
      auth_instruction: 'TAP AGAIN TO CONFIRM',
      confirm_title: 'CONFIRM MOMENT',
      confirm_button: 'CONFIRM',
      success_title: 'MOMENT SAVED',
      success_subtitle: 'ZK PROOF GENERATED',
      error_title: 'ERROR',
      error_subtitle: 'AUTH FAILED'
    }
    
    setDisplayTextConfig(defaults)
    
    // Also update the editing ritual immediately for real-time preview
    if (editingRitual) {
      const updatedNodes = editingRitual.nodes.map(node => ({
        ...node,
        parameters: {
          ...node.parameters,
          displayText: defaults
        }
      }))
      
      setEditingRitual({ ...editingRitual, nodes: updatedNodes })
      
      // If this is the active ritual, update it immediately for real-time preview
      if (activeRitual && editingRitual.id === activeRitual.id) {
        const updatedActiveRitual = { ...editingRitual, nodes: updatedNodes }
        ritualManager.updateRitual(editingRitual.id, updatedActiveRitual)
        setActiveRitual(updatedActiveRitual)
        onRitualChange?.(updatedActiveRitual)
        
        // Force emit ritual updated event for real-time updates
        setTimeout(() => {
          console.log('🎭 Display text reset - emitting ritual changed event')
          onRitualChange?.(updatedActiveRitual)
        }, 10)
      }
    } else if (activeRitual) {
      // Update the active ritual directly if not editing
      ritualManager.updateRitualDisplayText(activeRitual.id, defaults)
      const updatedRitual = ritualManager.getActiveRitual()
      if (updatedRitual) {
        setActiveRitual(updatedRitual)
        onRitualChange?.(updatedRitual)
        
        // Force emit ritual updated event for real-time updates
        setTimeout(() => {
          console.log('🎭 Display text reset - emitting ritual changed event')
          onRitualChange?.(updatedRitual)
        }, 10)
      }
    }
  }

  // Load display text from active ritual when component mounts or ritual changes
  useEffect(() => {
    if (activeRitual && activeRitual.nodes.length > 0) {
      const displayText = activeRitual.nodes[0].parameters?.displayText
      if (displayText) {
        setDisplayTextConfig({
          waiting_title: displayText.waiting_title || 'MELD',
          waiting_subtitle: displayText.waiting_subtitle || 'TAP TO BEGIN',
          detected_title: displayText.detected_title || 'NFC DETECTED',
          detected_subtitle: displayText.detected_subtitle || 'AUTHENTICATING...',
          auth_title: displayText.auth_title || 'AUTHENTICATED',
          auth_instruction: displayText.auth_instruction || 'TAP AGAIN TO CONFIRM',
          confirm_title: displayText.confirm_title || 'CONFIRM MOMENT',
          confirm_button: displayText.confirm_button || 'CONFIRM',
          success_title: displayText.success_title || 'MOMENT SAVED',
          success_subtitle: displayText.success_subtitle || 'ZK PROOF GENERATED',
          error_title: displayText.error_title || 'ERROR',
          error_subtitle: displayText.error_subtitle || 'AUTH FAILED'
        })
      }
    }
  }, [activeRitual])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[420px] glass-card shadow-float border-l border-sage-200/60 z-40 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-sage-500 via-lavender-500 to-terracotta-500 p-6 text-white shadow-minimal">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight">Ritual Designer</h2>
              <p className="text-sage-100 text-sm font-medium">Configure MELD Node behaviors</p>
            </div>
          </div>
          
          <button
            onClick={onToggle}
            className="p-3 hover:bg-white/20 rounded-xl transition-colors duration-200"
            aria-label="Close Ritual Designer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Ritual Selection */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('rituals')}
            className="flex items-center justify-between w-full text-left font-bold text-lg text-neutral-800 hover:text-sage-600 transition-colors"
            aria-expanded={expandedSections.rituals}
          >
            <span>Active Ritual</span>
            {expandedSections.rituals ? 
              <ChevronDown className="w-5 h-5 text-neutral-500" /> : 
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            }
          </button>
          
          {expandedSections.rituals && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <select
                  value={activeRitual?.id || ''}
                  onChange={(e) => handleRitualSelect(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-sage-200/60 rounded-xl text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                >
                  <option value="">Select a ritual...</option>
                  {rituals.map(ritual => (
                    <option key={ritual.id} value={ritual.id}>
                      {ritual.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleCreateNewRitual}
                  className="px-4 py-3 bg-sage-500 text-white rounded-xl hover:bg-sage-600 transition-colors shadow-minimal"
                  title="Create new ritual"
                  aria-label="Create new ritual"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {activeRitual && (
                <div className="glass-card rounded-2xl p-5 border border-sage-200/60">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-neutral-800 mb-1">{activeRitual.name}</h3>
                      {activeRitual.description && (
                        <p className="text-sm text-neutral-600 leading-relaxed">{activeRitual.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditRitual(activeRitual)}
                        className="p-2 hover:bg-white/60 rounded-lg transition-colors shadow-minimal border border-sage-200/60"
                        title="Edit ritual"
                        aria-label="Edit ritual"
                      >
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteRitual(activeRitual.id)}
                        className="p-2 hover:bg-red-50/80 rounded-lg transition-colors shadow-minimal border border-red-200/60"
                        title="Delete ritual"
                        aria-label="Delete ritual"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {activeRitual.nodes.map(node => {
                      const meldNode = MELD_NODES.find(n => n.id === node.nodeId)
                      return (
                        <div
                          key={node.nodeId}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-sage-200/60 text-sm font-medium"
                          style={{ borderLeftColor: getBehaviorColor(node.behavior) }}
                        >
                          {BEHAVIOR_ICONS[node.behavior]}
                          <span className="text-neutral-800">{meldNode?.icon} {node.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Display Text Configuration */}
        <div className="space-y-4 border-t-2 border-sage-100/30 pt-8">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setShowDisplayTextConfig(!showDisplayTextConfig)}
              className="flex items-center gap-2 text-left font-bold text-lg text-neutral-800 hover:text-sage-600 transition-colors"
            >
              <Type className="w-5 h-5" />
              <span>Display Text Configuration</span>
              {showDisplayTextConfig ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
            
            {showDisplayTextConfig && (
              <button
                onClick={resetDisplayTextToDefaults}
                className="p-2 hover:bg-sage-100/60 rounded-md transition-colors group flex-shrink-0"
                title="Reset to Defaults"
                aria-label="Reset to Defaults"
              >
                <RefreshCw className="w-4 h-4 text-neutral-500 group-hover:rotate-180 transition-transform duration-300" />
              </button>
            )}
          </div>
          
          {showDisplayTextConfig && (
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 mb-4">
                Customize the text displayed at each stage of the authentication flow. 
                All text will be converted to uppercase for optimal e-paper display compatibility.
                <span className="block mt-1 text-xs text-sage-600 font-medium">Changes are saved automatically and applied to live simulations.</span>
              </div>
              
              {/* Waiting State */}
              <div className="border border-sage-200/60 rounded-lg p-3 glass-card">
                <h4 className="font-medium text-sm mb-2 text-sage-600">Waiting State</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="waiting_title" className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                      id="waiting_title"
                      type="text"
                      value={displayTextConfig.waiting_title || ''}
                      onChange={(e) => updateDisplayText('waiting_title', e.target.value)}
                      placeholder="MELD"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="waiting_subtitle" className="block text-xs font-medium text-neutral-700 mb-1">Subtitle</label>
                    <input
                      id="waiting_subtitle"
                      type="text"
                      value={displayTextConfig.waiting_subtitle || ''}
                      onChange={(e) => updateDisplayText('waiting_subtitle', e.target.value)}
                      placeholder="TAP TO BEGIN"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>

              {/* NFC Detection State */}
              <div className="border border-sage-200/60 rounded-lg p-3 glass-card">
                <h4 className="font-medium text-sm mb-2 text-sage-600">NFC Detection</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="detected_title" className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                      id="detected_title"
                      type="text"
                      value={displayTextConfig.detected_title || ''}
                      onChange={(e) => updateDisplayText('detected_title', e.target.value)}
                      placeholder="NFC DETECTED"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="detected_subtitle" className="block text-xs font-medium text-neutral-700 mb-1">Subtitle</label>
                    <input
                      id="detected_subtitle"
                      type="text"
                      value={displayTextConfig.detected_subtitle || ''}
                      onChange={(e) => updateDisplayText('detected_subtitle', e.target.value)}
                      placeholder="AUTHENTICATING..."
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>

              {/* Authentication State */}
              <div className="border border-sage-200/60 rounded-lg p-3 glass-card">
                <h4 className="font-medium text-sm mb-2 text-sage-600">Authentication</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth_title" className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                      id="auth_title"
                      type="text"
                      value={displayTextConfig.auth_title || ''}
                      onChange={(e) => updateDisplayText('auth_title', e.target.value)}
                      placeholder="AUTHENTICATED"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth_instruction" className="block text-xs font-medium text-neutral-700 mb-1">Instruction</label>
                    <input
                      id="auth_instruction"
                      type="text"
                      value={displayTextConfig.auth_instruction || ''}
                      onChange={(e) => updateDisplayText('auth_instruction', e.target.value)}
                      placeholder="TAP AGAIN TO CONFIRM"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>

              {/* Confirmation State */}
              <div className="border border-sage-200/60 rounded-lg p-3 glass-card">
                <h4 className="font-medium text-sm mb-2 text-sage-600">Confirmation</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="confirm_title" className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                      id="confirm_title"
                      type="text"
                      value={displayTextConfig.confirm_title || ''}
                      onChange={(e) => updateDisplayText('confirm_title', e.target.value)}
                      placeholder="CONFIRM MOMENT"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm_button" className="block text-xs font-medium text-neutral-700 mb-1">Button Text</label>
                    <input
                      id="confirm_button"
                      type="text"
                      value={displayTextConfig.confirm_button || ''}
                      onChange={(e) => updateDisplayText('confirm_button', e.target.value)}
                      placeholder="CONFIRM"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>

              {/* Success State */}
              <div className="border border-sage-200/60 rounded-lg p-3 glass-card">
                <h4 className="font-medium text-sm mb-2 text-sage-600">Success</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="success_title" className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                      id="success_title"
                      type="text"
                      value={displayTextConfig.success_title || ''}
                      onChange={(e) => updateDisplayText('success_title', e.target.value)}
                      placeholder="MOMENT SAVED"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="success_subtitle" className="block text-xs font-medium text-neutral-700 mb-1">Subtitle</label>
                    <input
                      id="success_subtitle"
                      type="text"
                      value={displayTextConfig.success_subtitle || ''}
                      onChange={(e) => updateDisplayText('success_subtitle', e.target.value)}
                      placeholder="ZK PROOF GENERATED"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>

              {/* Error State */}
              <div className="border border-sage-200/60 rounded-lg p-3 glass-card">
                <h4 className="font-medium text-sm mb-2 text-sage-600">Error</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="error_title" className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input
                      id="error_title"
                      type="text"
                      value={displayTextConfig.error_title || ''}
                      onChange={(e) => updateDisplayText('error_title', e.target.value)}
                      placeholder="ERROR"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="error_subtitle" className="block text-xs font-medium text-neutral-700 mb-1">Subtitle</label>
                    <input
                      id="error_subtitle"
                      type="text"
                      value={displayTextConfig.error_subtitle || ''}
                      onChange={(e) => updateDisplayText('error_subtitle', e.target.value)}
                      placeholder="AUTH FAILED"
                      className="w-full px-3 py-2 border border-sage-300/60 rounded-md text-sm text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Node Configuration */}
        {editingRitual && (
          <div className="space-y-4 border-t-2 border-sage-100/30 pt-8">
            <button
              onClick={() => toggleSection('nodeConfig')}
              className="flex items-center justify-between w-full text-left font-bold text-lg text-neutral-800 hover:text-sage-600 transition-colors"
              aria-expanded={expandedSections.nodeConfig}
            >
              <span>Configure Nodes</span>
              {expandedSections.nodeConfig ? 
                <ChevronDown className="w-5 h-5 text-neutral-500" /> : 
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              }
            </button>
            
            {expandedSections.nodeConfig && (
              <div className="space-y-6">
                {/* Ritual Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-800">
                    Ritual Name
                  </label>
                  <input
                    type="text"
                    value={editingRitual.name}
                    onChange={(e) => setEditingRitual({ ...editingRitual, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-sage-200/60 rounded-xl text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                    placeholder="Enter ritual name..."
                  />
                </div>

                {/* Ritual Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-800">
                    Description
                  </label>
                  <textarea
                    value={editingRitual.description || ''}
                    onChange={(e) => setEditingRitual({ ...editingRitual, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-sage-200/60 rounded-xl text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors resize-none"
                    rows={2}
                    placeholder="Describe your ritual..."
                  />
                </div>

                {/* Node Configurations */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base text-neutral-800">Node Behaviors</h4>
                  {editingRitual.nodes.map(nodeConfig => {
                    const meldNode = MELD_NODES.find(n => n.id === nodeConfig.nodeId)
                    if (!meldNode) return null

                    return (
                      <div key={nodeConfig.nodeId} className="glass-card rounded-2xl p-5 border-2 border-sage-200/60 space-y-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full ring-2 ring-white shadow-minimal"
                            style={{ backgroundColor: meldNode.color }}
                          />
                          <span className="font-bold text-base text-neutral-800">
                            {meldNode.icon} {meldNode.name}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-2">
                              Node Label
                            </label>
                            <input
                              type="text"
                              value={nodeConfig.label}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, { label: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                              placeholder="Enter node label..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-2">
                              Behavior
                            </label>
                            <select
                              value={nodeConfig.behavior}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, { 
                                behavior: e.target.value as NodeBehavior 
                              })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                            >
                              <option value="save_moment">💖 Save Moment</option>
                              <option value="send_tip">⚡ Send Tip</option>
                              <option value="vote_option_a">🗳️ Vote Option A</option>
                              <option value="vote_option_b">🗳️ Vote Option B</option>
                              <option value="unlock_content">🔓 Unlock Content</option>
                              <option value="trigger_light">🎨 Trigger Light</option>
                              <option value="play_sound">🔊 Play Sound</option>
                              <option value="increment_counter">📊 Counter</option>
                              <option value="custom">💻 Custom</option>
                            </select>
                          </div>
                        </div>

                        {/* Behavior-specific parameters */}
                        {nodeConfig.behavior === 'send_tip' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-bold text-neutral-800 mb-1">
                                Tip Amount ($)
                            </label>
                            <input
                              type="number"
                                min="0.01"
                                step="0.01"
                                value={nodeConfig.parameters?.tipAmount || 1}
                                onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                  parameters: { 
                                    ...nodeConfig.parameters, 
                                    tipAmount: parseFloat(e.target.value) || 1 
                                  }
                                })}
                                className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                                placeholder="1.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-neutral-800 mb-1">
                                Recipient
                              </label>
                              <input
                                type="text"
                                value={nodeConfig.parameters?.recipient || 'performer'}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                  parameters: { 
                                    ...nodeConfig.parameters, 
                                    recipient: e.target.value 
                                  }
                              })}
                                className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                                placeholder="performer"
                            />
                            </div>
                          </div>
                        )}

                        {(nodeConfig.behavior === 'vote_option_a' || nodeConfig.behavior === 'vote_option_b') && (
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-1">
                              Vote Option Text
                            </label>
                            <input
                              type="text"
                              value={nodeConfig.parameters?.voteOption || `Option ${nodeConfig.behavior === 'vote_option_a' ? 'A' : 'B'}`}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                parameters: { 
                                  ...nodeConfig.parameters, 
                                  voteOption: e.target.value 
                                }
                              })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                              placeholder={`Option ${nodeConfig.behavior === 'vote_option_a' ? 'A' : 'B'}`}
                            />
                          </div>
                        )}

                        {nodeConfig.behavior === 'increment_counter' && (
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-1">
                              Counter Name
                            </label>
                            <input
                              type="text"
                              value={nodeConfig.parameters?.counterName || 'default_counter'}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                parameters: { 
                                  ...nodeConfig.parameters, 
                                  counterName: e.target.value 
                                }
                              })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                              placeholder="default_counter"
                            />
                          </div>
                        )}

                        {nodeConfig.behavior === 'trigger_light' && (
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-1">
                              Light Pattern
                            </label>
                            <select
                              value={nodeConfig.parameters?.lightPattern || 'rainbow'}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                parameters: { 
                                  ...nodeConfig.parameters, 
                                  lightPattern: e.target.value 
                                }
                              })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                            >
                              <option value="rainbow">🌈 Rainbow</option>
                              <option value="pulse">💓 Pulse</option>
                              <option value="strobe">⚡ Strobe</option>
                              <option value="solid">💎 Solid</option>
                              <option value="fade">🌅 Fade</option>
                            </select>
                          </div>
                        )}

                        {nodeConfig.behavior === 'play_sound' && (
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-1">
                              Sound File
                            </label>
                            <select
                              value={nodeConfig.parameters?.soundFile || 'beep.wav'}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                parameters: { 
                                  ...nodeConfig.parameters, 
                                  soundFile: e.target.value 
                                }
                              })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                            >
                              <option value="beep.wav">🔊 Beep</option>
                              <option value="success.wav">✅ Success</option>
                              <option value="error.wav">❌ Error</option>
                              <option value="chime.wav">🔔 Chime</option>
                              <option value="ding.wav">🛎️ Ding</option>
                            </select>
                          </div>
                        )}

                        {nodeConfig.behavior === 'unlock_content' && (
                          <div>
                            <label className="block text-sm font-bold text-neutral-800 mb-1">
                              Content ID
                            </label>
                            <input
                              type="text"
                              value={nodeConfig.parameters?.contentId || 'default-content'}
                              onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                parameters: { 
                                  ...nodeConfig.parameters, 
                                  contentId: e.target.value 
                                }
                              })}
                              className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                              placeholder="default-content"
                            />
                          </div>
                        )}

                        {nodeConfig.behavior === 'custom' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-bold text-neutral-800 mb-1">
                                Custom Behavior Name
                              </label>
                              <input
                                type="text"
                                value={nodeConfig.parameters?.customName || 'customBehavior'}
                                onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                  parameters: { 
                                    ...nodeConfig.parameters, 
                                    customName: e.target.value 
                                  }
                                })}
                                className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                                placeholder="customBehavior"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-neutral-800 mb-1">
                                Custom Arduino Code
                            </label>
                            <textarea
                                value={nodeConfig.parameters?.customLogic || 'Serial.println("Custom behavior executed");'}
                                onChange={(e) => updateNodeConfig(nodeConfig.nodeId, {
                                  parameters: { 
                                    ...nodeConfig.parameters, 
                                    customLogic: e.target.value 
                                  }
                                })}
                                className="w-full px-3 py-2 border-2 border-sage-200/60 rounded-lg text-sm font-medium text-neutral-800 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors font-mono"
                              rows={4}
                                placeholder="Serial.println(&quot;Custom behavior executed&quot;);"
                            />
                              <p className="text-xs text-neutral-500 mt-1">
                                Write Arduino C++ code that will be executed when this node is tapped.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveRitual}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-3 px-6 py-3 bg-sage-500 text-white rounded-xl hover:bg-sage-600 disabled:bg-sage-400 transition-all duration-200 text-sm font-bold shadow-minimal hover:shadow-float transform hover:scale-105"
                  >
                    {saveStatus === 'saving' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saveStatus === 'saved' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : saveStatus === 'error' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saveStatus === 'saving' ? 'Saving...' : 
                     saveStatus === 'saved' ? 'Saved!' : 
                     saveStatus === 'error' ? 'Error!' : 'Save Ritual'}
                  </button>
                  
                  <button
                    onClick={() => setEditingRitual(null)}
                    className="px-6 py-3 border-2 border-sage-300/60 text-neutral-700 rounded-xl hover:bg-sage-50/80 hover:border-sage-400/60 transition-all duration-200 text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Section */}
        <div className="space-y-4 border-t-2 border-sage-100/30 pt-8">
          <button
            onClick={() => toggleSection('export')}
            className="flex items-center justify-between w-full text-left font-bold text-lg text-neutral-800 hover:text-sage-600 transition-colors"
            aria-expanded={expandedSections.export}
          >
            <span>Export to ESP32</span>
            {expandedSections.export ? 
              <ChevronDown className="w-5 h-5 text-neutral-500" /> : 
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            }
          </button>
          
          {expandedSections.export && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 mb-4">
                Generate Arduino sketches for physical deployment on ESP32 devices with NFC readers.
              </p>

              {/* Installation Guide Button */}
              <div className="bg-gradient-to-r from-terracotta-50/80 to-sand-50/80 border border-terracotta-200/60 rounded-lg p-4 mb-4 glass-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-terracotta-800 mb-1">📚 Complete Installation Guide</h4>
                    <p className="text-sm text-terracotta-700">
                      Step-by-step instructions, wiring diagrams, and troubleshooting
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInstallationGuide(true)}
                    className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg text-sm flex items-center gap-2 shadow-minimal"
                  >
                    <BookOpen className="w-4 h-4" />
                    Open Guide
                  </button>
                </div>
              </div>

              {/* Hardware Requirements */}
              <div className="glass-card rounded-lg p-4 border border-sage-200/60">
                <h4 className="font-medium text-sage-600 mb-3">Hardware Requirements</h4>
                <ul className="text-sm text-neutral-700 space-y-1">
                  <li>• ESP32 development board (one per node)</li>
                  <li>• MFRC522 or PN532 NFC reader (one per ESP32)</li>
                  <li>• 296x296 E-paper display (square, one per device)</li>
                  <li>• Buzzer for audio feedback (one per device)</li>
                </ul>
                <div className="mt-2 text-xs text-neutral-500">
                  💡 Total cost: ~$26 per node | Complete guide has shopping links
                </div>
              </div>

              <button
                onClick={handleExportSketch}
                disabled={!activeRitual}
                className="w-full px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 font-medium shadow-minimal"
              >
                <Download className="w-4 h-4" />
                Download ESP32 Sketches
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  Individual files for each device
                </span>
              </button>
              
              {!activeRitual && (
                <p className="text-xs text-neutral-500 text-center">
                  Select a ritual to enable sketch export
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Installation Guide Modal */}
      {showInstallationGuide && (
        <InstallationGuide 
          currentRitual={activeRitual}
          onClose={() => setShowInstallationGuide(false)}
        />
      )}
    </div>
  )
} 