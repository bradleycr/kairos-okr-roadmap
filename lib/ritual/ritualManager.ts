// --- Ritual Manager ---
// Manages ritual configurations and execution for flexible 1-6 node systems
// Integrates with dynamic MELD Node simulation architecture

import { Ritual, RitualNodeConfig, RitualExecution, NodeBehavior } from './types'
import { getMeldNodes, simulateTap, eventBus, TapMoment, NODE_TEMPLATES } from '@/lib/hal/simulateTap'
import { memoryStore } from '@/lib/moment/memoryStore'
import { galleryManager, recordInteraction } from '@/lib/gallery/artworkRegistry'

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
function createDefaultRituals(): Ritual[] {
  const currentNodes = getMeldNodes()
  
  return [
    {
      id: 'default-moments',
      name: 'Moment Collection',
      description: 'Save beautiful cryptographic moments at each node',
      createdAt: Date.now(),
      version: '1.0.0',
      nodes: currentNodes.map(node => ({
        nodeId: node.id,
        label: `${node.name} Moment`,
        behavior: 'save_moment' as NodeBehavior,
        parameters: {
          displayText: {
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
        }
      }))
    }
  ]
}

function getDefaultRituals(): Ritual[] {
  const currentNodes = getMeldNodes()
  
  if (currentNodes.length === 1) {
    // Single node rituals
    return [
      {
        id: 'minimal-moment',
        name: 'Minimal Moment',
        description: 'Beautiful single-node moment collection',
        createdAt: Date.now(),
        version: '1.0.0',
        nodes: [{
          nodeId: currentNodes[0].id,
          label: 'Save Moment',
          behavior: 'save_moment' as NodeBehavior,
          parameters: {
            displayText: {
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
          }
        }]
      }
    ]
  }
  
  // Multi-node rituals
  const artGalleryRituals = [
    {
      id: 'art-gallery-experience',
      name: 'Art Gallery Experience',
      description: 'Interactive art appreciation with pendant tapping',
      createdAt: Date.now(),
      version: '1.0.0',
      nodes: currentNodes.slice(0, 3).map((node, index) => {
        const artworks = ['artwork-1', 'artwork-2', 'artwork-3']
        const artworkTitles = ['The Persistence of Memory', 'Digital Confluence', 'Untitled Masterpiece']
        const behaviors: NodeBehavior[] = ['favorite_artwork', 'rate_artwork', 'view_artist_info']
        
        return {
          nodeId: node.id,
          label: `${artworkTitles[index] || 'Artwork'} Frame`,
          behavior: behaviors[index] || 'favorite_artwork',
          parameters: {
            artworkId: artworks[index] || 'artwork-1',
            artworkTitle: artworkTitles[index] || 'Artwork',
            artistName: index === 0 ? 'Salvador Dalí' : index === 1 ? 'Alex Chen' : 'Unknown Artist',
            gallerySection: index === 0 ? 'Surrealism Wing' : index === 1 ? 'Contemporary Digital' : 'Modern Art',
            rating: 5,
            displayText: {
              waiting_title: 'ART FRAME',
              waiting_subtitle: 'TAP TO INTERACT',
              detected_title: 'NFC DETECTED',
              detected_subtitle: 'AUTHENTICATING...',
              auth_title: 'AUTHENTICATED',
              auth_instruction: 'TAP TO CONFIRM',
              confirm_title: 'CONFIRM ACTION',
              confirm_button: 'CONFIRM',
              success_title: index === 0 ? 'FAVORITED' : index === 1 ? 'RATED' : 'INFO UNLOCKED',
              success_subtitle: index === 0 ? 'ADDED TO FAVORITES' : index === 1 ? '★★★★★ RATED' : 'ARTIST INFO AVAILABLE',
              error_title: 'ERROR',
              error_subtitle: 'AUTH FAILED'
            }
          }
        }
      })
    },
    {
      id: 'civic-portrait-experience',
      name: 'Civic Portrait Experience',
      description: 'Interactive civic engagement through portrait interfaces',
      createdAt: Date.now(),
      version: '1.0.0',
      nodes: currentNodes.slice(0, 2).map((node, index) => ({
        nodeId: node.id,
        label: index === 0 ? 'Civic Guardian' : 'Community Portal',
        behavior: index === 0 ? 'unlock_story' : 'join_discussion',
        parameters: {
          artworkId: index === 0 ? 'civic-portrait-1' : 'civic-portrait-2',
          artworkTitle: index === 0 ? 'The Civic Guardian' : 'Community Portal',
          gallerySection: 'Civic Space',
          displayText: {
            waiting_title: index === 0 ? 'CIVIC GUARDIAN' : 'COMMUNITY PORTAL',
            waiting_subtitle: 'TAP TO ENGAGE',
            detected_title: 'CITIZEN DETECTED',
            detected_subtitle: 'VERIFYING...',
            auth_title: 'WELCOME, CITIZEN',
            auth_instruction: 'TAP TO CONTINUE',
            confirm_title: index === 0 ? 'UNLOCK STORY' : 'JOIN DISCUSSION',
            confirm_button: 'ENGAGE',
            success_title: index === 0 ? 'STORY UNLOCKED' : 'DISCUSSION JOINED',
            success_subtitle: index === 0 ? 'COMMUNITY HISTORY REVEALED' : 'WELCOME TO THE CONVERSATION',
            error_title: 'ACCESS DENIED',
            error_subtitle: 'VERIFICATION FAILED'
          }
        }
      }))
    }
  ]
  
  return [
    {
      id: 'moment-collection',
      name: 'Moment Collection',
      description: 'Save cryptographic moments at each node',
      createdAt: Date.now(),
      version: '1.0.0',
      nodes: currentNodes.map(node => ({
        nodeId: node.id,
        label: `${node.name} Moment`,
        behavior: 'save_moment' as NodeBehavior,
        parameters: {
          displayText: {
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
        }
      }))
    },
    {
      id: 'tip-performers',
      name: 'Tip the Performers',
      description: 'Send tips to performers via NFC tap',
      createdAt: Date.now(),
      version: '1.0.0',
      nodes: currentNodes.map((node, index) => ({
        nodeId: node.id,
        label: `Tip ${node.name}`,
        behavior: (index < currentNodes.length - 1 ? 'send_tip' : 'save_moment') as NodeBehavior,
        parameters: index < currentNodes.length - 1 ? {
          tipAmount: 5,
          recipient: `${node.type}_wallet`,
          displayText: {
            waiting_title: 'TIP JAR',
            waiting_subtitle: 'TAP TO TIP',
            success_title: 'TIP SENT',
            success_subtitle: '$5.00 SENT'
          }
        } : {
          displayText: {
            waiting_title: 'MEMORY',
            waiting_subtitle: 'TAP TO SAVE'
          }
        }
      }))
    },
    {
      id: 'voting-ritual',
      name: 'Community Voting',
      description: 'Vote on community decisions at different stations',
      createdAt: Date.now(),
      version: '1.0.0',
      nodes: currentNodes.map((node, index) => {
        if (index === 0) {
          return {
            nodeId: node.id,
            label: 'Vote: Option A',
            behavior: 'vote_option_a' as NodeBehavior,
            parameters: {
              voteOption: 'Option A',
              displayText: {
                waiting_title: 'VOTE A',
                waiting_subtitle: 'TAP TO VOTE',
                success_title: 'VOTE CAST',
                success_subtitle: 'OPTION A'
              }
            }
          }
        } else if (index === 1) {
          return {
            nodeId: node.id,
            label: 'Vote: Option B',
            behavior: 'vote_option_b' as NodeBehavior,
            parameters: {
              voteOption: 'Option B',
              displayText: {
                waiting_title: 'VOTE B',
                waiting_subtitle: 'TAP TO VOTE',
                success_title: 'VOTE CAST',
                success_subtitle: 'OPTION B'
              }
            }
          }
        } else {
          return {
            nodeId: node.id,
            label: 'Abstain',
            behavior: 'increment_counter' as NodeBehavior,
            parameters: {
              counterName: 'abstain_votes',
              displayText: {
                waiting_title: 'ABSTAIN',
                waiting_subtitle: 'TAP TO ABSTAIN',
                success_title: 'ABSTAINED',
                success_subtitle: 'VOTE RECORDED'
              }
            }
          }
        }
      })
    },
    ...artGalleryRituals
  ]
}

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
      ritualStore.rituals = getDefaultRituals()
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
    ritualStore.rituals = getDefaultRituals()
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
    ritualStore.rituals = getDefaultRituals()
    ritualStore.activeRitual = ritualStore.rituals[0]
    saveToStorage()
    console.log('🎭 Created and activated default ritual:', ritualStore.activeRitual.name)
  }
  
  // Sync with current nodes (in case nodes were updated)
  syncRitualsWithCurrentNodes()
  
  // Debug log the active ritual and its nodes
  if (ritualStore.activeRitual) {
    console.log('🎭 Active ritual:', ritualStore.activeRitual.name)
    console.log('🎭 Configured nodes:', ritualStore.activeRitual.nodes.map(n => `${n.nodeId} (${n.behavior})`))
  }
}

/**
 * Sync existing rituals with current node configuration
 */
function syncRitualsWithCurrentNodes(): void {
  const currentNodes = getMeldNodes()
  const currentNodeIds = new Set(currentNodes.map(n => n.id))
  
  ritualStore.rituals = ritualStore.rituals.map(ritual => ({
    ...ritual,
    nodes: ritual.nodes.filter(node => currentNodeIds.has(node.nodeId))
  }))
  
  // Update active ritual if it exists
  if (ritualStore.activeRitual) {
    ritualStore.activeRitual = {
      ...ritualStore.activeRitual,
      nodes: ritualStore.activeRitual.nodes.filter(node => currentNodeIds.has(node.nodeId))
    }
  }
  
  saveToStorage()
}

/**
 * Create a new ritual with current nodes
 */
export function createRitualWithCurrentNodes(ritual: Omit<Ritual, 'id' | 'createdAt' | 'nodes'>): Ritual {
  const currentNodes = getMeldNodes()
  
  const newRitual: Ritual = {
    ...ritual,
    id: `ritual-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: Date.now(),
    nodes: currentNodes.map(node => ({
      nodeId: node.id,
      label: node.name,
      behavior: 'save_moment' as NodeBehavior,
      parameters: {
        displayText: {
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
      }
    }))
  }
  
  ritualStore.rituals.push(newRitual)
  saveToStorage()
  
  return newRitual
}

// --- Event Handlers ---

// Listen for node updates and sync rituals
eventBus.on('nodesUpdated', () => {
  syncRitualsWithCurrentNodes()
  console.log('🎭 Synced rituals with updated nodes')
})

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
    
    // Emit both events for complete system coverage
    eventBus.emit('ritualActivated', ritual)
    eventBus.emit('ritualChanged', ritual)
    console.log('🎭 Activated ritual:', ritual.name)
    
    // Force a brief delay to ensure all components receive the update
    setTimeout(() => {
      eventBus.emit('ritualChanged', ritual)
    }, 10)
  }
}

/**
 * Create a new ritual
 */
export function createRitual(ritual: Omit<Ritual, 'id' | 'createdAt'>): Ritual {
  const newRitual: Ritual = {
    ...ritual,
    id: `ritual-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: Date.now()
  }
  
  ritualStore.rituals.push(newRitual)
  saveToStorage()
  
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
    eventBus.emit('ritualUpdated', ritualStore.rituals[index])
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
    
    // Emit events for the ritual change
    eventBus.emit('ritualDeleted', { deletedId: ritualId })
    eventBus.emit('ritualChanged', ritualStore.activeRitual)
    
    console.log('🎭 Deleted ritual and updated active ritual to:', ritualStore.activeRitual?.name || 'None')
  } else {
    // Just emit deleted event if it wasn't active
    eventBus.emit('ritualDeleted', { deletedId: ritualId })
  }
  
  saveToStorage()
}

