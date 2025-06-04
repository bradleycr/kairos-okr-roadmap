// --- Ritual Manager ---
// Manages ritual configurations and execution
// Integrates with existing MELD Node simulation architecture

import { Ritual, RitualNodeConfig, RitualExecution, NodeBehavior } from './types'
import { MELD_NODES, simulateTap, eventBus, TapMoment } from '@/lib/hal/simulateTap'
import { memoryStore } from '@/lib/moment/memoryStore'

// --- Storage Keys ---
const STORAGE_KEYS = {
  RITUALS: 'meld_rituals',
  ACTIVE_RITUAL: 'meld_active_ritual',
  EXECUTIONS: 'meld_ritual_executions'
}

// --- In-Memory Store ---
let ritualStore: {
  rituals: Ritual[]
  activeRitual: Ritual | null
  executions: RitualExecution[]
} = {
  rituals: [],
  activeRitual: null,
  executions: []
}

// --- Default Ritual Templates ---
const DEFAULT_RITUALS: Ritual[] = [
  {
    id: 'default-moments',
    name: 'Basic Moment Collection',
    description: 'Save cryptographic moments at each node',
    createdAt: Date.now(),
    version: '1.0.0',
    nodes: [
      {
        nodeId: 'dj-node',
        label: 'DJ Moment',
        behavior: 'save_moment'
      },
      {
        nodeId: 'vj-node', 
        label: 'VJ Moment',
        behavior: 'save_moment'
      },
      {
        nodeId: 'bar-node',
        label: 'Bar Moment', 
        behavior: 'save_moment'
      }
    ]
  },
  {
    id: 'voting-ritual',
    name: 'Community Voting',
    description: 'Vote on community decisions at different stations',
    createdAt: Date.now(),
    version: '1.0.0',
    nodes: [
      {
        nodeId: 'dj-node',
        label: 'Vote: Set A',
        behavior: 'vote_option_a',
        parameters: { voteOption: 'Set A: Electronic' }
      },
      {
        nodeId: 'vj-node',
        label: 'Vote: Set B', 
        behavior: 'vote_option_b',
        parameters: { voteOption: 'Set B: Ambient' }
      },
      {
        nodeId: 'bar-node',
        label: 'Abstain',
        behavior: 'increment_counter',
        parameters: { counterName: 'abstain_votes' }
      }
    ]
  },
  {
    id: 'tip-performers',
    name: 'Tip the Performers',
    description: 'Send tips to DJs and VJs via NFC tap',
    createdAt: Date.now(),
    version: '1.0.0',
    nodes: [
      {
        nodeId: 'dj-node',
        label: 'Tip DJ',
        behavior: 'send_tip',
        parameters: { tipAmount: 5, recipient: 'dj_wallet' }
      },
      {
        nodeId: 'vj-node',
        label: 'Tip VJ',
        behavior: 'send_tip', 
        parameters: { tipAmount: 5, recipient: 'vj_wallet' }
      },
      {
        nodeId: 'bar-node',
        label: 'Save Memory',
        behavior: 'save_moment'
      }
    ]
  }
]

// --- Storage Functions ---

function loadFromStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Load rituals
    const ritualsData = localStorage.getItem(STORAGE_KEYS.RITUALS)
    if (ritualsData) {
      ritualStore.rituals = JSON.parse(ritualsData)
    } else {
      // Initialize with defaults
      ritualStore.rituals = [...DEFAULT_RITUALS]
      saveToStorage()
    }

    // Load active ritual
    const activeRitualData = localStorage.getItem(STORAGE_KEYS.ACTIVE_RITUAL)
    if (activeRitualData) {
      ritualStore.activeRitual = JSON.parse(activeRitualData)
    }

    // Load executions
    const executionsData = localStorage.getItem(STORAGE_KEYS.EXECUTIONS)
    if (executionsData) {
      ritualStore.executions = JSON.parse(executionsData)
    }
  } catch (error) {
    console.warn('Failed to load ritual data:', error)
    // Initialize with defaults on error
    ritualStore.rituals = [...DEFAULT_RITUALS]
  }
}

function saveToStorage(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.RITUALS, JSON.stringify(ritualStore.rituals))
    localStorage.setItem(STORAGE_KEYS.ACTIVE_RITUAL, JSON.stringify(ritualStore.activeRitual))
    localStorage.setItem(STORAGE_KEYS.EXECUTIONS, JSON.stringify(ritualStore.executions))
  } catch (error) {
    console.warn('Failed to save ritual data:', error)
  }
}

// --- Ritual Management Functions ---

/**
 * Initialize the ritual manager
 */
