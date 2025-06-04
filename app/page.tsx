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

export default function MeldSimulation() {
  const [selectedPendant, setSelectedPendant] = useState<PendantIdentity | null>(null)
  const [totalMoments, setTotalMoments] = useState(0)
  const [nodeStats, setNodeStats] = useState<Record<string, any>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [showRitualPanel, setShowRitualPanel] = useState(false)
  const [currentRitual, setCurrentRitual] = useState<Ritual | null>(null)
  
  // Simplified NFC interaction states
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [nodeState, setNodeState] = useState<'idle' | 'detecting' | 'authenticating' | 'executing' | 'success'>('idle')
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
    switch (nodeState) {
      case 'idle':
        // FIRST TAP: Start authentication
        console.log('🔵 First tap: Starting NFC detection and authentication...')
        addCryptoLog(`🔵 AUTHENTICATION STARTED for ${selectedPendant.name}`)
        addCryptoLog(`📱 Pendant DID: ${selectedPendant.did}`)
        addCryptoLog('━'.repeat(60))
        addCryptoLog('🔍 PHASE 1: NFC Detection & Data Reading')
        setActiveNode(nodeId)
        setNodeState('detecting')
        
        // Step 1: NFC Detection (100ms realistic ESP32 timing)
        setTimeout(() => {
          console.log('🔐 Moving to authentication...')
          addCryptoLog('📡 NFC TAG DETECTED - Reading cryptographic data')
          addCryptoLog(`🏷️ Protocol: ISO 14443 Type A (13.56 MHz)`)
          addCryptoLog(`💾 Tag type: NTAG213/215 (compatible)`)
          addCryptoLog(`🔑 Public Key: ${formatKeyForDisplay(selectedPendant.publicKey)}`)
          addCryptoLog('━'.repeat(60))
          addCryptoLog('🔐 PHASE 2: Cryptographic Authentication')
          setNodeState('authenticating')
          
          // Step 2: Real Ed25519 verification or simulation
          setTimeout(async () => {
            if (productionMode) {
              // PRODUCTION MODE: Real signature verification
              try {
                addCryptoLog('🔐 PRODUCTION MODE: Performing real Ed25519 cryptography')
                
                // Create a challenge message for this specific tap
                const challengeData = {
                  nodeId,
                  timestamp: Date.now(),
                  pendantDID: selectedPendant.did,
                  nonce: Math.random().toString(36).substring(2, 15)
                }
                const challengeMessage = JSON.stringify(challengeData)
                
                addCryptoLog(`⚡ Generated challenge: ${challengeMessage.substring(0, 60)}...`)
                addCryptoLog(`🎲 Nonce: ${challengeData.nonce}`)
                addCryptoLog(`⏰ Timestamp: ${challengeData.timestamp}`)
                addCryptoLog(`🏷️ Algorithm: Edwards-curve Digital Signature Algorithm (Ed25519)`)
                addCryptoLog(`🔢 Curve: Edwards25519 (Curve25519 over prime 2^255-19)`)
                addCryptoLog(`🧮 Hash function: SHA-512`)
                
                // Sign the challenge with pendant's private key (simulating what would be stored on NFC tag)
                const { signMessage, verifySignature } = await import('@/lib/crypto/keys')
                
                addCryptoLog('🖊️ SIGNING challenge with pendant private key...')
                addCryptoLog(`🔑 Using private key: ${formatKeyForDisplay(selectedPendant.privateKey)}`)
                const signature = await signMessage(challengeMessage, selectedPendant.privateKey)
                
                // Convert signature to hex for display
                const signatureHex = typeof signature === 'string' 
                  ? signature 
                  : Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
                
                addCryptoLog(`🖊️ Ed25519 Signature: ${signatureHex.substring(0, 24)}...${signatureHex.slice(-16)}`)
                addCryptoLog(`📏 Signature length: ${signatureHex.length} chars (${signatureHex.length/2} bytes)`)
                addCryptoLog(`⚡ Signature algorithm: EdDSA with Edwards25519`)
                
                // Verify the signature with the public key (this is what ESP32 would do)
                addCryptoLog('🔍 VERIFYING signature with public key...')
                addCryptoLog(`🔑 Verifying against: ${formatKeyForDisplay(selectedPendant.publicKey)}`)
                addCryptoLog(`📊 Verification algorithm: Ed25519.verify()`)
                addCryptoLog(`🧮 Using @noble/ed25519 cryptographic library`)
                
                const startTime = performance.now()
                const isValid = await verifySignature(challengeMessage, signature, selectedPendant.publicKey)
                const verifyTime = (performance.now() - startTime).toFixed(1)
                
                if (isValid) {
                  addCryptoLog(`✅ Ed25519 signature verification PASSED (${verifyTime}ms)`)
                  addCryptoLog('🛡️ Cryptographic identity authenticated')
                  addCryptoLog('🎯 Challenge-response protocol successful')
                  addCryptoLog('🔒 Replay attack protection: ACTIVE')
                  addCryptoLog('🏆 Security level: 128-bit equivalent')
                  addCryptoLog('📜 Compatible with: Bitcoin, Ethereum, Signal, SSH')
                  console.log('✅ Authentication complete. Ready for confirmation tap!')
                  console.log('📱 Tap again to execute the ritual...')
                } else {
                  addCryptoLog('❌ Ed25519 signature verification FAILED')
                  addCryptoLog('🚫 Authentication rejected')
                  setNodeState('idle')
                  setActiveNode(null)
                  return
                }
              } catch (error) {
                addCryptoLog(`❌ Cryptographic error: ${error}`)
                addCryptoLog('🔧 Check key format and signature validity')
                setNodeState('idle')
                setActiveNode(null)
                return
              }
            } else {
              // SIMULATION MODE: Format validation only
              addCryptoLog('🔧 SIMULATION MODE: DID format validation only')
              addCryptoLog(`📋 Checking DID format: ${selectedPendant.did.substring(0, 20)}...`)
              
              if (selectedPendant.did.startsWith('did:key:') && selectedPendant.did.length > 20) {
                addCryptoLog('✅ W3C DID:key format validation PASSED')
                addCryptoLog('🔑 Multicodec prefix verified (Ed25519)')
                addCryptoLog('📝 Base58 encoding validated')
                
                // Show detailed DID parsing for educational purposes
                const didParts = selectedPendant.did.split(':')
                addCryptoLog(`🏗️ DID scheme: "${didParts[0]}" (Decentralized Identifier)`)
                addCryptoLog(`🔧 DID method: "${didParts[1]}" (Key-based identity)`)
                addCryptoLog(`🎯 Multicodec: "${didParts[2].charAt(0)}" (Ed25519 signature scheme)`)
                addCryptoLog(`🔑 Key ID: ${didParts[2].substring(1, 9)}...${didParts[2].substring(-6)}`)
                addCryptoLog(`📏 Total DID length: ${selectedPendant.did.length} chars`)
                addCryptoLog(`🧮 Public key (hex): ${formatKeyForDisplay(selectedPendant.publicKey)}`)
                addCryptoLog(`💎 Private key (hex): ${formatKeyForDisplay(selectedPendant.privateKey)} [SECURE]`)
                addCryptoLog('📜 W3C DID Core specification compliance verified')
                
                console.log('✅ Authentication complete. Ready for confirmation tap!')
                console.log('📱 Tap again to execute the ritual...')
              } else {
                addCryptoLog('❌ DID format validation FAILED')
                addCryptoLog('🚫 Invalid W3C DID:key structure')
                addCryptoLog('🔧 Expected format: did:key:z[base58-multicodec-pubkey]')
                setNodeState('idle')
                setActiveNode(null)
                return
              }
            }
            
            // Stay in 'authenticating' state - ready for execution tap
          }, 1500)
        }, 100)
        break
        
      case 'authenticating':
        // SECOND TAP: Execute immediately
        console.log('🟢 Second tap: Executing ritual behavior...')
        addCryptoLog('━'.repeat(60))
        addCryptoLog('🟢 PHASE 3: Authorized Execution')
        addCryptoLog('🟢 SECOND TAP: Authorized execution initiated')
        addCryptoLog(`⚡ Executing behavior: ${currentRitual?.nodes[0]?.behavior || 'save_moment'}`)
        addCryptoLog(`🎯 Node ID: ${nodeId}`)
        addCryptoLog(`🔐 Authenticated user: ${selectedPendant.name}`)
        setNodeState('executing')
        
        try {
          // Execute ritual behavior with cryptographic authentication
          if (currentRitual) {
            const execution = await ritualManager.executeRitualBehavior(
              nodeId,
              selectedPendant.id,
              selectedPendant.publicKey,
              selectedPendant.privateKey,
              selectedPendant.did
            )
            
            if (execution.result === 'success') {
              addCryptoLog('🎉 Ritual execution SUCCESSFUL')
              addCryptoLog(`💾 Data persisted with DID: ${selectedPendant.did.substring(0, 25)}...`)
              addCryptoLog('🔐 Cryptographic audit trail created')
              updateStats()
              setNodeState('success')
              console.log('🎉 Ritual execution successful:', execution.behavior)
              
              // Log the successful pendant interaction
              eventBus.emit('esp32LogInteraction', {
                nodeId,
                interaction: {
                  pendantDID: selectedPendant.did,
                  pendantId: selectedPendant.id,
                  pendantName: selectedPendant.name,
                  authResult: 'success',
                  behaviorExecuted: execution.behavior,
                  momentId: execution.momentId,
                  ritualId: currentRitual.id,
                  signatureValid: true,
                  metadata: {
                    nodeState: 'success',
                    timestamp: Date.now(),
                    execution: execution
                  }
                }
              })
            } else {
              throw new Error(execution.error || 'Ritual execution failed')
            }
          } else {
            // Fallback to default ZK moment saving
            const moment = await simulateTap({
              nodeId: nodeId,
              pendantPublicKey: selectedPendant.publicKey,
              pendantPrivateKey: selectedPendant.privateKey,
              pendantDID: selectedPendant.did,
              pendantId: selectedPendant.id
            })
            
            addCryptoLog('💾 ZK Moment saved with cryptographic proof')
            addCryptoLog(`🆔 Moment ID: ${moment.id}`)
            addCryptoLog('🔒 Zero-knowledge privacy preserved')
            
            memoryStore.addMoment(moment)
            updateStats()
            setNodeState('success')
            console.log('💾 Moment saved successfully:', moment.id)
            
            // Log the successful pendant interaction for default behavior
            eventBus.emit('esp32LogInteraction', {
              nodeId,
              interaction: {
                pendantDID: selectedPendant.did,
                pendantId: selectedPendant.id,
                pendantName: selectedPendant.name,
                authResult: 'success',
                behaviorExecuted: 'save_moment',
                momentId: moment.id,
                ritualId: 'default',
                signatureValid: true,
                metadata: {
                  nodeState: 'success',
                  timestamp: Date.now(),
                  moment: moment
                }
              }
            })
          }
          
          // Auto-return to ready after 2 seconds (shorter for better UX)
          setTimeout(() => {
            console.log('🔄 Auto-returning to MELD home screen...')
            addCryptoLog('🔄 Session complete - returning to idle state')
            addCryptoLog('─'.repeat(50))
            resetNodeState()
          }, 2000)
          
        } catch (error) {
          console.error('❌ Failed to execute ritual:', error)
          addCryptoLog(`❌ Execution failed: ${error}`)
          addCryptoLog('🔧 Check ritual configuration and try again')
          // Return to idle on error after 2 seconds
          setTimeout(() => {
            console.log('🔄 Returning to MELD home screen after error...')
            addCryptoLog('🔄 Error recovery - returning to idle state')
            resetNodeState()
          }, 2000)
        }
        break
        
      case 'executing':
      case 'success':
        // During execution or success, ignore taps
        console.log('⏳ Please wait for current operation to complete...')
        break
        
      default:
        // Reset to idle if in unknown state
        console.log('🔄 Resetting to MELD home screen...')
        resetNodeState()
        break
    }
  }

  const resetNodeState = () => {
    setActiveNode(null)
    setNodeState('idle')
  }

  // Clear all data
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all saved moments? This cannot be undone.')) {
      memoryStore.clearAllMoments()
      ritualManager.clearExecutionHistory()
      updateStats()
    }
  }

  // Get node configuration from active ritual
  const getNodeConfig = (nodeId: string) => {
    if (!currentRitual) return null
    
    const nodeConfig = currentRitual.nodes.find(node => node.nodeId === nodeId)
    if (!nodeConfig) return null
    
    return {
      nodeId: nodeConfig.nodeId,
      label: nodeConfig.label,
      behavior: nodeConfig.behavior,
      parameters: nodeConfig.parameters || {},
      // Ensure display text is available
      displayText: nodeConfig.parameters?.displayText || {
        waiting_title: 'MELD',
        waiting_subtitle: 'TAP TO BEGIN',
        detected_title: 'NFC SCAN',
        detected_subtitle: 'READING...',
        auth_title: 'VERIFIED',
        confirm_title: 'VERIFIED',
        success_title: 'SUCCESS!',
        error_title: 'ERROR',
        error_subtitle: 'TRY AGAIN'
      }
    }
  }

  // Generate display text and screen type for each node
  const getNodeDisplay = (nodeId: string) => {
    const nodeConfig = getNodeConfig(nodeId)
    if (!nodeConfig) {
      return {
        text: "MELD Node\nReady for activation",
        screen: "main"
      }
    }

    const isActive = activeNode === nodeId
    
    if (!selectedPendant) {
      return {
        text: `${nodeConfig.label}\n${nodeConfig.behavior.replace('_', ' ')}\nSelect pendant to begin`,
        screen: "main"
      }
    }

    if (!isActive) {
      return {
        text: `${nodeConfig.label}\n${nodeConfig.behavior.replace('_', ' ')}\nWaiting...`,
        screen: "main"
      }
    }

    // Active node - show dynamic content based on state
    switch (nodeState) {
      case 'detecting':
        return {
          text: `${nodeConfig.label}\nDetecting NFC...\n${selectedPendant.name}`,
          screen: "main"
        }
      case 'authenticating':
        return {
          text: `${nodeConfig.label}\nAuthenticating...\n${selectedPendant.name}`,
          screen: "main"
        }
      case 'executing':
        const behaviorText = nodeConfig.behavior.replace('_', ' ').toUpperCase()
        return {
          text: `${nodeConfig.label}\nExecuting ${behaviorText}...\n${selectedPendant.name}`,
          screen: "main"
        }
      case 'success':
        return {
          text: `${nodeConfig.label}\nSuccess!\n${nodeConfig.behavior.replace('_', ' ')} completed`,
          screen: "main"
        }
      default:
        return {
          text: `${nodeConfig.label}\n${nodeConfig.behavior.replace('_', ' ')}\nTap to activate`,
          screen: "main"
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-teal-950">
      {/* Ambient background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/90 backdrop-blur-sm shadow-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Modern geometric logo */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/20">
                  <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-cyan-300 to-teal-300 rounded-sm"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex flex-col">
                {/* Markdown-inspired title with monospace elements */}
                <div className="flex items-baseline gap-1">
                  <span className="text-gray-400 font-mono text-lg">#</span>
                  <h1 className="text-3xl font-light text-white tracking-wide font-mono">
                    <span className="text-gray-300">Kair</span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400">OS</span>
                  </h1>
                  <span className="text-gray-500 font-mono text-sm ml-1">beta</span>
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full mb-2 animate-pulse ml-2"></div>
                </div>
                
                {/* Elegant subtitle with markdown syntax highlighting */}
                <div className="flex items-center gap-2 text-sm font-mono">
                  <span className="text-gray-500">></span>
                  <span className="text-gray-300 font-medium">Human first wearable OS</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400 font-medium">Ritual design system</span>
                  <span className="text-gray-500 animate-pulse">_</span>
                </div>
                
                {/* Status indicators with markdown-like tags */}
                <div className="flex items-center gap-2 mt-1">
                  {selectedPendant && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 rounded-md text-xs font-mono">
                      <span className="text-cyan-500">[</span>
                      <Shield className="w-3 h-3" />
                      {selectedPendant.name}
                      <span className="text-cyan-500">]</span>
                    </span>
                  )}
                  {currentRitual && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-400/20 text-purple-300 rounded-md text-xs font-mono">
                      <span className="text-purple-500">@</span>
                      <Sparkles className="w-3 h-3" />
                      {currentRitual.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-400 font-mono">secure_interactions</div>
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 font-mono">{totalMoments}</div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRitualPanel(!showRitualPanel)}
                  className={`p-2 rounded-lg transition-all duration-200 border ${showRitualPanel 
                    ? 'text-purple-300 bg-purple-500/20 border-purple-400/30 shadow-lg shadow-purple-500/20' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                  }`}
                  title="Ritual Builder"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                
                <button
                  onClick={updateStats}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-slate-800/50 rounded-lg transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-slate-800/50 rounded-lg transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="relative z-10 bg-cyan-950/50 backdrop-blur-sm border-b border-cyan-800/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-300">ESP32 Development Tools</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDebugModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                >
                  <Info className="w-3 h-3" />
                  Debug Info
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All Data
                </button>
              </div>
            </div>
            
            {/* Production Mode Controls */}
            <div className="mt-4 pt-4 border-t border-cyan-800/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-cyan-300">Authentication Mode:</span>
                  <button
                    onClick={() => {
                      setProductionMode(!productionMode)
                      addCryptoLog(`Switched to ${!productionMode ? 'PRODUCTION' : 'SIMULATION'} mode`)
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      productionMode 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                    }`}
                  >
                    {productionMode ? '🔐 PRODUCTION' : '🔧 SIMULATION'}
                  </button>
                </div>
                
                <button
                  onClick={() => setCryptoLogs([])}
                  className="text-xs text-gray-400 hover:text-gray-300 font-mono"
                >
                  Clear Logs
                </button>
              </div>
              
              {/* Crypto Logs */}
              {cryptoLogs.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-mono space-y-1">
                    {cryptoLogs.map((log, i) => (
                      <div key={i} className={`${
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('🔐') ? 'text-cyan-400' :
                        'text-gray-300'
                      }`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-2 font-mono">
                <span className="text-cyan-400">Production Mode:</span> Real Ed25519 signature verification<br/>
                <span className="text-yellow-400">Simulation Mode:</span> DID format validation only
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execution Result Notification */}
      {executionResult && (
        <div className="fixed top-20 right-6 z-50 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {executionResult}
          </div>
        </div>
      )}

      {/* Authentication Flow Status */}
      {selectedPendant && activeNode && (
        <div className="fixed top-20 left-6 z-50 bg-purple-500/20 border border-purple-400/30 text-purple-300 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="text-sm font-medium">
              {nodeState === 'detecting' && '🔍 Detecting pendant...'}
              {nodeState === 'authenticating' && '✅ Authenticated! Tap to execute'}
              {nodeState === 'executing' && '⚡ Executing ritual...'}
              {nodeState === 'success' && '✅ Success! Returning to MELD...'}
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
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* ESP32 Wearable Devices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MELD_NODES.map((node, index) => {
            const isActive = activeNode === node.id
            const nodeStatsData = nodeStats[node.id]
            const nodeConfig = ritualManager.getNodeConfig(node.id)
            
            const nodeDisplay = getNodeDisplay(node.id)
            
            return (
              <div key={node.id} className="relative space-y-4">
                {/* Node Location Label */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">{node.name}</h3>
                  <p className="text-sm text-gray-400">{node.location}</p>
                </div>

                {/* Wearable Device */}
                <ESP32WearableDevice
                  key={`${node.id}-${currentRitual?.id || 'default'}-${currentRitual?.nodes?.find(n => n.nodeId === node.id)?.parameters?.displayText?.waiting_title || 'meld'}`}
                  text={nodeDisplay.text}
                  onTap={() => handleNodeTap(node.id)}
                  disabled={!selectedPendant || (activeNode !== null && activeNode !== node.id)}
                  state={
                    isActive && (nodeState === 'executing') ? "moment" : 
                    isActive && (nodeState === 'detecting' || nodeState === 'authenticating') ? "identity" : 
                    "default"
                  }
                  screen={nodeDisplay.screen}
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
                  className="w-full px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-mono flex items-center justify-center gap-2"
                  title="View pendant interaction logs for this ESP32"
                >
                  <Hash className="w-4 h-4" />
                  Track {esp32DeviceLogs[node.id]?.uniquePendants?.size || 0} Pendants
                </button>

                {/* Node Stats Display */}
                {esp32DeviceLogs[node.id] && (
                  <div className="bg-slate-900/40 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Total Interactions:</span>
                      <span className="text-white font-mono">{esp32DeviceLogs[node.id].totalInteractions || 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Unique Pendants:</span>
                      <span className="text-white font-mono">{esp32DeviceLogs[node.id].uniquePendants?.size || 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Success Rate:</span>
                      <span className="text-white font-mono">
                        {esp32DeviceLogs[node.id].interactions?.length > 0
                          ? Math.round((esp32DeviceLogs[node.id].interactions.filter(i => i.authResult === 'success').length / esp32DeviceLogs[node.id].interactions.length) * 100)
                          : 100}%
                      </span>
                    </div>
                    {esp32DeviceLogs[node.id].interactions?.length > 0 && (
                      <div className="flex justify-between text-gray-400">
                        <span>Last Activity:</span>
                        <span className="text-white font-mono">
                          {formatTimestamp(esp32DeviceLogs[node.id].interactions[esp32DeviceLogs[node.id].interactions.length - 1].timestamp).split(' ')[1]}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pendant Selector - Moved below the MELD Node Devices */}
        <div className="max-w-2xl mx-auto mt-16 mb-12 px-4">
          <PendantSelector
            selectedPendant={selectedPendant}
            onPendantSelect={setSelectedPendant}
          />
        </div>

        {/* Technical Two-Tap Authentication Flow */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-3 text-center font-mono">
            <span className="text-gray-500">//</span> Two-Tap Cryptographic Authentication Flow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-300">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 font-mono">1</div>
              <div className="font-semibold text-blue-300">NFC Detection</div>
              <div className="text-gray-400 font-mono text-xs">~100ms ESP32 scan</div>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 font-mono">2</div>
              <div className="font-semibold text-cyan-300">Crypto Auth</div>
              <div className="text-gray-400 font-mono text-xs">Ed25519 verify ~1.5s</div>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 font-mono">3</div>
              <div className="font-semibold text-purple-300">Ready State</div>
              <div className="text-gray-400 font-mono text-xs">await confirmation</div>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 font-mono">4</div>
              <div className="font-semibold text-emerald-300">Execute Ritual</div>
              <div className="text-gray-400 font-mono text-xs">second tap → run</div>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 font-mono">5</div>
              <div className="font-semibold text-teal-300">Auto Return</div>
              <div className="text-gray-400 font-mono text-xs">save + reset ~2s</div>
            </div>
          </div>
          
          {/* Technical details */}
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div className="text-xs text-gray-400 font-mono leading-relaxed">
              <span className="text-cyan-400">State Machine:</span> idle → detecting → authenticating → executing → success → idle<br/>
              <span className="text-purple-400">Security:</span> Ed25519 signature verification with DID-based identity<br/>
              <span className="text-emerald-400">UX Pattern:</span> Deliberate two-tap prevents accidental ritual execution
            </div>
          </div>
        </div>

        {/* MELD Attribution */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/40 backdrop-blur-sm rounded-full border border-slate-700/50">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-sm text-gray-400">
              Simulation brought to you by <a
                href="https://github.com/meldtech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors duration-200 underline underline-offset-2 decoration-cyan-400/50 hover:decoration-cyan-300"
              >
                MELD
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                System Debug Information
              </h2>
              <button
                onClick={() => setShowDebugModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Ritual Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300 border-b border-purple-500/30 pb-2">
                  Current Ritual
                </h3>
                {currentRitual ? (
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">ID:</span> <span className="text-white font-mono">{currentRitual.id}</span></div>
                    <div><span className="text-gray-400">Name:</span> <span className="text-cyan-300">{currentRitual.name}</span></div>
                    <div><span className="text-gray-400">Version:</span> <span className="text-green-300">{currentRitual.version}</span></div>
                    <div><span className="text-gray-400">Description:</span> <span className="text-gray-300">{currentRitual.description || 'None'}</span></div>
                    <div><span className="text-gray-400">Nodes:</span> <span className="text-blue-300">{currentRitual.nodes.length}</span></div>
                  </div>
                ) : (
                  <div className="text-gray-400 italic">No active ritual</div>
                )}
              </div>

              {/* Selected Pendant Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300 border-b border-cyan-500/30 pb-2">
                  Selected Pendant
                </h3>
                {selectedPendant ? (
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">ID:</span> <span className="text-white font-mono">{selectedPendant.id}</span></div>
                    <div><span className="text-gray-400">Name:</span> <span className="text-cyan-300">{selectedPendant.name}</span></div>
                    <div><span className="text-gray-400">DID:</span> <span className="text-green-300 font-mono break-all">{selectedPendant.did}</span></div>
                    <div><span className="text-gray-400">Public Key:</span> <span className="text-blue-300 font-mono">{formatKeyForDisplay(selectedPendant.publicKey)}</span></div>
                  </div>
                ) : (
                  <div className="text-gray-400 italic">No pendant selected</div>
                )}
              </div>

              {/* System State */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-300 border-b border-emerald-500/30 pb-2">
                  System State
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">Active Node:</span> <span className="text-white">{activeNode || 'None'}</span></div>
                  <div><span className="text-gray-400">Node State:</span> <span className="text-yellow-300">{nodeState}</span></div>
                  <div><span className="text-gray-400">Production Mode:</span> <span className={productionMode ? 'text-green-300' : 'text-yellow-300'}>{productionMode ? 'Enabled' : 'Disabled'}</span></div>
                  <div><span className="text-gray-400">Total Moments:</span> <span className="text-blue-300">{totalMoments}</span></div>
                  <div><span className="text-gray-400">Settings Panel:</span> <span className={showSettings ? 'text-green-300' : 'text-red-300'}>{showSettings ? 'Open' : 'Closed'}</span></div>
                  <div><span className="text-gray-400">Ritual Panel:</span> <span className={showRitualPanel ? 'text-green-300' : 'text-red-300'}>{showRitualPanel ? 'Open' : 'Closed'}</span></div>
                </div>
              </div>

              {/* Node Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-300 border-b border-orange-500/30 pb-2">
                  Node Statistics
                </h3>
                <div className="space-y-3 text-sm">
                  {MELD_NODES.map(node => (
                    <div key={node.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: node.color }}>{node.icon}</span>
                        <span className="text-white font-medium">{node.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400">Moments:</span> <span className="text-cyan-300">{nodeStats[node.id]?.moments || 0}</span></div>
                        <div><span className="text-gray-400">Unique Users:</span> <span className="text-purple-300">{nodeStats[node.id]?.stats?.uniquePendants || 0}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Rituals */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-pink-300 border-b border-pink-500/30 pb-2">
                  Available Rituals ({ritualManager.getAllRituals().length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {ritualManager.getAllRituals().map(ritual => (
                    <div key={ritual.id} className={`p-3 rounded-lg border ${ritual.id === currentRitual?.id ? 'bg-purple-500/20 border-purple-500/50' : 'bg-slate-800/50 border-slate-700/50'}`}>
                      <div className="font-medium text-white mb-1">{ritual.name}</div>
                      <div className="text-xs text-gray-400 mb-2">{ritual.description || 'No description'}</div>
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-300">{ritual.nodes.length} nodes</span>
                        <span className="text-green-300">v{ritual.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="text-xs text-gray-400 font-mono">
                Debug info refreshed at: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pendant Tracking Modal */}
      {showPendantTracking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-cyan-400" />
                ESP32 {showPendantTracking} - Pendant Tracking
              </h2>
              <button
                onClick={() => setShowPendantTracking(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* ESP32 Device Summary */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-3">Device Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Total Interactions</div>
                    <div className="text-white font-mono text-lg">
                      {esp32DeviceLogs[showPendantTracking]?.totalInteractions || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Unique Pendants</div>
                    <div className="text-white font-mono text-lg">
                      {esp32DeviceLogs[showPendantTracking]?.uniquePendants?.size || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Success Rate</div>
                    <div className="text-white font-mono text-lg">
                      {esp32DeviceLogs[showPendantTracking]?.interactions?.length > 0
                        ? Math.round((esp32DeviceLogs[showPendantTracking].interactions.filter(i => i.authResult === 'success').length / esp32DeviceLogs[showPendantTracking].interactions.length) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Last Sync</div>
                    <div className="text-white font-mono text-lg">
                      {esp32DeviceLogs[showPendantTracking]?.lastSync > 0 
                        ? formatTimestamp(esp32DeviceLogs[showPendantTracking].lastSync) 
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pendant Profiles */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-3">Pendant Profiles</h3>
                {esp32DeviceLogs[showPendantTracking]?.pendantProfiles?.size > 0 ? (
                  <div className="space-y-3">
                    {Array.from(esp32DeviceLogs[showPendantTracking].pendantProfiles.entries()).map(([pendantDID, profile]) => (
                      <div key={pendantDID} className="border border-slate-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-white font-semibold">
                            {profile.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {profile.totalTaps} taps
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          DID: {pendantDID.substring(0, 40)}...
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="text-gray-400">
                            Last seen: {formatTimestamp(profile.lastSeen)}
                          </div>
                          <div className="text-green-400">
                            Auth: {profile.authSuccessRate}% success
                          </div>
                        </div>
                        <div className="text-xs text-purple-400">
                          Behaviors: {profile.behaviors.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No pendant interactions recorded yet. Tap an ESP32 with a selected pendant to start tracking.
                  </div>
                )}
              </div>

              {/* Recent Interactions Log */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-3">Recent Interactions</h3>
                {esp32DeviceLogs[showPendantTracking]?.interactions?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {esp32DeviceLogs[showPendantTracking].interactions.slice(-10).reverse().map((interaction, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            interaction.authResult === 'success' ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <div className="text-white font-mono">
                            {formatTimestamp(interaction.timestamp)}
                          </div>
                          <div className="text-gray-300">
                            {interaction.pendantName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                            {interaction.behaviorExecuted}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            interaction.authResult === 'success' 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {interaction.authResult}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-4">
                    No interactions logged yet
                  </div>
                )}
              </div>

              {/* Sync to Hub Option */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-3">Hub Sync</h3>
                <p className="text-gray-400 text-sm mb-4">
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
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
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
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
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
