// --- ESP32 MELD Node Simulator ---
// Runs the exact same C++ code as real ESP32 hardware
// Ensures bit-exact behavior between browser and deployed devices

"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import CanvasPanel, { DisplayFramebuffer } from './CanvasPanel'
import { Ritual } from '@/lib/ritual/types'

interface ESP32SimulatorProps {
  ritual?: Ritual | null
  nodeId?: string
  className?: string
  onDebugMessage?: (message: string) => void
  onNFCData?: (data: string) => void
}

interface SimulatorState {
  isRunning: boolean
  nfcData: string
  buzzerActive: boolean
  wasmError: string | null
}

export default function ESP32Simulator({
  ritual,
  nodeId = 'simulator-node',
  className = '',
  onDebugMessage,
  onNFCData
}: ESP32SimulatorProps) {
  const [state, setState] = useState<SimulatorState>({
    isRunning: false,
    nfcData: '',
    buzzerActive: false,
    wasmError: null
  })
  
  const wasmModuleRef = useRef<any>(null)
  const framebufferRef = useRef<DisplayFramebuffer>(new DisplayFramebuffer())
  const animationFrameRef = useRef<number>()

  /**
   * Load WebAssembly module
   */
  const loadWasm = useCallback(async () => {
    try {
      console.log("🚀 Loading MELD Node WebAssembly...")
      
      // Dynamic import of the generated WebAssembly module
      const MELDNodeWASM = await import('/meld-node.js')
      
      const wasmModule = await MELDNodeWASM.default({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return '/meld-node.wasm'
          }
          if (path.endsWith('.worker.js')) {
            return '/meld-node.worker.js'
          }
          return path
        }
      })

      wasmModuleRef.current = wasmModule
      
      // Set up the bridge
      if (window.MELDNodeBridge) {
        window.MELDNodeBridge.setDisplayFramebuffer(framebufferRef.current)
        
        window.MELDNodeBridge.setBuzzerCallback((active: boolean) => {
          setState(prev => ({ ...prev, buzzerActive: active }))
        })
        
        window.MELDNodeBridge.setDebugCallback((message: string) => {
          setState(prev => ({
            ...prev,
            debugMessages: [...prev.debugMessages.slice(-19), message] // Keep last 20 messages
          }))
          onDebugMessage?.(message)
        })
      }

      // Setup WASM callbacks for hardware simulation
      window.MELDNodeBridge = {
        ...window.MELDNodeBridge,
        setBuzzerCallback: (active: boolean) => {
          setState(prev => ({ ...prev, buzzerActive: active }))
        }
      }

      // Initialize WASM module
      window.Module = {
        onRuntimeInitialized: () => {
          console.log("✅ WASM Runtime initialized successfully")
          setState(prev => ({ ...prev, isRunning: true }))
        }
      }

      setState(prev => ({ ...prev, wasmLoaded: true, wasmError: null }))
      console.log("✅ WebAssembly loaded successfully")
      
    } catch (error) {
      console.error("❌ Failed to load WebAssembly:", error)
      setState(prev => ({ 
        ...prev, 
        wasmError: error instanceof Error ? error.message : 'Unknown error' 
      }))
    }
  }, [onDebugMessage])

  /**
   * Start the ESP32 simulation
   */
  const startSimulation = useCallback(() => {
    if (!wasmModuleRef.current || state.isRunning) return

    try {
      // Initialize the firmware
      wasmModuleRef.current._wasm_setup()
      setState(prev => ({ ...prev, isRunning: true }))
      
      // Start the main loop
      const runLoop = () => {
        if (wasmModuleRef.current && state.isRunning) {
          try {
            wasmModuleRef.current._wasm_loop()
          } catch (error) {
            console.error("WASM loop error:", error)
          }
        }
        animationFrameRef.current = requestAnimationFrame(runLoop)
      }
      
      runLoop()
      console.log("🎮 ESP32 simulation started")
      
    } catch (error) {
      console.error("Failed to start simulation:", error)
      setState(prev => ({ 
        ...prev, 
        wasmError: error instanceof Error ? error.message : 'Simulation start failed' 
      }))
    }
  }, [state.isRunning])

  /**
   * Stop the ESP32 simulation
   */
  const stopSimulation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setState(prev => ({ ...prev, isRunning: false }))
    console.log("⏹️ ESP32 simulation stopped")
  }, [])

  /**
   * Update ritual configuration in WebAssembly
   */
  const updateRitualConfig = useCallback(() => {
    if (!window.MELDNodeBridge || !ritual || !state.wasmLoaded) return

    const nodeConfig = ritual.nodes.find(n => n.nodeId === nodeId)
    if (!nodeConfig) return

    // Map behavior enum values
    const behaviorMap: Record<string, number> = {
      'save_moment': 0,
      'send_tip': 1,
      'vote_option_a': 2,
      'vote_option_b': 3,
      'unlock_content': 4,
      'trigger_light': 5,
      'play_sound': 6,
      'increment_counter': 7,
      'custom': 8
    }

    const behavior = behaviorMap[nodeConfig.behavior] ?? 0
    const tipAmount = nodeConfig.parameters?.tipAmount ?? 5.0
    const voteOption = nodeConfig.parameters?.voteOption ?? ''
    const counterName = nodeConfig.parameters?.counterName ?? 'default_counter'
    const lightPattern = nodeConfig.parameters?.lightPattern ?? 'rainbow'

    window.MELDNodeBridge.setRitualConfig(
      nodeConfig.nodeId,
      nodeConfig.label,
      behavior,
      tipAmount,
      voteOption,
      counterName,
      lightPattern
    )

    console.log("🔧 Ritual config updated:", nodeConfig.label)
  }, [ritual, nodeId, state.wasmLoaded])

  /**
   * Handle touch events from canvas
   */
  const handleTouch = useCallback((x: number, y: number, type: 'down' | 'move' | 'up') => {
    if (!window.MELDNodeBridge || !state.isRunning) return

    const touchType = type === 'down' ? 0 : type === 'move' ? 1 : 2
    window.MELDNodeBridge.sendTouchEvent(x, y, touchType)
  }, [state.isRunning])

  /**
   * Simulate NFC tag tap
   */
  const simulateNFCTap = useCallback((uid: string, ndef?: string) => {
    if (!window.MELDNodeBridge || !state.isRunning) return

    // Convert hex UID to bytes
    const uidBytes = uid.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    const ndefBytes = ndef ? new TextEncoder().encode(ndef) : new Uint8Array(0)

    window.MELDNodeBridge.sendNFCTag(uidBytes, ndefBytes)
    
    // Auto-remove tag after 3 seconds
    setTimeout(() => {
      window.MELDNodeBridge?.removeNFCTag()
    }, 3000)
  }, [state.isRunning])

  // Load WebAssembly on mount
  useEffect(() => {
    loadWasm()
    
    return () => {
      stopSimulation()
    }
  }, [loadWasm, stopSimulation])

  // Update ritual config when it changes
  useEffect(() => {
    updateRitualConfig()
  }, [updateRitualConfig])

  // Auto-start simulation when WASM loads
  useEffect(() => {
    if (state.wasmLoaded && !state.isRunning && !state.wasmError) {
      startSimulation()
    }
  }, [state.wasmLoaded, state.isRunning, state.wasmError, startSimulation])

  if (state.wasmError) {
    return (
      <div className={`p-6 border-2 border-red-300 rounded-xl bg-red-50 ${className}`}>
        <h3 className="font-bold text-red-900 mb-2">⚠️ WebAssembly Error</h3>
        <p className="text-sm text-red-800">{state.wasmError}</p>
        <button
          onClick={loadWasm}
          className="mt-3 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!state.wasmLoaded) {
    return (
      <div className={`p-6 border-2 border-blue-300 rounded-xl bg-blue-50 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium text-blue-900">Loading ESP32 WebAssembly...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Display */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">ESP32-S3 Display</h3>
          <div className="flex items-center gap-3">
            {/* Hardware Status */}
            <div className="flex gap-4 mb-4">
              {/* Buzzer Indicator */}
              <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                <div 
                  className={`w-3 h-3 rounded-full transition-colors ${state.buzzerActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}
                />
                <span className="text-xs text-gray-300">BUZZER</span>
              </div>
            </div>
          </div>
        </div>
        
        <CanvasPanel
          width={296}
          height={296}
          scale={2}
          onTouch={handleTouch}
          className="mx-auto"
        />
      </div>

      {/* Control Panel */}
      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
        <h4 className="font-bold text-base text-gray-900 mb-3">Simulation Controls</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => simulateNFCTap('04A1B2C3')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            disabled={!state.isRunning}
          >
            📱 Test NFC Tag
          </button>
          
          <button
            onClick={() => simulateNFCTap('04D1E2F3', 'CMD:INVERT')}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            disabled={!state.isRunning}
          >
            🔄 Invert Command
          </button>
          
          <button
            onClick={state.isRunning ? stopSimulation : startSimulation}
            className={`px-3 py-2 rounded-lg text-sm ${
              state.isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {state.isRunning ? '⏹️ Stop' : '▶️ Start'}
          </button>
          
          <button
            onClick={loadWasm}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            🔄 Reload
          </button>
        </div>
      </div>

      {/* Debug Console */}
      {state.debugMessages.length > 0 && (
        <div className="bg-black rounded-xl border-2 border-gray-200 p-4">
          <h4 className="font-bold text-base text-green-400 mb-3">Debug Console</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-xs">
            {state.debugMessages.map((message, index) => (
              <div key={index} className="text-green-300">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 