export function initializeRitualManager(): void {
  loadFromStorage()
  
  // Set default ritual if none active
  if (!ritualStore.activeRitual && ritualStore.rituals.length > 0) {
    ritualStore.activeRitual = ritualStore.rituals[0]
    saveToStorage()
    console.log('🎭 Activated default ritual:', ritualStore.activeRitual.name)
  }
  
  // If still no rituals (edge case), create default ones
  if (ritualStore.rituals.length === 0) {
    console.log('🎭 No rituals found, initializing defaults...')
    ritualStore.rituals = [...DEFAULT_RITUALS]
    ritualStore.activeRitual = ritualStore.rituals[0]
    saveToStorage()
    console.log('🎭 Created and activated default ritual:', ritualStore.activeRitual.name)
  }
  
  // Debug log the active ritual and its nodes
  if (ritualStore.activeRitual) {
    console.log('🎭 Active ritual:', ritualStore.activeRitual.name)
    console.log('🎭 Configured nodes:', ritualStore.activeRitual.nodes.map(n => `${n.nodeId} (${n.behavior})`))
  }
}

/**
 * Get all available rituals
 */
export function getAllRituals(): Ritual[] {
  return [...ritualStore.rituals]
}

/**
 * Get the currently active ritual
 */
export function getActiveRitual(): Ritual | null {
  return ritualStore.activeRitual
}

/**
 * Set the active ritual
 */
export function setActiveRitual(ritualId: string): void {
  const ritual = ritualStore.rituals.find(r => r.id === ritualId)
  if (ritual) {
    ritualStore.activeRitual = ritual
    saveToStorage()
    eventBus.emit('ritualChanged', { ritual })
  }
}

/**
 * Create a new ritual
 */
