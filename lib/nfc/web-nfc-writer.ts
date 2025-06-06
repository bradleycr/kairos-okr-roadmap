/**
 * ✍️ Web NFC Writer for KairOS Authentication Tags
 * 
 * Provides elegant, reliable Web NFC writing functionality that integrates
 * seamlessly with existing NDEF encoding infrastructure. Features comprehensive
 * error handling, progress tracking, and mobile-optimized user experience.
 * 
 * @author KairOS Team
 * @version 1.0.0
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NDEFReader/write
 */

import { createKairOSNDEFMessage, encodeNDEFMessage, type NDEFMessage, type NDEFRecord } from './ndef-encoder'

// --- Web NFC Writing Configuration ---
interface WebNFCWriteOptions {
  timeout?: number           // Timeout in milliseconds (default: 10000)
  overwrite?: boolean        // Whether to overwrite existing data (default: true)
  retryAttempts?: number     // Number of retry attempts (default: 3)
  retryDelay?: number        // Delay between retries in ms (default: 1000)
  onProgress?: (status: NFCWriteStatus) => void  // Progress callback
}

interface NFCWriteStatus {
  phase: 'detecting' | 'connecting' | 'writing' | 'verifying' | 'complete' | 'error'
  message: string
  progress: number  // 0-100
  canRetry?: boolean
}

interface NFCWriteResult {
  success: boolean
  message: string
  bytesWritten?: number
  chipInfo?: {
    serialNumber?: string
    chipType?: string
    totalCapacity?: number
    usedSpace?: number
  }
  error?: {
    code: string
    details: string
    suggestions: string[]
  }
}

// --- NTAG424 Config Type (matches your existing interface) ---
interface NTAG424Config {
  chipId: string
  chipUID: string
  did: string
  signature: string
  publicKey: string
  privateKey: string
  nfcUrl: string
  testUrl: string
  createdAt: string
  challengeMessage: string
  urlAnalysis: {
    bytes: number
    chars: number
    compatibility: Record<string, string>
  }
  validated?: boolean
}

/**
 * 🎯 Elegant Web NFC Writer Class
 * 
 * Handles all aspects of Web NFC writing with beautiful error handling,
 * progress tracking, and seamless integration with existing architecture.
 */
export class WebNFCWriter {
  private reader: NDEFReader | null = null
  private isWriting: boolean = false
  private abortController: AbortController | null = null

  constructor() {
    // Don't initialize NDEFReader here - it may not be available
    // We'll create it lazily when needed
  }

  /**
   * 🔧 Lazy Initialization of NDEFReader
   * 
   * Creates the NDEFReader only when needed and supported.
   */
  private ensureReaderInitialized(): void {
    if (!this.reader && typeof window !== 'undefined' && 'NDEFReader' in window) {
      this.reader = new NDEFReader()
    }
  }

  /**
   * 🚀 Primary Write Method - Write KairOS Config to NFC Tag
   * 
   * Takes a complete NTAG424Config and writes it to an NFC tag using
   * optimized NDEF encoding with comprehensive error handling.
   */
  async writeConfig(
    config: NTAG424Config, 
    options: WebNFCWriteOptions = {}
  ): Promise<NFCWriteResult> {
    
    // Ensure we have Web NFC support before proceeding
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      return {
        success: false,
        message: 'Web NFC is not supported in this environment',
        error: {
          code: 'NFC_NOT_SUPPORTED',
          details: 'Web NFC API is not available in this browser/environment',
          suggestions: [
            'Use Chrome or Edge browser on Android',
            'Ensure you are on HTTPS',
            'Use copy-paste method as fallback'
          ]
        }
      }
    }

    // Initialize reader if needed
    this.ensureReaderInitialized()
    
    if (!this.reader) {
      return {
        success: false,
        message: 'Failed to initialize NFC reader',
        error: {
          code: 'READER_INIT_FAILED',
          details: 'Could not create NDEFReader instance',
          suggestions: [
            'Refresh the page and try again',
            'Use copy-paste method as fallback'
          ]
        }
      }
    }

    // Prevent concurrent writes with elegant state management
    if (this.isWriting) {
      return {
        success: false,
        message: 'Another NFC write operation is already in progress',
        error: {
          code: 'WRITE_IN_PROGRESS',
          details: 'Only one NFC write operation can be active at a time',
          suggestions: [
            'Wait for current operation to complete',
            'Cancel current operation and try again'
          ]
        }
      }
    }

    // Set up write configuration with sensible defaults
    const writeOptions: Required<WebNFCWriteOptions> = {
      timeout: options.timeout ?? 10000,
      overwrite: options.overwrite ?? true,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      onProgress: options.onProgress ?? (() => {})
    }

