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

export function normalizeBaseUrl(url: string): string {
  let u = url?.trim() || DEFAULT_CUSTOM_OPENAI_BASE_URL;
  u = u.replace(/\/+$/, '');
  if (u.endsWith('/chat/completions')) {
    u = u.slice(0, -'/chat/completions'.length).replace(/\/+$/, '');
  }
  return u;
}

export function formatCustomOpenAIError(error: unknown, baseUrl: string): string {
  const err = error as { status?: number; message?: string; name?: string };
  const message = err?.message || String(error);
  const normalized = normalizeBaseUrl(baseUrl);

  const isConnectionError =
    err?.name === 'APIConnectionError' ||
    message.includes('Connection error') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('CORS');

  if (isConnectionError) {
    const isOfficialOpenAI = normalized.includes('api.openai.com');
    const isMixedContent =
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      normalized.startsWith('http://');

    if (isOfficialOpenAI) {
      return '连接失败 (CORS 跨域拦截)：OpenAI 官方接口 (api.openai.com) 不支持在浏览器前端直接跨域调用。如果您使用的是官方 Key，请使用支持 CORS 的第三方代理/中转 URL（如 OneAPI、NewAPI、Cloudflare Workers 等），或切换至支持浏览器调用的服务商（如 OpenRouter、Anthropic）。';
    }

    if (isMixedContent) {
      return `连接失败 (Mixed Content 混合内容拦截)：当前网站使用 HTTPS，浏览器安全策略禁止直接向 HTTP 接口 (${normalized}) 发送请求。请将 Base URL 升级为 HTTPS 或使用 HTTPS 反向代理。`;
    }

    return `连接失败 (Connection error)：无法访问 ${normalized}。常见原因：\n1. 服务端跨域未开启 (CORS)：需在服务端配置 Access-Control-Allow-Origin: * 并响应 OPTIONS 预检；\n2. 路径不全：检查是否缺少 /v1（通常为 https://your-proxy.com/v1）；\n3. 服务不可达：请检查服务端网络连接或证书是否有效。`;
  }

  if (err?.status === 401 || message.includes('Incorrect API key') || message.includes('401')) {
    return 'API 密钥无效或未授权 (401 Unauthorized)。请检查 API Key 是否填写正确。';
  }

  if (err?.status === 429 || message.includes('rate limit')) {
    return '接口请求频率超限 (429 Rate Limit) 或并发过高。';
  }

  if (err?.status === 402 || message.includes('quota') || message.includes('balance') || message.includes('insufficient')) {
    return '接口账户余额不足或额度耗尽 (402/Quota Exceeded)。';
  }

  if (err?.status === 404 || message.includes('model')) {
    return '未找到该模型 (404 Not Found)。请检查所填写的模型 ID 是否存在于该提供商中。';
  }

  return message || '未知错误';
}

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

    const normalizedUrl = normalizeBaseUrl(this.baseUrl);

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

  async testModel(modelId: string, apiKey?: string): Promise<{ success: boolean; reply?: string; error?: string }> {
    const key = apiKey || this.apiKey;
    if (!key) {
      return { success: false, error: '请先填写 API Key 密钥后再进行测试。' };
    }

    const normalizedUrl = normalizeBaseUrl(this.baseUrl);

    try {
      const testClient = new OpenAI({
        apiKey: key,
        baseURL: normalizedUrl,
        dangerouslyAllowBrowser: true,
      });

      const targetModel = modelId.trim() || this.models[0]?.id || 'gpt-4o-mini';
      const completion = await testClient.chat.completions.create({
        model: targetModel,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 80,
      });

      const reply = completion.choices[0]?.message?.content || '(无文本回复)';
      this.addCustomModel(targetModel);
      return { success: true, reply };
    } catch (error: unknown) {
      const message = formatCustomOpenAIError(error, normalizedUrl);
      log.error('Custom OpenAI testModel failed', { error });
      return { success: false, error: message };
    }
  }

  async validateApiKey(apiKey: string, modelId?: string): Promise<boolean> {
    try {
      const normalizedUrl = normalizeBaseUrl(this.baseUrl);

      const testClient = new OpenAI({
        apiKey: apiKey,
        baseURL: normalizedUrl,
        dangerouslyAllowBrowser: true,
      });

      const targetModel = modelId?.trim() || this.models[0]?.id || 'gpt-4o-mini';
      await testClient.chat.completions.create({
        model: targetModel,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      });
      return true;
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
      const formatted = formatCustomOpenAIError(error, this.baseUrl);
      throw new ProviderError(
        ProviderErrorType.UNKNOWN,
        `自定义 OpenAI 接口错误: ${formatted}`,
        'custom-openai'
      );
    }
  }
}

export const customOpenAIProvider = new CustomOpenAIProvider();