export function createRitual(ritual: Omit<Ritual, 'id' | 'createdAt'>): Ritual {
  const newRitual: Ritual = {
    ...ritual,
    id: `ritual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now()
  }
  
  ritualStore.rituals.push(newRitual)
  saveToStorage()
  
  eventBus.emit('ritualCreated', { ritual: newRitual })
  return newRitual
}

/**
 * Update an existing ritual
 */
export function updateRitual(ritualId: string, updates: Partial<Ritual>): void {
  const index = ritualStore.rituals.findIndex(r => r.id === ritualId)
  if (index !== -1) {
    ritualStore.rituals[index] = { ...ritualStore.rituals[index], ...updates }
    
    // Update active ritual if it's the one being updated
    if (ritualStore.activeRitual?.id === ritualId) {
      ritualStore.activeRitual = ritualStore.rituals[index]
    }
    
    saveToStorage()
    eventBus.emit('ritualUpdated', { ritual: ritualStore.rituals[index] })
  }
}

/**
 * Delete a ritual
 */
export function deleteRitual(ritualId: string): void {
  ritualStore.rituals = ritualStore.rituals.filter(r => r.id !== ritualId)
  
  // Clear active ritual if it was deleted
  if (ritualStore.activeRitual?.id === ritualId) {
    ritualStore.activeRitual = ritualStore.rituals[0] || null
  }
  
  saveToStorage()
  eventBus.emit('ritualDeleted', { ritualId })
}

/**
 * Get node configuration for a specific node in the active ritual
 */
export function getNodeConfig(nodeId: string): RitualNodeConfig | null {
  if (!ritualStore.activeRitual) return null
  
  return ritualStore.activeRitual.nodes.find(node => node.nodeId === nodeId) || null
}

/**
 * Execute ritual behavior for a node tap with enhanced authentication flow
 */
export async function executeRitualBehavior(
  nodeId: string,
  pendantId: string,
  pendantPublicKey: Uint8Array,
  pendantPrivateKey: Uint8Array,
  pendantDID: string
): Promise<RitualExecution> {
  const nodeConfig = getNodeConfig(nodeId)
  
  if (!nodeConfig) {
    console.error(`🎭 No ritual configuration found for node: ${nodeId}`)
    console.error('🎭 Active ritual:', ritualStore.activeRitual?.name || 'None')
    console.error('🎭 Available nodes in active ritual:', ritualStore.activeRitual?.nodes.map(n => n.nodeId) || 'None')
    
    // Fallback to save_moment behavior if no ritual configuration is found
    console.log('🎭 Falling back to default save_moment behavior')
    
    const fallbackExecution: RitualExecution = {
      ritualId: ritualStore.activeRitual?.id || 'fallback',
      nodeId,
      pendantId,
      behavior: 'save_moment',
      timestamp: Date.now(),
      result: 'pending'
    }
    
    try {
      // Execute default save_moment behavior
      const moment = await simulateTap({
        nodeId,
        pendantPublicKey,
        pendantPrivateKey,
        pendantDID,
        pendantId
      })
      
      memoryStore.addMoment(moment)
      
      fallbackExecution.data = { momentId: moment.id }
      fallbackExecution.result = 'success'
      
      // Store execution record
      ritualStore.executions.push(fallbackExecution)
      saveToStorage()
      
      // Emit event for UI updates
      eventBus.emit('ritualExecution', { execution: fallbackExecution })
      
      return fallbackExecution
    } catch (error) {
      fallbackExecution.result = 'failure'
      fallbackExecution.error = error instanceof Error ? error.message : 'Unknown error'
      
      ritualStore.executions.push(fallbackExecution)
      saveToStorage()
      
      throw new Error(`Fallback execution failed: ${fallbackExecution.error}`)
    }
  }

  const execution: RitualExecution = {
    ritualId: ritualStore.activeRitual!.id,
    nodeId,
    pendantId,
    behavior: nodeConfig.behavior,
    timestamp: Date.now(),
    result: 'pending'
  }

  try {
    // Execute behavior based on type
    switch (nodeConfig.behavior) {
      case 'save_moment':
        const moment = await simulateTap({
          nodeId,
          pendantPublicKey,
          pendantPrivateKey,
          pendantDID,
          pendantId
        })
        memoryStore.addMoment(moment)
        
        // Generate ZK proof for the moment if configured
        if (nodeConfig.parameters?.generateZKProof) {
          try {
            const zkMoment = await createZKMoment(moment, pendantPublicKey, pendantDID)
            execution.data = { 
              momentId: moment.id,
              zkProof: zkMoment.proof,
              verified: zkMoment.verified
            }
          } catch (zkError) {
            console.warn('ZK proof generation failed:', zkError)
            execution.data = { momentId: moment.id, zkProof: null }
          }
        } else {
          execution.data = { momentId: moment.id }
        }
        break

      case 'send_tip':
        const tipAmount = nodeConfig.parameters?.tipAmount || 1
        const recipient = nodeConfig.parameters?.recipient || 'default'
        execution.data = { 
          tipAmount, 
          recipient, 
          transactionId: `tip-${Date.now()}`,
          pendantDID
        }
        break

      case 'vote_option_a':
      case 'vote_option_b':
        const option = nodeConfig.behavior === 'vote_option_a' ? 'A' : 'B'
        const voteOption = nodeConfig.parameters?.voteOption || `Option ${option}`
        execution.data = { 
          vote: option, 
          voteOption,
          voteId: `vote-${Date.now()}`,
          pendantDID
        }
        break

      case 'increment_counter':
        const counterName = nodeConfig.parameters?.counterName || 'default_counter'
        const newCount = getCounterValue(counterName) + 1
        setCounterValue(counterName, newCount)
        execution.data = { 
          counterName, 
          newCount,
          pendantDID
        }
        break

      case 'trigger_light':
        const lightPattern = nodeConfig.parameters?.lightPattern || 'default'
        execution.data = { 
          lightPattern, 
          duration: 3000,
          pendantDID
        }
        break

      case 'play_sound':
        const soundFile = nodeConfig.parameters?.soundFile || 'beep.wav'
        execution.data = { 
          soundFile, 
          played: true,
          pendantDID
        }
        break

      case 'unlock_content':
        execution.data = { 
          contentUnlocked: true, 
          contentId: `content-${nodeId}`,
          pendantDID
        }
        break

      case 'custom':
        // Execute custom logic if provided
        if (nodeConfig.logic) {
          execution.data = await executeCustomLogic(nodeConfig.logic, {
            nodeId,
            pendantId,
            pendantDID,
            parameters: nodeConfig.parameters
          })
        }
        break

      default:
        throw new Error(`Unknown behavior: ${nodeConfig.behavior}`)
    }

    execution.result = 'success'
  } catch (error) {
    execution.result = 'failure'
    execution.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Store execution record
  ritualStore.executions.push(execution)
  saveToStorage()

  // Emit event for UI updates
  eventBus.emit('ritualExecution', { execution })

  return execution
}

/**
 * Create a ZK moment with cryptographic proof
 */
async function createZKMoment(
  moment: TapMoment, 
  pendantPublicKey: Uint8Array, 
  pendantDID: string
): Promise<{ proof: string, verified: boolean }> {
  // Import ZK proof system
  const { ZKProofSystem } = await import('@/lib/zk/zkProofSystem')
  const zkSystem = new ZKProofSystem()
  
  // Convert tap moment to ZK moment format
  const zkMoment = {
    momentId: moment.id,
    timestamp: moment.timestamp,
    hash: new Uint8Array(Buffer.from(moment.hash, 'hex')),
    signature: moment.signature,
    nonce: new Uint8Array(Buffer.from(moment.nonce, 'hex')),
    metadata: {
      nodeId: moment.nodeId,
      pendantDID: pendantDID
    }
  }
  
  // Generate ZK proof for moment count verification
  const proofResult = await zkSystem.generateMomentCountProof(
    [zkMoment],
    1, // Threshold of 1 for single moment proof
    pendantPublicKey
  )
  
  if (proofResult.success && proofResult.proof) {
    return {
      proof: JSON.stringify(proofResult.proof),
      verified: true
    }
  } else {
    throw new Error(proofResult.error || 'ZK proof generation failed')
  }
}

/**
 * Get counter value (enhanced with persistence)
 */
function getCounterValue(counterName: string): number {
  const counterKey = `counter_${counterName}`
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(counterKey)
    return stored ? parseInt(stored, 10) : 0
  }
  return 0
}

/**
 * Set counter value (enhanced with persistence)
 */
function setCounterValue(counterName: string, value: number): void {
  const counterKey = `counter_${counterName}`
  if (typeof window !== 'undefined') {
    localStorage.setItem(counterKey, value.toString())
  }
}

/**
 * Execute custom logic (simplified eval for demo - in production would use safer sandbox)
 */
async function executeCustomLogic(logic: string, context: any): Promise<any> {
  try {
    // Create a safe context for execution
    const func = new Function('context', `
      const { nodeId, pendantId, pendantDID, parameters } = context;
      ${logic}
    `)
    return func(context)
  } catch (error) {
    throw new Error(`Custom logic execution failed: ${error}`)
  }
}

/**
 * Get execution history
 */
export function getExecutionHistory(limit?: number): RitualExecution[] {
  const executions = [...ritualStore.executions].sort((a, b) => b.timestamp - a.timestamp)
  return limit ? executions.slice(0, limit) : executions
}

/**
 * Get executions for a specific ritual
 */
export function getExecutionsForRitual(ritualId: string): RitualExecution[] {
  return ritualStore.executions.filter(e => e.ritualId === ritualId)
}

/**
 * Clear execution history
 */
export function clearExecutionHistory(): void {
  ritualStore.executions = []
  saveToStorage()
}

/**
 * Create a new ritual with enhanced display text configuration
 */
export function createRitualWithDisplayText(
  ritual: Omit<Ritual, 'id' | 'createdAt'>,
  displayTextConfig?: {
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
): Ritual {
  const newRitual: Ritual = {
    ...ritual,
    id: `ritual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now()
  }
  
  // Add display text configuration to ritual parameters
  if (displayTextConfig) {
    newRitual.nodes = newRitual.nodes.map(node => ({
      ...node,
      parameters: {
        ...node.parameters,
        displayText: displayTextConfig
      }
    }))
  }
  
  ritualStore.rituals.push(newRitual)
  saveToStorage()
  
  eventBus.emit('ritualCreated', { ritual: newRitual })
  return newRitual
}

