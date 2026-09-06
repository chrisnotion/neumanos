/**
 * xAI Grok Provider
 * Access to Grok models from Elon Musk's xAI
 * BYOK (Bring Your Own Key) - User provides paid API key
 * OpenAI-compatible API
 */

import OpenAI from 'openai';
import type {
  AIProvider,
  AIProviderMetadata,
  AIModel,
  AIMessageOptions,
  AIResponse,
} from './types';
import { ProviderError, ProviderErrorType } from './types';
import { logger } from '../logger';

const log = logger.module('AI:xAI');

/**
 * xAI provider metadata
 */
const METADATA: AIProviderMetadata = {
  id: 'xai',
  name: 'xAI Grok',
  displayName: 'xAI Grok',
  description: 'Grok models from xAI (Elon Musk). Real-time information and unique personality.',

  requiresApiKey: true,
  apiKeyUrl: 'https://console.x.ai',
  apiKeyLabel: 'xAI API Key',

  hasFreeModels: false, // No permanent free tier
  freeModelIds: [],

  supportsCORS: false,
  requiresProxy: true, // Likely requires proxy like OpenAI
  supportsStreaming: true,

  websiteUrl: 'https://x.ai',
  docsUrl: 'https://docs.x.ai',
};

/**
 * xAI Grok models (all paid)
 */
const PAID_MODELS: AIModel[] = [
  {
    id: 'grok-2-latest',
    name: 'Grok 2 (Latest)',
    provider: 'xai',
    speedRating: 4,
    qualityRating: 5,
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    isFree: false,
    costPer1MTokens: 5.0,
    requiresApiKey: true,
    useCases: ['chat', 'analysis', 'real-time-info', 'reasoning'],
    description: 'xAI 旗舰 Grok 2 模型，具备强大推理能力与实时信息获取。',
  },
  {
    id: 'grok-2',
    name: 'Grok 2 (Stable)',
    provider: 'xai',
    speedRating: 4,
    qualityRating: 5,
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    isFree: false,
    costPer1MTokens: 5.0,
    requiresApiKey: true,
    useCases: ['chat', 'analysis', 'real-time-info'],
    description: 'xAI Grok 2 稳定版本。',
  },
  {
    id: 'grok-2-vision-1212',
    name: 'Grok 2 Vision',
    provider: 'xai',
    speedRating: 4,
    qualityRating: 5,
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: true,
    isFree: false,
    costPer1MTokens: 5.0,
    requiresApiKey: true,
    useCases: ['chat', 'multimodal', 'analysis'],
    description: 'Grok 2 视觉多模态模型，支持图像理解。',
  },
  {
    id: 'grok-beta',
    name: 'Grok Beta (Legacy)',
    provider: 'xai',
    speedRating: 3,
    qualityRating: 4,
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    isFree: false,
    costPer1MTokens: 5.0,
    requiresApiKey: true,
    useCases: ['chat', 'analysis', 'real-time-info'],
    description: 'xAI 早期 Grok 测试模型（部分地区可能已下线）。',
  },
  {
    id: 'grok-vision-beta',
    name: 'Grok Vision Beta (Legacy)',
    provider: 'xai',
    speedRating: 3,
    qualityRating: 4,
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    isFree: false,
    costPer1MTokens: 5.0,
    requiresApiKey: true,
    useCases: ['chat', 'multimodal', 'analysis'],
    description: 'Grok 早期视觉测试模型。',
  },
];

/**
 * xAI Grok AI Provider Implementation
 * Uses OpenAI-compatible API
 */
