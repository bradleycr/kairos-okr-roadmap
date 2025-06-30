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
  // Calculate timing for exactly 8 minutes (480 seconds)
  const totalDuration = 480; // 8 minutes in seconds
  const introTime = 30; // 30 seconds for intro
  const outroTime = 30; // 30 seconds for outro
  const availableStepTime = totalDuration - introTime - outroTime; // 420 seconds for steps
  const timePerStep = Math.floor(availableStepTime / steps.length); // Even distribution
  
  const intro = `Welcome to your personalized morning ritual. Find a comfortable position, and let us begin your eight-minute journey together. Take a deep breath in... and slowly exhale. Let this time be yours. ${generatePause(25)}`;
  
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
    
    // Calculate pause duration for this step
    const pauseDuration = Math.max(15, timePerStep - Math.floor(gentleStep.length / 10)); // Rough estimate of speech time
    
    if (!isLast) {
      return `${gentleStep} ${generatePause(pauseDuration)} When you are ready, we will move forward together.`;
    } else {
      return `${gentleStep} ${generatePause(Math.max(15, pauseDuration - 10))} Take a moment to appreciate what you have just experienced.`;
    }
  });
  
  const outro = `${generatePause(15)} Your morning ritual is complete. You have given yourself this gift of mindful intention. Carry this energy with you as you step into your day. You are ready.`;
  
  return [intro, ...stepsWithTimings, outro].join(' ');
}

function generatePause(seconds: number): string {
  // Generate natural-sounding pauses of specific duration
  const pauseWords = [
    'Let yourself breathe deeply.',
    'Allow this moment to settle within you.',
    'Feel your body relax and your mind become clear.',
    'Notice the gentle rhythm of your breath.',
    'Let peace flow through you.',
    'Feel grounded and present.',
    'Allow yourself to be exactly where you are.',
    'Breathe in calm, breathe out tension.',
    'Feel the stillness around you.',
    'Rest in this peaceful moment.'
  ];
  
  // Estimate roughly 3 seconds per pause phrase
  const phrasesNeeded = Math.max(1, Math.floor(seconds / 3));
  const selectedPhrases = [];
  
  for (let i = 0; i < phrasesNeeded; i++) {
    const phrase = pauseWords[i % pauseWords.length];
    selectedPhrases.push(phrase);
  }
  
  return selectedPhrases.join(' ... ');
} 