/**
 * Get node configuration for a specific node
 */
export function getNodeConfig(nodeId: string): RitualNodeConfig | null {
  if (!ritualStore.activeRitual) return null
  return ritualStore.activeRitual.nodes.find(n => n.nodeId === nodeId) || null
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

      case 'favorite_artwork':
        const artworkId = nodeConfig.parameters?.artworkId
        if (!artworkId) throw new Error('Artwork ID required for favorite_artwork behavior')
        
        const favoriteInteraction = recordInteraction({
          artworkId,
          userId: pendantDID,
          pendantDID,
          type: 'favorite',
          nodeId,
          gallerySection: nodeConfig.parameters?.gallerySection || 'Unknown',
          signature: 'temp-sig' // In production, sign with pendant private key
        })
        
        execution.data = { 
          artworkId,
          interactionId: favoriteInteraction.id,
          artworkTitle: nodeConfig.parameters?.artworkTitle,
          pendantDID
        }
        break

      case 'rate_artwork':
        const ratingArtworkId = nodeConfig.parameters?.artworkId
        const rating = nodeConfig.parameters?.rating || 5
        if (!ratingArtworkId) throw new Error('Artwork ID required for rate_artwork behavior')
        
        const ratingInteraction = recordInteraction({
          artworkId: ratingArtworkId,
          userId: pendantDID,
          pendantDID,
          type: 'rating',
          rating,
          nodeId,
          gallerySection: nodeConfig.parameters?.gallerySection || 'Unknown',
          signature: 'temp-sig'
        })
        
        const artworkRating = galleryManager.getArtworkRating(ratingArtworkId)
        execution.data = { 
          artworkId: ratingArtworkId,
          rating,
          interactionId: ratingInteraction.id,
          averageRating: artworkRating.averageRating,
          totalRatings: artworkRating.totalRatings,
          artworkTitle: nodeConfig.parameters?.artworkTitle,
          pendantDID
        }
        break

      case 'leave_comment':
        const commentArtworkId = nodeConfig.parameters?.artworkId
        const comment = nodeConfig.parameters?.comment || 'Beautiful artwork!'
        if (!commentArtworkId) throw new Error('Artwork ID required for leave_comment behavior')
        
        const commentInteraction = recordInteraction({
          artworkId: commentArtworkId,
          userId: pendantDID,
          pendantDID,
          type: 'comment',
          comment,
          nodeId,
          gallerySection: nodeConfig.parameters?.gallerySection || 'Unknown',
          signature: 'temp-sig'
        })
        
        execution.data = { 
          artworkId: commentArtworkId,
          comment,
          interactionId: commentInteraction.id,
          artworkTitle: nodeConfig.parameters?.artworkTitle,
          pendantDID
        }
        break

      case 'view_artist_info':
        const infoArtworkId = nodeConfig.parameters?.artworkId
        if (!infoArtworkId) throw new Error('Artwork ID required for view_artist_info behavior')
        
        const artwork = galleryManager.getArtwork(infoArtworkId)
        if (!artwork) throw new Error('Artwork not found')
        
        const infoInteraction = recordInteraction({
          artworkId: infoArtworkId,
          userId: pendantDID,
          pendantDID,
          type: 'view_info',
          nodeId,
          gallerySection: nodeConfig.parameters?.gallerySection || 'Unknown',
          signature: 'temp-sig'
        })
        
        execution.data = { 
          artworkId: infoArtworkId,
          artistInfo: artwork.artist,
          artworkInfo: {
            title: artwork.title,
            year: artwork.year,
            medium: artwork.medium,
            description: artwork.description
          },
          interactionId: infoInteraction.id,
          pendantDID
        }
        break

      case 'join_discussion':
        const discussionArtworkId = nodeConfig.parameters?.artworkId
        if (!discussionArtworkId) throw new Error('Artwork ID required for join_discussion behavior')
        
        execution.data = { 
          artworkId: discussionArtworkId,
          discussionUrl: `/gallery/discussions/${discussionArtworkId}`,
          artworkTitle: nodeConfig.parameters?.artworkTitle,
          pendantDID
        }
        break

      case 'unlock_story':
        const storyArtworkId = nodeConfig.parameters?.artworkId
        if (!storyArtworkId) throw new Error('Artwork ID required for unlock_story behavior')
        
        const storyInteraction = recordInteraction({
          artworkId: storyArtworkId,
          userId: pendantDID,
          pendantDID,
          type: 'unlock_story',
          nodeId,
          gallerySection: nodeConfig.parameters?.gallerySection || 'Unknown',
          signature: 'temp-sig'
        })
        
        execution.data = { 
          artworkId: storyArtworkId,
          storyUnlocked: true,
          storyContent: `The story behind "${nodeConfig.parameters?.artworkTitle || 'this artwork'}" is now available to you...`,
          interactionId: storyInteraction.id,
          audioGuideUrl: nodeConfig.parameters?.audioGuideUrl,
          pendantDID
        }
        break

      case 'collect_memory':
        const memoryArtworkId = nodeConfig.parameters?.artworkId
        const memoryNote = nodeConfig.parameters?.memoryNote || 'A moment with this beautiful artwork'
        if (!memoryArtworkId) throw new Error('Artwork ID required for collect_memory behavior')
        
        const memoryInteraction = recordInteraction({
          artworkId: memoryArtworkId,
          userId: pendantDID,
          pendantDID,
          type: 'collect_memory',
          memoryNote,
          nodeId,
          gallerySection: nodeConfig.parameters?.gallerySection || 'Unknown',
          signature: 'temp-sig'
        })
        
        execution.data = { 
          artworkId: memoryArtworkId,
          memoryNote,
          memoryCollected: true,
          interactionId: memoryInteraction.id,
          artworkTitle: nodeConfig.parameters?.artworkTitle,
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