export class XAIProvider implements AIProvider {
  metadata = METADATA;
  models: AIModel[] = [...PAID_MODELS];

  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  /**
   * Check if provider is configured with API key
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  /**
   * Set API key and initialize client
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Note: xAI likely doesn't support CORS, this will likely fail
    });
  }

  /**
   * Get current API key
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Clear API key and client
   */
  clearApiKey(): void {
    this.apiKey = null;
    this.client = null;
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new OpenAI({
        baseURL: 'https://api.x.ai/v1',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Try to list models (minimal API call)
      await testClient.models.list();
      return true;
    } catch (error: unknown) {
      log.error('API key validation failed', { error });
      return false;
    }
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): AIModel | null {
    return this.models.find((m) => m.id === modelId) || null;
  }

  /**
   * Set custom models
   */
  setCustomModels(models: AIModel[]): void {
    if (models && models.length > 0) {
      this.models = models;
    }
  }

  /**
   * Add custom model
   */
  addCustomModel(modelId: string, name?: string): void {
    const trimmedId = modelId.trim();
    if (!trimmedId) return;

    const existingIndex = this.models.findIndex((m) => m.id === trimmedId);
    if (existingIndex >= 0) {
      const existing = this.models[existingIndex];
      this.models.splice(existingIndex, 1);
      this.models = [existing, ...this.models];
      return;
    }

    const newModel: AIModel = {
      id: trimmedId,
      name: name?.trim() || trimmedId,
      provider: 'xai',
      speedRating: 4,
      qualityRating: 5,
      contextWindow: 131072,
      maxOutputTokens: 8192,
      supportsStreaming: true,
      isFree: false,
      requiresApiKey: true,
      useCases: ['chat', 'analysis', 'real-time-info', 'reasoning'],
      description: `xAI 自定义模型: ${trimmedId}`,
    };

    this.models = [newModel, ...this.models];
  }

  /**
   * Get default model
   */
  getDefaultModel(): AIModel {
    return this.models[0] || PAID_MODELS[0];
  }

  /**
   * Get all free models
   */
  getFreeModels(): AIModel[] {
    return []; // No free models
  }

  /**
   * Send message to xAI Grok
   */
  async sendMessage(model: string, options: AIMessageOptions): Promise<AIResponse> {
    if (!this.client) {
      throw new ProviderError(
        ProviderErrorType.INVALID_API_KEY,
        'xAI provider not configured. Please add your xAI API key.',
        'xai'
      );
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add conversation history
      if (options.conversationHistory) {
        options.conversationHistory.forEach((msg) => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        });
      }

      // Add current user prompt
      messages.push({
        role: 'user',
        content: options.prompt,
      });

      // Send request
      if (options.stream && options.onChunk) {
        // Streaming mode
        const stream = await this.client.chat.completions.create({
          model: model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: true,
        });

        let fullContent = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullContent += content;
          if (content && options.onChunk) {
            options.onChunk(content);
          }
        }

        return {
          content: fullContent,
          model: model,
          provider: 'xai',
          finishReason: 'stop',
        };
      } else {
        // Non-streaming mode
        const completion = await this.client.chat.completions.create({
          model: model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: false,
        });

        const content = completion.choices[0]?.message?.content || '';

        return {
          content: content,
          model: model,
          provider: 'xai',
          finishReason: completion.choices[0]?.finish_reason as 'stop' | 'length' | undefined,
          usage: completion.usage ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          } : undefined,
        };
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };

      // Map xAI errors to ProviderError (similar to OpenAI)
      if (err?.status === 401 || err?.message?.includes('Incorrect API key')) {
        throw new ProviderError(
          ProviderErrorType.INVALID_API_KEY,
          'Invalid xAI API key. Please check your API key and try again.',
          'xai'
        );
      } else if (err?.status === 429 || err?.message?.includes('rate limit')) {
        throw new ProviderError(
          ProviderErrorType.RATE_LIMIT,
          'xAI rate limit exceeded. Please wait a moment and try again.',
          'xai',
          true // retryable
        );
      } else if (err?.status === 402 || err?.message?.includes('quota') || err?.message?.includes('billing')) {
        throw new ProviderError(
          ProviderErrorType.QUOTA_EXCEEDED,
          'xAI quota exceeded or billing issue. Please check your account.',
          'xai'
        );
      } else if (err?.status === 404 || err?.message?.includes('model')) {
        throw new ProviderError(
          ProviderErrorType.MODEL_NOT_FOUND,
          `Model "${model}" not found on xAI.`,
          'xai'
        );
      } else if (err?.message?.includes('CORS') || err?.message?.includes('fetch')) {
        throw new ProviderError(
          ProviderErrorType.NETWORK_ERROR,
          'xAI requires backend proxy for browser use. CORS error encountered.',
          'xai'
        );
      } else {
        throw new ProviderError(
          ProviderErrorType.UNKNOWN,
          `xAI error: ${err?.message || 'Unknown error occurred'}`,
          'xai'
        );
      }
    }
  }
}

// Singleton instance
export const xaiProvider = new XAIProvider();
