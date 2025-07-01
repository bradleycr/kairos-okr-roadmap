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
  // Calculate timing for exactly 8 minutes (480 seconds)
  const totalDuration = 480; // 8 minutes in seconds
  const introTime = 35; // Slightly longer intro for better pacing
  const outroTime = 25; // Shorter outro
  const availableStepTime = totalDuration - introTime - outroTime; // 420 seconds for steps
  const timePerStep = Math.floor(availableStepTime / steps.length); // Even distribution
  
  const intro = `Welcome to your personalized morning ritual. This is your time, your space, your eight minutes of intentional presence. 

Find a comfortable position, close your eyes if that feels right, and take three deep breaths with me. 

Breathe in slowly... hold for a moment... and release completely. 

Again, breathe in... feel your body settling... and breathe out any tension. 

One more time, a deep breath in... and let everything go as you exhale. 

Perfect. Let us begin your journey together. ${generatePause(20)}`;
  
  const stepsWithTimings = steps.map((step, index) => {
    const stepNumber = index + 1;
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;
    
    let timing = '';
    if (isFirst) {
      timing = 'For your first step today, ';
    } else if (isLast) {
      timing = 'And for your final step, ';
    } else {
      timing = `Now, moving to step ${stepNumber}, `;
    }
    
    // Add gentle pacing and breath cues
    const gentleStep = `${timing}${step}. 

Take a moment to really feel this intention in your body. Breathe with it. Let it become part of you.`;
    
    // Calculate pause duration for this step
    const basePauseDuration = Math.max(20, timePerStep - Math.floor(gentleStep.length / 12)); 
    
    if (!isLast) {
      return `${gentleStep} ${generatePause(basePauseDuration)} 

When you feel ready, we will continue together.`;
    } else {
      return `${gentleStep} ${generatePause(Math.max(20, basePauseDuration - 5))} 

Take this final moment to appreciate what you have created for yourself.`;
    }
  });
  
  const outro = `Your morning ritual is complete. 

You have given yourself the gift of intentional presence, of mindful beginnings, of purposeful energy. 

As you open your eyes and step into your day, carry this clarity with you. You are grounded, you are ready, you are exactly where you need to be.

Your day begins now.`;
  
  return [intro, ...stepsWithTimings, outro].join(' ');
}

function generatePause(seconds: number): string {
  // Generate natural meditation phrases for pause periods
  const meditationPhrases = [
    'Let yourself breathe naturally and deeply.',
    'Feel your body relax with each breath.',
    'Allow this intention to settle into your being.',
    'Notice the peace that comes with stillness.',
    'Let go of any thoughts that arise, returning to this moment.',
    'Feel the quiet strength growing within you.',
    'Breathe in calm, breathe out anything you do not need.',
    'Rest in this space of gentle awareness.',
    'Allow yourself to be exactly as you are right now.',
    'Feel the connection between your breath and your intention.',
    'Let this moment hold you with kindness.',
    'Notice how present and peaceful you can be.'
  ];
  
  // Estimate roughly 4 seconds per meditation phrase (slower, more deliberate)
  const phrasesNeeded = Math.max(1, Math.floor(seconds / 4));
  const selectedPhrases = [];
  
  for (let i = 0; i < phrasesNeeded; i++) {
    const phrase = meditationPhrases[i % meditationPhrases.length];
    selectedPhrases.push(phrase);
  }
  
  return selectedPhrases.join(' ... ');
} 