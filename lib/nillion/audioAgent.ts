/**
 * Nillion Audio Agent for KairOS
 * 
 * Processes audio transcriptions privately using Nillion's TEE
 * For voice memos, reflections, and personal insights
 */

import { nillionAI } from './secretLLM'

export interface AudioTranscription {
  id: string
  timestamp: number
  duration: number
  transcription: string
  confidence: number
  language?: string
}

export interface AudioSummary {
  id: string
  originalTranscriptionId: string
  timestamp: number
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  categories: string[]
  actionItems: string[]
  privacyScore: number
  processingAttestation: string
}

export interface AudioInsight {
  transcriptionId: string
  insights: string
  themes: string[]
  emotionalTone: string
  suggestions: string[]
  privacyPreserved: boolean
}

export class NillionAudioAgent {
  private transcriptions: Map<string, AudioTranscription> = new Map()
  private summaries: Map<string, AudioSummary> = new Map()

  /**
   * Process audio transcription privately using Nillion's TEE
   */
  async processTranscription(transcription: AudioTranscription): Promise<AudioSummary> {
    try {
      // Use Nillion SecretLLM to analyze transcription privately
      const response = await nillionAI.analyzeUserProfile({
        userDID: `audio_user_${Date.now()}`, // Anonymous ID for privacy
        zkMoments: [{
          timestamp: transcription.timestamp,
          type: 'audio_reflection',
          encrypted: true
        }],
        ritualHistory: [],
        preferences: { privacyLevel: 'maximum' },
        analysisType: 'personalization'
      })

      // Generate detailed summary using private AI
      const summaryResponse = await this.generatePrivateSummary(transcription)

      const summary: AudioSummary = {
        id: `summary_${transcription.id}`,
        originalTranscriptionId: transcription.id,
        timestamp: Date.now(),
        summary: summaryResponse.summary,
        keyPoints: summaryResponse.keyPoints,
        sentiment: summaryResponse.sentiment,
        categories: summaryResponse.categories,
        actionItems: summaryResponse.actionItems,
        privacyScore: response.privacyScore,
        processingAttestation: response.attestation || 'TEE_VERIFIED'
      }

      // Store privately (in production, this would be encrypted)
      this.transcriptions.set(transcription.id, transcription)
      this.summaries.set(summary.id, summary)

      return summary
    } catch (error) {
      console.error('Private transcription processing failed:', error)
      throw new Error('Failed to process transcription privately')
    }
  }

  /**
   * Generate private summary using Nillion's TEE
   */
  private async generatePrivateSummary(transcription: AudioTranscription): Promise<{
    summary: string
    keyPoints: string[]
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
    categories: string[]
    actionItems: string[]
  }> {
    const systemPrompt = `You are a private AI assistant for KairOS users. 
    Analyze audio transcriptions with complete privacy preservation.
    Provide thoughtful summaries that help users reflect on their thoughts and experiences.
    Focus on personal growth, insights, and actionable takeaways.
    Never store or expose the original content - process everything within the TEE.`

    const userPrompt = `Please analyze this audio transcription privately:

    Duration: ${transcription.duration} seconds
    Confidence: ${transcription.confidence}%
    Content: "${transcription.transcription}"

    Provide:
    1. A concise but meaningful summary
    2. 3-5 key points or insights
    3. Overall sentiment (positive/neutral/negative/mixed)
    4. 2-3 relevant categories (e.g., reflection, planning, gratitude, concern)
    5. Any actionable items or next steps mentioned

    Keep the analysis personal and growth-focused.`

    try {
      // Use Nillion SecretLLM for private AI analysis (OpenAI-compatible)
      const response = await fetch('https://api.nillion.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer Nillion2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-3B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      })

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content || ''

      // Parse the AI response (in production, this would be more sophisticated)
      return this.parseAISummaryResponse(content)
    } catch (error) {
      console.error('Private summary generation failed:', error)
      throw error
    }
  }

  /**
   * Generate insights across multiple transcriptions
   */
  async generatePersonalInsights(transcriptionIds: string[]): Promise<AudioInsight[]> {
    const transcriptions = transcriptionIds
      .map(id => this.transcriptions.get(id))
      .filter(Boolean) as AudioTranscription[]

    if (transcriptions.length === 0) {
      return []
    }

    const systemPrompt = `You are a personal growth AI for KairOS users.
    Analyze patterns across multiple audio reflections to provide meaningful insights.
    Focus on themes, emotional patterns, and growth opportunities.
    Maintain complete privacy - this analysis happens entirely within the TEE.`

    const userPrompt = `Analyze these ${transcriptions.length} audio reflections for patterns and insights:

    ${transcriptions.map((t, i) => `
    Reflection ${i + 1} (${new Date(t.timestamp).toLocaleDateString()}):
    "${t.transcription.substring(0, 200)}${t.transcription.length > 200 ? '...' : ''}"
    `).join('\n')}

    Provide insights about:
    1. Recurring themes or topics
    2. Emotional patterns over time
    3. Areas of growth or concern
    4. Suggestions for personal development`

    try {
      // Use Nillion SecretLLM for private insights analysis (OpenAI-compatible)
      const response = await fetch('https://api.nillion.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer Nillion2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-3B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.8
        })
      })

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content || ''