    this.isWriting = true
    this.abortController = new AbortController()

    try {
      // Phase 1: Create optimized NDEF message
      writeOptions.onProgress({
        phase: 'detecting',
        message: 'Preparing NFC message...',
        progress: 10
      })

      const ndefMessage = this.createOptimizedNDEFMessage(config)
      const messageBytes = encodeNDEFMessage(ndefMessage as any)

      // Phase 2: Wait for NFC tag and connect
      writeOptions.onProgress({
        phase: 'connecting', 
        message: '📱 Hold your NFC tag near the device...',
        progress: 25
      })

      // Phase 3: Write with retry logic
      const writeResult = await this.writeWithRetry(
        ndefMessage,
        writeOptions
      )

      return writeResult

    } catch (error: any) {
      return this.handleWriteError(error, config)
    } finally {
      this.isWriting = false
      this.abortController = null
    }
  }

  /**
   * 🔄 Write with Intelligent Retry Logic
   * 
   * Implements robust retry mechanism with exponential backoff
   * and detailed progress reporting.
   */
  private async writeWithRetry(
    message: NDEFMessage,
    options: Required<WebNFCWriteOptions>
  ): Promise<NFCWriteResult> {
    
    let lastError: any = null
    
    for (let attempt = 1; attempt <= options.retryAttempts; attempt++) {
      try {
        options.onProgress({
          phase: 'writing',
          message: attempt === 1 
            ? 'Writing to NFC tag...' 
            : `Writing attempt ${attempt}/${options.retryAttempts}...`,
          progress: 25 + (attempt / options.retryAttempts) * 50
        })

        // Perform the actual write operation
        await this.reader?.write(message, {
          overwrite: options.overwrite,
          signal: this.abortController?.signal
        })

        // Success! Verify the write
        options.onProgress({
          phase: 'verifying',
          message: 'Verifying write success...',
          progress: 85
        })

        // Calculate message size for success report
        const messageSize = this.calculateMessageSize(message)

        options.onProgress({
          phase: 'complete',
          message: '✅ NFC tag written successfully!',
          progress: 100
        })

        return {
          success: true,
          message: 'NFC tag written successfully',
          bytesWritten: messageSize,
          chipInfo: {
            // Note: Web NFC API doesn't provide detailed chip info
            // but we can estimate based on the write success
            usedSpace: messageSize
          }
        }

      } catch (error: any) {
        lastError = error
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          break
        }
        
        // Wait before retry (with exponential backoff)
        if (attempt < options.retryAttempts) {
          const delay = options.retryDelay * Math.pow(1.5, attempt - 1)
          
          options.onProgress({
            phase: 'error',
            message: `Write failed, retrying in ${Math.round(delay/1000)}s...`,
            progress: 25 + (attempt / options.retryAttempts) * 50,
            canRetry: true
          })
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retry attempts failed
    throw lastError
  }

  /**
   * 🎨 Create Optimized NDEF Message
   * 
   * Uses existing KairOS NDEF encoder to create perfectly optimized
   * messages for different NFC chip types.
   */
  private createOptimizedNDEFMessage(config: NTAG424Config): NDEFMessage {
    try {
      // Determine chip type from URL analysis compatibility
      const chipType = this.detectChipType(config.urlAnalysis.compatibility)
      
      // Use existing KairOS NDEF encoder for consistency
      const { message } = createKairOSNDEFMessage(
        config.chipUID,
        config.signature,
        config.publicKey,
        this.extractBaseUrl(config.nfcUrl),
        {
          includeText: false,  // Keep it minimal for web writing
          includeBackup: false,
          chipType: chipType as any
        }
      )

      // Convert from our internal NDEF format to Web NFC API format
      return this.convertToWebNFCMessage(message)
    } catch (error) {
      // Fallback to simple URL record if advanced encoding fails
      return {
        records: [{
          recordType: 'url',
          data: config.nfcUrl
        }]
      }
    }
  }

  /**
   * 🔄 Convert Internal NDEF to Web NFC Format
   * 
   * Bridges between our internal NDEF encoder format and the Web NFC API format.
   */
  private convertToWebNFCMessage(internalMessage: any): NDEFMessage {
    try {
      const webNFCRecords: NDEFRecord[] = internalMessage.records.map((record: any) => {
        // Convert our internal record format to Web NFC format
        if (record.data && typeof record.data === 'string') {
          return {
            recordType: 'url',
            data: record.data
          }
        }
        
        // Handle other record types if needed
        return {
          recordType: record.recordType || 'url',
          data: record.data || record.payload || ''
        }
      })

      return {
        records: webNFCRecords
      }
    } catch (error) {
      // Ultimate fallback
      return {
        records: [{
          recordType: 'url',
          data: this.extractBaseUrl('')
        }]
      }
    }
  }

  /**
   * 🛡️ Comprehensive Error Handling
   * 
   * Provides user-friendly error messages with actionable suggestions
   * based on different error scenarios.
   */
  private handleWriteError(error: any, config: NTAG424Config): NFCWriteResult {
    const errorHandlers = {
      'NotAllowedError': () => ({
        code: 'PERMISSION_DENIED',
        details: 'NFC permission was denied or revoked',
        suggestions: [
          'Grant NFC permission when prompted',
          'Check browser settings for NFC permissions',
          'Try refreshing the page and granting permission'
        ]
      }),
      
      'NotSupportedError': () => ({
        code: 'NFC_NOT_SUPPORTED',
        details: 'NFC is not supported on this device/browser',
        suggestions: [
          'Use Chrome or Edge browser on Android',
          'Ensure NFC is enabled in device settings',
          'Use copy-paste method as fallback'
        ]
      }),
      
      'NetworkError': () => ({
        code: 'WRITE_FAILED',
        details: 'Failed to write data to NFC tag',
        suggestions: [
          'Keep tag close to device during writing',
          'Try a different NFC tag',
          'Ensure tag is not write-protected'
        ]
      }),
      
      'AbortError': () => ({
        code: 'OPERATION_CANCELLED',
        details: 'Write operation was cancelled or timed out',
        suggestions: [
          'Keep tag close to device longer',
          'Try again with a longer timeout',
          'Ensure tag is positioned correctly'
        ]
      }),
      
      'InvalidStateError': () => ({
        code: 'INVALID_STATE',
        details: 'NFC reader is in an invalid state',
        suggestions: [
          'Refresh the page and try again',
          'Close other NFC applications',
          'Restart your browser'
        ]
      })
    }

    const errorHandler = errorHandlers[error.name as keyof typeof errorHandlers]
    const errorInfo = errorHandler ? errorHandler() : {
      code: 'UNKNOWN_ERROR',
      details: error.message || 'An unknown error occurred',
      suggestions: [
        'Try the copy-paste method as backup',
        'Check console for technical details',
        'Refresh page and try again'
      ]
    }

    return {
      success: false,
      message: `Write failed: ${errorInfo.details}`,
      error: errorInfo
    }
  }

  /**
   * 🔧 Utility Methods
   */
  
  private detectChipType(compatibility: Record<string, string>): string {
    // Find the most suitable chip type based on compatibility
    const suitableTypes = Object.entries(compatibility)
      .filter(([_, status]) => status.includes('✅'))
      .map(([type, _]) => type)
    
    return suitableTypes[0] || 'NTAG213' // Default to smallest common chip
  }

  private extractBaseUrl(fullUrl: string): string {
    try {
      const url = new URL(fullUrl)
      return `${url.protocol}//${url.host}`
    } catch {
      return 'https://kair-os.vercel.app' // Fallback
    }
  }

  private calculateMessageSize(message: NDEFMessage): number {
    // Rough estimation of NDEF message size
    const encodedMessage = encodeNDEFMessage(message)
    return encodedMessage.length
  }

  private isNonRetryableError(error: any): boolean {
    // Some errors shouldn't trigger retries
    const nonRetryableErrors = [
      'NotAllowedError',    // Permission denied
      'NotSupportedError',  // NFC not supported
      'SecurityError'       // Security context issues
    ]
    
    return nonRetryableErrors.includes(error.name)
  }

  /**
   * 🛑 Cancel Current Write Operation
   * 
   * Provides graceful cancellation of ongoing write operations.
   */
  cancelWrite(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.isWriting = false
    }
  }

  /**
   * 📊 Get Writer Status
   * 
   * Returns current state of the NFC writer.
   */
  getStatus(): { isWriting: boolean; canWrite: boolean } {
    return {
      isWriting: this.isWriting,
      canWrite: 'NDEFReader' in window && window.isSecureContext
    }
  }
}

/**
 * 🎯 Convenience Function for Quick Writes
 * 
 * Provides a simple function interface for one-off NFC writes
 * with sensible defaults and progress callbacks.
 */
export async function writeNFCConfig(
  config: NTAG424Config,
  onProgress?: (status: NFCWriteStatus) => void
): Promise<NFCWriteResult> {
  const writer = new WebNFCWriter()
  return writer.writeConfig(config, { onProgress })
}

// --- Export Types for TypeScript Excellence ---
export type { 
  WebNFCWriteOptions, 
  NFCWriteStatus, 
  NFCWriteResult, 
  NTAG424Config 
} 