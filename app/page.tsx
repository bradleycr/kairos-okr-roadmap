"use client"

import { useState, useEffect, useCallback } from 'react'
import { PendantIdentity, TapMoment, MELD_NODES, simulateTap, eventBus, formatTimestamp } from '@/lib/hal/simulateTap'
import { memoryStore } from '@/lib/moment/memoryStore'
import { ritualManager } from '@/lib/ritual/ritualManager'
import { Ritual } from '@/lib/ritual/types'
import PendantSelector from '@/components/PendantSelector'
import ESP32WearableDevice from '@/components/ESP32WearableDevice'
import RitualControlPanel from '@/components/RitualControlPanel'
import { Settings, RefreshCw, Trash2, Info, Sparkles, Shield, X, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MeldSimulation() {
  const [selectedPendant, setSelectedPendant] = useState<PendantIdentity | null>(null)
  const [totalMoments, setTotalMoments] = useState(0)
  const [nodeStats, setNodeStats] = useState<Record<string, any>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [showRitualPanel, setShowRitualPanel] = useState(false)
  const [currentRitual, setCurrentRitual] = useState<Ritual | null>(null)
  
  // Simplified NFC interaction states
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [nodeState, setNodeState] = useState<'idle' | 'detecting' | 'authenticating' | 'executing' | 'success' | 'completed'>('idle')
  const [executionResult, setExecutionResult] = useState<string | null>(null)
  
  // Production testing mode
  const [productionMode, setProductionMode] = useState(false)
  const [cryptoLogs, setCryptoLogs] = useState<string[]>([])
  const [showDebugModal, setShowDebugModal] = useState(false)
  const [showPendantTracking, setShowPendantTracking] = useState<string | null>(null)
  const [esp32DeviceLogs, setEsp32DeviceLogs] = useState<Record<string, any>>({})

  // Add crypto logging function
  const addCryptoLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setCryptoLogs(prev => [...prev.slice(-10), logEntry]) // Keep last 10 logs
    console.log(`🔵 ${logEntry}`)
  }

  // Helper function to convert Uint8Array keys to hex strings for display
  const formatKeyForDisplay = (key: Uint8Array, length: number = 16): string => {
    const hexString = Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')
    return length > 0 ? `${hexString.substring(0, length)}...` : hexString
  }

  // Handle ESP32 device log updates
  const handleDeviceLogUpdate = useCallback((nodeId: string, deviceLog: any) => {
    setEsp32DeviceLogs(prev => ({
      ...prev,
      [nodeId]: deviceLog
    }))
  }, [])

  // Initialize app with both memory store and ritual manager
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing KairOS app...')
        memoryStore.initialize()
        ritualManager.initialize()
        
        // Load active ritual
        const ritual = ritualManager.getActiveRitual()
        setCurrentRitual(ritual)
        console.log('🎭 Loaded active ritual:', ritual?.name || 'None')
        
        setTimeout(() => {
          updateStats()
        }, 200)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        // Try to reinitialize with fresh defaults
        console.log('🔄 Attempting to reinitialize with defaults...')
        try {
          localStorage.clear() // Clear potentially corrupted data
          ritualManager.initialize()
          const ritual = ritualManager.getActiveRitual()
          setCurrentRitual(ritual)
          console.log('✅ Reinitialized successfully with ritual:', ritual?.name)
        } catch (retryError) {
          console.error('❌ Failed to reinitialize:', retryError)
        }
      }
    }
    
    initializeApp()
  }, [])

  // Listen for moment updates and ritual executions
  useEffect(() => {
    const handleMomentSaved = () => {
      updateStats()
    }
    
    const handleRitualExecution = (data: any) => {
      const { execution } = data
      if (execution.result === 'success') {
        // Display execution result based on behavior type
        const resultMessages: Record<string, string> = {
          'send_tip': `💰 Tip sent: $${execution.data.tipAmount}`,
          'vote_option_a': `🗳️ Vote recorded: ${execution.data.voteOption}`,
          'vote_option_b': `🗳️ Vote recorded: ${execution.data.voteOption}`,
          'increment_counter': `📊 Counter: ${execution.data.newCount}`,
          'trigger_light': `🎨 Light pattern: ${execution.data.lightPattern}`,
          'play_sound': `🔊 Sound played: ${execution.data.soundFile}`,
          'unlock_content': `🔓 Content unlocked!`,
          'save_moment': `✨ ZK Moment saved securely`
        }
        
        setExecutionResult(resultMessages[execution.behavior] || `✨ ${execution.behavior} executed`)
        
        // Clear result after 3 seconds
        setTimeout(() => setExecutionResult(null), 3000)
      }
    }
    
    const handleRitualChanged = (data: any) => {
      console.log('🎭 Ritual changed detected:', data.ritual.name)
      setCurrentRitual(data.ritual)
      // Force re-render of ESP32 displays with new configuration
      setTimeout(() => {
        console.log('🔄 Triggering display updates for ritual change')
      }, 100)
    }
    
    const handleRitualUpdated = (data: any) => {
      console.log('🎭 Ritual updated detected:', data.ritual.name)
      // Update current ritual if it's the one being updated
      if (currentRitual && data.ritual.id === currentRitual.id) {
        setCurrentRitual(data.ritual)
        console.log('🔄 Real-time ritual configuration update applied')
      }
    }
    
    const handleRitualDeleted = (data: any) => {
      console.log('🎭 Ritual deleted detected:', data.ritualId)
      // Reload active ritual if the current one was deleted
      const newRitual = ritualManager.getActiveRitual()
      setCurrentRitual(newRitual)
    }
    
    const handleEsp32LogUpdate = (data: any) => {
      const { nodeId, deviceLog } = data
      setEsp32DeviceLogs(prev => ({
        ...prev,
        [nodeId]: deviceLog
      }))
    }
    
    eventBus.on('momentSaved', handleMomentSaved)
    eventBus.on('ritualExecution', handleRitualExecution)
    eventBus.on('ritualChanged', handleRitualChanged)
    eventBus.on('ritualUpdated', handleRitualUpdated)
    eventBus.on('ritualDeleted', handleRitualDeleted)
    eventBus.on('esp32LogUpdate', handleEsp32LogUpdate)
    
    return () => {
      eventBus.off('momentSaved', handleMomentSaved)
      eventBus.off('ritualExecution', handleRitualExecution)
      eventBus.off('ritualChanged', handleRitualChanged)
      eventBus.off('ritualUpdated', handleRitualUpdated)
      eventBus.off('ritualDeleted', handleRitualDeleted)
      eventBus.off('esp32LogUpdate', handleEsp32LogUpdate)
    }
  }, [currentRitual])

  // Update global statistics
  const updateStats = () => {
    const allMoments = memoryStore.getAllMoments()
    setTotalMoments(allMoments.length)
    
    const stats: Record<string, any> = {}
    MELD_NODES.forEach(node => {
      const nodeMoments = memoryStore.getMomentsForNode(node.id)
      const nodeStatsData = memoryStore.getNodeStats(node.id)
      
      stats[node.id] = {
        moments: nodeMoments.length,
        recent: nodeMoments.slice(-3),
        stats: nodeStatsData || {
          nodeId: node.id,
          totalMoments: 0,
          uniquePendants: 0,
          lastActivity: 0,
          averageTapsPerHour: 0
        }
      }
    })
    setNodeStats(stats)
  }

  // Enhanced TWO-tap confirmation flow for NFC pendant authentication
  const handleNodeTap = async (nodeId: string) => {
    if (!selectedPendant) return
    
    // If another node is active, ignore
    if (activeNode && activeNode !== nodeId) return
    
    // Handle different states of the authentication flow
    if (nodeState === 'idle') {
      // First tap: Start authentication
      setActiveNode(nodeId)
      setNodeState('detecting')
      addCryptoLog(`Node ${nodeId}: 🚀 FIRST TAP - Authentication initiated`)
      
      setTimeout(() => {
        // Simulate NFC detection
        setNodeState('authenticating')
        addCryptoLog(`Node ${nodeId}: 📡 NFC pendant detected - ${selectedPendant.name}`)
        
        setTimeout(() => {
          // Authentication successful, ready for execution
          setNodeState('executing')
          addCryptoLog(`Node ${nodeId}: ✅ Authentication SUCCESSFUL`)
          addCryptoLog(`Node ${nodeId}: 🟡 READY FOR EXECUTION - Tap again to execute ritual`)
          addCryptoLog(`Node ${nodeId}: 👆 Status: AWAITING SECOND TAP`)
        }, 800)
      }, 600)
      
    } else if (nodeState === 'executing') {
      // Second tap: Execute ritual
      addCryptoLog(`Node ${nodeId}: 🚀 SECOND TAP - Executing ritual now...`)
      setNodeState('success')
      
      try {
        // Validate pendant crypto keys before signing
        if (!selectedPendant.privateKey || !selectedPendant.publicKey) {
          throw new Error('Pendant missing cryptographic keys')
        }
        
        if (!(selectedPendant.privateKey instanceof Uint8Array) || selectedPendant.privateKey.length !== 32) {
          throw new Error('Invalid private key format - expected 32-byte Uint8Array')
        }
        
        if (!(selectedPendant.publicKey instanceof Uint8Array) || selectedPendant.publicKey.length !== 32) {
          throw new Error('Invalid public key format - expected 32-byte Uint8Array')
        }
        
        addCryptoLog(`Node ${nodeId}: 🔐 Crypto keys validated successfully`)
        addCryptoLog(`Node ${nodeId}: ⚡ Generating cryptographic moment...`)
        
        const tapMoment = await simulateTap({
          nodeId,
          pendantPublicKey: selectedPendant.publicKey,
          pendantPrivateKey: selectedPendant.privateKey,
          pendantDID: selectedPendant.did,
          pendantId: selectedPendant.id
        })
        
        console.log('✅ Tap simulation completed:', tapMoment)
        addCryptoLog(`Node ${nodeId}: ✅ Ritual executed successfully`)
        addCryptoLog(`Node ${nodeId}: 📝 Moment ID: ${tapMoment.id}`)
        addCryptoLog(`Node ${nodeId}: 🔗 Hash: ${tapMoment.hash.substring(0, 16)}...`)
        
        updateStats()
        
        // Show success state for 3 seconds before auto-reset
        setTimeout(() => {
          setNodeState('completed')
          addCryptoLog(`Node ${nodeId}: 🎉 SUCCESS - Moment saved securely`)
          
          // Then auto-reset after showing success
          setTimeout(() => {
            resetNodeState()
            addCryptoLog(`Node ${nodeId}: 🔄 Returning to idle state`)
            addCryptoLog(`─────────────────────────────────`)
          }, 3000)
        }, 1000)
      } catch (error) {
        console.error('❌ Tap simulation failed:', error)
        addCryptoLog(`Node ${nodeId}: ❌ ERROR - ${error.message}`)
        resetNodeState()
      }
    }
  }

  const resetNodeState = () => {
    setActiveNode(null)
    setNodeState('idle')
  }

  const handleClearAll = () => {
    memoryStore.clearAllMoments()
    updateStats()
    setCryptoLogs([])
    resetNodeState()
    addCryptoLog('All data cleared')
  }

  const getNodeConfig = (nodeId: string) => {
    if (!currentRitual) {
      return {
        displayText: {
          waiting_title: "MELD Node",
          waiting_subtitle: "Awaiting pendant...",
          detecting_title: "Detecting...",
          detecting_subtitle: "Hold pendant steady",
          success_title: "Authenticated",
          success_subtitle: "Tap again to execute"
        },
        behavior: "save_moment"
      }
    }
    
    const nodeConfig = currentRitual.nodes.find(n => n.nodeId === nodeId)
    if (!nodeConfig) {
      // Return default config if node not found in ritual
      return {
        displayText: {
          waiting_title: "MELD Node",
          waiting_subtitle: "Node not configured",
          detecting_title: "Detecting...",
          detecting_subtitle: "Hold pendant steady",
          success_title: "Authenticated",
          success_subtitle: "No behavior set"
        },
        behavior: "save_moment"
      }
    }
    
    // Ensure we always return a properly structured config
    return {
      displayText: nodeConfig.parameters?.displayText || {
        waiting_title: "MELD Node",
        waiting_subtitle: "Awaiting pendant...",
        detecting_title: "Detecting...",
        detecting_subtitle: "Hold pendant steady",
        success_title: "Authenticated",
        success_subtitle: "Tap again to execute"
      },
      behavior: nodeConfig.behavior || nodeConfig.parameters?.behavior || "save_moment"
    }
  }

  const getNodeDisplay = (nodeId: string) => {
    const config = getNodeConfig(nodeId)
    const isActive = activeNode === nodeId
    
    if (!isActive) {
      return {
        title: "MELD Node",
        subtitle: "👆 Tap to authenticate"
      }
    }

    switch (nodeState) {
      case 'detecting':
        return {
          title: "🔍 DETECTING...",
          subtitle: "Hold pendant steady"
        }
      case 'authenticating':
        return {
          title: "🔐 AUTHENTICATING...",
          subtitle: "Verifying Ed25519 signature"
        }
      case 'executing':
        return {
          title: "✅ READY TO EXECUTE",
          subtitle: "👆 TAP AGAIN to execute ritual"
        }
      case 'success':
        return {
          title: "⚡ EXECUTING...",
          subtitle: `Running ${config.behavior || 'ritual'}...`
        }
      case 'completed':
        return {
          title: "🎉 SUCCESS!",
          subtitle: `${config.behavior?.replace('_', ' ')?.toUpperCase() || 'RITUAL'} COMPLETED`
        }
      default:
        return {
          title: "MELD Node",
          subtitle: "👆 Tap to authenticate"
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-sand-50">
      
      {/* Consolidated Minimal Header */}
      <div className="sticky top-16 z-40 glass-card border-0 border-b border-sage-100/30 animate-fade-slide-up">
        <div className="container-adaptive py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Streamlined Status Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedPendant && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-100/80 border border-sage-200/60 text-sage-700 rounded-xl text-sm font-medium shadow-minimal">
                  <Shield className="w-4 h-4" />
                  {selectedPendant.name}
                </div>
              )}
              {currentRitual && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-lavender-100/80 border border-lavender-200/60 text-lavender-700 rounded-xl text-sm font-medium shadow-minimal">
                  <Sparkles className="w-4 h-4" />
                  {currentRitual.name}
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-100/80 border border-terracotta-200/60 text-terracotta-700 rounded-xl text-sm font-medium shadow-minimal">
                <span className="w-2 h-2 bg-terracotta-500 rounded-full animate-gentle-pulse"></span>
                {totalMoments} interactions
              </div>
            </div>
            
            {/* Compact Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRitualPanel(!showRitualPanel)}
                className={cn(
                  "p-3 rounded-xl transition-all duration-200 interactive focus-ring shadow-minimal",
                  showRitualPanel 
                    ? 'bg-lavender-100 text-lavender-700' 
                    : 'text-neutral-600 hover:text-lavender-600 hover:bg-white/60'
                )}
                title="Ritual Builder"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              
              <button
                onClick={updateStats}
                className="p-3 text-neutral-600 hover:text-sage-600 hover:bg-white/60 rounded-xl transition-all duration-200 interactive focus-ring shadow-minimal"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 text-neutral-600 hover:text-neutral-700 hover:bg-white/60 rounded-xl transition-all duration-200 interactive focus-ring shadow-minimal"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="sticky top-[120px] z-30 glass-card border-0 border-b border-neutral-100/30">
          <div className="container-adaptive py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-sage-600" />
                <span className="text-lg font-semibold text-neutral-800">Development Tools</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDebugModal(true)}
                  className="flex items-center gap-2 px-4 py-2 glass-button text-neutral-700 rounded-lg hover:text-sage-700 text-sm font-medium"
                >
                  <Info className="w-4 h-4" />
                  Debug Info
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50/80 text-red-700 rounded-lg hover:bg-red-100/80 transition-colors text-sm font-medium border border-red-200/60"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              </div>
            </div>
            
            {/* Production Mode Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-neutral-700">Authentication Mode:</span>
                  <button
                    onClick={() => {
                      setProductionMode(!productionMode)
                      addCryptoLog(`Switched to ${!productionMode ? 'PRODUCTION' : 'SIMULATION'} mode`)
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                      productionMode 
                        ? 'bg-sage-100/80 text-sage-700 border-sage-200/60' 
                        : 'bg-sand-100/80 text-sand-700 border-sand-200/60'
                    )}
                  >
                    {productionMode ? '🔐 PRODUCTION' : '🔧 SIMULATION'}
                  </button>
                </div>
                
                <button
                  onClick={() => setCryptoLogs([])}
                  className="text-sm text-neutral-500 hover:text-neutral-700 font-medium"
                >
                  Clear Logs
                </button>
              </div>
              
              {/* Crypto Logs */}
              {cryptoLogs.length > 0 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 max-h-32 overflow-y-auto border border-neutral-200/60">
                  <div className="text-sm font-mono space-y-1">
                    {cryptoLogs.map((log, i) => (
                      <div key={i} className={cn(
                        "text-sm",
                        log.includes('✅') ? 'text-sage-700' :
                        log.includes('❌') ? 'text-red-600' :
                        log.includes('🔐') ? 'text-lavender-700' :
                        'text-neutral-600'
                      )}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-sm text-neutral-500 space-y-1">
                <div><span className="font-medium text-sage-600">Production Mode:</span> Real Ed25519 signature verification</div>
                <div><span className="font-medium text-sand-600">Simulation Mode:</span> DID format validation only</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execution Result Notification */}
      {executionResult && (
        <div className="fixed top-24 right-6 z-50 glass-card bg-sage-100/90 border-sage-200/60 text-sage-800 px-4 py-3 rounded-xl shadow-float animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {executionResult}
          </div>
        </div>
      )}

      {/* Authentication Flow Status */}
      {selectedPendant && activeNode && (
        <div className="fixed top-24 left-6 z-50 glass-card bg-lavender-100/90 border-lavender-200/60 text-lavender-800 px-4 py-3 rounded-xl shadow-float">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              nodeState === 'executing' ? "bg-yellow-500 animate-pulse" : 
              nodeState === 'completed' ? "bg-green-500 animate-gentle-pulse" :
              "bg-lavender-500 animate-gentle-pulse"
            )}></div>
            <div className="text-sm font-medium">
              {nodeState === 'detecting' && '🔍 First tap detected - authenticating...'}
              {nodeState === 'authenticating' && '🔐 Verifying pendant signature...'}
              {nodeState === 'executing' && '✅ Authenticated! 👆 TAP AGAIN to execute'}
              {nodeState === 'success' && '⚡ Executing ritual now...'}
              {nodeState === 'completed' && '🎉 Success! Moment saved securely'}
            </div>
          </div>
        </div>
      )}

      {/* Ritual Control Panel */}
      <RitualControlPanel
        isOpen={showRitualPanel}
        onToggle={() => setShowRitualPanel(!showRitualPanel)}
        onRitualChange={setCurrentRitual}
      />

      {/* Main Content */}
      <div className="container-adaptive pb-8">
        
        {/* ESP32 Wearable Devices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MELD_NODES.map((node, index) => {
            const isActive = activeNode === node.id
            const nodeStatsData = nodeStats[node.id]
            const nodeConfig = ritualManager.getNodeConfig(node.id)
            
            const nodeDisplay = getNodeDisplay(node.id)
            
            return (
              <div key={node.id} className="space-y-6 animate-fade-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Node Location Label */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-neutral-800">{node.name}</h3>
                  <p className="text-sm text-neutral-500">{node.location}</p>
                </div>

                {/* Wearable Device */}
                <ESP32WearableDevice
                  key={`${node.id}-${currentRitual?.id || 'default'}-${currentRitual?.nodes?.find(n => n.nodeId === node.id)?.parameters?.displayText?.waiting_title || 'meld'}`}
                  text={nodeDisplay.title}
                  onTap={() => handleNodeTap(node.id)}
                  disabled={!selectedPendant || (activeNode !== null && activeNode !== node.id)}
                  state={
                    isActive && (nodeState === 'executing') ? "moment" : 
                    isActive && (nodeState === 'detecting' || nodeState === 'authenticating') ? "identity" : 
                    "default"
                  }
                  screen={nodeDisplay.subtitle}
                  screenData={{
                    nodeState: isActive ? nodeState : 'idle',
                    pendantDID: isActive && selectedPendant ? selectedPendant.did : undefined,
                    pendantId: isActive && selectedPendant ? selectedPendant.id : undefined,
                    pendantName: isActive && selectedPendant ? selectedPendant.name : undefined,
                    executionResult
                  }}
                  nodeId={node.id}
                  ritualConfig={{
                    ...nodeConfig,
                    ritualId: currentRitual?.id,
                    displayText: currentRitual?.nodes?.find(n => n.nodeId === node.id)?.parameters?.displayText
                  }}
                  onDeviceLogUpdate={handleDeviceLogUpdate}
                />

                {/* Pendant Tracking Button */}
                <button
                  onClick={() => setShowPendantTracking(node.id)}
                  className="w-full px-3 py-2 bg-sage-100/80 hover:bg-sage-200/80 text-sage-700 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-sage-200/60"
                  title="View pendant interaction logs for this ESP32"
                >
                  <Hash className="w-4 h-4" />
                  Track {esp32DeviceLogs[node.id]?.uniquePendants?.size || 0} Pendants
                </button>
              </div>
            )
          })}
        </div>

        {/* Compact Pendant Selector - Below ESP32 Screens */}
        <div className="mt-12">
          <PendantSelector
            selectedPendant={selectedPendant}
            onPendantChange={setSelectedPendant}
            className="max-w-4xl mx-auto transform scale-90"
          />
        </div>

        {/* Technical Two-Tap Authentication Flow */}
        <div className="glass-card rounded-3xl p-8 shadow-float border border-sage-200/60 animate-fade-slide-up">
          <h3 className="text-xl font-bold text-neutral-800 mb-6 text-center">
            <span className="text-sage-500">//</span> Two-Tap Cryptographic Authentication Flow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-minimal">1</div>
              <div className="font-semibold text-sage-700 mb-1">First Tap</div>
              <div className="text-neutral-500 text-xs">NFC detection ~100ms</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-terracotta-400 to-terracotta-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-minimal">2</div>
              <div className="font-semibold text-terracotta-700 mb-1">Crypto Auth</div>
              <div className="text-neutral-500 text-xs">Ed25519 verify ~1.5s</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-sand-400 to-sand-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-minimal">3</div>
              <div className="font-semibold text-sand-700 mb-1">Ready State</div>
              <div className="text-neutral-500 text-xs">awaiting 2nd tap</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-lavender-400 to-lavender-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-minimal">4</div>
              <div className="font-semibold text-lavender-700 mb-1">Second Tap</div>
              <div className="text-neutral-500 text-xs">execute ritual</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-sage-500 to-sage-700 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-minimal">5</div>
              <div className="font-semibold text-sage-700 mb-1">Success</div>
              <div className="text-neutral-500 text-xs">show completion ~3s</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-minimal">6</div>
              <div className="font-semibold text-terracotta-700 mb-1">Auto Return</div>
              <div className="text-neutral-500 text-xs">back to idle</div>
            </div>
          </div>
          
          {/* Technical details */}
          <div className="mt-8 p-4 glass-card rounded-2xl border border-neutral-200/60">
            <div className="text-sm text-neutral-600 leading-relaxed space-y-2">
              <div><span className="text-sage-600 font-medium">Flow:</span> idle → detecting → authenticating → READY (tap again) → executing → SUCCESS → idle</div>
              <div><span className="text-terracotta-600 font-medium">Security:</span> Ed25519 signature verification with DID-based identity</div>
              <div><span className="text-lavender-600 font-medium">UX Pattern:</span> Deliberate two-tap prevents accidental ritual execution</div>
            </div>
          </div>
        </div>

        {/* MELD Attribution */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 glass-card rounded-2xl border border-sage-200/60 shadow-minimal">
            <div className="w-8 h-8 bg-gradient-to-br from-sage-500 to-terracotta-600 rounded-xl flex items-center justify-center shadow-minimal">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-sm text-neutral-600">
              Simulation brought to you by <a
                href="https://github.com/meldtech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-600 font-semibold hover:text-sage-700 transition-colors duration-200 underline underline-offset-2 decoration-sage-600/50 hover:decoration-sage-700"
              >
                MELD
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-3">
                <Info className="w-6 h-6 text-sage-600" />
                System Debug Information
              </h2>
              <button
                onClick={() => setShowDebugModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500 hover:text-neutral-700 interactive focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Ritual Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-lavender-700 border-b border-lavender-200 pb-2">
                  Current Ritual
                </h3>
                {currentRitual ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">ID:</span> 
                      <span className="text-neutral-800 font-mono">{currentRitual.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">Name:</span> 
                      <span className="text-sage-700 font-semibold">{currentRitual.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">Version:</span> 
                      <span className="text-terracotta-700 font-semibold">{currentRitual.version}</span>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">Description:</span>
                      <div className="text-neutral-700 mt-1">{currentRitual.description || 'None'}</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">Nodes:</span> 
                      <span className="text-lavender-700 font-semibold">{currentRitual.nodes.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500 italic text-center py-8 bg-neutral-50 rounded-lg">No active ritual</div>
                )}
              </div>

              {/* Selected Pendant Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-sage-700 border-b border-sage-200 pb-2">
                  Selected Pendant
                </h3>
                {selectedPendant ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">ID:</span> 
                      <span className="text-neutral-800 font-mono">{selectedPendant.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">Name:</span> 
                      <span className="text-sage-700 font-semibold">{selectedPendant.name}</span>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">DID:</span>
                      <div className="text-terracotta-700 font-mono text-xs break-all mt-1">{selectedPendant.did}</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <span className="text-neutral-600 font-medium">Public Key:</span>
                      <div className="text-lavender-700 font-mono text-xs mt-1">{formatKeyForDisplay(selectedPendant.publicKey)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500 italic text-center py-8 bg-neutral-50 rounded-lg">No pendant selected</div>
                )}
              </div>

              {/* System State */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-terracotta-700 border-b border-terracotta-200 pb-2">
                  System State
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-600 font-medium">Active Node:</span> 
                    <span className="text-neutral-800 font-mono">{activeNode || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-600 font-medium">Node State:</span> 
                    <span className="text-sand-700 font-semibold">{nodeState}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-600 font-medium">Production Mode:</span> 
                    <span className={cn("font-semibold", productionMode ? 'text-sage-700' : 'text-sand-700')}>
                      {productionMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-600 font-medium">Total Moments:</span> 
                    <span className="text-lavender-700 font-semibold">{totalMoments}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-600 font-medium">Settings Panel:</span> 
                    <span className={cn("font-semibold", showSettings ? 'text-sage-700' : 'text-neutral-500')}>
                      {showSettings ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-600 font-medium">Ritual Panel:</span> 
                    <span className={cn("font-semibold", showRitualPanel ? 'text-sage-700' : 'text-neutral-500')}>
                      {showRitualPanel ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Node Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-sand-700 border-b border-sand-200 pb-2">
                  Node Statistics
                </h3>
                <div className="space-y-3 text-sm">
                  {MELD_NODES.map(node => (
                    <div key={node.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span style={{ color: node.color, fontSize: '1.25rem' }}>{node.icon}</span>
                        <span className="text-neutral-800 font-semibold">{node.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Moments:</span> 
                          <span className="text-sage-700 font-semibold">{nodeStats[node.id]?.moments || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Unique Users:</span> 
                          <span className="text-lavender-700 font-semibold">{nodeStats[node.id]?.stats?.uniquePendants || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Rituals */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-lavender-700 border-b border-lavender-200 pb-2">
                  Available Rituals ({ritualManager.getAllRituals().length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {ritualManager.getAllRituals().map(ritual => (
                    <div key={ritual.id} className={cn(
                      "p-4 rounded-xl border transition-all",
                      ritual.id === currentRitual?.id 
                        ? 'bg-lavender-100/80 border-lavender-300/60' 
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    )}>
                      <div className="font-semibold text-neutral-800 mb-2">{ritual.name}</div>
                      <div className="text-xs text-neutral-600 mb-3">{ritual.description || 'No description'}</div>
                      <div className="flex justify-between text-xs">
                        <span className="px-2 py-1 bg-sage-100 text-sage-700 rounded">{ritual.nodes.length} nodes</span>
                        <span className="px-2 py-1 bg-terracotta-100 text-terracotta-700 rounded">v{ritual.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-200">
              <div className="text-xs text-neutral-500 font-mono">
                Debug info refreshed at: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pendant Tracking Modal */}
      {showPendantTracking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-3">
                <Hash className="w-6 h-6 text-sage-600" />
                ESP32 {showPendantTracking} - Pendant Tracking
              </h2>
              <button
                onClick={() => setShowPendantTracking(null)}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500 hover:text-neutral-700 interactive focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* ESP32 Device Summary */}
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <h3 className="font-bold text-sage-700 mb-4">Device Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-xl border border-neutral-200">
                    <div className="text-neutral-500 text-xs font-medium">Total Interactions</div>
                    <div className="text-neutral-800 font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.totalInteractions || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl border border-neutral-200">
                    <div className="text-neutral-500 text-xs font-medium">Unique Pendants</div>
                    <div className="text-neutral-800 font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.uniquePendants?.size || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl border border-neutral-200">
                    <div className="text-neutral-500 text-xs font-medium">Success Rate</div>
                    <div className="text-neutral-800 font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.interactions?.length > 0
                        ? Math.round((esp32DeviceLogs[showPendantTracking].interactions.filter(i => i.authResult === 'success').length / esp32DeviceLogs[showPendantTracking].interactions.length) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl border border-neutral-200">
                    <div className="text-neutral-500 text-xs font-medium">Last Sync</div>
                    <div className="text-neutral-800 font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.lastSync > 0 
                        ? formatTimestamp(esp32DeviceLogs[showPendantTracking].lastSync).split(' ')[1]
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pendant Profiles */}
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <h3 className="font-bold text-sage-700 mb-4">Pendant Profiles</h3>
                {esp32DeviceLogs[showPendantTracking]?.pendantProfiles?.size > 0 ? (
                  <div className="space-y-3">
                    {Array.from(esp32DeviceLogs[showPendantTracking].pendantProfiles.entries()).map(([pendantDID, profile]) => (
                      <div key={pendantDID} className="p-4 bg-white rounded-xl border border-neutral-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-neutral-800 font-semibold">
                            {profile.name}
                          </div>
                          <div className="text-xs px-2 py-1 bg-terracotta-100 text-terracotta-700 rounded font-medium">
                            {profile.totalTaps} taps
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 mb-3 font-mono bg-neutral-50 p-2 rounded">
                          DID: {pendantDID.substring(0, 40)}...
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="text-neutral-600">
                            Last seen: {formatTimestamp(profile.lastSeen)}
                          </div>
                          <div className="px-2 py-1 bg-sage-100 text-sage-700 rounded font-medium">
                            Auth: {profile.authSuccessRate}% success
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-neutral-600">Behaviors: </span>
                          <span className="text-lavender-700 font-medium">{profile.behaviors.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-neutral-500 text-center py-12 bg-white rounded-xl border border-neutral-200">
                    No pendant interactions recorded yet. Tap an ESP32 with a selected pendant to start tracking.
                  </div>
                )}
              </div>

              {/* Recent Interactions Log */}
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <h3 className="font-bold text-sage-700 mb-4">Recent Interactions</h3>
                {esp32DeviceLogs[showPendantTracking]?.interactions?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {esp32DeviceLogs[showPendantTracking].interactions.slice(-10).reverse().map((interaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            interaction.authResult === 'success' ? 'bg-sage-500' : 'bg-red-400'
                          )}></div>
                          <div className="text-neutral-800 font-mono text-xs">
                            {formatTimestamp(interaction.timestamp)}
                          </div>
                          <div className="text-neutral-700 font-medium">
                            {interaction.pendantName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lavender-700 bg-lavender-100 px-2 py-1 rounded text-xs font-medium">
                            {interaction.behaviorExecuted}
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            interaction.authResult === 'success' 
                              ? 'bg-sage-100 text-sage-700' 
                              : 'bg-red-100 text-red-700'
                          )}>
                            {interaction.authResult}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-neutral-500 text-center py-8 bg-white rounded-xl border border-neutral-200">
                    No interactions logged yet
                  </div>
                )}
              </div>

              {/* Sync to Hub Option */}
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <h3 className="font-bold text-sage-700 mb-4">Hub Sync</h3>
                <p className="text-neutral-600 text-sm mb-6">
                  In production, this ESP32 would sync interaction logs to a central Raspberry Pi hub via WiFi/Bluetooth. 
                  The hub can then process data into art, analytics, and experiences.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      console.log(`📡 Syncing ESP32 ${showPendantTracking} logs to hub...`)
                      // Update last sync time
                      setEsp32DeviceLogs(prev => ({
                        ...prev,
                        [showPendantTracking]: {
                          ...prev[showPendantTracking],
                          lastSync: Date.now()
                        }
                      }))
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors text-sm font-medium shadow-minimal"
                  >
                    📡 Sync to Hub
                  </button>
                  <button
                    onClick={() => {
                      setEsp32DeviceLogs(prev => ({
                        ...prev,
                        [showPendantTracking]: {
                          ...prev[showPendantTracking],
                          interactions: [],
                          totalInteractions: 0,
                          uniquePendants: new Set(),
                          pendantProfiles: new Map()
                        }
                      }))
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-minimal"
                  >
                    🗑️ Clear Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

