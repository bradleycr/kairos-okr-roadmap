// --- MELD Node Card Component ---
// Represents a fixed MELD Node device at an event location
// Handles NFC pendant tapping with beautiful visual feedback

"use client"

import { useState, useEffect } from 'react'
import { MeldNode, TapMoment, PendantIdentity, simulateTap, eventBus, formatTimestamp, truncateHash } from '@/lib/hal/simulateTap'
import { memoryStore, NodeMomentStats } from '@/lib/moment/memoryStore'
import { Wifi, WifiOff, Clock, Users, Activity, Hash, Check, AlertCircle } from 'lucide-react'

interface MeldNodeCardProps {
  node: MeldNode
  selectedPendant: PendantIdentity | null
  onTapSuccess?: (moment: TapMoment) => void
  className?: string
}

export default function MeldNodeCard({ 
  node, 
  selectedPendant, 
  onTapSuccess,
  className = "" 
}: MeldNodeCardProps) {
  const [moments, setMoments] = useState<TapMoment[]>([])
  const [stats, setStats] = useState<NodeMomentStats | null>(null)
  const [isTapping, setIsTapping] = useState(false)
  const [lastTapSuccess, setLastTapSuccess] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  // Load moments and stats for this node
  useEffect(() => {
    const loadNodeData = () => {
      const nodeMoments = memoryStore.getMomentsForNode(node.id)
      const nodeStats = memoryStore.getNodeStats(node.id)
      setMoments(nodeMoments)
      setStats(nodeStats || null)
    }
    
    loadNodeData()
    
    // Listen for new moments
    const handleMomentSaved = (data: { moment: TapMoment, nodeId: string }) => {
      if (data.nodeId === node.id) {
        loadNodeData()
        setLastTapSuccess(true)
        setTimeout(() => setLastTapSuccess(false), 2000)
      }
    }
    
    eventBus.on('momentSaved', handleMomentSaved)
    
    return () => {
      eventBus.off('momentSaved', handleMomentSaved)
    }
  }, [node.id])

  // Handle pendant tap on this node
  const handleTap = async () => {
    if (!selectedPendant || isTapping) return
    
    setIsTapping(true)
    
    try {
      const moment = await simulateTap({
        nodeId: node.id,
        pendantPublicKey: selectedPendant.publicKey,
        pendantPrivateKey: selectedPendant.privateKey,
        pendantDID: selectedPendant.did,
        pendantId: selectedPendant.id
      })
      
      // Add to memory store
      memoryStore.addMoment(moment)
      
      if (onTapSuccess) {
        onTapSuccess(moment)
      }
      
    } catch (error) {
      console.error('Failed to simulate tap:', error)
    } finally {
      setIsTapping(false)
    }
  }

  // Get recent moments for display
  const recentMoments = moments.slice(-3).reverse()

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${className}`}
      style={{
        borderColor: isHovering && selectedPendant ? node.color : '#e5e7eb',
        boxShadow: lastTapSuccess ? `0 0 20px ${node.color}50` : undefined
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Success Animation Overlay */}
      {lastTapSuccess && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 animate-pulse"
            style={{ 
              background: `linear-gradient(45deg, ${node.color}20, transparent, ${node.color}20)`
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${node.color}20` }}
            >
              {node.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{node.name}</h3>
              <p className="text-sm text-gray-500">{node.location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {node.status === 'online' ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span 
              className={`text-xs px-2 py-1 rounded-full ${
                node.status === 'online' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {node.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Hash className="w-3 h-3" />
              <span className="text-xs">Moments</span>
            </div>
            <div className="font-bold text-lg" style={{ color: node.color }}>
              {stats?.totalMoments || 0}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Users className="w-3 h-3" />
              <span className="text-xs">Visitors</span>
            </div>
            <div className="font-bold text-lg" style={{ color: node.color }}>
              {stats?.uniquePendants || 0}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Activity className="w-3 h-3" />
              <span className="text-xs">Per Hour</span>
            </div>
            <div className="font-bold text-lg" style={{ color: node.color }}>
              {stats?.averageTapsPerHour?.toFixed(1) || '0.0'}
            </div>
          </div>
        </div>
      </div>

      {/* Tap Button */}
      <div className="p-4">
        <button
          onClick={handleTap}
          disabled={!selectedPendant || isTapping || node.status !== 'online'}
          className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 ${
            !selectedPendant || node.status !== 'online'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isTapping
              ? 'cursor-not-allowed'
              : 'shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
          }`}
          style={{
            backgroundColor: selectedPendant && node.status === 'online' && !isTapping
              ? `${node.color}15` 
              : undefined,
            borderColor: selectedPendant && node.status === 'online' 
              ? node.color 
              : undefined,
            color: selectedPendant && node.status === 'online' 
              ? node.color 
              : undefined,
            border: selectedPendant && node.status === 'online' 
              ? `2px solid ${node.color}` 
              : '2px solid transparent'
          }}
        >
          {isTapping ? (
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              />
              Tapping...
            </div>
          ) : !selectedPendant ? (
            'Select a pendant to tap'
          ) : node.status !== 'online' ? (
            'Node offline'
          ) : (
            <>
              Tap {selectedPendant.icon} {selectedPendant.name}
            </>
          )}
        </button>
      </div>

      {/* Recent Moments */}
      {recentMoments.length > 0 && (
        <div className="p-4 pt-0">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent Activity
          </div>
          <div className="space-y-2">
            {recentMoments.map((moment) => (
              <div 
                key={moment.id} 
                className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
              >
                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="font-mono text-gray-600 flex-shrink-0">
                  {formatTimestamp(moment.timestamp)}
                </span>
                <span className="text-gray-500 truncate">
                  {truncateHash(moment.hash, 6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {moments.length === 0 && (
        <div className="p-4 pt-0">
          <div className="text-center py-4 text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No moments yet</p>
            <p className="text-xs">Tap a pendant to create the first moment</p>
          </div>
        </div>
      )}
    </div>
  )
} 