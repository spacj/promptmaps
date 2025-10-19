import { NextRequest, NextResponse } from 'next/server';
import { generateOptimizedPrompt } from '@/lib/mistral';
import { generateMindmapText } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { boxes, promptType } = await request.json();

    // Generate the structured text from mind map
    const mindmapText = generateMindmapText(boxes);

    // Use Mistral AI to optimize the prompt
    const optimizedPrompt = await generateOptimizedPrompt(mindmapText, promptType);

    return NextResponse.json({
      success: true,
      optimizedPrompt,
    });
  } catch (error) {
    console.error('Error in generate-prompt API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}