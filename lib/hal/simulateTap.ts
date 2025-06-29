// --- MELD Node Tap Simulation HAL ---
// Simulates NFC pendant tapping on flexible MELD Node devices (1-6 nodes)
// ESP32-ready: Replace with actual NFC reader + crypto signing

import { signMessage } from '@/lib/crypto/keys'
import { sha256 } from '@noble/hashes/sha256'
import { randomBytes } from '@noble/hashes/utils'

// --- Types for Multi-Node System ---
export interface PendantIdentity {
  id: string
  name: string
  publicKey: Uint8Array
  privateKey: Uint8Array
  did: string
  color: string
  icon: string
}

export interface MeldNode {
  id: string
  name: string
  location: string
  type: 'dj' | 'vj' | 'bar' | 'stage' | 'entrance' | 'custom'
  color: string
  icon: string
  status: 'online' | 'offline' | 'busy'
}

export interface TapMoment {
  id: string
  nodeId: string
  pendantId: string
  pendantDID: string
  timestamp: number
  hash: string
  signature: Uint8Array
  nonce: string
  verified: boolean
}

export interface TapSimulationParams {
  nodeId: string
  pendantPublicKey: Uint8Array
  pendantPrivateKey: Uint8Array
  pendantDID: string
  pendantId: string
}

// --- Event Bus for Real-time Updates ---
class EventBus {
  private listeners: Record<string, Function[]> = {}

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
  }

  emit(event: string, data: any) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(data))
  }
}

export const eventBus = new EventBus()

// --- Dynamic Node Management ---
export const NODE_TEMPLATES = {
  minimal: {
    id: 'node-1',
    name: 'MELD Terminal',
    location: 'Main Stage',
    type: 'stage' as const,
    color: '#A78BFA',
    icon: '✨',
    status: 'online' as const
  },
  dj: {
    id: 'dj-node',
    name: 'DJ Booth',
    location: 'Main Stage Left',
    type: 'dj' as const,
    color: '#FF6B6B',
    icon: '🎧',
    status: 'online' as const
  },
  vj: {
    id: 'vj-node',
    name: 'VJ Station',
    location: 'Visual Control',
    type: 'vj' as const,
    color: '#4ECDC4',
    icon: '🎥',
    status: 'online' as const
  },
  bar: {
    id: 'bar-node',
    name: 'Bar Terminal',
    location: 'Main Bar',
    type: 'bar' as const,
    color: '#45B7D1',
    icon: '🍸',
    status: 'online' as const
  },
  stage: {
    id: 'stage-node',
    name: 'Stage Terminal',
    location: 'Center Stage',
    type: 'stage' as const,
    color: '#FFA726',
    icon: '🎤',
    status: 'online' as const
  },
  entrance: {
    id: 'entrance-node',
    name: 'Entry Point',
    location: 'Main Entrance',
    type: 'entrance' as const,
    color: '#66BB6A',
    icon: '🚪',
    status: 'online' as const
  },
  art_frame: {
    id: 'art-frame-node',
    name: 'Art Frame',
    location: 'Gallery Wall',
    type: 'custom' as const,
    color: '#8B5CF6',
    icon: '🖼️',
    status: 'online' as const
  },
  sculpture_stand: {
    id: 'sculpture-node',
    name: 'Sculpture Stand',
    location: 'Gallery Floor',
    type: 'custom' as const,
    color: '#10B981',
    icon: '🗿',
    status: 'online' as const
  },
  gallery_kiosk: {
    id: 'gallery-kiosk-node',
    name: 'Gallery Kiosk',
    location: 'Information Desk',
    type: 'custom' as const,
    color: '#F59E0B',
    icon: '📱',
    status: 'online' as const
  },
  civic_portrait: {
    id: 'civic-portrait-node',
    name: 'Civic Portrait',
    location: 'Community Space',
    type: 'custom' as const,
    color: '#DC2626',
    icon: '🏛️',
    status: 'online' as const
  }
}

// --- Dynamic MELD Nodes (1-6 flexible) ---
let DYNAMIC_MELD_NODES: MeldNode[] = [NODE_TEMPLATES.minimal]

