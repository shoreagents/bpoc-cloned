import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    
    console.log('🔍 Environment check:');
    console.log('CLAUDE_API_KEY exists:', !!apiKey);
    console.log('CLAUDE_API_KEY length:', apiKey ? apiKey.length : 0);
    console.log('CLAUDE_API_KEY starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'CLAUDE_API_KEY not found in environment variables',
        hasApiKey: false,
        fallbackScoring: 'Will use improved fallback scoring system'
      }, { status: 200 });
    }

    // Test a simple AI call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'What is 2+2? Answer with just the number.'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `API call failed: ${response.status} - ${errorText}`,
        hasApiKey: true,
        status: response.status,
        fallbackScoring: 'Will use improved fallback scoring system'
      }, { status: 200 });
    }

    const result = await response.json();
    const content = result.content[0].text;

    return NextResponse.json({ 
      success: true,
      hasApiKey: true,
      aiResponse: content,
      status: response.status,
      fallbackScoring: 'AI is working, but fallback scoring is available if needed'
    });

  } catch (error) {
    console.error('Error testing AI:', error);
    return NextResponse.json({ 
      error: 'Failed to test AI',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.CLAUDE_API_KEY,
      fallbackScoring: 'Will use improved fallback scoring system'
    }, { status: 200 });
  }
}
