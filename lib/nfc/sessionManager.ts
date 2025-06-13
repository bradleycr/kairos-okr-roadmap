/**
 * 🔐 Session Manager
 * 
 * Handles user session tracking for NFC authentication
 * Detects same-chip vs different-chip scenarios
 */

import type { UserSession } from '@/app/api/nfc/sessions/route'

export interface SessionInfo {
  currentUser: {
    chipUID: string
    displayName: string
    sessionId: string
    lastAuthenticated: string
  } | null
  isActive: boolean
  deviceFingerprint: string
}

/**
 * Generate a device fingerprint for session tracking
 */
export function generateDeviceFingerprint(): string {
  // Create a simple but relatively unique device fingerprint
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')
  
  // Create a hash of the fingerprint
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return `device_${Math.abs(hash).toString(36)}`
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private static deviceFingerprint: string | null = null
  
  /**
   * Initialize session manager
   */
  static initialize(): void {
    if (typeof window !== 'undefined') {
      this.deviceFingerprint = generateDeviceFingerprint()
    }
  }
  
  /**
   * Get device fingerprint
   */
  static getDeviceFingerprint(): string {
    if (!this.deviceFingerprint) {
      this.initialize()
    }
    return this.deviceFingerprint || 'unknown'
  }
  
  /**
   * Create a new session
   */
  static async createSession(chipUID: string): Promise<UserSession | null> {
    try {
      const response = await fetch('/api/nfc/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chipUID,
          deviceInfo: navigator.userAgent,
          deviceFingerprint: this.getDeviceFingerprint()
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.session) {
        // Store session ID locally for quick access
        localStorage.setItem('kairos_session_id', data.session.sessionId)
        localStorage.setItem('kairos_current_user', chipUID)
        return data.session
      }
      
      return null
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }
  
  /**
   * Get current active session
   */
  static async getCurrentSession(): Promise<SessionInfo> {
    try {
      const sessionId = localStorage.getItem('kairos_session_id')
      const currentUser = localStorage.getItem('kairos_current_user')
      
      if (!sessionId || !currentUser) {
        return {
          currentUser: null,
          isActive: false,
          deviceFingerprint: this.getDeviceFingerprint()
        }
      }
      
      // Verify session is still valid
      const response = await fetch('/api/nfc/sessions', {
        method: 'GET',
        headers: {
          'X-Session-ID': sessionId
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.session && data.session.isActive) {
        // Update last activity
        await this.updateSessionActivity(sessionId)
        
        return {
          currentUser: {
            chipUID: data.session.chipUID,
            displayName: await this.getDisplayName(data.session.chipUID),
            sessionId: data.session.sessionId,
            lastAuthenticated: data.session.lastAuthenticated
          },
          isActive: true,
          deviceFingerprint: this.getDeviceFingerprint()
        }
      } else {
        // Session is invalid, clear local storage
        this.clearLocalSession()
        return {
          currentUser: null,
          isActive: false,
          deviceFingerprint: this.getDeviceFingerprint()
        }
      }
    } catch (error) {
      console.error('Failed to get current session:', error)
      return {
        currentUser: null,
        isActive: false,
        deviceFingerprint: this.getDeviceFingerprint()
      }
    }
  }
  
  /**
   * Check if tapped chip is same as current user
   */
  static async isSameChip(tappedChipUID: string): Promise<boolean> {
    const session = await this.getCurrentSession()
    return session.currentUser?.chipUID === tappedChipUID
  }
  
  /**
   * Verify session token cryptographically
   */
  static async verifySessionToken(sessionToken: string): Promise<boolean> {
    try {
      const response = await fetch('/api/nfc/sessions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sessionToken,
          deviceFingerprint: this.getDeviceFingerprint()
        })
      })
      
      const data = await response.json()
      return data.success && data.isValid
    } catch (error) {
      console.error('Failed to verify session token:', error)
      return false
    }
  }
  
  /**
   * Update session activity
   */
  static async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await fetch('/api/nfc/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })
    } catch (error) {
      console.error('Failed to update session activity:', error)
    }
  }
  
  /**
   * Clear session (logout)
   */
  static async clearSession(): Promise<void> {
    try {
      const sessionId = localStorage.getItem('kairos_session_id')
      
      if (sessionId) {
        await fetch('/api/nfc/sessions', {
          method: 'DELETE',
          headers: {
            'X-Session-ID': sessionId
          }
        })
      }
      
      this.clearLocalSession()
    } catch (error) {
      console.error('Failed to clear session:', error)
      this.clearLocalSession() // Clear local session regardless
    }
  }
  
  /**
   * Clear local session data
   */
  private static clearLocalSession(): void {
    localStorage.removeItem('kairos_session_id')
    localStorage.removeItem('kairos_current_user')
  }
  
  /**
   * Get display name for user
   */
  private static async getDisplayName(chipUID: string): Promise<string> {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'GET',
        headers: {
          'X-Chip-UID': chipUID
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.account) {
        return data.account.displayName || `User ${chipUID.slice(-4).toUpperCase()}`
      }
      
      return `User ${chipUID.slice(-4).toUpperCase()}`
    } catch (error) {
      console.error('Failed to get display name:', error)
      return `User ${chipUID.slice(-4).toUpperCase()}`
    }
  }
} 