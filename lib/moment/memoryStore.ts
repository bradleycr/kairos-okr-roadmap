// --- MELD Node Memory Store ---
// Manages saved moments across multiple fixed MELD Node devices
// ESP32-ready: Replace localStorage with EEPROM/NVS storage

import { TapMoment } from '@/lib/hal/simulateTap'

// --- Storage Keys for ESP32 NVS ---
const STORAGE_KEYS = {
  MOMENTS: 'meld_moments',
  STATS: 'meld_stats'
}

// --- Types for Memory Management ---
export interface NodeMomentStats {
  nodeId: string
  totalMoments: number
  uniquePendants: number
  lastActivity: number
  averageTapsPerHour: number
}

export interface MeldMemoryStore {
  moments: TapMoment[]
  stats: Record<string, NodeMomentStats>
}

// --- In-Memory Store (ESP32: Use PSRAM or external storage) ---
let internalStore: MeldMemoryStore = {
  moments: [],
  stats: {}
}

// --- Storage Functions (ESP32: Replace with NVS API) ---

/**
 * Load saved moments from localStorage
 * @note ESP32: Load from EEPROM/Flash
 */
function loadMomentsFromStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MOMENTS)
    if (!stored) return
    
    const parsed = JSON.parse(stored)
    internalStore.moments = parsed.map((moment: any) => ({
      ...moment,
      hash: new Uint8Array(moment.hash),
      signature: new Uint8Array(moment.signature),
      nonce: new Uint8Array(moment.nonce)
    }))
  } catch (error) {
    console.warn('Failed to load moments from storage:', error)
  }
}

/**
 * Save moments to localStorage
 * @note ESP32: Save to EEPROM/Flash
 */
function saveMomentsToStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    // Convert Uint8Arrays to regular arrays for JSON serialization
    const serializable = internalStore.moments.map(moment => ({
      ...moment,
      hash: Array.from(moment.hash),
      signature: Array.from(moment.signature),
      nonce: Array.from(moment.nonce)
    }))
    localStorage.setItem(STORAGE_KEYS.MOMENTS, JSON.stringify(serializable))
  } catch (error) {
    console.warn('Failed to save moments to storage:', error)
  }
}

/**
 * Load stats from localStorage
 * @note ESP32: Load from EEPROM/Flash
 */
function loadStatsFromStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STATS)
    if (stored) {
      internalStore.stats = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load stats from storage:', error)
  }
}

/**
 * Save stats to localStorage
 * @note ESP32: Save to EEPROM/Flash
 */
function saveStatsToStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(internalStore.stats))
  } catch (error) {
    console.warn('Failed to save stats to storage:', error)
  }
}

// --- Memory Store Operations ---

/**
 * Initialize memory store with persistent data
 */
export function initializeMemoryStore(): void {
  loadMomentsFromStorage()
  loadStatsFromStorage()
  
  // Recalculate stats from moments if missing
  if (Object.keys(internalStore.stats).length === 0 && internalStore.moments.length > 0) {
    recalculateAllStats()
  }
}

/**
 * Add a new moment to the store
 */
export function addMoment(moment: TapMoment): void {
  internalStore.moments.push(moment)
  updateNodeStats(moment.nodeId)
  saveMomentsToStorage()
  
  // Emit events for real-time UI updates (ensure all components sync)
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('momentAdded', { 
      detail: { moment, nodeId: moment.nodeId, pendantId: moment.pendantId }
    }))
  }
}

/**
 * Get all moments for a specific node
 */
export function getMomentsForNode(nodeId: string): TapMoment[] {
  return internalStore.moments.filter(moment => moment.nodeId === nodeId)
}

/**
 * Get all moments across all nodes
 */
export function getAllMoments(): TapMoment[] {
  return [...internalStore.moments]
}

/**
 * Get stats for a specific node
 */
export function getNodeStats(nodeId: string): NodeMomentStats | undefined {
  return internalStore.stats[nodeId]
}

/**
 * Get stats for all nodes
 */
export function getAllNodeStats(): Record<string, NodeMomentStats> {
  return { ...internalStore.stats }
}

/**
 * Clear all moments (for testing/reset)
 */
export function clearAllMoments(): void {
  internalStore.moments = []
  internalStore.stats = {}
  saveMomentsToStorage()
  saveStatsToStorage()
}

/**
 * Get recent moments (last N moments)
 */
export function getRecentMoments(limit: number = 10): TapMoment[] {
  return internalStore.moments
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

/**
 * Get moments by pendant ID
 */
export function getMomentsForPendant(pendantId: string): TapMoment[] {
  return internalStore.moments.filter(moment => moment.pendantId === pendantId)
}

// --- Statistics Calculation ---

/**
 * Update statistics for a specific node
 */
function updateNodeStats(nodeId: string): void {
  const nodeMoments = getMomentsForNode(nodeId)
  const uniquePendants = new Set(nodeMoments.map(m => m.pendantId)).size
  const now = Date.now()
  const lastActivity = nodeMoments.length > 0 
    ? Math.max(...nodeMoments.map(m => m.timestamp)) 
    : 0
  
  // Calculate average taps per hour (last 24 hours)
  const oneDayAgo = now - (24 * 60 * 60 * 1000)
  const recentMoments = nodeMoments.filter(m => m.timestamp > oneDayAgo)
  const hoursElapsed = Math.max(1, (now - oneDayAgo) / (60 * 60 * 1000))
  const averageTapsPerHour = recentMoments.length / hoursElapsed
  
  internalStore.stats[nodeId] = {
    nodeId,
    totalMoments: nodeMoments.length,
    uniquePendants,
    lastActivity,
    averageTapsPerHour: Math.round(averageTapsPerHour * 100) / 100
  }
  
  saveStatsToStorage()
}

/**
 * Recalculate stats for all nodes
 */
function recalculateAllStats(): void {
  const nodeIds = new Set(internalStore.moments.map(m => m.nodeId))
  nodeIds.forEach(nodeId => updateNodeStats(nodeId))
}

// --- Export Store Interface ---
export const memoryStore = {
  initialize: initializeMemoryStore,
  addMoment,
  getMomentsForNode,
  getAllMoments,
  getNodeStats,
  getAllNodeStats,
  clearAllMoments,
  getRecentMoments,
  getMomentsForPendant
} 