// --- Node Management Functions ---
export function getMeldNodes(): MeldNode[] {
  return [...DYNAMIC_MELD_NODES]
}

export function setMeldNodes(nodes: MeldNode[]): void {
  if (nodes.length < 1 || nodes.length > 6) {
    throw new Error('MELD nodes must be between 1 and 6')
  }
  DYNAMIC_MELD_NODES = [...nodes]
  eventBus.emit('nodesUpdated', DYNAMIC_MELD_NODES)
}

export function addMeldNode(template: keyof typeof NODE_TEMPLATES = 'minimal'): MeldNode {
  if (DYNAMIC_MELD_NODES.length >= 6) {
    throw new Error('Maximum 6 nodes allowed')
  }
  
  const templateNode = NODE_TEMPLATES[template]
  const newNode: MeldNode = {
    ...templateNode,
    id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: `${templateNode.name} ${DYNAMIC_MELD_NODES.length + 1}`
  }
  
  DYNAMIC_MELD_NODES.push(newNode)
  eventBus.emit('nodesUpdated', DYNAMIC_MELD_NODES)
  return newNode
}

export function removeMeldNode(nodeId: string): boolean {
  if (DYNAMIC_MELD_NODES.length <= 1) {
    throw new Error('Must have at least 1 node')
  }
  
  const initialLength = DYNAMIC_MELD_NODES.length
  DYNAMIC_MELD_NODES = DYNAMIC_MELD_NODES.filter(node => node.id !== nodeId)
  
  if (DYNAMIC_MELD_NODES.length < initialLength) {
    eventBus.emit('nodesUpdated', DYNAMIC_MELD_NODES)
    return true
  }
  return false
}

export function updateMeldNode(nodeId: string, updates: Partial<MeldNode>): boolean {
  const nodeIndex = DYNAMIC_MELD_NODES.findIndex(node => node.id === nodeId)
  if (nodeIndex === -1) return false
  
  DYNAMIC_MELD_NODES[nodeIndex] = { ...DYNAMIC_MELD_NODES[nodeIndex], ...updates }
  eventBus.emit('nodesUpdated', DYNAMIC_MELD_NODES)
  return true
}

// --- Core Tap Simulation Function ---
export const simulateTap = async ({
  nodeId,
  pendantPublicKey,
  pendantPrivateKey,
  pendantDID,
  pendantId
}: TapSimulationParams): Promise<TapMoment> => {
  const timestamp = Date.now()
  const nonce = Array.from(randomBytes(16), byte => byte.toString(16).padStart(2, '0')).join('')
  
  // Create moment data for hashing
  const momentData = {
    nodeId,
    pendantDID,
    timestamp,
    nonce
  }
  
  // Generate cryptographic hash of the moment
  const dataString = JSON.stringify(momentData)
  const hashBytes = sha256(new TextEncoder().encode(dataString))
  const hash = Array.from(hashBytes, byte => byte.toString(16).padStart(2, '0')).join('')
  
  // Sign the hash with pendant's private key
  const signature = await signMessage(hashBytes, pendantPrivateKey)
  
  // Create the moment record
  const moment: TapMoment = {
    id: `moment-${timestamp}-${nonce.slice(0, 8)}`,
    nodeId,
    pendantId,
    pendantDID,
    timestamp,
    hash,
    signature,
    nonce,
    verified: true // In real system, this would be verified by the node
  }
  
  // Emit event for real-time UI updates
  eventBus.emit('momentSaved', {
    moment,
    nodeId,
    pendantId
  })
  
  // Simulate NFC transaction delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return moment
}

// --- Utility Functions ---
export const getNodeById = (nodeId: string): MeldNode | undefined => {
  return DYNAMIC_MELD_NODES.find(node => node.id === nodeId)
}

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

export const truncateHash = (hash: string, length: number = 8): string => {
  return `${hash.substring(0, length)}...`
}

// --- Initialize Default Configuration ---
export function initializeDefaultNodes(): void {
  // Start with a single beautiful minimal node
  DYNAMIC_MELD_NODES = [NODE_TEMPLATES.minimal]
  eventBus.emit('nodesUpdated', DYNAMIC_MELD_NODES)
} 