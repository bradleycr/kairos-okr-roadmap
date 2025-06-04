// --- ESP32 MELD Node Wearable Device ---
// Replaces the existing WearableDevice with bit-exact ESP32 simulation
// Maintains the same interface while providing realistic hardware behavior

"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HAL } from "@/lib/hardwareAbstraction"
import { Shield, Wifi, Hash, Check, Key, Cpu, Bluetooth, RefreshCw } from 'lucide-react'
import { eventBus } from "@/lib/hal/simulateTap"

interface ESP32WearableDeviceProps {
  text: string
  onTap: () => void
  disabled: boolean
  state: "default" | "identity" | "moment"
  screen?: string
  screenData?: any
  nodeId?: string
  ritualConfig?: any
  onDeviceLogUpdate?: (nodeId: string, deviceLog: ESP32DeviceLog) => void
}

interface PendantInteraction {
  timestamp: number
  pendantDID: string
  pendantId: string
  pendantName: string
  authResult: 'success' | 'failed' | 'pending'
  behaviorExecuted: string
  momentId?: string
  ritualId?: string
  signatureValid: boolean
  metadata?: any
}

interface ESP32DeviceLog {
  nodeId: string
  nodeName: string
  totalInteractions: number
  uniquePendants: Set<string>
  interactions: PendantInteraction[]
  lastSync: number
  pendantProfiles: Map<string, {
    name: string
    totalTaps: number
    lastSeen: number
    behaviors: string[]
    authSuccessRate: number
  }>
}

// Enhanced authentication state machine
type AuthState = 
  | 'WAITING'        // "Meld: Tap to begin"
  | 'NFC_DETECTED'   // NFC pendant detected
  | 'AUTHENTICATED'  // Show pendant DID + moment details
  | 'CONFIRMING'     // Show confirmation button
  | 'CONFIRMED'      // Success state
  | 'ERROR'          // Error state

// Display framebuffer simulation (296x296 e-paper)
class ESP32Display {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private framebuffer: Uint8Array
  private width = 296
  private height = 296
  
  constructor() {
    // 1-bit framebuffer: 1 byte = 8 pixels
    this.framebuffer = new Uint8Array((this.width * this.height) / 8)
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.clear()
  }

  clear() {
    this.framebuffer.fill(0x00) // 0 = white in e-paper
    this.updateCanvas()
  }

  setPixel(x: number, y: number, black: boolean) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    
    const byteIndex = Math.floor((y * this.width + x) / 8)
    const bitIndex = 7 - ((y * this.width + x) % 8)
    
