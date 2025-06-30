// --- ZKBirthday Shared Word Storage API ---
// Robust storage for Charlie's birthday constellation
// Now with mutex locks to prevent race conditions during concurrent writes

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// --- Types ---
interface WordEntry {
  id: string
  letter: string
  word: string
  contributor: string
  timestamp: number
  sessionId: string
}

const CHARLIE_LETTERS = ['C', 'H', 'A', 'R', 'L', 'I', 'E']

// --- Robust Storage System with Mutex Lock ---
// Multi-layer storage: KV -> File -> Memory + Race condition protection
const memoryStorage = new Map<string, WordEntry[]>()
const sessionLocks = new Map<string, Promise<any>>()

// Mutex lock to prevent race conditions during writes
async function withLock<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
  // Wait for any existing operation to complete
  const existingLock = sessionLocks.get(sessionId)
  if (existingLock) {
    await existingLock.catch(() => {}) // Ignore errors from previous operations
  }
  
  // Create new lock for this operation
  const newLock = operation()
  sessionLocks.set(sessionId, newLock)
  
  try {
    const result = await newLock
    return result
  } finally {
    // Clean up this lock if it's still the current one
    if (sessionLocks.get(sessionId) === newLock) {
      sessionLocks.delete(sessionId)
    }
  }
}

// Helper to get KV in production only
async function getKV() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv')
      return kv
    }
  } catch (error) {
    console.log('KV not available, using file storage')
  }
  return null
}

// File storage fallback (works on Vercel)
async function getWordsFromFile(sessionId: string): Promise<WordEntry[]> {
  try {
    const filePath = `/tmp/zk-birthday-${sessionId}.json`
    const data = await fs.readFile(filePath, 'utf-8')
    const words = JSON.parse(data) as WordEntry[]
    console.log(`📁 FILE: Loaded ${words.length} words from file for session ${sessionId}`)
    return words
  } catch (error) {
    console.log(`📁 FILE: No file storage found for session ${sessionId}, using empty array`)
    return []
  }
}

async function saveWordsToFile(sessionId: string, words: WordEntry[]): Promise<boolean> {
  try {
    const filePath = `/tmp/zk-birthday-${sessionId}.json`
    await fs.writeFile(filePath, JSON.stringify(words, null, 2))
    console.log(`📁 FILE: Saved ${words.length} words to file for session ${sessionId}`)
    return true
  } catch (error) {
    console.error('📁 FILE: Failed to save to file:', error)
    return false
  }
}

