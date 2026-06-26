/**
 * Multi-AI SDK and Notebook System Types & Interfaces
 * Prepared as extension stubs as requested.
 */

// --- Multi-AI SDK Types ---

export type AIModelProvider = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'ollama' | 'cohere';

export interface AIModelConfig {
  provider: AIModelProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AISDKRequestOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

/**
 * Common interface for all AI model adapters
 */
export interface IAIServiceAdapter {
  provider: AIModelProvider;
  
  /**
   * Simple content generation
   */
  generateText(prompt: string, options?: AISDKRequestOptions): Promise<string>;
  
  /**
   * Chat session initialization
   */
  createChatSession(systemInstruction?: string): IAIChatSession;
  
  /**
   * Structure data extraction
   */
  extractStructuredData<T>(prompt: string, schema: Record<string, any>): Promise<T>;
}

export interface IAIChatSession {
  sendMessage(message: string): Promise<string>;
  getHistory(): Array<{ role: 'user' | 'model'; text: string }>;
}


// --- Notebook/Notes System Types ---

export interface Note {
  id: string;
  articleId?: string; // Optional reference to associated RSS article
  title: string;
  content: string; // Markdown or rich text
  clippedText?: string; // Original clipped text from article
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  notes: Note[];
  createdAt: string;
}
