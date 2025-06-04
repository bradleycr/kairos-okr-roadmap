// --- E-Paper Display Simulation ---
// 296×296 black-and-white display simulation
// Renders the same framebuffer that would appear on real ESP32 e-paper

"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'

interface CanvasPanelProps {
  width?: number
  height?: number
  scale?: number
  className?: string
  onTouch?: (x: number, y: number, type: 'down' | 'move' | 'up') => void
}

export class DisplayFramebuffer {
  private buffer: Uint8Array
  private dirty: boolean = false
  private dirtyRegions: Set<number> = new Set()
  
  constructor(
    public readonly width: number = 296,
    public readonly height: number = 296
  ) {
    // 1-bit framebuffer: 1 byte = 8 pixels
    this.buffer = new Uint8Array((width * height) / 8)
  }

  /**
   * Clear display to white
   */
  clear(): void {
    this.buffer.fill(0x00) // 0 = white in e-paper
    this.markAllDirty()
  }

  /**
   * Set a single pixel
   */
  setPixel(x: number, y: number, black: boolean): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    
    const byteIndex = Math.floor((y * this.width + x) / 8)
    const bitIndex = 7 - ((y * this.width + x) % 8)
    
    if (black) {
      this.buffer[byteIndex] |= (1 << bitIndex)  // Set bit for black
    } else {
      this.buffer[byteIndex] &= ~(1 << bitIndex) // Clear bit for white
    }
    
    this.markRegionDirty(x, y)
  }

  /**
   * Get pixel value
   */
  getPixel(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false
    
    const byteIndex = Math.floor((y * this.width + x) / 8)
    const bitIndex = 7 - ((y * this.width + x) % 8)
    
    return (this.buffer[byteIndex] & (1 << bitIndex)) !== 0
  }

  /**
   * Draw text using simple bitmap font
   */
  drawText(x: number, y: number, text: string, size: number = 1): void {
    const charWidth = 6 * size
    const charHeight = 8 * size
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      const charX = x + (i * charWidth)
      
      // Simple ASCII font patterns (basic 6x8 characters)
      const fontData = this.getFontData(char)
      
      for (let cy = 0; cy < 8; cy++) {
        for (let cx = 0; cx < 6; cx++) {
          const bit = (fontData[cy] >> (5 - cx)) & 1
          if (bit) {
            // Draw scaled pixel
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

  /**
   * Get ImageData for canvas rendering
   */
  getImageData(): ImageData {
    const imageData = new ImageData(this.width, this.height)
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pixel = this.getPixel(x, y)
        const color = pixel ? 0 : 255 // Black or white
        const index = (y * this.width + x) * 4
        
        imageData.data[index] = color     // R
        imageData.data[index + 1] = color // G
        imageData.data[index + 2] = color // B
        imageData.data[index + 3] = 255   // A
      }
    }
    
    return imageData
  }

  /**
   * Mark specific region as dirty for partial updates
   */
  private markRegionDirty(x: number, y: number): void {
    const region = Math.floor(y / 32) * Math.ceil(this.width / 32) + Math.floor(x / 32)
    this.dirtyRegions.add(region)
    this.dirty = true
  }

  /**
   * Mark entire display as dirty
   */
  private markAllDirty(): void {
    this.dirtyRegions.clear()
    for (let i = 0; i < Math.ceil(this.height / 32) * Math.ceil(this.width / 32); i++) {
      this.dirtyRegions.add(i)
    }
    this.dirty = true
  }

  /**
   * Get dirty regions for partial updates
   */
  getDirtyRegions(): Set<number> {
    return new Set(this.dirtyRegions)
  }

  /**
   * Clear dirty flag
   */
  clearDirty(): void {
    this.dirty = false
    this.dirtyRegions.clear()
  }

  /**
   * Check if display needs refresh
   */
  isDirty(): boolean {
    return this.dirty
  }

  /**
   * Simple font data for basic ASCII characters
   */
  private getFontData(charCode: number): number[] {
    // Basic 6x8 font patterns for common characters
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
      86: [0x22, 0x22, 0x22, 0x22, 0x14, 0x14, 0x08, 0x00], // V
      87: [0x22, 0x22, 0x22, 0x2A, 0x2A, 0x36, 0x22, 0x00], // W
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
      44: [0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x10, 0x00], // ,
      33: [0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x08, 0x00], // !
      63: [0x1C, 0x22, 0x02, 0x04, 0x08, 0x00, 0x08, 0x00], // ?
      58: [0x00, 0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00], // :
    }
    
    return fonts[charCode] || fonts[63] // Return '?' for unknown characters
  }
}

