import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { steps, voice = 'nova', format = 'mp3' } = await request.json();
    
    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Steps array is required' },
        { status: 400 }
      );
    }

    // Validate format
    const supportedFormats = ['mp3', 'opus', 'aac', 'flac'];
    const audioFormat = supportedFormats.includes(format) ? format : 'mp3';

    // Create a guided meditation script from the 8 steps
    const guidedScript = createGuidedMeditationScript(steps);

    console.log(`🎵 Generating TTS audio: ${audioFormat} format, ${voice} voice, ${guidedScript.length} chars`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // High quality voice
        input: guidedScript,
        voice: voice, // nova, alloy, echo, fable, onyx, shimmer
        response_format: audioFormat,
        speed: 0.85, // Slightly slower for meditation clarity
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS API error:', error);
      return NextResponse.json(
        { error: `TTS API failed: ${error}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`✅ Generated ${audioBuffer.byteLength} bytes of ${audioFormat} audio`);
    
    // Determine content type and file extension
    const contentTypes = {
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      aac: 'audio/aac',
      flac: 'audio/flac'
    };

    const fileExtensions = {
      mp3: 'mp3',
      opus: 'opus',
      aac: 'aac',
      flac: 'flac'
    };
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentTypes[audioFormat as keyof typeof contentTypes],
        'Content-Length': audioBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=7200', // Cache for 2 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Enable inline playback instead of download
        'Content-Disposition': `inline; filename="morning-ritual.${fileExtensions[audioFormat as keyof typeof fileExtensions]}"`,
      },
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function createGuidedMeditationScript(steps: string[]): string {
  // Calculate timing for exactly 8 minutes (480 seconds) - much more concise
  const intro = `Good morning. This is your 8-minute personalized morning routine. Let's get started.

Take a deep breath and let's begin your day with intention.`;
  
  const stepsWithTimings = steps.map((step, index) => {
    const stepNumber = index + 1;
    
    // Much more direct and concise
    return `Step ${stepNumber}: ${step}

Take a moment with this, then we'll continue.`;
  });
  
  const outro = `Great work. Your morning routine is complete. You're ready for your day.`;
  
  return [intro, ...stepsWithTimings, outro].join('\n\n');
}

function generatePause(seconds: number): string {
  // Much simpler pause generation
  return `Take ${Math.max(5, Math.floor(seconds / 2))} seconds here.`;
} 