/**
 * Provider Settings Modal
 * Configure AI provider API keys with encryption
 *
 * Features:
 * - Configure all 8 AI providers (OpenRouter, Groq, HuggingFace, Mistral, Gemini, OpenAI, Anthropic, xAI)
 * - Encrypted API key storage
 * - Visual provider status (configured/unconfigured)
 * - Test API key validation
 * - Provider documentation links
 * - Free vs paid tier indicators
 * - CORS compatibility warnings
 */

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { PasswordPrompt } from './PasswordPrompt';
import { ConfirmDialog } from './ConfirmDialog';
import { useTerminalStore } from '../stores/useTerminalStore';
import { AIProviderRouter, PROVIDER_METADATA } from '../services/ai/providerRouter';
import { toast } from '../stores/useToastStore';

interface ProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  router: AIProviderRouter;
}

export function ProviderSettings({ isOpen, onClose, router }: ProviderSettingsProps) {
  const {
    // providers is unused (using router.getAllProviders() instead)
    encryptionPassword,
    passwordHash,
    isPasswordExpired,
    setProviderApiKey,
    clearProviderApiKey,
    setEncryptionPassword,
    setActiveProvider,
    enableCrossModuleContext,
    setEnableCrossModuleContext,
    customOpenAIBaseUrl,
    setCustomOpenAIBaseUrl,
    customOpenAIModel,
    setCustomOpenAIModel,
  } = useTerminalStore();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [baseUrlInput, setBaseUrlInput] = useState<string>(customOpenAIBaseUrl || 'https://api.openai.com/v1');
  const [customModelInput, setCustomModelInput] = useState<string>(customOpenAIModel || 'gpt-4o-mini');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [validationResults, setValidationResults] = useState<Record<string, boolean | null>>({});
  const [testingModel, setTestingModel] = useState<boolean>(false);
  const [testReply, setTestReply] = useState<string | null>(null);
  const [providerToClear, setProviderToClear] = useState<string | null>(null);

  // Get provider metadata (sync - no SDK loading needed for display)
  const providerMetadataList = PROVIDER_METADATA;
  const providerStatus = router.getProviderStatus();

  // Sync inputs with persisted store values
  useEffect(() => {
    if (customOpenAIBaseUrl) {
      setBaseUrlInput(customOpenAIBaseUrl);
    }
    if (customOpenAIModel) {
      setCustomModelInput(customOpenAIModel);
    }
  }, [customOpenAIBaseUrl, customOpenAIModel]);

  // Check if password is needed
  useEffect(() => {
    if (!encryptionPassword || isPasswordExpired()) {
      // Password needed but don't show prompt automatically
      // User will trigger it when trying to save an API key
    }
  }, [encryptionPassword, isPasswordExpired]);

  const handlePasswordSubmit = (password: string, hash: string, duration: 'daily' | 'weekly' | 'monthly') => {
    setEncryptionPassword(password, hash, duration);
    setShowPasswordPrompt(false);

    // If user was trying to save a provider, save it now
    if (selectedProvider && apiKeyInputs[selectedProvider]) {
      saveProviderKey(selectedProvider, apiKeyInputs[selectedProvider], password);
    }
  };

  const saveProviderKey = async (providerId: string, apiKey: string, password: string) => {
    try {
      if (providerId === 'custom-openai') {
        const trimmedBaseUrl = baseUrlInput.trim() || 'https://api.openai.com/v1';
        const trimmedModel = customModelInput.trim() || 'gpt-4o-mini';
        setCustomOpenAIBaseUrl(trimmedBaseUrl);
        setCustomOpenAIModel(trimmedModel);
        router.setProviderBaseUrl(providerId, trimmedBaseUrl);
        router.addProviderCustomModel(providerId, trimmedModel);
      }

      await setProviderApiKey(providerId, apiKey, password);
      setApiKeyInputs((prev) => ({ ...prev, [providerId]: '' }));
      setValidationResults((prev) => ({ ...prev, [providerId]: null }));

      // Store API key in router (will be applied when provider loads)
      router.setProviderApiKey(providerId, apiKey);

      // Try to load provider and set as active
      const provider = await router.getProvider(providerId);
      if (provider) {
        if (providerId === 'custom-openai') {
          const trimmedModel = customModelInput.trim() || 'gpt-4o-mini';
          setActiveProvider(providerId, trimmedModel);
        } else {
          const defaultModel = provider.getDefaultModel();
          if (defaultModel) {
            setActiveProvider(providerId, defaultModel.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error('Failed to save API key', 'Please try again.');
    }
  };

  const handleSaveApiKey = (providerId: string) => {
    const apiKey = apiKeyInputs[providerId];
    if (!apiKey || !apiKey.trim()) return;

    // Check if password is needed
    if (!encryptionPassword || isPasswordExpired()) {
      setSelectedProvider(providerId);
      setShowPasswordPrompt(true);
      return;
    }

    saveProviderKey(providerId, apiKey, encryptionPassword);
  };

  const handleClearApiKey = (providerId: string) => {
    setProviderToClear(providerId);
  };

  const confirmClearApiKey = () => {
    if (providerToClear) {
      clearProviderApiKey(providerToClear);
      setApiKeyInputs((prev) => ({ ...prev, [providerToClear]: '' }));
      setValidationResults((prev) => ({ ...prev, [providerToClear]: null }));
      setProviderToClear(null);
    }
  };

  const handleTestApiKey = async (providerId: string) => {
    const apiKey = apiKeyInputs[providerId];
    if (!apiKey || !apiKey.trim()) {
      toast.warning('Please enter an API key first');
      return;
    }

    setValidating((prev) => ({ ...prev, [providerId]: true }));

    try {
      if (providerId === 'custom-openai') {
        const trimmedBaseUrl = baseUrlInput.trim() || 'https://api.openai.com/v1';
        router.setProviderBaseUrl(providerId, trimmedBaseUrl);
      }

      // Load provider SDK on-demand for validation
      const provider = await router.getProvider(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      const isValid = await provider.validateApiKey(apiKey);
      setValidationResults((prev) => ({ ...prev, [providerId]: isValid }));

      if (isValid) {
        toast.success('API key valid', `${providerStatus[providerId]?.name} is ready to use.`);
      } else {
        toast.error('API key invalid', `Please check your ${providerStatus[providerId]?.name} key.`);
      }
    } catch (error: unknown) {
      console.error('API key validation error:', error);
      setValidationResults((prev) => ({ ...prev, [providerId]: false }));
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Validation error', message);
    } finally {
      setValidating((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleOneClickTest = async (providerId: string) => {
    let apiKey = apiKeyInputs[providerId]?.trim();
    if (!apiKey) {
      if (encryptionPassword && !isPasswordExpired()) {
        const savedKey = await useTerminalStore.getState().getProviderApiKey(providerId, encryptionPassword);
        if (savedKey) apiKey = savedKey;
      }
    }

    if (!apiKey) {
      toast.warning('请先输入 API 密钥', '需要输入 API Key 以测试模型是否真实可用。');
      return;
    }

    setTestingModel(true);
    setTestReply(null);

    try {
      const trimmedBaseUrl = baseUrlInput.trim() || 'https://api.openai.com/v1';
      const trimmedModel = customModelInput.trim() || 'gpt-4o-mini';

      router.setProviderBaseUrl(providerId, trimmedBaseUrl);
      router.setProviderApiKey(providerId, apiKey);

      const provider = await router.getProvider(providerId);
      if (!provider) {
        throw new Error('未找到服务商实例');
      }

      if (provider.testModel) {
        const result = await provider.testModel(trimmedModel, apiKey);
        if (result.success) {
          setValidationResults((prev) => ({ ...prev, [providerId]: true }));
          setTestReply(result.reply || '(无返回文本)');
          toast.success('一键测试成功！', `模型 [${trimmedModel}] 可用。回复: ${result.reply?.slice(0, 60)}`);
        } else {
          setValidationResults((prev) => ({ ...prev, [providerId]: false }));
          setTestReply(`测试失败: ${result.error}`);
          toast.error('模型测试失败', result.error || '无法与模型完成对话。');
        }
      } else {
        const response = await provider.sendMessage(trimmedModel, {
          prompt: 'hi',
          maxTokens: 50,
        });
        setValidationResults((prev) => ({ ...prev, [providerId]: true }));
        setTestReply(response.content || '(无返回文本)');
        toast.success('一键测试成功！', `模型 [${trimmedModel}] 可用。回复: ${response.content.slice(0, 60)}`);
      }
    } catch (error: unknown) {
      console.error('One-click test error:', error);
      const msg = error instanceof Error ? error.message : '未知错误';
      setValidationResults((prev) => ({ ...prev, [providerId]: false }));
      setTestReply(`测试失败: ${msg}`);
      toast.error('一键测试失败', msg);
    } finally {
      setTestingModel(false);
    }
  };

  const toggleShowApiKey = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="AI 大模型服务商设置"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {/* Header Description */}
          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            <p className="mb-1">
              配置各大服务商的 API 密钥。密钥采用 AES-256-CBC 算法高强度加密，且仅安全保存在您的本地设备中。
            </p>
            <p className="text-[10px]">
              <span className="text-accent-green">🟢 免费</span> 包含免费可用模型额度
              {' • '}
              <span className="text-accent-blue">🔵 自备密钥</span> BYOK (自带 API Key)
              {' • '}
              <span className="text-accent-yellow">⚠️</span> 受浏览器跨域 (CORS) 限制
            </p>
          </div>

          {/* Provider List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {Object.entries(providerMetadataList).map(([providerId, metadata]) => {
              const status = providerStatus[providerId];
              const isConfigured = status?.configured || false;

              return (
                <div
                  key={providerId}
                  className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button"
                >
                  {/* Provider Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      {/* Provider Favicon */}
                      {metadata.websiteUrl && (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(metadata.websiteUrl).hostname}&sz=32`}
                          alt=""
                          className="w-5 h-5 mt-0.5 rounded-sm flex-shrink-0"
                          onError={(e) => {
                            // Hide on error - fall back to no icon
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                          {metadata.displayName}
                        </h3>
                        {metadata.hasFreeModels && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                            含免费模型
                          </span>
                        )}
                        {!metadata.supportsCORS && metadata.requiresProxy && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 bg-accent-yellow/10 text-accent-yellow rounded cursor-help"
                            title="该服务商直接限制了浏览器直连跨域 (CORS)。推荐使用 OpenRouter，可免代理直接在浏览器中访问其模型。"
                          >
                            ⚠️ 需跨域代理
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {metadata.description}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                        <span>{status?.modelCount || 0} 个可选模型</span>
                        {metadata.apiKeyUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={metadata.apiKeyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-blue hover:text-accent-blue-hover"
                            >
                              获取 API 密钥 →
                            </a>
                          </>
                        )}
                        {metadata.docsUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={metadata.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-blue hover:text-accent-blue-hover"
                            >
                              官方开发文档 →
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isConfigured ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                          ✓ 已配置
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary rounded">
                          未配置
                        </span>
                      )}
                    </div>
                  </div>

                  {/* API Key Input & Base URL */}
                  <div className="space-y-1.5">
                    {providerId === 'custom-openai' && (
                      <div className="space-y-1.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-text-light-secondary dark:text-text-dark-secondary">
                            Base URL (兼容 OpenAI 接口地址)
                          </label>
                          <input
                            type="text"
                            value={baseUrlInput}
                            onChange={(e) => setBaseUrlInput(e.target.value)}
                            placeholder="例如: https://api.your-proxy.com/v1"
                            className="w-full px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary text-xs"
                          />
                          <p className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary leading-tight">
                            ⚠️ 提示：OpenAI 官方域名 (api.openai.com) 禁用浏览器直接跨域访问；需使用支持 CORS 的第三方代理/中转 URL，且必须与本站同为 HTTPS 协议。
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-text-light-secondary dark:text-text-dark-secondary">
                            模型 ID (Model ID)
                          </label>
                          <input
                            type="text"
                            value={customModelInput}
                            onChange={(e) => setCustomModelInput(e.target.value)}
                            placeholder="例如: gpt-4o-mini, deepseek-chat, qwen-max, claude-3-5-sonnet 等"
                            className="w-full px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      <div className="flex-1 relative">
                        <input
                          type={showApiKeys[providerId] ? 'text' : 'password'}
                          value={apiKeyInputs[providerId] || ''}
                          onChange={(e) =>
                            setApiKeyInputs((prev) => ({ ...prev, [providerId]: e.target.value }))
                          }
                          placeholder={
                            isConfigured
                              ? '输入新 API 密钥以替换现有密钥'
                              : `输入您的 ${metadata.apiKeyLabel || 'API 密钥'}`
                          }
                          className="w-full px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary text-xs"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowApiKey(providerId)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary text-[10px]"
                        >
                          {showApiKeys[providerId] ? '隐藏' : '显示'}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleSaveApiKey(providerId)}
                        disabled={!apiKeyInputs[providerId]?.trim()}
                        className="px-2.5 py-1 bg-accent-blue hover:bg-accent-blue-hover disabled:bg-surface-light-elevated dark:disabled:bg-surface-dark-elevated disabled:text-text-light-tertiary dark:disabled:text-text-dark-tertiary disabled:cursor-not-allowed text-white rounded-button text-xs transition-all duration-standard ease-smooth"
                      >
                        {isConfigured ? '更新保存' : '保存'}
                      </button>

                      {providerId === 'custom-openai' ? (
                        <button
                          onClick={() => handleOneClickTest(providerId)}
                          disabled={testingModel}
                          className="px-2.5 py-1 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/30 rounded-button text-xs font-medium transition-all duration-standard ease-smooth flex items-center gap-1"
                          title="发送 prompt: hi 测试模型是否真实可用"
                        >
                          {testingModel ? '测试中 (发送 hi)...' : '⚡ 一键测试 (hi)'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTestApiKey(providerId)}
                          disabled={!apiKeyInputs[providerId]?.trim() || validating[providerId]}
                          className="px-2.5 py-1 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-50 disabled:cursor-not-allowed border border-border-light dark:border-border-dark rounded-button text-xs text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
                        >
                          {validating[providerId] ? '检测中...' : '测试连通性'}
                        </button>
                      )}

                      {isConfigured && (
                        <button
                          onClick={() => handleClearApiKey(providerId)}
                          className="px-2.5 py-1 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 rounded-button text-xs text-accent-red transition-all duration-standard ease-smooth"
                        >
                          清除
                        </button>
                      )}

                      {/* Validation Result */}
                      {validationResults[providerId] !== null && (
                        <span
                          className={`px-1.5 py-1 text-[10px] rounded-button ${
                            validationResults[providerId]
                              ? 'bg-accent-green/10 text-accent-green'
                              : 'bg-accent-red/10 text-accent-red'
                          }`}
                        >
                          {validationResults[providerId] ? '✓ 连通有效' : '✗ 密钥无效'}
                        </span>
                      )}
                    </div>

                    {/* Test Reply Display for custom-openai */}
                    {providerId === 'custom-openai' && testReply && (
                      <div className="mt-1.5 p-2 rounded bg-surface-light dark:bg-surface-dark text-[11px] text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark break-all">
                        <span className="font-medium text-text-light-primary dark:text-text-dark-primary">测试结果：</span>
                        {testReply}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Context Settings */}
          <div className="pt-3 border-t border-border-light dark:border-border-dark space-y-2">
            <h3 className="text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">
              AI 上下文联动
            </h3>
            <div className="flex items-start justify-between gap-4 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                  跨模块全局上下文注入
                </div>
                <div className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                  允许在与 AI 对话时按需参考笔记、待办事项、日历与习惯打卡数据
                </div>
              </div>
              <button
                role="switch"
                aria-checked={enableCrossModuleContext}
                onClick={() => setEnableCrossModuleContext(!enableCrossModuleContext)}
                className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
                  enableCrossModuleContext
                    ? 'bg-accent-blue'
                    : 'bg-surface-dark dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark'
                }`}
                aria-label="切换跨模块上下文"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    enableCrossModuleContext ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-3 border-t border-border-light dark:border-border-dark">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-xs transition-all duration-standard ease-smooth"
            >
              完成
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Prompt Modal */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordPrompt(false);
          setSelectedProvider(null);
        }}
        mode={passwordHash ? 'unlock' : 'setup'}
        existingPasswordHash={passwordHash || undefined}
      />

      {/* Confirm Clear API Key Dialog */}
      <ConfirmDialog
        isOpen={providerToClear !== null}
        onClose={() => setProviderToClear(null)}
        onConfirm={confirmClearApiKey}
        title="Remove API Key"
        message={providerToClear ? `Remove the API key for ${providerStatus[providerToClear]?.name || providerToClear}? You will need to re-enter it to use this provider.` : ''}
        confirmText="Remove"
        variant="danger"
      />
    </>
  );
}
