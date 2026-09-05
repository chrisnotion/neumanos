/**
 * Custom OpenAI-Compatible Provider
 * Access any OpenAI-compatible API (OneAPI, NewAPI, vLLM, Ollama, LocalAI, DeepSeek, Moonshot, etc.)
 * Allows user to configure custom Base URL and models.
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

const log = logger.module('AI:CustomOpenAI');

export const DEFAULT_CUSTOM_OPENAI_BASE_URL = 'https://api.openai.com/v1';

const METADATA: AIProviderMetadata = {
  id: 'custom-openai',
  name: 'Custom OpenAI',
  displayName: '自定义 OpenAI 接口',
  description: '兼容 OpenAI 协议的自定义接口。支持自定义 Base URL 与模型名称（适用于第三方反代、中转、Ollama、vLLM 等）。',

  requiresApiKey: true,
  apiKeyLabel: 'API Key',

  hasFreeModels: false,
  freeModelIds: [],

  supportsCORS: true,
  requiresProxy: false,
  supportsStreaming: true,

  websiteUrl: 'https://platform.openai.com',
  docsUrl: 'https://platform.openai.com/docs/api-reference',
};

const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'custom-openai',
    speedRating: 4,
    qualityRating: 5,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    isFree: false,
    requiresApiKey: true,
    useCases: ['chat', 'code', 'reasoning', 'multimodal'],
    description: '默认通用主力模型。',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'custom-openai',
    speedRating: 5,
    qualityRating: 4,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    isFree: false,
    requiresApiKey: true,
    useCases: ['chat', 'code', 'quick-tasks'],
    description: '轻量高速模型。',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'custom-openai',
    speedRating: 4,
    qualityRating: 5,
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
    isFree: false,
    requiresApiKey: true,
    useCases: ['chat', 'code', 'reasoning'],
    description: '深度求索对话模型。',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner (R1)',
    provider: 'custom-openai',
    speedRating: 3,
    qualityRating: 5,
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: false,
    isFree: false,
    requiresApiKey: true,
    useCases: ['reasoning', 'code', 'math'],
    description: '深度求索推理模型。',
  },
];

export class CustomOpenAIProvider implements AIProvider {
  metadata = METADATA;
  models: AIModel[] = [...DEFAULT_MODELS];

  private client: OpenAI | null = null;
  private apiKey: string | null = null;
  private baseUrl: string = DEFAULT_CUSTOM_OPENAI_BASE_URL;

  private initializeClient(): void {
    if (!this.apiKey) {
      this.client = null;
      return;
    }

    let normalizedUrl = this.baseUrl?.trim() || DEFAULT_CUSTOM_OPENAI_BASE_URL;
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: normalizedUrl,
      dangerouslyAllowBrowser: true,
    });
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initializeClient();
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  clearApiKey(): void {
    this.apiKey = null;
    this.client = null;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl?.trim() || DEFAULT_CUSTOM_OPENAI_BASE_URL;
    if (this.apiKey) {
      this.initializeClient();
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setCustomModels(models: AIModel[]): void {
    if (models && models.length > 0) {
      this.models = models;
    }
  }

  addCustomModel(modelId: string, name?: string): void {
    const trimmedId = modelId.trim();
    if (!trimmedId) return;

    if (!this.models.some((m) => m.id === trimmedId)) {
      const newModel: AIModel = {
        id: trimmedId,
        name: name?.trim() || trimmedId,
        provider: 'custom-openai',
        speedRating: 4,
        qualityRating: 4,
        contextWindow: 128000,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsVision: true,
        supportsFunctionCalling: true,
        isFree: false,
        requiresApiKey: true,
        useCases: ['chat', 'code', 'general'],
        description: `自定义模型 ${trimmedId}`,
      };
      this.models = [newModel, ...this.models];
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      let normalizedUrl = this.baseUrl?.trim() || DEFAULT_CUSTOM_OPENAI_BASE_URL;
      normalizedUrl = normalizedUrl.replace(/\/+$/, '');

      const testClient = new OpenAI({
        apiKey: apiKey,
        baseURL: normalizedUrl,
        dangerouslyAllowBrowser: true,
      });

      try {
        await testClient.models.list();
        return true;
      } catch {
        await testClient.chat.completions.create({
          model: this.models[0]?.id || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        });
        return true;
      }
    } catch (error: unknown) {
      log.error('Custom OpenAI API key validation failed', { error });
      return false;
    }
  }

  getModel(modelId: string): AIModel | null {
    const found = this.models.find((m) => m.id === modelId);
    if (found) return found;

    this.addCustomModel(modelId);
    return this.models.find((m) => m.id === modelId) || null;
  }

  getDefaultModel(): AIModel {
    return this.models[0] || DEFAULT_MODELS[0];
  }

  getFreeModels(): AIModel[] {
    return [];
  }

  async sendMessage(model: string, options: AIMessageOptions): Promise<AIResponse> {
    if (!this.client) {
      throw new ProviderError(
        ProviderErrorType.INVALID_API_KEY,
        '自定义 OpenAI 服务商未配置 API Key。',
        'custom-openai'
      );
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      if (options.conversationHistory) {
        options.conversationHistory.forEach((msg) => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        });
      }

      messages.push({
        role: 'user',
        content: options.prompt,
      });

      if (options.stream && options.onChunk) {
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
          provider: 'custom-openai',
          finishReason: 'stop',
        };
      } else {
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
          provider: 'custom-openai',
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

      if (err?.status === 401 || err?.message?.includes('Incorrect API key') || err?.message?.includes('401')) {
        throw new ProviderError(
          ProviderErrorType.INVALID_API_KEY,
          '自定义 OpenAI API 密钥无效或未授权。',
          'custom-openai'
        );
      } else if (err?.status === 429 || err?.message?.includes('rate limit')) {
        throw new ProviderError(
          ProviderErrorType.RATE_LIMIT,
          '自定义接口速率超限 (429 Rate Limit)。',
          'custom-openai',
          true
        );
      } else if (err?.status === 402 || err?.message?.includes('quota') || err?.message?.includes('balance')) {
        throw new ProviderError(
          ProviderErrorType.QUOTA_EXCEEDED,
          '自定义接口余额不足或额度耗尽。',
          'custom-openai'
        );
      } else if (err?.status === 404 || err?.message?.includes('model')) {
        throw new ProviderError(
          ProviderErrorType.MODEL_NOT_FOUND,
          `在当前接口未找到模型 "${model}"。`,
          'custom-openai'
        );
      } else if (err?.message?.includes('CORS') || err?.message?.includes('Failed to fetch')) {
        throw new ProviderError(
          ProviderErrorType.NETWORK_ERROR,
          `网络请求或跨域(CORS)错误：无法访问 ${this.baseUrl}。请检查 Base URL 是否正确，以及服务端是否允许跨域。`,
          'custom-openai'
        );
      } else {
        throw new ProviderError(
          ProviderErrorType.UNKNOWN,
          `自定义 OpenAI 接口错误: ${err?.message || '未知错误'}`,
          'custom-openai'
        );
      }
    }
  }
}

export const customOpenAIProvider = new CustomOpenAIProvider();