export default function CanvasPanel({
  width = 296,
  height = 296,
  scale = 2,
  className = '',
  onTouch
}: CanvasPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framebufferRef = useRef<DisplayFramebuffer>(new DisplayFramebuffer(width, height))
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  // Expose framebuffer globally for WebAssembly access
  useEffect(() => {
    ;(window as any).displayFramebuffer = framebufferRef.current
  }, [])

  /**
   * Render framebuffer to canvas
   */
  const renderCanvas = useCallback((partial: boolean = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const framebuffer = framebufferRef.current

    if (partial && !framebuffer.isDirty()) return

    // Get image data from framebuffer
    const imageData = framebuffer.getImageData()
    
    // Create temporary canvas for scaling
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')!
    
    tempCtx.putImageData(imageData, 0, 0)
    
    // Scale and draw to main canvas
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(tempCanvas, 0, 0, width * scale, height * scale)
    
    framebuffer.clearDirty()
  }, [width, height, scale])

  /**
   * Full display refresh (simulates e-paper full refresh)
   */
  const fullRefresh = useCallback(() => {
    setRefreshing(true)
    renderCanvas(false)
    
    // Simulate e-paper refresh time
    setTimeout(() => {
      setRefreshing(false)
      setLastRefresh(Date.now())
    }, 700)
  }, [renderCanvas])

  /**
   * Partial display update (simulates e-paper partial update)
   */
  const partialUpdate = useCallback(() => {
    renderCanvas(true)
    setLastRefresh(Date.now())
  }, [renderCanvas])

  // Expose refresh functions globally for WebAssembly
  useEffect(() => {
    ;(window as any).displayFullRefresh = fullRefresh
    ;(window as any).displayPartialUpdate = partialUpdate
  }, [fullRefresh, partialUpdate])

  // Handle touch/mouse events
  const handlePointerEvent = useCallback((event: React.PointerEvent, type: 'down' | 'move' | 'up') => {
    if (!onTouch || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / scale)
    const y = Math.floor((event.clientY - rect.top) / scale)

    // Ensure coordinates are within bounds
    if (x >= 0 && x < width && y >= 0 && y < height) {
      onTouch(x, y, type)
    }
  }, [onTouch, scale, width, height])

  // Animation loop for automatic updates
  useEffect(() => {
    let animationId: number

    const animate = () => {
      const framebuffer = framebufferRef.current
      if (framebuffer.isDirty() && !refreshing) {
        partialUpdate()
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [partialUpdate, refreshing])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width * scale}
        height={height * scale}
        className={`border-2 border-gray-800 bg-gray-100 cursor-crosshair ${
          refreshing ? 'opacity-50' : ''
        }`}
        onPointerDown={(e) => handlePointerEvent(e, 'down')}
        onPointerMove={(e) => handlePointerEvent(e, 'move')}
        onPointerUp={(e) => handlePointerEvent(e, 'up')}
        style={{
          imageRendering: 'pixelated',
          transition: refreshing ? 'opacity 0.7s ease' : 'none'
        }}
      />
      
      {refreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
          <div className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded">
            E-Paper Refreshing...
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-600 font-mono">
        {width} × {height} • Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
      </div>
    </div>
  )
} 