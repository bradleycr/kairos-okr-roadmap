// --- MELD Node Tap Simulation HAL ---
// Simulates NFC pendant tapping on fixed MELD Node devices
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
  type: 'dj' | 'vj' | 'bar' | 'stage' | 'entrance'
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
type EventCallback = (data: any) => void
const eventCallbacks: Record<string, EventCallback[]> = {}

export const eventBus = {
  emit: (event: string, data: any) => {
    if (eventCallbacks[event]) {
      eventCallbacks[event].forEach(callback => callback(data))
    }
  },
  
  on: (event: string, callback: EventCallback) => {
    if (!eventCallbacks[event]) {
      eventCallbacks[event] = []
    }
    eventCallbacks[event].push(callback)
  },
  
  off: (event: string, callback: EventCallback) => {
    if (eventCallbacks[event]) {
      const index = eventCallbacks[event].indexOf(callback)
      if (index > -1) {
        eventCallbacks[event].splice(index, 1)
      }
    }
  }
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

// --- Pre-defined MELD Nodes for Event ---
export const MELD_NODES: MeldNode[] = [
  {
    id: 'dj-node',
    name: 'DJ Booth',
    location: 'Main Stage Left',
    type: 'dj',
    color: '#FF6B6B',
    icon: '🎧',
    status: 'online'
  },
  {
    id: 'vj-node', 
    name: 'VJ Station',
    location: 'Visual Control',
    type: 'vj',
    color: '#4ECDC4',
    icon: '🎥',
    status: 'online'
  },
  {
    id: 'bar-node',
    name: 'Bar Terminal',
    location: 'Main Bar',
    type: 'bar',
    color: '#45B7D1',
    icon: '🍸',
    status: 'online'
  }
]

// --- Utility Functions ---
export const getNodeById = (nodeId: string): MeldNode | undefined => {
  return MELD_NODES.find(node => node.id === nodeId)
}

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

export const truncateHash = (hash: string, length: number = 8): string => {
  return `${hash.slice(0, length)}...${hash.slice(-4)}`
}

export const truncateDID = (did: string, length: number = 20): string => {
  return `${did.slice(0, length)}...`
} 