    if (black) {
      this.framebuffer[byteIndex] |= (1 << bitIndex)
    } else {
      this.framebuffer[byteIndex] &= ~(1 << bitIndex)
    }
  }

  drawText(x: number, y: number, text: string, size: number = 1) {
    if (!text || typeof text !== 'string') return
    
    const charWidth = 6 * size
    const charHeight = 8 * size
    
    // Clean text: replace emoji and special chars with readable equivalents
    const cleanText = this.cleanTextForDisplay(text)
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText.charCodeAt(i)
      const charX = x + (i * charWidth)
      
      // Simple ASCII font patterns
      const fontData = this.getFontData(char)
      
      // Safety check
      if (!fontData || !Array.isArray(fontData) || fontData.length < 8) {
        continue
      }
      
      for (let cy = 0; cy < 8; cy++) {
        for (let cx = 0; cx < 6; cx++) {
          const bit = (fontData[cy] >> (5 - cx)) & 1
          if (bit) {
            for (let sy = 0; sy < size; sy++) {
              for (let sx = 0; sx < size; sx++) {
                this.setPixel(charX + cx * size + sx, y + cy * size + sy, true)
              }
            }
          }
        }
      }
    }
  }

  // Draw a pixel-perfect button (for confirmation) - Enhanced for e-paper
  drawButton(x: number, y: number, width: number, height: number, text: string, pressed: boolean = false) {
    // Draw thick button border for better e-paper visibility
    const borderThickness = 3
    
    // Outer border (thick black frame)
    for (let t = 0; t < borderThickness; t++) {
      for (let i = 0; i < width; i++) {
        this.setPixel(x + i, y + t, true) // Top
        this.setPixel(x + i, y + height - 1 - t, true) // Bottom
      }
      for (let i = 0; i < height; i++) {
        this.setPixel(x + t, y + i, true) // Left
        this.setPixel(x + width - 1 - t, y + i, true) // Right
      }
    }

    // Inner area - white background with black text, or inverted if pressed
    const innerX = x + borderThickness
    const innerY = y + borderThickness
    const innerWidth = width - (borderThickness * 2)
    const innerHeight = height - (borderThickness * 2)
    
    // Fill inner area
    for (let py = innerY; py < innerY + innerHeight; py++) {
      for (let px = innerX; px < innerX + innerWidth; px++) {
        this.setPixel(px, py, pressed) // White if not pressed, black if pressed
      }
    }

    // Draw button text (centered) - inverted color if pressed
    const textWidth = text.length * 6
    const textHeight = 8
    const textX = x + (width - textWidth) / 2
    const textY = y + (height - textHeight) / 2
    
    // Temporarily store original setPixel for text inversion
    const originalSetPixel = this.setPixel.bind(this)
    
    // Override setPixel for text rendering to handle inversion
    if (pressed) {
      this.setPixel = (px: number, py: number, black: boolean) => {
        originalSetPixel(px, py, !black) // Invert colors for pressed state
      }
    }
    
    this.drawText(Math.floor(textX), Math.floor(textY), text, 1)
    
    // Restore original setPixel
    this.setPixel = originalSetPixel
  }

  // Draw a truncated DID for display
  drawDID(x: number, y: number, did: string, size: number = 1) {
    // Extract key parts of DID for display
    const parts = did.split(':')
    if (parts.length >= 3) {
      const method = parts[0] + ':' + parts[1] // "did:key"
      const identifier = parts[2] // The base58 encoded key
      
      // Show method
      this.drawText(x, y, method.toUpperCase(), size)
      
      // Show truncated identifier (first 8 and last 4 chars)
      const truncated = identifier.length > 12 
        ? `${identifier.slice(0, 8)}...${identifier.slice(-4)}`
        : identifier
      
      this.drawText(x, y + (10 * size), truncated, size)
    } else {
      // Fallback: show truncated full DID
      const truncated = did.length > 20 
        ? `${did.slice(0, 16)}...`
        : did
      this.drawText(x, y, truncated.toUpperCase(), size)
    }
  }

  private cleanTextForDisplay(text: string): string {
    // Replace common emojis and Unicode with ASCII equivalents for ESP32 display
    const cleanedText = text
      .replace(/🎧/g, 'DJ')
      .replace(/🎥/g, 'VJ') 
      .replace(/🍸/g, 'BAR')
      .replace(/📡/g, 'NFC')
      .replace(/🔐/g, 'AUTH')
      .replace(/⚡/g, 'EXEC')
      .replace(/✨/g, 'SUCCESS')
      .replace(/💰/g, 'TIP')
      .replace(/🗳️/g, 'VOTE')
      .replace(/📊/g, 'COUNT')
      .replace(/🎨/g, 'LIGHT')
      .replace(/🔊/g, 'SOUND')
      .replace(/🔓/g, 'UNLOCK')
      .replace(/[^\x20-\x7E]/g, '?') // Replace any non-printable ASCII with ?
      .toUpperCase() // ESP32 displays often use uppercase for better readability
    
    // Debug logging
    if (text !== cleanedText) {
      console.log(`🖥️ ESP32 Display: "${text}" -> "${cleanedText}"`)
    }
    
    return cleanedText
  }

  private getFontData(charCode: number): number[] {
    const fonts: Record<number, number[]> = {
      32: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // Space
      65: [0x1C, 0x22, 0x22, 0x3E, 0x22, 0x22, 0x22, 0x00], // A
      66: [0x3C, 0x22, 0x22, 0x3C, 0x22, 0x22, 0x3C, 0x00], // B
      67: [0x1C, 0x22, 0x20, 0x20, 0x20, 0x22, 0x1C, 0x00], // C
      68: [0x3C, 0x22, 0x22, 0x22, 0x22, 0x22, 0x3C, 0x00], // D
      69: [0x3E, 0x20, 0x20, 0x3C, 0x20, 0x20, 0x3E, 0x00], // E
      70: [0x3E, 0x20, 0x20, 0x3C, 0x20, 0x20, 0x20, 0x00], // F
      71: [0x1C, 0x22, 0x20, 0x26, 0x22, 0x22, 0x1C, 0x00], // G
      72: [0x22, 0x22, 0x22, 0x3E, 0x22, 0x22, 0x22, 0x00], // H
      73: [0x1C, 0x08, 0x08, 0x08, 0x08, 0x08, 0x1C, 0x00], // I
      74: [0x0E, 0x04, 0x04, 0x04, 0x04, 0x24, 0x18, 0x00], // J
      75: [0x22, 0x24, 0x28, 0x30, 0x28, 0x24, 0x22, 0x00], // K
      76: [0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x3E, 0x00], // L
      77: [0x22, 0x36, 0x2A, 0x2A, 0x22, 0x22, 0x22, 0x00], // M
      78: [0x22, 0x32, 0x2A, 0x26, 0x22, 0x22, 0x22, 0x00], // N
      79: [0x1C, 0x22, 0x22, 0x22, 0x22, 0x22, 0x1C, 0x00], // O
      80: [0x3C, 0x22, 0x22, 0x3C, 0x20, 0x20, 0x20, 0x00], // P
      81: [0x1C, 0x22, 0x22, 0x22, 0x2A, 0x24, 0x1A, 0x00], // Q
      82: [0x3C, 0x22, 0x22, 0x3C, 0x28, 0x24, 0x22, 0x00], // R
      83: [0x1C, 0x22, 0x20, 0x1C, 0x02, 0x22, 0x1C, 0x00], // S
      84: [0x3E, 0x08, 0x08, 0x08, 0x08, 0x08, 0x08, 0x00], // T
      85: [0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x1C, 0x00], // U
      86: [0x22, 0x22, 0x22, 0x14, 0x14, 0x08, 0x08, 0x00], // V
      87: [0x22, 0x22, 0x2A, 0x2A, 0x2A, 0x36, 0x22, 0x00], // W
      88: [0x22, 0x22, 0x14, 0x08, 0x14, 0x22, 0x22, 0x00], // X
      89: [0x22, 0x22, 0x14, 0x08, 0x08, 0x08, 0x08, 0x00], // Y
      90: [0x3E, 0x02, 0x04, 0x08, 0x10, 0x20, 0x3E, 0x00], // Z
      // Numbers
      48: [0x1C, 0x22, 0x26, 0x2A, 0x32, 0x22, 0x1C, 0x00], // 0
      49: [0x08, 0x18, 0x08, 0x08, 0x08, 0x08, 0x1C, 0x00], // 1
      50: [0x1C, 0x22, 0x02, 0x0C, 0x10, 0x20, 0x3E, 0x00], // 2
      51: [0x1C, 0x22, 0x02, 0x0C, 0x02, 0x22, 0x1C, 0x00], // 3
      52: [0x04, 0x0C, 0x14, 0x24, 0x3E, 0x04, 0x04, 0x00], // 4
      53: [0x3E, 0x20, 0x3C, 0x02, 0x02, 0x22, 0x1C, 0x00], // 5
      54: [0x0C, 0x10, 0x20, 0x3C, 0x22, 0x22, 0x1C, 0x00], // 6
      55: [0x3E, 0x02, 0x04, 0x08, 0x10, 0x10, 0x10, 0x00], // 7
      56: [0x1C, 0x22, 0x22, 0x1C, 0x22, 0x22, 0x1C, 0x00], // 8
      57: [0x1C, 0x22, 0x22, 0x1E, 0x02, 0x04, 0x18, 0x00], // 9
      // Common symbols
      46: [0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00], // .
      58: [0x00, 0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00], // :
      33: [0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x08, 0x00], // !
      45: [0x00, 0x00, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x00], // -
      63: [0x1C, 0x22, 0x02, 0x04, 0x08, 0x00, 0x08, 0x00], // ?
      95: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3E, 0x00], // _
    }
    
    // Return font data or fallback to '?' character, or solid block if '?' doesn't exist
    return fonts[charCode] || fonts[63] || [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
  }

  updateCanvas() {
    if (!this.ctx || !this.canvas) return

    const imageData = this.ctx.createImageData(this.width, this.height)
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const byteIndex = Math.floor((y * this.width + x) / 8)
        const bitIndex = 7 - ((y * this.width + x) % 8)
        const pixel = (this.framebuffer[byteIndex] & (1 << bitIndex)) !== 0
        const color = pixel ? 0 : 255 // Black text on white background (correct e-paper behavior)
        const index = (y * this.width + x) * 4
        
        imageData.data[index] = color     // R
        imageData.data[index + 1] = color // G
        imageData.data[index + 2] = color // B
        imageData.data[index + 3] = 255   // A
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0)
  }
}