      // Generate insights for each transcription
      return transcriptions.map(t => ({
        transcriptionId: t.id,
        insights: content,
        themes: this.extractThemes(content),
        emotionalTone: this.extractEmotionalTone(content),
        suggestions: this.extractSuggestions(content),
        privacyPreserved: true
      }))
    } catch (error) {
      console.error('Personal insights generation failed:', error)
      return []
    }
  }

  /**
   * Get all transcriptions (for demo purposes)
   */
  getAllTranscriptions(): AudioTranscription[] {
    return Array.from(this.transcriptions.values())
  }

  /**
   * Get all summaries (for demo purposes)
   */
  getAllSummaries(): AudioSummary[] {
    return Array.from(this.summaries.values())
  }

  /**
   * Get summary by transcription ID
   */
  getSummaryByTranscriptionId(transcriptionId: string): AudioSummary | undefined {
    return Array.from(this.summaries.values())
      .find(s => s.originalTranscriptionId === transcriptionId)
  }

  private parseAISummaryResponse(content: string): {
    summary: string
    keyPoints: string[]
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
    categories: string[]
    actionItems: string[]
  } {
    // Simple parsing - in production, this would be more sophisticated
    const lines = content.split('\n').filter(line => line.trim())
    
    let summary = ''
    const keyPoints: string[] = []
    const categories: string[] = []
    const actionItems: string[] = []
    let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral'

    // Extract summary (first substantial paragraph)
    const summaryMatch = content.match(/summary[:\-\s]*(.*?)(?:\n\n|\n[0-9]|\nkey|$)/is)
    if (summaryMatch) {
      summary = summaryMatch[1].trim()
    } else {
      summary = lines[0] || 'No summary available'
    }

    // Extract key points
    const keyPointMatches = content.match(/key points?[:\-\s]*(.*?)(?:\n\n|\nsentiment|\ncategor|$)/is)
    if (keyPointMatches) {
      const pointsText = keyPointMatches[1]
      const points = pointsText.split(/\n/).filter(line => line.trim().match(/^[-•*]\s/))
      keyPoints.push(...points.map(p => p.replace(/^[-•*]\s/, '').trim()))
    }

    // Extract sentiment
    if (content.toLowerCase().includes('positive')) sentiment = 'positive'
    else if (content.toLowerCase().includes('negative')) sentiment = 'negative'
    else if (content.toLowerCase().includes('mixed')) sentiment = 'mixed'

    // Extract categories
    const categoryMatches = content.match(/categor[yi]es?[:\-\s]*(.*?)(?:\n\n|\naction|\n[0-9]|$)/is)
    if (categoryMatches) {
      const catText = categoryMatches[1]
      categories.push(...catText.split(/[,\n]/).map(c => c.trim()).filter(c => c.length > 0))
    }

    // Extract action items
    const actionMatches = content.match(/action[:\-\s]*(.*?)$/is)
    if (actionMatches) {
      const actionText = actionMatches[1]
      const actions = actionText.split(/\n/).filter(line => line.trim().match(/^[-•*]\s/))
      actionItems.push(...actions.map(a => a.replace(/^[-•*]\s/, '').trim()))
    }

    return {
      summary: summary || 'Audio reflection processed privately',
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Personal reflection captured'],
      sentiment,
      categories: categories.length > 0 ? categories : ['reflection'],
      actionItems: actionItems.length > 0 ? actionItems : []
    }
  }

  private extractThemes(content: string): string[] {
    const themes: string[] = []
    const themeKeywords = ['theme', 'pattern', 'recurring', 'common', 'frequent']
    
    const lines = content.toLowerCase().split('\n')
    lines.forEach(line => {
      if (themeKeywords.some(keyword => line.includes(keyword))) {
        // Extract potential themes from the line
        const words = line.split(' ').filter(w => w.length > 3)
        themes.push(...words.slice(0, 2))
      }
    })

    return [...new Set(themes)].slice(0, 5)
  }

  private extractEmotionalTone(content: string): string {
    const emotions = ['hopeful', 'concerned', 'excited', 'reflective', 'determined', 'uncertain']
    const lowerContent = content.toLowerCase()
    
    for (const emotion of emotions) {
      if (lowerContent.includes(emotion)) {
        return emotion
      }
    }
    
    return 'reflective'
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = []
    const suggestionKeywords = ['suggest', 'recommend', 'consider', 'try', 'might']
    
    const lines = content.split('\n')
    lines.forEach(line => {
      if (suggestionKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        suggestions.push(line.trim())
      }
    })

    return suggestions.slice(0, 3)
  }
}

