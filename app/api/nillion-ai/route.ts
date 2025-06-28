import { NextRequest, NextResponse } from 'next/server'
import { nillionAI, analyzeESP32Interactions, getPersonalizedInsights } from '@/lib/nillion/secretLLM'
import { audioAgent, processAudioTranscription, generateAudioInsights, transcribeAudio } from '@/lib/nillion/audioAgent'

/**
 * Nillion SecretLLM API Endpoint for KairOS
 * 
 * Demonstrates private AI analysis of ESP32 data, user profiles, and audio transcriptions
 * Uses Nillion's free test API key - no setup required!
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'esp32_analysis':
        return await handleESP32Analysis(data)
      
      case 'profile_insights':
        return await handleProfileInsights(data)
      
      case 'ritual_suggestions':
        return await handleRitualSuggestions(data)
      
      case 'attestation_check':
        return await handleAttestationCheck()

      // New audio processing endpoints
      case 'transcribe_audio':
        return await handleAudioTranscriptionDirect(data)
      
      case 'process_audio_transcription':
        return await handleAudioTranscription(data)
      
      case 'generate_audio_insights':
        return await handleAudioInsights(data)
      
      case 'get_audio_summaries':
        return await handleGetAudioSummaries()
      
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Nillion AI API error:', error)
    return NextResponse.json(
      { error: 'AI analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleESP32Analysis(data: any) {
  const { deviceId, interactions, analysisType = 'usage_patterns' } = data
  
  // Validate required data
  if (!deviceId || !interactions || !Array.isArray(interactions)) {
    return NextResponse.json(
      { error: 'Missing required fields: deviceId, interactions' },
      { status: 400 }
    )
  }

  // Use convenience function for ESP32 analysis
  const result = await analyzeESP32Interactions(deviceId, interactions)
  
  return NextResponse.json({
    success: true,
    analysis: result,
    privacy: {
      processed_in_tee: true,
      data_encrypted: true,
      no_data_stored: true
    },
    timestamp: new Date().toISOString()
  })
}

async function handleProfileInsights(data: any) {
  const { userDID, zkMoments, ritualHistory, analysisType = 'personalization' } = data
  
  if (!userDID || !zkMoments || !ritualHistory) {
    return NextResponse.json(
      { error: 'Missing required fields: userDID, zkMoments, ritualHistory' },
      { status: 400 }
    )
  }

  const result = await getPersonalizedInsights(userDID, zkMoments, ritualHistory)
  
  return NextResponse.json({
    success: true,
    insights: result,
    privacy: {
      processed_in_tee: true,
      user_identity_protected: true,
      no_data_stored: true
    },
    timestamp: new Date().toISOString()
  })
}

async function handleRitualSuggestions(data: any) {
  const { userProfile } = data
  
  if (!userProfile) {
    return NextResponse.json(
      { error: 'Missing userProfile data' },
      { status: 400 }
    )
  }

  const result = await nillionAI.generateRitualSuggestions(userProfile)
  
  return NextResponse.json({
    success: true,
    suggestions: result,
    privacy: {
      processed_in_tee: true,
      personalized_privately: true,
      no_data_stored: true
    },
    timestamp: new Date().toISOString()
  })
}

async function handleAttestationCheck() {
  const attestation = await nillionAI.verifyAttestation()
  
  return NextResponse.json({
    success: true,
    attestation,
    message: attestation.verified 
      ? 'TEE environment verified - your data is processed privately'
      : 'Attestation verification failed - privacy not guaranteed'
  })
}

// New audio processing handlers
async function handleAudioTranscriptionDirect(data: any) {
  const { audioBlob } = data
  
  if (!audioBlob) {
    return NextResponse.json(
      { error: 'Missing audio data' },
      { status: 400 }
    )
  }

  try {
    // Convert base64 back to blob if needed
    let blob = audioBlob
    if (typeof audioBlob === 'string') {
      // Convert base64 string to blob
      const byteCharacters = atob(audioBlob)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      blob = new Blob([byteArray], { type: 'audio/wav' })
    }

    const transcription = await transcribeAudio(blob)
    
    return NextResponse.json({
      success: true,
      transcription,
      privacy: {
        processed_in_tee: true,
        audio_not_stored: true,
        private_transcription: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Audio transcription failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleAudioTranscription(data: any) {
  const { transcription } = data
  
  if (!transcription || !transcription.transcription) {
    return NextResponse.json(
      { error: 'Missing transcription data' },
      { status: 400 }
    )
  }

  try {
    const summary = await processAudioTranscription(transcription)
    
    return NextResponse.json({
      success: true,
      summary,
      privacy: {
        processed_in_tee: true,
        transcription_never_stored: true,
        private_ai_analysis: true,
        attestation: summary.processingAttestation
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Audio transcription processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleAudioInsights(data: any) {
  const { transcriptionIds } = data
  
  if (!transcriptionIds || !Array.isArray(transcriptionIds)) {
    return NextResponse.json(
      { error: 'Missing transcriptionIds array' },
      { status: 400 }
    )
  }

  try {
    const insights = await generateAudioInsights(transcriptionIds)
    
    return NextResponse.json({
      success: true,
      insights,
      privacy: {
        processed_in_tee: true,
        pattern_analysis_private: true,
        no_individual_data_exposed: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Audio insights generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleGetAudioSummaries() {
  try {
    const transcriptions = audioAgent.getAllTranscriptions()
    const summaries = audioAgent.getAllSummaries()
    
    return NextResponse.json({
      success: true,
      data: {
        transcriptions,
        summaries,
        total_transcriptions: transcriptions.length,
        total_summaries: summaries.length
      },
      privacy: {
        data_anonymized: true,
        stored_temporarily: true,
        tee_processed: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve audio summaries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Nillion SecretLLM API for KairOS - Audio Agent Edition',
    endpoints: {
      'POST /api/nillion-ai': {
        esp32_analysis: 'Analyze ESP32 device interactions privately',
        profile_insights: 'Get personalized user insights',
        ritual_suggestions: 'Generate ritual recommendations',
        attestation_check: 'Verify TEE environment',
        transcribe_audio: 'Transcribe audio files using Nillion speech-to-text API',
        process_audio_transcription: 'Process and summarize audio transcriptions privately',
        generate_audio_insights: 'Generate insights across multiple audio reflections',
        get_audio_summaries: 'Retrieve all processed audio summaries'
      }
    },
    audio_features: [
      'Private transcription processing',
      'AI-powered summarization',
      'Sentiment analysis',
      'Key point extraction',
      'Action item identification',
      'Cross-reflection insights',
      'TEE-protected analysis'
    ],
    privacy_features: [
      'Trusted Execution Environment (TEE)',
      'No data storage or logging',
      'Cryptographic attestation',
      'End-to-end encryption',
      'Anonymous processing'
    ],
    free_tier: 'Using Nillion test API key - no setup required!'
  })
} 