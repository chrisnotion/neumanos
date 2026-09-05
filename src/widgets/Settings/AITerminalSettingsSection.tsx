import React, { useState, useMemo, useEffect } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import type { QuickNoteMode } from '../../stores/useTerminalStore';
import { ProviderSettings } from '../../components/ProviderSettings';
import { createDefaultRouter, PROVIDER_METADATA } from '../../services/ai/providerRouter';
import { logger } from '../../services/logger';

const log = logger.module('AI:Settings');

const QUICK_NOTE_MODES: { value: QuickNoteMode; label: string; description: string }[] = [
  {
    value: 'permanent',
    label: '持久便签',
    description: '单张便签长期保留，就绪后可手动转存至对应模块。',
  },
  {
    value: 'daily',
    label: '每日便签',
    description: '每日自动创建新便签，历史便签归档为普通笔记。',
  },
  {
    value: 'auto-archive',
    label: '自动归档',
    description: '超出指定天数的记录自动移入对应的「每日随记」。',
  },
];

const AUTO_ARCHIVE_OPTIONS = [
  { value: 3, label: '3 天' },
  { value: 7, label: '7 天' },
  { value: 14, label: '14 天' },
  { value: 30, label: '30 天' },
];

/**
 * AI Terminal Settings Section
 * Provides functional AI provider configuration directly in Settings.
 * Changes sync with AI Terminal since both use the same store.
 */
export const AITerminalSettingsSection: React.FC = () => {
  const providers = useTerminalStore((s) => s.providers);
  const activeProvider = useTerminalStore((s) => s.activeProvider);
  const activeModel = useTerminalStore((s) => s.activeModel);
  const encryptionPassword = useTerminalStore((s) => s.encryptionPassword);
  const isPasswordExpired = useTerminalStore((s) => s.isPasswordExpired);

  // Quick Note settings
  const quickNoteMode = useTerminalStore((s) => s.quickNoteMode);
  const autoArchiveDays = useTerminalStore((s) => s.autoArchiveDays);
  const setQuickNoteMode = useTerminalStore((s) => s.setQuickNoteMode);
  const setAutoArchiveDays = useTerminalStore((s) => s.setAutoArchiveDays);

  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [configuredCount, setConfiguredCount] = useState(0);

  // Create router for settings (shares store with AITerminal)
  const router = useMemo(() => createDefaultRouter(), []);

  // Initialize API keys and count configured providers
  useEffect(() => {
    const initializeAndCount = async () => {
      // Initialize API keys from encrypted storage
      if (encryptionPassword && !isPasswordExpired()) {
        const allProviderIds = Object.keys(PROVIDER_METADATA);
        for (const providerId of allProviderIds) {
          const providerConfig = providers[providerId];
          if (providerConfig && providerConfig.encryptedApiKey) {
            try {
              const decryptedKey = await useTerminalStore.getState().getProviderApiKey(providerId, encryptionPassword);
              if (decryptedKey) {
                router.setProviderApiKey(providerId, decryptedKey);
              }
            } catch (error) {
              log.error(`Failed to decrypt ${providerId} API key`, { error });
            }
          }
        }
      }

      // Count configured providers
      const configured = await router.getConfiguredProviders();
      setConfiguredCount(configured.length);
    };

    initializeAndCount();
  }, [encryptionPassword, isPasswordExpired, providers, router]);

  // Recount when providers change
  useEffect(() => {
    const countConfigured = async () => {
      const configured = await router.getConfiguredProviders();
      setConfiguredCount(configured.length);
    };
    countConfigured();
  }, [providers, router]);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              AI 终端助手
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              支持 8 家主流大模型服务商的多模型协同架构
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowProviderSettings(true)}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          配置模型服务商
        </button>
      </div>

      {/* Provider Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">已就绪服务商</p>
          <p className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {configuredCount} <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary">/ 8</span>
          </p>
        </div>
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">当前主选模型</p>
          <p className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
            {activeProvider ? (
              <>
                {PROVIDER_METADATA[activeProvider]?.displayName || activeProvider}
                {activeModel && (
                  <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary block truncate">
                    {activeModel}
                  </span>
                )}
              </>
            ) : (
              <span className="text-text-light-secondary dark:text-text-dark-secondary">尚未选择</span>
            )}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6 p-4 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
        <p className="text-sm text-status-info-text dark:text-status-info-text-dark mb-2">
          <strong>🎯 多模型服务矩阵特性</strong>
        </p>
        <ul className="text-xs text-status-info-text dark:text-status-info-text-dark space-y-1">
          <li>• 支持 8 大服务商（OpenRouter, Groq, HuggingFace, Mistral, Gemini, OpenAI, Claude, Grok）</li>
          <li>• 多数服务商提供充裕的免费模型额度，即开即用</li>
          <li>• 主服务商响应异常或限流时，自动无缝降级切换</li>
          <li>• 采用独立高强度加密算法存储密钥，安全隐私皆在本地</li>
        </ul>
      </div>

      {/* Quick Note Settings */}
      <div className="mb-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            快速便签设置
          </h3>
        </div>

        {/* Mode Selection */}
        <div className="mb-4">
          <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
            便签工作模式
          </label>
          <div className="space-y-2">
            {QUICK_NOTE_MODES.map((mode) => (
              <label
                key={mode.value}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  quickNoteMode === mode.value
                    ? 'bg-accent-yellow/10 border border-accent-yellow/30'
                    : 'bg-surface-light dark:bg-surface-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="quickNoteMode"
                  value={mode.value}
                  checked={quickNoteMode === mode.value}
                  onChange={(e) => setQuickNoteMode(e.target.value as QuickNoteMode)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {mode.label}
                  </span>
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                    {mode.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Auto-Archive Days (only shown in auto-archive mode) */}
        {quickNoteMode === 'auto-archive' && (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
            <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
              自动归档超出天数的便签
            </label>
            <select
              value={autoArchiveDays}
              onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-yellow"
            >
              {AUTO_ARCHIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-2">
              凡是记录时间超过 {autoArchiveDays} 天的条目，将自动移入其对应日期的「每日随记」中。
            </p>
          </div>
        )}
      </div>

      {/* Chat History Privacy Note */}
      <div className="mb-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          <strong>隐私承诺：</strong> 对话记录仅保存在本地设备中。您可随时在 AI 终端面板中一键清空全部历史记录。
        </p>
      </div>

      {/* Free Provider Links */}
      <div className="p-4 bg-status-success-bg dark:bg-status-success-bg-dark border border-status-success-border dark:border-status-success-border-dark rounded-lg">
        <p className="text-sm font-semibold text-status-success-text dark:text-status-success-text-dark mb-2">
          获取免费 API 密钥：
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm text-status-success-text dark:text-status-success-text-dark">
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            OpenRouter 密钥 →
          </a>
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            Groq 控制台 →
          </a>
          <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            HuggingFace 令牌 →
          </a>
          <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            Mistral 控制台 →
          </a>
        </div>
      </div>

      {/* Provider Settings Modal */}
      <ProviderSettings
        isOpen={showProviderSettings}
        onClose={() => setShowProviderSettings(false)}
        router={router}
      />
    </div>
  );
};