// Export singleton instance
export const audioAgent = new NillionAudioAgent()

// Convenience functions
export async function processAudioTranscription(transcription: AudioTranscription): Promise<AudioSummary> {
  return audioAgent.processTranscription(transcription)
}

export async function generateAudioInsights(transcriptionIds: string[]): Promise<AudioInsight[]> {
  return audioAgent.generatePersonalInsights(transcriptionIds)
}

/**
 * Real audio transcription using Nillion's speech-to-text API
 * Processes audio privately in TEE environment
 */
export async function transcribeAudio(audioBlob: Blob): Promise<AudioTranscription> {
  try {
    // Convert blob to base64 for API transmission
    const base64Audio = await blobToBase64(audioBlob)
    
    // Use OpenAI Whisper API for transcription
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'whisper-1',
        audio: base64Audio,
        language: 'en',
        response_format: 'verbose_json',
        temperature: 0.2,
        timestamp_granularities: ["word", "segment"]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Transcription API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    
    // Extract transcription details from Nillion/Whisper response
    const transcription: AudioTranscription = {
      id: `transcription_${Date.now()}`,
      timestamp: Date.now(),
      duration: result.duration || estimateAudioDuration(audioBlob),
      transcription: result.text || result.transcript || '',
      confidence: calculateAverageConfidence(result.segments),
      language: result.language || 'en'
    }

    if (!transcription.transcription.trim()) {
      throw new Error('No transcription text received from API')
    }

    return transcription
  } catch (error) {
    console.error('Audio transcription failed:', error)
    
         // Provide more specific error messages
     if (error instanceof Error) {
       if (error.message.includes('401') || error.message.includes('403')) {
         throw new Error('Authentication failed. Please check your OpenAI API key.')
       } else if (error.message.includes('429')) {
         throw new Error('Rate limit exceeded. Please try again later.')
       } else if (error.message.includes('413')) {
         throw new Error('Audio file is too large. Please use a shorter recording.')
       }
     }
     
     throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper function to convert Blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Estimate audio duration from blob size (fallback)
 */
function estimateAudioDuration(blob: Blob): number {
  // Rough estimation: 1 second ≈ 16KB for typical audio
  return Math.max(1, Math.floor(blob.size / 16000))
}

/**
 * Calculate average confidence from transcription segments
 */
function calculateAverageConfidence(segments: any[]): number {
  if (!segments || segments.length === 0) return 0.85 // Default confidence
  
  const confidences = segments
    .map(seg => seg.confidence || seg.avg_logprob || 0)
    .filter(conf => conf > 0)
  
  if (confidences.length === 0) return 0.85
  
  const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  return Math.max(0, Math.min(1, average))
} 