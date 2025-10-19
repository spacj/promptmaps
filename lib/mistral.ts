import { Mistral } from '@mistralai/mistralai';

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

export async function generateOptimizedPrompt(
  mindmapText: string,
  promptType: string
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    code: `You are an expert prompt engineer specializing in code generation. Convert the following mind map into a clear, structured prompt for AI code generation. Include:
- Specific programming languages and frameworks
- Expected functionality and features
- Code structure and architecture
- Best practices to follow
Make it natural and conversational, not robotic.`,
    
    research: `You are an expert prompt engineer for research and analysis. Convert the following mind map into a comprehensive research prompt. Include:
- Research questions and objectives
- Methodology and approach
- Key areas to investigate
- Expected depth and format
Make it sound natural and academic, not mechanical.`,
    
    creative: `You are an expert prompt engineer for creative content. Convert the following mind map into an inspiring creative prompt. Include:
- Tone, style, and mood
- Key themes and elements
- Target audience
- Format and length
Make it engaging and natural, like a creative brief.`,
    
    business: `You are an expert prompt engineer for business applications. Convert the following mind map into a professional business prompt. Include:
- Business objectives and goals
- Target audience and stakeholders
- Key deliverables
- Success metrics
Make it professional yet conversational.`,
    
    education: `You are an expert prompt engineer for educational content. Convert the following mind map into a clear educational prompt. Include:
- Learning objectives
- Target audience level
- Teaching approach
- Assessment criteria
Make it clear and approachable, like a lesson plan.`,
    
    general: `You are an expert prompt engineer. Convert the following mind map into a well-structured, clear prompt for AI. Maintain hierarchy, add context, and make it natural and human-like. Focus on clarity and specificity while keeping a conversational tone.`
  };

  const systemPrompt = systemPrompts[promptType] || systemPrompts.general;

  try {
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Mind Map Structure:\n\n${mindmapText}\n\nPlease convert this into an optimized, natural-sounding prompt that maintains the hierarchical structure but reads like it was written by a human. Focus on clarity, context, and proper formatting.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Handle both string and ContentChunk[] response types
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      return formatFallbackPrompt(mindmapText, promptType);
    }
    
    // If content is an array of chunks, extract text
    if (Array.isArray(content)) {
      return content
        .map((chunk: any) => chunk.text || '')
        .join('')
        .trim() || formatFallbackPrompt(mindmapText, promptType);
    }
    
    // If content is a string, return it directly
    return typeof content === 'string' ? content : formatFallbackPrompt(mindmapText, promptType);
  } catch (error) {
    console.error('Error calling Mistral AI:', error);
    // Fallback to formatted mindmap if API fails
    return formatFallbackPrompt(mindmapText, promptType);
  }
}

function formatFallbackPrompt(mindmapText: string, promptType: string): string {
  const typeIntros: Record<string, string> = {
    code: 'I need help creating code with the following structure and requirements:\n\n',
    research: 'I need to conduct research on the following topics:\n\n',
    creative: 'I need creative content based on these ideas:\n\n',
    business: 'I need business-focused content covering:\n\n',
    education: 'I need educational content about:\n\n',
    general: 'Here\'s what I need help with:\n\n',
  };

  const intro = typeIntros[promptType] || typeIntros.general;
  return intro + mindmapText + '\n\nPlease provide a comprehensive response that addresses all these points.';
}

export { client };