/**
 * Update ritual display text configuration
 */
export function updateRitualDisplayText(
  ritualId: string,
  displayTextConfig: {
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
): void {
  const ritual = ritualStore.rituals.find(r => r.id === ritualId)
  if (ritual) {
    ritual.nodes = ritual.nodes.map(node => ({
      ...node,
      parameters: {
        ...node.parameters,
        displayText: {
          ...node.parameters?.displayText,
          ...displayTextConfig
        }
      }
    }))
    
    // Update active ritual if it's the one being updated
    if (ritualStore.activeRitual?.id === ritualId) {
      ritualStore.activeRitual = ritual
    }
    
    saveToStorage()
    eventBus.emit('ritualUpdated', { ritual })
  }
}

/**
 * Get display text configuration for a ritual
 */
export function getRitualDisplayText(ritualId: string): Record<string, string> | null {
  const ritual = ritualStore.rituals.find(r => r.id === ritualId)
  if (ritual && ritual.nodes.length > 0) {
    return ritual.nodes[0].parameters?.displayText || null
  }
  return null
}

// --- Export singleton instance ---
export const ritualManager = {
  initialize: initializeRitualManager,
  getAllRituals,
  getActiveRitual,
  setActiveRitual,
  createRitual,
  updateRitual,
  deleteRitual,
  getNodeConfig,
  executeRitualBehavior,
  getExecutionHistory,
  getExecutionsForRitual,
  clearExecutionHistory,
  createRitualWithDisplayText,
  updateRitualDisplayText,
  getRitualDisplayText
} 