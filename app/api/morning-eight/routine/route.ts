import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { memory } = await request.json();
    
    if (!memory || memory.trim().length === 0) {
      return NextResponse.json(
        { error: 'Memory content is required' },
        { status: 400 }
      );
    }

    const prompt = `You are crafting a personalized 8-minute morning ritual based on someone's voice reflections.

Their personal reflections and thoughts:
"""
${memory}
"""

Create exactly 8 mindful steps for their morning ritual. Each step should:
- Take about 1 minute
- Be personally relevant to their reflections 
- Be practical and actionable
- Include specific guidance
- Flow naturally into the next step

Format as a simple numbered list (1-8) with clear, direct language. No extra formatting or explanations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a mindful wellness guide who creates personalized morning rituals based on personal reflections. Always respond with exactly 8 numbered steps, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `OpenAI API failed: ${error}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    const routineText = result.choices[0]?.message?.content || '';
    
    // Parse the numbered list into individual steps
    const steps = routineText
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return NextResponse.json({
      steps,
      generatedAt: new Date().toISOString(),
      memoryLength: memory.length,
    });
  } catch (error) {
    console.error('Routine generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate routine' },
      { status: 500 }
    );
  }
} 