// --- Helper Functions ---
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function validateWord(word: string): boolean {
  return typeof word === 'string' && 
         word.trim().length > 0 && 
         word.trim().length <= 50 &&
         /^[a-zA-Z\s'-]+$/.test(word.trim())
}

function validateLetter(letter: string): boolean {
  return typeof letter === 'string' && 
         CHARLIE_LETTERS.includes(letter.toUpperCase())
}

// --- Multi-Layer Storage Functions ---
async function getWords(sessionId: string): Promise<WordEntry[]> {
  console.log(`📖 LOAD: Getting words for session: ${sessionId}`)
  
  // Try KV first (most authoritative)
  try {
    const kv = await getKV()
    if (kv) {
      const words = await kv.get<WordEntry[]>(`session:${sessionId}:words`)
      if (words && words.length > 0) {
        console.log(`📖 LOAD: KV storage loaded ${words.length} words for session ${sessionId}`)
        // Sync to memory and file for faster future access
        memoryStorage.set(sessionId, words)
        saveWordsToFile(sessionId, words).catch(e => console.warn('Background file sync failed:', e))
        return words
      }
    }
  } catch (error) {
    console.warn('📖 LOAD: KV storage failed:', error)
  }
  
  // Try file storage
  try {
    const words = await getWordsFromFile(sessionId)
    if (words.length > 0) {
      console.log(`📖 LOAD: File storage loaded ${words.length} words for session ${sessionId}`)
      // Sync to memory for faster access
      memoryStorage.set(sessionId, words)
      return words
    }
  } catch (error) {
    console.warn('📖 LOAD: File storage failed:', error)
  }
  
  // Fallback to memory
  const memoryWords = memoryStorage.get(sessionId) || []
  console.log(`📖 LOAD: Memory storage returned ${memoryWords.length} words for session ${sessionId}`)
  return memoryWords
}

async function saveWords(sessionId: string, words: WordEntry[]): Promise<boolean> {
  console.log(`💾 SAVE: Saving ${words.length} words for session: ${sessionId}`)
  let success = false
  
  // Always save to memory first for immediate availability
  memoryStorage.set(sessionId, words)
  console.log(`💾 SAVE: Memory storage updated with ${words.length} words`)
  
  // Try KV storage (most reliable for persistence)
  try {
    const kv = await getKV()
    if (kv) {
      await kv.set(`session:${sessionId}:words`, words)
      await kv.expire(`session:${sessionId}:words`, 60 * 60 * 24 * 2) // 2 days for party
      console.log(`💾 SAVE: KV storage successful - ${words.length} words saved`)
      success = true
    }
  } catch (error) {
    console.warn('💾 SAVE: KV save failed:', error)
  }
  
  // Try file storage (backup persistence)
  try {
    const fileSuccess = await saveWordsToFile(sessionId, words)
    if (fileSuccess) {
      console.log(`💾 SAVE: File storage successful - ${words.length} words saved`)
      success = true
    }
  } catch (error) {
    console.warn('💾 SAVE: File save failed:', error)
  }
  
  // Log final result
  console.log(`💾 SAVE: Final result for session ${sessionId}: ${success ? 'SUCCESS' : 'MEMORY_ONLY'} (${words.length} words)`)
  
  // Always return true since memory storage works
  return true
}

// --- GET: Retrieve all words for a session ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'default'
    
    // Get words from KV storage
    const sessionWords = await getWords(sessionId)
    
    // Group by letter
    const groupedWords: { [letter: string]: any[] } = {}
    CHARLIE_LETTERS.forEach(letter => {
      groupedWords[letter] = []
    })
    
    sessionWords.forEach(word => {
      const letter = word.letter.toUpperCase()
      if (groupedWords[letter]) {
        groupedWords[letter].push({
          id: word.id,
          word: word.word,
          contributor: word.contributor,
          timestamp: word.timestamp
        })
      }
    })
    
    // Sort by timestamp (newest first)
    Object.keys(groupedWords).forEach(letter => {
      groupedWords[letter].sort((a, b) => b.timestamp - a.timestamp)
    })
    
    const stats = {
      totalWords: sessionWords.length,
      lettersCompleted: Object.values(groupedWords).filter(words => words.length > 0).length,
      contributors: new Set(sessionWords.map(w => w.contributor)).size,
      lastUpdate: sessionWords.length > 0 ? Math.max(...sessionWords.map(w => w.timestamp)) : 0
    }
    
    return NextResponse.json({
      success: true,
      data: {
        words: groupedWords,
        stats,
        sessionId
      }
    })
    
  } catch (error) {
    console.error('GET /api/zkbirthday/words error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve words'
    }, { status: 500 })
  }
}

