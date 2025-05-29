"use client"
import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import CryptoDiagnostics from "@/app/cryptoDiagnostics/page"
import QRCodeDisplay from "@/components/qr-code-display"

interface DevToolsPanelProps {
  children?: React.ReactNode
  sessionId?: string // Optional, for QRCodeDisplay
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ children, sessionId }) => {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(400) // Safe default for SSR
  const [fullHeight, setFullHeight] = useState(false)
  const [qrSessionId, setQrSessionId] = useState<string | undefined>(sessionId)
  const minHeight = 180

  // --- Kindle/ATM e-paper inspired palette ---
  const epaperBg = "#f5f5ec" // soft e-ink background
  const epaperBorder = "#b8b5a1" // classic e-ink border
  const epaperScreen = "#eae7df" // screen area
  const epaperText = "#44423a" // dark e-ink text
  const epaperShadow = "0 2px 12px 0 #b8b5a133"

  // Always collapse on mount (handles hot reloads/dev state persistence)
  useEffect(() => {
    setOpen(false)
  }, [])

  // Set initial height and update on resize (client only)
  useEffect(() => {
    if (fullHeight) return
    const setInitialHeight = () => setHeight(Math.max(minHeight, 0.6 * window.innerHeight))
    setInitialHeight()
    window.addEventListener('resize', setInitialHeight)
    return () => window.removeEventListener('resize', setInitialHeight)
  }, [fullHeight])

  // Set QR sessionId from URL if not provided (client only)
  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setQrSessionId(params.get('session') || 'demo-session')
    }
  }, [sessionId])

  // Drag to resize
  const startDrag = (e: React.MouseEvent) => {
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

  return (
    <>
      {/* --- E-ink style round toggle button --- */}
      <button
        aria-label={open ? "Hide Dev Tools" : "Show Dev Tools"}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="fixed z-[100] right-4 bottom-[calc(2.7rem+1.5rem)] border border-solid"
        style={{
          background: epaperBg,
          borderColor: epaperBorder,
          color: epaperText,
          borderRadius: 9999,
          width: 48,
          height: 48,
          boxShadow: epaperShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="sr-only">Toggle Dev Tools</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={epaperText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
      </button>
      {/* --- E-ink floating panel --- */}
      <div
        className={`fixed z-40 transition-all duration-500 ease-in-out
          w-full left-0 right-0 bottom-0 rounded-t-2xl border-t border-solid flex flex-col
          ${open ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          background: epaperBg,
          borderColor: epaperBorder,
          boxShadow: epaperShadow,
          borderWidth: 2,
          borderRightWidth: 0,
          marginBottom: 'var(--footer-height, 2.7rem)',
          height: fullHeight ? `calc(100vh - var(--footer-height, 2.7rem))` : height,
          minHeight,
          maxHeight: `calc(100vh - var(--footer-height, 2.7rem))`,
        }}
        role="complementary"
        aria-label="Developer Tools Panel"
        tabIndex={-1}
      >
        {/* --- Resize handle --- */}
        <div
          className="w-full h-4 cursor-ns-resize flex items-center justify-center"
          style={{ userSelect: 'none', touchAction: 'none' }}
          onMouseDown={e => { if (!fullHeight) startDrag(e) }}
        >
          <div className="w-12 h-1.5 rounded-full bg-neutral-400/60" />
        </div>
        {/* --- Full Height Toggle --- */}
        <button
          className="absolute right-6 top-4 px-3 py-1 rounded-full text-xs font-mono border border-neutral-300 bg-white/80 shadow-sm hover:bg-neutral-100 transition"
          style={{ zIndex: 10 }}
          onClick={() => setFullHeight(f => !f)}
        >
          {fullHeight ? 'Windowed' : 'Full Height'}
        </button>
        {/* --- E-ink screen area --- */}
        <div
          className="flex-1 overflow-y-auto flex flex-col"
          style={{
            background: epaperScreen,
            borderRadius: 18,
            margin: 16,
            boxShadow: 'inset 0 2px 8px 0 #b8b5a122',
            border: `1.5px solid ${epaperBorder}`,
            padding: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* --- Panel header, e-ink style --- */}
          <div className="flex items-center gap-2 border-b border-solid" style={{ borderColor: epaperBorder, padding: '16px 16px 8px 16px' }}>
            <span className="font-mono text-lg tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>Dev Tools</span>
            <span className="ml-auto text-xs" style={{ color: '#88887a', fontFamily: 'DM Mono, Courier, monospace' }}>(for developers)</span>
          </div>
          <div className="p-4" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace', fontSize: 15 }}>
            {/* Add more dev tools here as needed */}
            <QRCodeDisplay sessionId={qrSessionId || 'demo-session'} />
            <CryptoDiagnostics />
            {children}
          </div>
        </div>
        {/* TODO: Add focus trap here for accessibility if panel is open */}
      </div>
    </>
  )
}

export default DevToolsPanel; 