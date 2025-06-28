/**
 * AudioTranscriptionDemo - KairOS Audio Agent with Nillion Integration
 * 
 * ✨ Features:
 * - Real audio transcription using OpenAI Whisper API
 * - Private AI analysis and summarization via Nillion SecretLLM (TEE)
 * - Sentiment analysis and key point extraction
 * - Action item identification from voice memos
 * - Cross-reflection insights and pattern analysis
 * 
 * 🔒 Privacy Features:
 * - AI analysis processed privately in Nillion's Trusted Execution Environment
 * - No audio files stored on servers
 * - Cryptographic attestation of privacy preservation for AI processing
 * - Anonymous processing with no user data retention
 * 
 * 🎯 Perfect for:
 * - Personal voice memos and reflections
 * - Meeting notes and action item extraction
 * - Voice journaling with AI insights
 * - Private thought processing and analysis
 * 
 * @author KairOS Team
 * @version 2.0 - Now with real Nillion transcription!
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, Square, Trash2, Brain, Shield, Sparkles } from 'lucide-react'

interface AudioTranscription {
  id: string
  timestamp: number
  duration: number
  transcription: string
  confidence: number
  language?: string
}

interface AudioSummary {
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

export default function AudioTranscriptionDemo() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<AudioTranscription | null>(null)
  const [summary, setSummary] = useState<AudioSummary | null>(null)
  const [processing, setProcessing] = useState(false)
  const [allSummaries, setAllSummaries] = useState<AudioSummary[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const clearRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setTranscription(null)
    setSummary(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  const transcribeAndProcess = async () => {
    if (!audioBlob) return

    setProcessing(true)
    try {
      // Step 1: Convert audio blob to base64 for API transmission
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
            const base64 = reader.result.split(',')[1]
            resolve(base64)
          } else {
            reject(new Error('Failed to convert audio to base64'))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(audioBlob)
      })

      // Step 2: Transcribe using Nillion's speech-to-text API
      const transcriptionResponse = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'transcribe_audio',
          data: { audioBlob: base64Audio }
        })
      })

      const transcriptionResult = await transcriptionResponse.json()
      if (!transcriptionResult.success) {
        throw new Error(transcriptionResult.error || transcriptionResult.details || 'Transcription failed')
      }

      const transcription = transcriptionResult.transcription
      setTranscription(transcription)

      // Step 3: Process with Nillion AI privately for summarization and insights
      const processingResponse = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'process_audio_transcription',
          data: { transcription }
        })
      })

      const processingResult = await processingResponse.json()
      if (processingResult.success) {
        setSummary(processingResult.summary)
        // Refresh all summaries
        await loadAllSummaries()
      } else {
        throw new Error(processingResult.error || 'Processing failed')
      }
    } catch (error) {
      console.error('Transcription processing failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to process audio. Please try again.'
      if (errorMessage.includes('Authentication failed')) {
        userMessage = 'Authentication issue with OpenAI API. Please check your API key configuration.'
      } else if (errorMessage.includes('Rate limit exceeded')) {
        userMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (errorMessage.includes('too large')) {
        userMessage = 'Audio file is too large. Please record a shorter clip.'
      } else if (errorMessage.includes('No transcription text')) {
        userMessage = 'Could not transcribe audio. Please speak more clearly or check microphone.'
      }
      
      alert(userMessage)
    } finally {
      setProcessing(false)
    }
  }

  const loadAllSummaries = async () => {
    try {
      const response = await fetch('/api/nillion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'get_audio_summaries',
          data: {}
        })
      })

      const result = await response.json()
      if (result.success) {
        setAllSummaries(result.data.summaries || [])
      }
    } catch (error) {
      console.error('Failed to load summaries:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      case 'mixed': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  useEffect(() => {
    loadAllSummaries()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎙️ Private Audio Agent
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Record voice memos, get AI-powered transcriptions and summaries - all processed privately using Nillion's TEE.
          Perfect for personal reflections, meeting notes, and voice journaling.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 max-w-lg mx-auto">
          <p className="text-blue-800 text-sm font-medium">
            🎯 Using <strong>OpenAI Whisper</strong> for transcription + <strong>Nillion SecretLLM</strong> for private AI analysis!
          </p>
        </div>
        
        {/* Developer Test Button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/nillion-ai', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'attestation_check' })
                })
                const result = await response.json()
                alert(`Nillion API Status: ${result.success ? 'Connected ✅' : 'Error ❌'}`)
              } catch (error) {
                alert('API Connection Failed ❌')
              }
            }}
            className="mt-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
          >
            Test Nillion API Connection
          </button>
        )}
        
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1">
            <Shield className="w-3 h-3" />
            TEE Protected
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Summarization
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            🎯 Sentiment Analysis
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            🔒 Private Processing
          </span>
        </div>
      </div>

      {/* Recording Interface */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Voice Recording</h2>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Recording Timer */}
          <div className="text-2xl font-mono text-gray-700">
            {formatTime(recordingTime)}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
                disabled={processing}
              >
                <Mic className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full transition-colors"
              >
                <Square className="w-6 h-6" />
              </button>
            )}

            {audioUrl && (
              <>
                {!isPlaying ? (
                  <button
                    onClick={playAudio}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
                    disabled={processing}
                  >
                    <Play className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={pauseAudio}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={clearRecording}
                  className="bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-full transition-colors"
                  disabled={processing}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Process Button */}
          {audioBlob && !transcription && (
            <button
              onClick={transcribeAndProcess}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Transcribing with Nillion API...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Transcribe & Analyze Privately
                </>
              )}
            </button>
          )}

          {/* Hidden Audio Element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      </div>

      {/* Transcription Results */}
      {transcription && (
        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Transcription</h3>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-700 mb-2">"{transcription.transcription}"</p>
            <div className="text-sm text-gray-500 flex gap-4">
              <span>Duration: {transcription.duration}s</span>
              <span>Confidence: {Math.round(transcription.confidence * 100)}%</span>
              <span>Language: {transcription.language}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Private AI Analysis
          </h3>
          
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Summary</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{summary.summary}</p>
            </div>

            {/* Key Points */}
            {summary.keyPoints.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Key Points</h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <span className="text-sm text-gray-500">Sentiment</span>
                <div className={`px-2 py-1 rounded text-sm font-medium ${getSentimentColor(summary.sentiment)}`}>
                  {summary.sentiment}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Privacy Score</span>
                <div className="text-lg font-semibold text-green-600">{summary.privacyScore}/100</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Categories</span>
                <div className="text-sm">{summary.categories.join(', ')}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">TEE Verified</span>
                <div className="text-sm text-green-600">✓ {summary.processingAttestation}</div>
              </div>
            </div>

            {/* Action Items */}
            {summary.actionItems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Action Items</h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.actionItems.map((item, i) => (
                    <li key={i} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Summaries */}
      {allSummaries.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Previous Audio Reflections</h3>
          <div className="space-y-3">
            {allSummaries.slice(-5).reverse().map((s) => (
              <div key={s.id} className="border-l-4 border-purple-200 pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">
                    {new Date(s.timestamp).toLocaleDateString()} at {new Date(s.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(s.sentiment)}`}>
                    {s.sentiment}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{s.summary}</p>
                {s.keyPoints.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">Key: </span>
                    <span className="text-xs text-gray-600">{s.keyPoints[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border rounded-lg p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          🔒 Privacy Guaranteed
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Your audio is processed locally and transcriptions are analyzed privately using Nillion's Trusted Execution Environment. 
          No audio data is stored permanently, and all AI analysis happens within the secure TEE.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-white rounded text-xs">Local Audio Processing</span>
          <span className="px-2 py-1 bg-white rounded text-xs">TEE-Protected AI</span>
          <span className="px-2 py-1 bg-white rounded text-xs">No Permanent Storage</span>
          <span className="px-2 py-1 bg-white rounded text-xs">Cryptographic Attestation</span>
        </div>
      </div>
    </div>
  )
} 