export default function ESP32WearableDevice({
  text,
  onTap,
  disabled,
  state,
  screen = "main",
  screenData,
  nodeId = "esp32-node",
  ritualConfig,
  onDeviceLogUpdate
}: ESP32WearableDeviceProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [nfcDetected, setNfcDetected] = useState(false)
  const [pendantData, setPendantData] = useState<{ did: string; id: string; name: string } | null>(null)
  const [momentId, setMomentId] = useState<string | undefined>(undefined)
  const [touchDetected, setTouchDetected] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [debugMessages, setDebugMessages] = useState<string[]>([])
  const [authState, setAuthState] = useState<AuthState>('WAITING')
  const [showPendantLog, setShowPendantLog] = useState(false)
  const [deviceLog, setDeviceLog] = useState<ESP32DeviceLog>({
    nodeId,
    nodeName: `MELD Node ${nodeId}`,
    totalInteractions: 0,
    uniquePendants: new Set(),
    interactions: [],
    lastSync: 0,
    pendantProfiles: new Map()
  })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayRef = useRef<ESP32Display>(new ESP32Display())
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const renderIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // E-ink/Kindle inspired palette
  const epaperBg = "#f5f5ec"
  const epaperBorder = "#b8b5a1"
  const epaperScreen = "#eae7df"
  const epaperText = "#44423a"
  const epaperShadow = "0 2px 12px 0 #b8b5a133"

  // Get dynamic text based on ritual configuration
  const getConfigurableText = (key: string, defaultText: string): string => {
    if (ritualConfig?.displayText) {
      return ritualConfig.displayText[key] || defaultText;
    }
    return defaultText;
  };

  const getBehaviorText = (): string => {
    // Get behavior from ritualConfig (this is the primary source)
    if (ritualConfig?.behavior) {
      const behavior = ritualConfig.behavior;
      switch (behavior) {
        case 'save_moment': return getConfigurableText('save_moment_label', 'SAVE MOMENT');
        case 'send_tip': return getConfigurableText('send_tip_label', 'SEND TIP');
        case 'vote_option_a': return getConfigurableText('vote_option_a_label', 'VOTE A');
        case 'vote_option_b': return getConfigurableText('vote_option_b_label', 'VOTE B');
        case 'unlock_content': return getConfigurableText('unlock_content_label', 'UNLOCK CONTENT');
        case 'trigger_light': return getConfigurableText('trigger_light_label', 'TRIGGER LIGHT');
        case 'play_sound': return getConfigurableText('play_sound_label', 'PLAY SOUND');
        case 'increment_counter': return getConfigurableText('increment_counter_label', 'INCREMENT');
        case 'custom': return getConfigurableText('custom_behavior_label', 'CUSTOM ACTION');
        default: return behavior.replace('_', ' ').toUpperCase();
      }
    }
    
    // Fallback: check screenData for behavior (alternate source)
    if (screenData?.behavior) {
      const behavior = screenData.behavior;
      switch (behavior) {
        case 'save_moment': return getConfigurableText('save_moment_label', 'SAVE MOMENT');
        case 'send_tip': return getConfigurableText('send_tip_label', 'SEND TIP');
        case 'vote_option_a': return getConfigurableText('vote_option_a_label', 'VOTE A');
        case 'vote_option_b': return getConfigurableText('vote_option_b_label', 'VOTE B');
        case 'unlock_content': return getConfigurableText('unlock_content_label', 'UNLOCK CONTENT');
        case 'trigger_light': return getConfigurableText('trigger_light_label', 'TRIGGER LIGHT');
        case 'play_sound': return getConfigurableText('play_sound_label', 'PLAY SOUND');
        case 'increment_counter': return getConfigurableText('increment_counter_label', 'INCREMENT');
        case 'custom': return getConfigurableText('custom_behavior_label', 'CUSTOM ACTION');
        default: return behavior.replace('_', ' ').toUpperCase();
      }
    }
    
    // Final fallback: use text prop or default
    return text.split('\n')[1]?.replace('_', ' ')?.toUpperCase() || 'SAVE MOMENT';
  };

  const getRitualLabel = (): string => {
    return ritualConfig?.name || 'NO RITUAL';
  };

  const updateDisplay = useCallback(() => {
    if (!displayRef.current) return;

    const display = displayRef.current;
    display.clear(); // Always clear before drawing

    // Draw main content based on AuthState
    switch (authState) {
      case 'WAITING':
        // "Meld: Tap to begin" screen - MUCH LARGER fonts with perfect centering
        const waitingTitle = getConfigurableText('waiting_title', 'MELD')
        const waitingSubtitle = getConfigurableText('waiting_subtitle', 'TAP TO BEGIN')
        
        // Center "MELD" title (4 chars * 6px * 4 size = 96px width)
        const titleWidth = waitingTitle.length * 6 * 4
        const titleX = (296 - titleWidth) / 2  // Perfect horizontal center
        display.drawText(Math.floor(titleX), 50, waitingTitle, 4)
        
        // Center "TAP TO BEGIN" subtitle (11 chars * 6px * 2 size = 132px width)
        const subtitleWidth = waitingSubtitle.length * 6 * 2
        const subtitleX = (296 - subtitleWidth) / 2  // Perfect horizontal center
        display.drawText(Math.floor(subtitleX), 120, waitingSubtitle, 2)
        
        // Show ritual-specific action at bottom - centered
        const actionText = `ACTION: ${getBehaviorText()}`
        const actionWidth = actionText.length * 6 * 2
        const actionX = (296 - actionWidth) / 2
        display.drawText(Math.floor(actionX), 200, actionText, 2)
        
        // Show security mode indicator - centered
        const modeText = "NODE SIMULATION"
        const modeWidth = modeText.length * 6 * 1
        const modeX = (296 - modeWidth) / 2
        display.drawText(Math.floor(modeX), 270, modeText, 1)
        break
        
      case 'NFC_DETECTED':
        // NFC detection screen - centered fonts
        const detectedTitle = getConfigurableText('detected_title', 'NFC DETECTED')
        const detectedSubtitle = getConfigurableText('detected_subtitle', 'AUTHENTICATING...')
        
        // Center "NFC DETECTED" 
        const nfcTitleWidth = detectedTitle.length * 6 * 3
        const nfcTitleX = (296 - nfcTitleWidth) / 2
        display.drawText(Math.floor(nfcTitleX), 70, detectedTitle, 3)
        
        // Center "AUTHENTICATING..."
        const nfcSubWidth = detectedSubtitle.length * 6 * 2
        const nfcSubX = (296 - nfcSubWidth) / 2
        display.drawText(Math.floor(nfcSubX), 130, detectedSubtitle, 2)
        
        // Show scanning animation centered next to subtitle
        const dots = Math.floor(Date.now() / 500) % 4
        const dotText = '.'.repeat(dots + 1)
        const dotX = nfcSubX + nfcSubWidth + 10
        display.drawText(dotX, 130, dotText, 2)
        break
        
      case 'AUTHENTICATED':
        // Show pendant DID and moment details - centered layout
        const authTitle = getConfigurableText('auth_title', 'AUTHENTICATED')
        
        // Center "AUTHENTICATED" title
        const authTitleWidth = authTitle.length * 6 * 3
        const authTitleX = (296 - authTitleWidth) / 2
        display.drawText(Math.floor(authTitleX), 30, authTitle, 3)
        
        if (pendantData) {
          // Show pendant name - centered
          const pendantText = pendantData.name.length > 12 
            ? pendantData.name.substring(0, 12) 
            : pendantData.name
          const pendantWidth = pendantText.length * 6 * 2
          const pendantX = (296 - pendantWidth) / 2
          display.drawText(Math.floor(pendantX), 80, pendantText.toUpperCase(), 2)
          
          // Show DID label - centered
          const didLabelWidth = 4 * 6 * 2  // "DID:" is 4 chars
          const didLabelX = (296 - didLabelWidth) / 2
          display.drawText(Math.floor(didLabelX), 110, 'DID:', 2)
          
          // Show truncated DID - centered below label
          const didText = pendantData.did.startsWith('did:key:') 
            ? pendantData.did.substring(8, 20) + '...' 
            : pendantData.did.substring(0, 12) + '...'
          const didWidth = didText.length * 6 * 1
          const didX = (296 - didWidth) / 2
          display.drawText(Math.floor(didX), 140, didText, 1)
        }
        
        // Show prominent button with the ritual-specific action name - always centered
        const behaviorText = getBehaviorText()
        display.drawButton(20, 200, 256, 60, behaviorText, false)
        break
        
      case 'CONFIRMING':
        // Brief execution feedback - centered layout
        const confirmTitle = getConfigurableText('confirm_title', 'EXECUTING')
        const confirmTitleWidth = confirmTitle.length * 6 * 3
        const confirmTitleX = (296 - confirmTitleWidth) / 2
        display.drawText(Math.floor(confirmTitleX), 30, confirmTitle, 3)
        
        if (pendantData) {
          const pendantText = pendantData.name.length > 12 
            ? pendantData.name.substring(0, 12) 
            : pendantData.name
          const pendantWidth = pendantText.length * 6 * 2
          const pendantX = (296 - pendantWidth) / 2
          display.drawText(Math.floor(pendantX), 80, pendantText.toUpperCase(), 2)
          
          const didLabelWidth = 4 * 6 * 2
          const didLabelX = (296 - didLabelWidth) / 2
          display.drawText(Math.floor(didLabelX), 110, 'DID:', 2)
          
          const didText = pendantData.did.startsWith('did:key:') 
            ? pendantData.did.substring(8, 20) + '...' 
            : pendantData.did.substring(0, 12) + '...'
          const didWidth = didText.length * 6 * 1
          const didX = (296 - didWidth) / 2
          display.drawText(Math.floor(didX), 140, didText, 1)
        }
        
        // Show pressed button state with "EXECUTING..." - centered
        display.drawButton(20, 200, 256, 60, 'EXECUTING...', true)
        break
        
      case 'CONFIRMED':
        // Success screen - centered layout
        const successTitle = getConfigurableText('success_title', 'SUCCESS!')
        const successSubtitle = getConfigurableText('success_subtitle', 'MOMENT SAVED')
        
        // Center success title
        const successTitleWidth = successTitle.length * 6 * 3
        const successTitleX = (296 - successTitleWidth) / 2
        display.drawText(Math.floor(successTitleX), 80, successTitle, 3)
        
        // Center success subtitle - but make it ritual-specific
        const ritualSuccessText = `${getBehaviorText()} COMPLETE`
        const successSubWidth = ritualSuccessText.length * 6 * 2
        const successSubX = (296 - successSubWidth) / 2
        display.drawText(Math.floor(successSubX), 130, ritualSuccessText, 2)
        
        // Center auto-return message
        const returnText = 'RETURNING...'
        const returnWidth = returnText.length * 6 * 2
        const returnX = (296 - returnWidth) / 2
        display.drawText(Math.floor(returnX), 220, returnText, 2)
        break
        
      case 'ERROR':
        // Error screen - centered layout
        const errorTitle = getConfigurableText('error_title', 'ERROR')
        const errorSubtitle = getConfigurableText('error_subtitle', 'TRY AGAIN')
        
        // Center error title
        const errorTitleWidth = errorTitle.length * 6 * 3
        const errorTitleX = (296 - errorTitleWidth) / 2
        display.drawText(Math.floor(errorTitleX), 80, errorTitle, 3)
        
        // Center error subtitle
        const errorSubWidth = errorSubtitle.length * 6 * 2
        const errorSubX = (296 - errorSubWidth) / 2
        display.drawText(Math.floor(errorSubX), 130, errorSubtitle, 2)
        
        // Center instruction text
        const checkText = 'CHECK PENDANT'
        const checkWidth = checkText.length * 6 * 2
        const checkX = (296 - checkWidth) / 2
        display.drawText(Math.floor(checkX), 180, checkText, 2)
        
        const retryText = 'TAP TO RETRY'
        const retryWidth = retryText.length * 6 * 2
        const retryX = (296 - retryWidth) / 2
        display.drawText(Math.floor(retryX), 220, retryText, 2)
        break
        
      default:
        // Fallback to original display logic with better centering
        const lines = text.split('\n')
        let y = 20
        lines.forEach((line, index) => {
          if (line.trim() === '') {
            y += 15
            return
          }
          
          const size = index === 0 ? 3 : 2
          const lineHeight = size === 3 ? 35 : 25
          const maxChars = size === 3 ? 10 : 16
          const displayLine = line.length > maxChars ? line.substring(0, maxChars - 3) + '...' : line
          
          // Center each line
          const lineWidth = displayLine.length * 6 * size
          const lineX = (296 - lineWidth) / 2
          display.drawText(Math.floor(lineX), y, displayLine, size)
          y += lineHeight
        })
    }

    display.updateCanvas();
  }, [authState, pendantData, momentId, screen, text, nodeId, ritualConfig, getConfigurableText, getBehaviorText]);

  // Initialize display on component mount
  useEffect(() => {
    if (canvasRef.current) {
      displayRef.current = new ESP32Display()
      displayRef.current.setCanvas(canvasRef.current)
      // Initial clear and render
      updateDisplay()
    }

    // Cleanup on unmount
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current)
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  // Update display when relevant state changes
  useEffect(() => {
    updateDisplay()
  }, [authState, pendantData, momentId, screen, screenData, ritualConfig, updateDisplay]) // Added updateDisplay to dependencies

  // Watch for ritual configuration changes and update display in real-time
  useEffect(() => {
    if (ritualConfig) {
      console.log(`🎭 [${nodeId}] Ritual configuration updated:`, ritualConfig.label, ritualConfig.behavior)
      // Force display update with new configuration
      updateDisplay()
    }
  }, [ritualConfig, updateDisplay])

  // Simulate ESP32 screen refresh timing (realistic 650ms for e-paper)
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    // Trigger display update instead of non-existent refresh method
    setTimeout(updateDisplay, 50)
  }, [updateDisplay])

  const addDebugMessage = useCallback((message: string) => {
    // Debug messages for ESP32 simulation
  }, [])

  // Enhanced authentication flow
  const executeAuthenticationFlow = useCallback(async () => {
    // Check if we have screenData for authentication
    if (!screenData?.pendantDID || !screenData?.pendantId) {
      console.log('No pendant data available for authentication')
      return
    }

    addDebugMessage('Starting authentication flow')
    
    // Simulate NFC detection
    setAuthState('NFC_DETECTED')
    setNfcDetected(true)
    
    // Use actual pendant data from screenData
    setTimeout(() => {
      const pendantData = {
        did: screenData.pendantDID,
        id: screenData.pendantId,
        name: screenData.pendantName || 'User Pendant'
      }
      
      setPendantData(pendantData)
      setAuthState('AUTHENTICATED')
      addDebugMessage(`Authenticated: ${pendantData.name}`)
      
      // Generate moment ID
      const momentId = `moment-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
      setMomentId(momentId)
      
      triggerRefresh()
    }, 1500)
  }, [screenData, addDebugMessage, triggerRefresh])

  // Add pendant interaction to device log (moved before usage)
  const logPendantInteraction = useCallback((interaction: Omit<PendantInteraction, 'timestamp'>) => {
    const timestamp = Date.now()
    const fullInteraction: PendantInteraction = { ...interaction, timestamp }
    
    setDeviceLog(prevLog => {
      const newInteractions = [...prevLog.interactions, fullInteraction]
      const newUniquePendants = new Set(prevLog.uniquePendants)
      newUniquePendants.add(interaction.pendantDID)
      
      // Update pendant profile
      const newPendantProfiles = new Map(prevLog.pendantProfiles)
      const existingProfile = newPendantProfiles.get(interaction.pendantDID)
      
      if (existingProfile) {
        const successfulTaps = newInteractions.filter(i => 
          i.pendantDID === interaction.pendantDID && i.authResult === 'success'
        ).length
        const totalTaps = newInteractions.filter(i => i.pendantDID === interaction.pendantDID).length
        
        newPendantProfiles.set(interaction.pendantDID, {
          ...existingProfile,
          totalTaps,
          lastSeen: timestamp,
          behaviors: [...new Set([...existingProfile.behaviors, interaction.behaviorExecuted])],
          authSuccessRate: Math.round((successfulTaps / totalTaps) * 100)
        })
      } else {
        newPendantProfiles.set(interaction.pendantDID, {
          name: interaction.pendantName,
          totalTaps: 1,
          lastSeen: timestamp,
          behaviors: [interaction.behaviorExecuted],
          authSuccessRate: interaction.authResult === 'success' ? 100 : 0
        })
      }
      
      const updatedLog = {
        ...prevLog,
        totalInteractions: newInteractions.length,
        uniquePendants: newUniquePendants,
        interactions: newInteractions.slice(-100), // Keep last 100 interactions
        pendantProfiles: newPendantProfiles
      }
      
      // Notify parent component of log update
      if (onDeviceLogUpdate) {
        // Defer parent state update to avoid setState during render
        setTimeout(() => {
          onDeviceLogUpdate(nodeId, updatedLog)
        }, 0)
      }
      
      // Emit event for real-time updates
      setTimeout(() => {
        eventBus.emit('esp32LogUpdate', {
          nodeId,
          deviceLog: updatedLog,
          interaction: fullInteraction
        })
      }, 0)
      
      return updatedLog
    })
    
    console.log(`📝 ESP32 ${nodeId} logged interaction:`, fullInteraction)
  }, [nodeId, onDeviceLogUpdate])

  // Listen for interaction logging events from main page
  useEffect(() => {
    const handleLogInteractionEvent = (data: any) => {
      if (data.nodeId === nodeId && data.interaction) {
        console.log(`📝 [${nodeId}] Received interaction logging event:`, data.interaction)
        logPendantInteraction(data.interaction)
      }
    }
    
    eventBus.on('esp32LogInteraction', handleLogInteractionEvent)
    
    return () => {
      eventBus.off('esp32LogInteraction', handleLogInteractionEvent)
    }
  }, [nodeId, logPendantInteraction])

  // Sync with parent component state
  useEffect(() => {
    if (screenData?.nodeState) {
      const stateMapping: Record<string, AuthState> = {
        'idle': 'WAITING',
        'detecting': 'NFC_DETECTED',
        'authenticating': 'AUTHENTICATED',
        'executing': 'CONFIRMING',   // Show button press effect during execution
        'success': 'CONFIRMED'
      }
      
      const newAuthState = stateMapping[screenData.nodeState] || 'WAITING'
      if (newAuthState !== authState) {
        setAuthState(newAuthState)
        
        // Set pendant data if available
        if (screenData.pendantDID && newAuthState !== 'WAITING') {
          setPendantData({
            did: screenData.pendantDID,
            id: screenData.pendantId || 'unknown',
            name: screenData.pendantName || 'User Pendant'
          })
          
          // Generate moment ID when moving to AUTHENTICATED state
          if (newAuthState === 'AUTHENTICATED' && !momentId) {
            const newMomentId = `moment-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
            setMomentId(newMomentId)
            console.log('🆔 Generated moment ID:', newMomentId)
          }
          
          // Log successful authentication when confirmed
          if (newAuthState === 'CONFIRMED') {
            logPendantInteraction({
              pendantDID: screenData.pendantDID,
              pendantId: screenData.pendantId || 'unknown',
              pendantName: screenData.pendantName || 'User Pendant',
              authResult: 'success',
              behaviorExecuted: ritualConfig?.behavior || 'save_moment',
              momentId: momentId,
              ritualId: ritualConfig?.ritualId,
              signatureValid: true,
              metadata: {
                nodeState: screenData.nodeState,
                timestamp: Date.now()
              }
            })
          }
        } else if (newAuthState === 'WAITING') {
          setPendantData(null)
          setMomentId(undefined)
          setNfcDetected(false)
        }
        
        // Always update display when state changes
        updateDisplay()
      }
    }
  }, [screenData?.nodeState, screenData?.pendantDID, screenData?.pendantId, screenData?.pendantName, authState, momentId, updateDisplay, logPendantInteraction, ritualConfig])

  // Handle device tap based on current state
  const handleTap = useCallback(() => {
    if (disabled) return
    
    setIsAnimating(true)
    setTouchDetected(true)
    
    // Always call the parent onTap handler for state management
    onTap()
    
    // Reset touch state
    setTimeout(() => {
      setIsAnimating(false)
      setTouchDetected(false)
    }, 1000)
    
    HAL.vibration.vibrate([50, 30, 100])
  }, [disabled, onTap])

  const [buzzerActive, setBuzzerActive] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Simulate syncing logs to cloud/hub
  const syncLogsToHub = useCallback(async () => {
    setRefreshing(true)
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setDeviceLog(prevLog => ({
      ...prevLog,
      lastSync: Date.now()
    }))
    
    setRefreshing(false)
    
    // In real hardware: Upload via WiFi/Bluetooth to Raspberry Pi hub
    console.log(`📡 ESP32 ${nodeId} synced ${deviceLog.totalInteractions} interactions to hub`)
  }, [nodeId, deviceLog.totalInteractions])

  return (
    <div className="relative">
      {/* ESP32 Device Housing */}
      <div 
        className={`relative p-3 rounded-3xl border-4 transition-all duration-300 cursor-pointer select-none ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-lg active:scale-95'
        } ${isAnimating ? 'animate-pulse' : ''}`}
        style={{
          backgroundColor: epaperBg,
          borderColor: epaperBorder,
          boxShadow: epaperShadow
        }}
        onClick={handleTap}
      >
        {/* Device Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-2">
          {/* NFC Indicator */}
          <div 
            className={`w-2 h-2 rounded-full transition-colors ${nfcDetected ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} 
            title="NFC Activity"
          />
          
          {/* Touch Indicator */}
          <div 
            className={`w-2 h-2 rounded-full transition-colors ${touchDetected ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'}`} 
            title="Touch Activity"
          />
        </div>

        {/* E-Paper Display - Perfect size that doesn't crowd the screen */}
        <div 
          className={`w-72 h-72 mx-auto rounded-lg border-2 relative overflow-hidden ${
            refreshing ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: epaperScreen,
            borderColor: epaperBorder,
            // Enhanced e-paper texture for more realistic appearance
            backgroundImage: `
              repeating-radial-gradient(circle, #d6d3c2 0.5px, transparent 1.5px, transparent 8px),
              linear-gradient(45deg, transparent 49%, rgba(214,211,194,0.1) 50%, transparent 51%)
            `,
            // Add subtle grain texture
            boxShadow: `
              inset 0 0 20px rgba(0,0,0,0.05),
              ${epaperShadow}
            `
          }}
        >
          <canvas
            ref={canvasRef}
            width={296}
            height={296}
            className="w-full h-full"
            style={{
              imageRendering: 'pixelated',
              opacity: refreshing ? 0.3 : 1,  // More dramatic refresh effect
              transition: 'opacity 0.65s ease-in-out',  // Match e-paper refresh timing
              filter: 'contrast(1.8) brightness(1.1)',  // Enhanced contrast for better visibility
              backgroundColor: '#ffffff'  // Ensure white background
            }}
          />
          
          {refreshing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs font-mono text-gray-600 bg-white/80 px-2 py-1 rounded">
                ⚡ E-Paper Refreshing...
              </div>
            </div>
          )}
          
          {/* E-paper refresh indicator */}
          <div className="absolute top-1 right-1">
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                refreshing ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'
              }`} 
              title="E-Paper Refresh Status"
            />
          </div>
        </div>

        {/* Hardware Status - Clean and simple */}
        <div className="mt-2 flex justify-between items-center">
          <div className="flex gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>240MHz</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              <span>NFC</span>
            </div>
            <div className="flex items-center gap-1">
              <Bluetooth className="w-3 h-3" />
              <span>BLE</span>
            </div>
          </div>
          
          {/* Device model info */}
          <div className="text-xs text-gray-500 font-mono">
            ESP32-S3
          </div>
        </div>
      </div>

      {/* Debug Console */}
      {debugMessages.length > 0 && (
        <div className="mt-2 p-2 bg-black rounded text-green-400 text-xs font-mono max-h-20 overflow-y-auto">
          {debugMessages.map((msg, index) => (
            <div key={index}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  )
} 