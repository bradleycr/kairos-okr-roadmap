"use client"
import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QRCodeDisplay from "@/components/qr-code-display"
import type { Moment } from '@/lib/types';
import { useIsMobile } from '@/components/ui/use-mobile';
import { useCryptoIdentity } from '@/lib/crypto/keys'
import { Terminal, Cpu, Wifi, Database } from 'lucide-react'

interface SimUser {
  did: string;
  keyPair: { privateKey: CryptoKey; publicKey: CryptoKey };
  moments: Moment[];
}

interface DevToolsPanelProps {
  users: SimUser[];
  activeUserIdx: number | null;
  group: number[];
  moments: Moment[];
  sessionId?: string;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ 
  users, 
  activeUserIdx, 
  group, 
  moments, 
  sessionId 
}) => {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(400)
  const [fullHeight, setFullHeight] = useState(false)
  const [qrSessionId, setQrSessionId] = useState<string | undefined>(sessionId)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState('debug')
  
  const isMobile = useIsMobile()
  const { identity, isReady } = useCryptoIdentity()
  const minHeight = isMobile ? 120 : 180

  // --- E-ink inspired palette for ESP32 development ---
  const epaperBg = "#f5f5ec"
  const epaperBorder = "#b8b5a1"
  const epaperScreen = "#eae7df"
  const epaperText = "#44423a"
  const epaperShadow = "0 2px 12px 0 #b8b5a133"

  useEffect(() => {
    setOpen(false)
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && !fullHeight) {
      setHeight(Math.max(minHeight, 0.6 * window.innerHeight))
    }
  }, [fullHeight, minHeight])

  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setQrSessionId(params.get('session') || 'demo-session')
    }
  }, [sessionId])

  // Drag to resize (desktop only)
  const startDrag = (e: React.MouseEvent) => {
    if (isMobile) return
    e.preventDefault()
    const startY = e.clientY
    const startHeight = height
    const onMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY
      setHeight(h => Math.max(minHeight, startHeight + delta))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // --- ESP32 Status Information ---
  const getESP32Status = () => ({
    cryptoReady: isReady && !!identity,
    momentsCount: moments.length,
    usersActive: users.length,
    storageUsed: Math.round((moments.length * 256) / 1024), // Estimated KB
    memoryAvailable: '320KB (simulated)', // ESP32 has ~320KB RAM
    flashAvailable: '4MB (simulated)' // ESP32 typical flash
  })

  const status = getESP32Status()

  return (
    <>
      {/* --- Toggle button with ESP32 styling --- */}
      <button
        aria-label={open ? "Hide Dev Tools" : "Show Dev Tools"}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`fixed z-[100] right-4 ${isMobile ? 'bottom-4' : 'bottom-[calc(2.7rem+1.5rem)]'} border border-solid flex items-center justify-center shadow-lg active:scale-95 transition-all duration-150 hover:scale-105`}
        style={{
          background: epaperBg,
          borderColor: epaperBorder,
          color: epaperText,
          borderRadius: 9999,
          width: isMobile ? 44 : 48,
          height: isMobile ? 44 : 48,
          boxShadow: epaperShadow,
        }}
      >
        <Terminal className="w-5 h-5" />
      </button>

      {/* --- Main dev panel --- */}
      <div
        className={`fixed z-40 transition-all duration-500 ease-in-out
          bottom-0 rounded-t-2xl border-t border-solid flex flex-col
          ${open ? 'translate-y-0' : 'translate-y-full'}
          ${isMobile ? 'w-full left-0 right-0' : 'max-w-2xl left-1/2 -translate-x-1/2'}
        `}
        style={{
          background: epaperBg,
          borderColor: epaperBorder,
          boxShadow: epaperShadow,
          borderWidth: 2,
          marginBottom: isMobile ? 0 : 'var(--footer-height, 2.7rem)',
          height: fullHeight ? `calc(100vh - ${isMobile ? '0px' : 'var(--footer-height, 2.7rem)'})` : height,
          minHeight,
          maxHeight: `calc(100vh - ${isMobile ? '0px' : 'var(--footer-height, 2.7rem)'})`,
        }}
        role="complementary"
        aria-label="ESP32 Development Tools"
      >
        {/* --- Resize handle (desktop only) --- */}
        {!isMobile && (
          <div
            className="w-full h-4 cursor-ns-resize flex items-center justify-center border-b border-neutral-200"
            style={{ userSelect: 'none', touchAction: 'none' }}
            onMouseDown={e => { if (!fullHeight) startDrag(e) }}
          >
            <div className="w-12 h-1.5 rounded-full bg-neutral-400/60" />
          </div>
        )}

        {/* --- Header with tabs --- */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="font-mono font-bold text-lg">ESP32 Dev Tools</h3>
            <div className={`w-2 h-2 rounded-full ${status.cryptoReady ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'debug' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('debug')}
            >
              Debug
            </Button>
            <Button
              variant={activeTab === 'qr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('qr')}
            >
              QR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullHeight(f => !f)}
            >
              {fullHeight ? 'Window' : 'Full'}
            </Button>
          </div>
        </div>

        {/* --- Content area --- */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'debug' && (
            <div className="space-y-4">
              {/* --- ESP32 System Status --- */}
              <Card className="p-4">
                <h4 className="font-mono font-bold mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  System Status (ESP32 Simulation)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div>
                    <span className="text-gray-600">Crypto:</span>
                    <span className={`ml-2 ${status.cryptoReady ? 'text-green-600' : 'text-red-600'}`}>
                      {status.cryptoReady ? 'READY' : 'INIT'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Moments:</span>
                    <span className="ml-2 text-blue-600">{status.momentsCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Users:</span>
                    <span className="ml-2 text-purple-600">{status.usersActive}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Storage:</span>
                    <span className="ml-2 text-retro-coral-600">{status.storageUsed}KB</span>
                  </div>
                  <div>
                    <span className="text-gray-600">RAM:</span>
                    <span className="ml-2 text-gray-600">{status.memoryAvailable}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Flash:</span>
                    <span className="ml-2 text-gray-600">{status.flashAvailable}</span>
                  </div>
                </div>
              </Card>

              {/* --- Active Session Info --- */}
              {users.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-mono font-bold mb-3 flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Active Session
                  </h4>
                  <div className="space-y-2 text-sm font-mono">
                    {users.map((u, i) => (
                      <div 
                        key={u.did} 
                        className={`p-2 rounded ${i === activeUserIdx ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          {i === activeUserIdx && <span className="text-blue-600">⭐</span>}
                          <span className="text-gray-600">User {i + 1}:</span>
                          <span className="text-xs text-gray-500">{u.did.substring(0, 20)}...</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {u.moments.length} moments stored
                        </div>
                      </div>
                    ))}
                    {group.length > 1 && (
                      <div className="mt-2 p-2 bg-purple-100 rounded border border-purple-300">
                        <span className="font-bold text-purple-700">
                          Bonded Group: {group.length} devices
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* --- Recent Moments --- */}
              {moments.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-mono font-bold mb-3">
                    Recent Moments ({moments.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {moments.slice(-5).map((moment, index) => {
                      const date = new Date(moment.timestamp)
                      const timeStr = date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      return (
                        <div
                          key={index}
                          className="p-2 bg-gray-50 rounded text-xs font-mono"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-700">{timeStr}</span>
                            <span className="text-blue-600">#{moments.length - 4 + index}</span>
                          </div>
                          <div className="text-gray-500 truncate">
                            {moment.subject.substring(0, 40)}...
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'qr' && isClient && (
            <div className="flex flex-col items-center">
              <QRCodeDisplay sessionId={qrSessionId || 'demo-session'} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default DevToolsPanel 