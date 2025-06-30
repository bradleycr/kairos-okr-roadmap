import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { steps, voice = 'nova' } = await request.json();
    
    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Steps array is required' },
        { status: 400 }
      );
    }

    // Create a guided meditation script from the 8 steps
    const guidedScript = createGuidedMeditationScript(steps);

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
        response_format: 'mp3',
        speed: 0.9, // Slightly slower for meditation
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `TTS API failed: ${error}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="morning-ritual.mp3"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

function createGuidedMeditationScript(steps: string[]): string {
  const intro = `Welcome to your personalized morning ritual. Find a comfortable position, and let us begin your eight-minute journey together. Take a deep breath in... and slowly exhale. Let this time be yours.`;
  
  const stepsWithTimings = steps.map((step, index) => {
    const stepNumber = index + 1;
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;
    
    let timing = '';
    if (isFirst) {
      timing = 'Let us begin with your first step. ';
    } else if (isLast) {
      timing = 'For your final step, ';
    } else {
      timing = `Now, for step ${stepNumber}, `;
    }
    
    // Add gentle pacing and breath cues
    const gentleStep = `${timing}${step} Take your time with this. Breathe naturally and allow yourself to be fully present.`;
    
    if (!isLast) {
      return `${gentleStep} ... When you are ready, we will move forward together.`;
    } else {
      return `${gentleStep} ... Take a moment to appreciate what you have just experienced.`;
    }
  });
  
  const outro = `Your morning ritual is complete. You have given yourself this gift of mindful intention. Carry this energy with you as you step into your day. You are ready.`;
  
  return [intro, ...stepsWithTimings, outro].join(' ... ');
} 