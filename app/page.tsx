"use client"

import { useState, useEffect, useCallback } from 'react'
import { PendantIdentity, getMeldNodes, simulateTap, eventBus, formatTimestamp, initializeDefaultNodes } from '@/lib/hal/simulateTap'
import { memoryStore } from '@/lib/moment/memoryStore'
import { ritualManager } from '@/lib/ritual/ritualManager'
import { Ritual } from '@/lib/ritual/types'
import PendantSelector from '@/components/PendantSelector'
import ESP32WearableDevice from '@/components/ESP32WearableDevice'
import RitualControlPanel from '@/components/RitualControlPanel'
import { Settings, RefreshCw, Trash2, Info, Sparkles, Shield, X, Hash, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MeldSimulation() {
  const [selectedPendant, setSelectedPendant] = useState<PendantIdentity | null>(null)
  const [totalMoments, setTotalMoments] = useState(0)
  const [nodeStats, setNodeStats] = useState<Record<string, any>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [showRitualPanel, setShowRitualPanel] = useState(false)
  const [currentRitual, setCurrentRitual] = useState<Ritual | null>(null)
  const [currentNodes, setCurrentNodes] = useState(getMeldNodes())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
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
        // Initialize dynamic nodes system
        initializeDefaultNodes()
        
        // Initialize systems
        ritualManager.initialize()
        updateStats()
        
        // Set initial current ritual if available
        const activeRitual = ritualManager.getActiveRitual()
        if (activeRitual) {
          setCurrentRitual(activeRitual)
        }
        
        console.log('✅ MELD Simulation initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize MELD Simulation:', error)
      }
    }

    // Event Listeners
    const handleMomentSaved = () => {
      updateStats()
    }

    const handleRitualExecution = (data: any) => {
      console.log('🎭 Ritual execution:', data)
      if (data.execution) {
        setExecutionResult(data.execution.behavior)
        setTimeout(() => setExecutionResult(null), 3000)
      }
    }

    const handleEsp32LogUpdate = (data: any) => {
      setEsp32DeviceLogs(prev => ({
        ...prev,
        [data.nodeId]: data.deviceLog
      }))
    }

    const handleRitualChanged = (data: any) => {
      console.log('🎭 Ritual changed:', data)
      if (data && typeof data === 'object' && data.id) {
        setCurrentRitual(data)
      } else if (data === null) {
        setCurrentRitual(null)
      }
    }

    const handleRitualUpdated = (data: any) => {
      console.log('🎭 Ritual updated:', data)
      if (data && typeof data === 'object' && data.id) {
        setCurrentRitual(data)
      }
    }

    const handleRitualDeleted = (data: any) => {
      console.log('🎭 Ritual deleted:', data)
      setCurrentRitual(null)
    }

    const handleNodesUpdated = () => {
      const updatedNodes = getMeldNodes()
      setCurrentNodes(updatedNodes)
      updateStats()
      console.log('🔄 Nodes updated, refreshing layout')
    }

    // Initialize and setup event listeners
    initializeApp()
    
    eventBus.on('momentSaved', handleMomentSaved)
    eventBus.on('ritualExecution', handleRitualExecution)
    eventBus.on('esp32LogUpdate', handleEsp32LogUpdate)
    eventBus.on('ritualChanged', handleRitualChanged)
    eventBus.on('ritualUpdated', handleRitualUpdated)
    eventBus.on('ritualDeleted', handleRitualDeleted)
    eventBus.on('nodesUpdated', handleNodesUpdated)

    // Cleanup event listeners
    return () => {
      eventBus.off('momentSaved', handleMomentSaved)
      eventBus.off('ritualExecution', handleRitualExecution)
      eventBus.off('esp32LogUpdate', handleEsp32LogUpdate)
      eventBus.off('ritualChanged', handleRitualChanged)
      eventBus.off('ritualUpdated', handleRitualUpdated)
      eventBus.off('ritualDeleted', handleRitualDeleted)
      eventBus.off('nodesUpdated', handleNodesUpdated)
    }
  }, [])

  // Update global statistics
  const updateStats = () => {
    const allMoments = memoryStore.getAllMoments()
    setTotalMoments(allMoments.length)
    
    const stats: Record<string, any> = {}
    currentNodes.forEach(node => {
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

  // Comprehensive system refresh
  const handleSystemRefresh = async () => {
    setIsRefreshing(true)
    addCryptoLog('🔄 System refresh initiated...')
    
    try {
      // Reset any active node state
      resetNodeState()
      
      // Refresh node configuration
      const updatedNodes = getMeldNodes()
      setCurrentNodes(updatedNodes)
      
      // Refresh ritual manager
      ritualManager.initialize()
      const activeRitual = ritualManager.getActiveRitual()
      setCurrentRitual(activeRitual)
      
      // Update statistics
      updateStats()
      
      // Clear any temporary UI states
      setExecutionResult(null)
      
      addCryptoLog('✅ System refresh completed successfully')
      
      // Show success feedback
      setTimeout(() => {
        setIsRefreshing(false)
      }, 800)
      
    } catch (error) {
      console.error('System refresh failed:', error)
      addCryptoLog('❌ System refresh failed')
      setIsRefreshing(false)
    }
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
    const nodeConfig = currentRitual?.nodes.find(n => n.nodeId === nodeId)
    
    // Helper function to get behavior-specific display text
    const getBehaviorDisplay = (behavior: string, parameters?: any) => {
      switch (behavior) {
        case 'save_moment':
          return {
            waiting: { title: 'SAVE MOMENT', subtitle: '💖 Tap to capture memory' },
            ready: { title: 'SAVE MOMENT', subtitle: '👆 TAP AGAIN to save' },
            success: { title: 'MOMENT SAVED', subtitle: '✨ Memory captured!' }
          }
        case 'send_tip':
          const tipAmount = parameters?.tipAmount || 1
          const recipient = parameters?.recipient || 'performer'
          return {
            waiting: { title: 'TIP JAR', subtitle: `💰 Tip $${tipAmount} to ${recipient}` },
            ready: { title: 'SEND TIP', subtitle: `👆 TAP AGAIN to send $${tipAmount}` },
            success: { title: 'TIP SENT', subtitle: `💸 $${tipAmount} sent to ${recipient}` }
          }
        case 'vote_option_a':
          const optionA = parameters?.voteOption || 'Option A'
          return {
            waiting: { title: 'VOTE A', subtitle: `🗳️ ${optionA}` },
            ready: { title: 'CAST VOTE A', subtitle: `👆 TAP AGAIN for ${optionA}` },
            success: { title: 'VOTE CAST', subtitle: `✅ Voted for ${optionA}` }
          }
        case 'vote_option_b':
          const optionB = parameters?.voteOption || 'Option B'
          return {
            waiting: { title: 'VOTE B', subtitle: `🗳️ ${optionB}` },
            ready: { title: 'CAST VOTE B', subtitle: `👆 TAP AGAIN for ${optionB}` },
            success: { title: 'VOTE CAST', subtitle: `✅ Voted for ${optionB}` }
          }
        case 'increment_counter':
          const counterName = parameters?.counterName || 'counter'
          return {
            waiting: { title: 'COUNTER', subtitle: `📊 Increment ${counterName}` },
            ready: { title: 'INCREMENT', subtitle: `👆 TAP AGAIN to count` },
            success: { title: 'COUNTED', subtitle: `➕ ${counterName} increased` }
          }
        case 'trigger_light':
          const lightPattern = parameters?.lightPattern || 'rainbow'
          return {
            waiting: { title: 'LIGHT SHOW', subtitle: `🌈 Trigger ${lightPattern} lights` },
            ready: { title: 'TRIGGER LIGHTS', subtitle: `👆 TAP AGAIN for ${lightPattern}` },
            success: { title: 'LIGHTS ON', subtitle: `🎨 ${lightPattern} activated` }
          }
        case 'play_sound':
          const soundFile = parameters?.soundFile || 'beep.wav'
          const soundName = soundFile.replace('.wav', '').replace('_', ' ')
          return {
            waiting: { title: 'SOUND', subtitle: `🔊 Play ${soundName}` },
            ready: { title: 'PLAY SOUND', subtitle: `👆 TAP AGAIN for ${soundName}` },
            success: { title: 'SOUND PLAYED', subtitle: `🎵 ${soundName} played` }
          }
        case 'unlock_content':
          const contentId = parameters?.contentId || 'content'
          return {
            waiting: { title: 'UNLOCK', subtitle: `🔓 Access ${contentId}` },
            ready: { title: 'UNLOCK CONTENT', subtitle: `👆 TAP AGAIN to unlock` },
            success: { title: 'UNLOCKED', subtitle: `🔑 ${contentId} accessible` }
          }
        case 'custom':
          const customName = parameters?.customName || 'custom action'
          return {
            waiting: { title: 'CUSTOM', subtitle: `⚙️ ${customName}` },
            ready: { title: 'EXECUTE', subtitle: `👆 TAP AGAIN for ${customName}` },
            success: { title: 'EXECUTED', subtitle: `✅ ${customName} complete` }
          }
        default:
          return {
            waiting: { title: 'MELD NODE', subtitle: '👆 Tap to begin' },
            ready: { title: 'READY', subtitle: '👆 TAP AGAIN to execute' },
            success: { title: 'SUCCESS', subtitle: '✅ Action complete' }
          }
      }
    }
    
    // Use custom display text if available, otherwise use behavior-specific defaults
    const displayTexts = config.displayText || {}
    const behaviorDisplays = getBehaviorDisplay(config.behavior, nodeConfig?.parameters)
    
    if (!isActive) {
      // Show behavior-specific waiting state
      return {
        title: displayTexts.waiting_title || behaviorDisplays.waiting.title,
        subtitle: displayTexts.waiting_subtitle || behaviorDisplays.waiting.subtitle
      }
    }

    switch (nodeState) {
      case 'detecting':
        return {
          title: displayTexts.detected_title || "🔍 DETECTING...",
          subtitle: displayTexts.detected_subtitle || "Hold pendant steady"
        }
      case 'authenticating':
        return {
          title: "🔐 AUTHENTICATING...",
          subtitle: "Verifying Ed25519 signature"
        }
      case 'executing':
        return {
          title: displayTexts.auth_title || behaviorDisplays.ready.title,
          subtitle: displayTexts.auth_instruction || behaviorDisplays.ready.subtitle
        }
      case 'success':
        return {
          title: "⚡ EXECUTING...",
          subtitle: `Running ${config.behavior?.replace('_', ' ') || 'ritual'}...`
        }
      case 'completed':
        return {
          title: displayTexts.success_title || behaviorDisplays.success.title,
          subtitle: displayTexts.success_subtitle || behaviorDisplays.success.subtitle
        }
      default:
        return {
          title: displayTexts.waiting_title || behaviorDisplays.waiting.title,
          subtitle: displayTexts.waiting_subtitle || behaviorDisplays.waiting.subtitle
        }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      
      {/* Consolidated Minimal Header */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-sm border-0 border-b border-border/30 animate-fade-slide-up">
        <div className="container-adaptive py-8 sm:py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            {/* Streamlined Status Indicators */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Main Title - Enhanced Hierarchy */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/15 to-accent/10 border-2 border-primary/30 text-primary rounded-2xl text-base font-black shadow-float backdrop-blur-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                KairOS Ritual Designer
              </div>
              
              {selectedPendant && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-medium shadow-minimal">
                  <Shield className="w-4 h-4" />
                  {selectedPendant.name}
                </div>
              )}
              {currentRitual && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl text-sm font-medium shadow-minimal">
                  <Sparkles className="w-4 h-4" />
                  {currentRitual.name}
                </div>
              )}
            </div>
            
            {/* Compact Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('Sparkles button clicked, current state:', showRitualPanel)
                  setShowRitualPanel(!showRitualPanel)
                  console.log('New state will be:', !showRitualPanel)
                }}
                className={cn(
                  "retro-button p-3 rounded-retro transition-all duration-200 interactive focus-ring shadow-minimal",
                  showRitualPanel 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-muted-foreground hover:text-accent hover:bg-background/60'
                )}
                title="Ritual Builder"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSystemRefresh}
                disabled={isRefreshing}
                className={cn(
                  "retro-button p-3 rounded-retro transition-all duration-200 interactive focus-ring shadow-minimal",
                  isRefreshing 
                    ? 'text-primary bg-primary/10 cursor-not-allowed' 
                    : 'text-muted-foreground hover:text-primary hover:bg-background/60'
                )}
                title={isRefreshing ? "Refreshing system..." : "Refresh system state"}
              >
                <RefreshCw className={cn(
                  "w-5 h-5 transition-transform duration-500",
                  isRefreshing && "animate-spin"
                )} />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="retro-button p-3 text-muted-foreground hover:text-foreground hover:bg-background/60 rounded-retro transition-all duration-200 interactive focus-ring shadow-minimal"
                title="Developer Tools"
              >
                <Terminal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="sticky top-[120px] z-30 bg-background/80 backdrop-blur-sm border-0 border-b border-border/30">
          <div className="container-adaptive py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">Development Tools</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDebugModal(true)}
                  className="retro-button flex items-center gap-2 px-4 py-2 text-foreground rounded-lg hover:text-primary text-sm font-medium"
                >
                  <Info className="w-4 h-4" />
                  Debug Info
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium border border-destructive/20"
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
                  <span className="text-sm font-medium text-foreground">Authentication Mode:</span>
                  <button
                    onClick={() => {
                      setProductionMode(!productionMode)
                      addCryptoLog(`Switched to ${!productionMode ? 'PRODUCTION' : 'SIMULATION'} mode`)
                    }}
                    className={cn(
                      "retro-button px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                      productionMode 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-accent/10 text-accent border-accent/20'
                    )}
                  >
                    {productionMode ? '🔐 PRODUCTION' : '🔧 SIMULATION'}
                  </button>
                </div>
                
                <button
                  onClick={() => setCryptoLogs([])}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Clear Logs
                </button>
              </div>
              
              {/* Crypto Logs */}
              {cryptoLogs.length > 0 && (
                <div className="retro-card/60 backdrop-blur-sm rounded-lg p-4 max-h-32 overflow-y-auto border border-border">
                  <div className="text-sm font-mono space-y-1">
                    {cryptoLogs.map((log, i) => (
                      <div key={i} className={cn(
                        "text-sm",
                        log.includes('✅') ? 'text-primary' :
                        log.includes('❌') ? 'text-destructive' :
                        log.includes('🔐') ? 'text-accent' :
                        'text-muted-foreground'
                      )}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div><span className="font-medium text-primary">Production Mode:</span> Real Ed25519 signature verification</div>
                <div><span className="font-medium text-accent">Simulation Mode:</span> DID format validation only</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESP32 Wearable Devices */}
      <div className={cn(
        "gap-6 sm:gap-8 md:gap-10 mb-16 mt-8 sm:mt-12 md:mt-16",
        // Single node: center it with extra space and larger sizing
        currentNodes.length === 1 && "flex justify-center",
        // Multiple nodes: use responsive grid with proper wrapping
        currentNodes.length > 1 && "grid",
        currentNodes.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto",
        currentNodes.length === 3 && "grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto",
        currentNodes.length === 4 && "grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto",
        currentNodes.length === 5 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto",
        currentNodes.length === 6 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-6xl mx-auto"
      )}>
        {currentNodes.map((node, index) => {
          const isActive = activeNode === node.id
          const nodeStatsData = nodeStats[node.id]
          const nodeConfig = ritualManager.getNodeConfig(node.id)
          
          const nodeDisplay = getNodeDisplay(node.id)
          
          return (
            <div 
              key={node.id} 
              className={cn(
                "space-y-6 sm:space-y-8 animate-fade-slide-up",
                // Single node gets extra space and prominence
                currentNodes.length === 1 && "max-w-md w-full scale-110"
              )} 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Node Location Label */}
              <div className="text-center space-y-2">
                <h3 className={cn(
                  "font-bold text-foreground",
                  currentNodes.length === 1 ? "text-2xl" : "text-lg"
                )}>
                  {node.name}
                </h3>
                <p className={cn(
                  "text-muted-foreground",
                  currentNodes.length === 1 ? "text-base" : "text-sm"
                )}>
                  {node.location}
                </p>
              </div>

              {/* Wearable Device */}
              <ESP32WearableDevice
                key={`${node.id}-${currentRitual?.id || 'default'}-${currentRitual?.nodes?.find(n => n.nodeId === node.id)?.behavior || 'default'}-${JSON.stringify(currentRitual?.nodes?.find(n => n.nodeId === node.id)?.parameters?.displayText || {})}`}
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
                  executionResult,
                  behavior: currentRitual?.nodes?.find(n => n.nodeId === node.id)?.behavior || nodeConfig?.behavior || 'save_moment'
                }}
                nodeId={node.id}
                ritualConfig={{
                  ...(nodeConfig || {}),
                  ritualId: currentRitual?.id,
                  name: currentRitual?.name,
                  behavior: currentRitual?.nodes?.find(n => n.nodeId === node.id)?.behavior || (nodeConfig && nodeConfig.behavior) || 'save_moment',
                  displayText: currentRitual?.nodes?.find(n => n.nodeId === node.id)?.parameters?.displayText || (nodeConfig && nodeConfig.displayText),
                  parameters: currentRitual?.nodes?.find(n => n.nodeId === node.id)?.parameters
                }}
                onDeviceLogUpdate={handleDeviceLogUpdate}
              />

              {/* Pendant Tracking Button */}
              <button
                onClick={() => setShowPendantTracking(node.id)}
                className={cn(
                  "retro-button w-full flex items-center justify-center gap-2",
                  currentNodes.length === 1 ? "text-base py-3" : "text-sm"
                )}
                title="View pendant interaction logs for this ESP32"
              >
                <Hash className={cn(currentNodes.length === 1 ? "w-5 h-5" : "w-4 h-4")} />
                Track {esp32DeviceLogs[node.id]?.uniquePendants?.size || 0} Pendants
              </button>

              {/* Single node special info card */}
              {currentNodes.length === 1 && (
                <div className="retro-card p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="text-primary font-semibold">Minimal Setup:</span> Perfect for simple installations
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Open the Ritual Designer to add more nodes for complex multi-station experiences
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Compact Pendant Selector - Below ESP32 Screens */}
      <div className="mt-16 sm:mt-20 md:mt-24">
        <PendantSelector
          selectedPendant={selectedPendant}
          onPendantChange={setSelectedPendant}
          className="max-w-4xl mx-auto transform scale-90"
        />
      </div>

      {/* Technical Two-Tap Authentication Flow */}
      <div className="retro-card p-8 shadow-minimal animate-fade-slide-up">
        <h3 className="text-xl font-bold text-foreground mb-6 text-center">
          <span className="text-primary">//</span> Two-Tap Cryptographic Authentication Flow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 text-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-pixel flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-pixel">1</div>
            <div className="font-semibold text-primary mb-1">First Tap</div>
            <div className="text-muted-foreground text-xs">NFC detection ~100ms</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-accent text-accent-foreground rounded-pixel flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-pixel">2</div>
            <div className="font-semibold text-accent mb-1">Crypto Auth</div>
            <div className="text-muted-foreground text-xs">Ed25519 verify ~1.5s</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-pixel flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-pixel">3</div>
            <div className="font-semibold text-secondary mb-1">Ready State</div>
            <div className="text-muted-foreground text-xs">awaiting 2nd tap</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-accent/80 text-accent-foreground rounded-pixel flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-pixel">4</div>
            <div className="font-semibold text-accent mb-1">Second Tap</div>
            <div className="text-muted-foreground text-xs">execute ritual</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-pixel flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-pixel">5</div>
            <div className="font-semibold text-primary mb-1">Success</div>
            <div className="text-muted-foreground text-xs">show completion ~3s</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-pixel flex items-center justify-center text-sm font-bold mx-auto mb-3 shadow-pixel">6</div>
            <div className="font-semibold text-secondary mb-1">Auto Return</div>
            <div className="text-muted-foreground text-xs">back to idle</div>
          </div>
        </div>
        
        {/* Technical details */}
        <div className="mt-8 p-4 retro-card">
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <div><span className="text-primary font-medium">Flow:</span> idle → detecting → authenticating → READY (tap again) → executing → SUCCESS → idle</div>
            <div><span className="text-accent font-medium">Security:</span> Ed25519 signature verification with DID-based identity</div>
            <div><span className="text-primary font-medium">UX Pattern:</span> Deliberate two-tap prevents accidental ritual execution</div>
          </div>
        </div>
      </div>

      {/* MELD Attribution */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-card rounded-lg border border-border shadow-minimal">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-minimal">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Simulation brought to you by <a
              href="https://github.com/meldtech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:text-accent transition-colors duration-200 underline underline-offset-2 decoration-primary/50 hover:decoration-accent"
            >
              MELD
            </a>
          </span>
        </div>
      </div>

      {/* Ritual Control Panel */}
      <RitualControlPanel
        isOpen={showRitualPanel}
        onToggle={() => setShowRitualPanel(false)}
        onRitualChange={setCurrentRitual}
      />

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Info className="w-6 h-6 text-primary" />
                System Debug Information
              </h2>
              <button
                onClick={() => setShowDebugModal(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground interactive focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Ritual Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent border-b border-border pb-2">
                  Current Ritual
                </h3>
                {currentRitual ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">ID:</span> 
                      <span className="text-foreground font-mono">{currentRitual.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">Name:</span> 
                      <span className="text-primary font-semibold">{currentRitual.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">Version:</span> 
                      <span className="text-accent font-semibold">{currentRitual.version}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">Description:</span>
                      <div className="text-foreground mt-1">{currentRitual.description || 'None'}</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">Nodes:</span> 
                      <span className="text-accent font-semibold">{currentRitual.nodes.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic text-center py-8 bg-muted rounded-lg">No active ritual</div>
                )}
              </div>

              {/* Selected Pendant Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Selected Pendant
                </h3>
                {selectedPendant ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">ID:</span> 
                      <span className="text-foreground font-mono">{selectedPendant.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">Name:</span> 
                      <span className="text-primary font-semibold">{selectedPendant.name}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">DID:</span>
                      <div className="text-accent font-mono text-xs break-all mt-1">{selectedPendant.did}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium">Public Key:</span>
                      <div className="text-accent font-mono text-xs mt-1">{formatKeyForDisplay(selectedPendant.publicKey)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic text-center py-8 bg-muted rounded-lg">No pendant selected</div>
                )}
              </div>

              {/* System State */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent border-b border-border pb-2">
                  System State
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground font-medium">Active Node:</span> 
                    <span className="text-foreground font-mono">{activeNode || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground font-medium">Node State:</span> 
                    <span className="text-accent font-semibold">{nodeState}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground font-medium">Production Mode:</span> 
                    <span className={cn("font-semibold", productionMode ? 'text-primary' : 'text-accent')}>
                      {productionMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground font-medium">Total Moments:</span> 
                    <span className="text-accent font-semibold">{totalMoments}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground font-medium">Settings Panel:</span> 
                    <span className={cn("font-semibold", showSettings ? 'text-primary' : 'text-muted-foreground')}>
                      {showSettings ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground font-medium">Ritual Panel:</span> 
                    <span className={cn("font-semibold", showRitualPanel ? 'text-primary' : 'text-muted-foreground')}>
                      {showRitualPanel ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Node Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent border-b border-border pb-2">
                  Node Statistics
                </h3>
                <div className="space-y-3 text-sm">
                  {currentNodes.map(node => (
                    <div key={node.id} className="p-4 bg-muted rounded-xl border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <span style={{ color: node.color, fontSize: '1.25rem' }}>{node.icon}</span>
                        <span className="text-foreground font-semibold">{node.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Moments:</span> 
                          <span className="text-primary font-semibold">{nodeStats[node.id]?.moments || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unique Users:</span> 
                          <span className="text-accent font-semibold">{nodeStats[node.id]?.stats?.uniquePendants || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Rituals */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-accent border-b border-border pb-2">
                  Available Rituals ({ritualManager.getAllRituals().length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {ritualManager.getAllRituals().map(ritual => (
                    <div key={ritual.id} className={cn(
                      "p-4 rounded-xl border transition-all",
                      ritual.id === currentRitual?.id 
                        ? 'bg-accent/10 border-accent/30' 
                        : 'bg-muted border-border hover:border-primary/30'
                    )}>
                      <div className="font-semibold text-foreground mb-2">{ritual.name}</div>
                      <div className="text-xs text-muted-foreground mb-3">{ritual.description || 'No description'}</div>
                      <div className="flex justify-between text-xs">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded">{ritual.nodes.length} nodes</span>
                        <span className="px-2 py-1 bg-accent/10 text-accent rounded">v{ritual.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground font-mono">
                Debug info refreshed at: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pendant Tracking Modal */}
      {showPendantTracking && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Hash className="w-6 h-6 text-primary" />
                ESP32 {showPendantTracking} - Pendant Tracking
              </h2>
              <button
                onClick={() => setShowPendantTracking(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground interactive focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* ESP32 Device Summary */}
              <div className="bg-muted rounded-lg p-6 border border-border">
                <h3 className="font-bold text-primary mb-4">Device Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-card rounded-xl border border-border">
                    <div className="text-muted-foreground text-xs font-medium">Total Interactions</div>
                    <div className="text-foreground font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.totalInteractions || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-xl border border-border">
                    <div className="text-muted-foreground text-xs font-medium">Unique Pendants</div>
                    <div className="text-foreground font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.uniquePendants?.size || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-xl border border-border">
                    <div className="text-muted-foreground text-xs font-medium">Success Rate</div>
                    <div className="text-foreground font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.interactions?.length > 0
                        ? Math.round((esp32DeviceLogs[showPendantTracking].interactions.filter(i => i.authResult === 'success').length / esp32DeviceLogs[showPendantTracking].interactions.length) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-xl border border-border">
                    <div className="text-muted-foreground text-xs font-medium">Last Sync</div>
                    <div className="text-foreground font-bold text-xl mt-1">
                      {esp32DeviceLogs[showPendantTracking]?.lastSync > 0 
                        ? formatTimestamp(esp32DeviceLogs[showPendantTracking].lastSync).split(' ')[1]
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pendant Profiles */}
              <div className="bg-muted rounded-lg p-6 border border-border">
                <h3 className="font-bold text-primary mb-4">Pendant Profiles</h3>
                {esp32DeviceLogs[showPendantTracking]?.pendantProfiles?.size > 0 ? (
                  <div className="space-y-3">
                    {Array.from(esp32DeviceLogs[showPendantTracking].pendantProfiles.entries()).map(([pendantDID, profile]) => (
                      <div key={pendantDID} className="p-4 bg-card rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-foreground font-semibold">
                            {profile.name}
                          </div>
                          <div className="text-xs px-2 py-1 bg-accent/10 text-accent rounded font-medium">
                            {profile.totalTaps} taps
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3 font-mono bg-muted p-2 rounded">
                          DID: {pendantDID.substring(0, 40)}...
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="text-muted-foreground">
                            Last seen: {formatTimestamp(profile.lastSeen)}
                          </div>
                          <div className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                            Auth: {profile.authSuccessRate}% success
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Behaviors: </span>
                          <span className="text-accent font-medium">{profile.behaviors.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-12 bg-card rounded-xl border border-border">
                    No pendant interactions recorded yet. Tap an ESP32 with a selected pendant to start tracking.
                  </div>
                )}
              </div>

              {/* Recent Interactions Log */}
              <div className="bg-muted rounded-lg p-6 border border-border">
                <h3 className="font-bold text-primary mb-4">Recent Interactions</h3>
                {esp32DeviceLogs[showPendantTracking]?.interactions?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {esp32DeviceLogs[showPendantTracking].interactions.slice(-10).reverse().map((interaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border text-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            interaction.authResult === 'success' ? 'bg-primary' : 'bg-destructive'
                          )}></div>
                          <div className="text-foreground font-mono text-xs">
                            {formatTimestamp(interaction.timestamp)}
                          </div>
                          <div className="text-foreground font-medium">
                            {interaction.pendantName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-accent bg-accent/10 px-2 py-1 rounded text-xs font-medium">
                            {interaction.behaviorExecuted}
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            interaction.authResult === 'success' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-destructive/10 text-destructive'
                          )}>
                            {interaction.authResult}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-8 bg-card rounded-xl border border-border">
                    No interactions logged yet
                  </div>
                )}
              </div>

              {/* Sync to Hub Option */}
              <div className="bg-muted rounded-lg p-6 border border-border">
                <h3 className="font-bold text-primary mb-4">Hub Sync</h3>
                <p className="text-muted-foreground text-sm mb-6">
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
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-minimal"
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
                    className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium shadow-minimal"
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