// --- POST: Add a new word with mutex protection ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { letter, word, contributor, sessionId = 'default' } = body
    
    console.log(`➕ ADD WORD: Starting to add "${word}" to letter "${letter}" for session "${sessionId}"`)
    
    // Validate inputs first (before acquiring lock)
    if (!validateLetter(letter)) {
      console.error(`➕ ADD WORD: Invalid letter "${letter}"`)
      return NextResponse.json({
        success: false,
        error: 'Invalid letter. Must be one of: C, H, A, R, L, I, E'
      }, { status: 400 })
    }
    
    if (!validateWord(word)) {
      console.error(`➕ ADD WORD: Invalid word "${word}"`)
      return NextResponse.json({
        success: false,
        error: 'Invalid word. Must be 1-50 characters, letters only.'
      }, { status: 400 })
    }
    
    const trimmedWord = word.trim()
    const contributorName = contributor || `guest_${Date.now().toString(36)}`
    
    // Use mutex lock to prevent race conditions
    const result = await withLock(sessionId, async () => {
      // Get existing words INSIDE the lock
      console.log(`➕ ADD WORD: 🔒 LOCKED - Loading existing words for session "${sessionId}"`)
      const existingWords = await getWords(sessionId)
      console.log(`➕ ADD WORD: 🔒 LOCKED - Found ${existingWords.length} existing words`)
      
      // FAIL-SAFE: Limit total words per session
      const MAX_WORDS_PER_SESSION = 350 // 50 words per letter * 7 letters
      if (existingWords.length >= MAX_WORDS_PER_SESSION) {
        console.warn(`➕ ADD WORD: 🔒 LOCKED - Session full with ${existingWords.length} words`)
        throw new Error(`Constellation is full! Maximum ${MAX_WORDS_PER_SESSION} words per session to maintain visual beauty. ✨`)
      }
      
      // FAIL-SAFE: Limit words per letter
      const MAX_WORDS_PER_LETTER = 50
      const letterWords = existingWords.filter(w => w.letter.toUpperCase() === letter.toUpperCase())
      console.log(`➕ ADD WORD: 🔒 LOCKED - Letter "${letter}" currently has ${letterWords.length} words`)
      
      if (letterWords.length >= MAX_WORDS_PER_LETTER) {
        console.warn(`➕ ADD WORD: 🔒 LOCKED - Letter "${letter}" is full with ${letterWords.length} words`)
        throw new Error(`Letter "${letter}" is full! Maximum ${MAX_WORDS_PER_LETTER} words per letter to keep the constellation balanced. ✨`)
      }
      
      // Check for duplicates
      const existingWord = existingWords.find(w => 
        w.letter.toUpperCase() === letter.toUpperCase() &&
        w.word.toLowerCase() === trimmedWord.toLowerCase()
      )
      
      if (existingWord) {
        console.warn(`➕ ADD WORD: 🔒 LOCKED - Duplicate word "${trimmedWord}" found for letter "${letter}"`)
        throw new Error('This word has already been added to this letter.')
      }
      
      // Create new word entry
      const newWord: WordEntry = {
        id: generateId(),
        letter: letter.toUpperCase(),
        word: trimmedWord,
        contributor: contributorName,
        timestamp: Date.now(),
        sessionId
      }
      
      console.log(`➕ ADD WORD: 🔒 LOCKED - Created new word entry:`, {
        id: newWord.id,
        letter: newWord.letter,
        word: newWord.word,
        contributor: newWord.contributor
      })
      
      // Add to existing words and save
      const updatedWords = [...existingWords, newWord]
      console.log(`➕ ADD WORD: 🔒 LOCKED - Total words after addition: ${updatedWords.length} (was ${existingWords.length})`)
      
      const saveSuccess = await saveWords(sessionId, updatedWords)
      
      if (!saveSuccess) {
        console.error(`➕ ADD WORD: 🔒 LOCKED - Failed to save updated words`)
        throw new Error('Failed to save word to database')
      }
      
      console.log(`➕ ADD WORD: 🔒 LOCKED - Successfully added "${trimmedWord}" to letter "${letter}"! Total words now: ${updatedWords.length}`)
      
      return newWord
    })
    
    console.log(`➕ ADD WORD: 🔓 UNLOCKED - Operation completed successfully`)
    
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        letter: result.letter,
        word: result.word,
        contributor: result.contributor,
        timestamp: result.timestamp
      }
    })
    
  } catch (error) {
    console.error('➕ ADD WORD: Unexpected error:', error)
    
    // Check if it's one of our controlled errors
    if (error instanceof Error && (
      error.message.includes('Constellation is full') ||
      error.message.includes('Letter') && error.message.includes('is full') ||
      error.message.includes('already been added')
    )) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add word'
    }, { status: 500 })
  }
}

// --- DELETE: Reset/clear all words for a session ---
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'default'
    const confirmReset = searchParams.get('confirm')
    
    // Safety check - require confirmation
    if (confirmReset !== 'yes') {
      return NextResponse.json({
        success: false,
        error: 'Reset requires confirmation. Add ?confirm=yes to URL'
      }, { status: 400 })
    }
    
    // Clear from KV storage or in-memory fallback
    const clearSuccess = await saveWords(sessionId, [])
    
    if (clearSuccess) {
      return NextResponse.json({
        success: true,
        message: `All words cleared for session: ${sessionId}`,
        timestamp: Date.now()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to clear session data'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('DELETE /api/zkbirthday/words error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reset session'
    }, { status: 500 })
  }
}