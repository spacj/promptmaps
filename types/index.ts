export interface MindMapNode {
    id: string;
    text: string;
    x: number;
    y: number;
    level: number;
    parentId: string | null;
    style: {
      bg: string;
      text: string;
    };
  }
  
  export interface User {
    uid: string;
    email: string | null;
    isPremium: boolean;
    creditsUsedToday: number;
    lastResetDate: string;
  }
  
  export type PromptType = 'code' | 'research' | 'creative' | 'business' | 'education' | 'general';
  
  export interface PromptGenerationRequest {
    mindmapText: string;
    promptType: PromptType;
  }
  
  export interface PromptGenerationResponse {
    optimizedPrompt: string;
    success: boolean;
  }