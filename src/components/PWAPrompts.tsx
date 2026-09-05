/**
 * PWA Prompts Component
 *
 * Shows install and update prompts for the PWA.
 * Includes install banner and update notification.
 */

import React from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

/**
 * PWAInstallPrompt - Shows a banner prompting users to install the app
 */
export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, install, dismissInstall } = usePWA();

  if (!canInstall) return null;

  const handleInstall = async () => {
    await install();
  };

  return (
    <div
      className="
        fixed bottom-4 right-4 z-50
        flex items-center gap-3 p-4
        bg-surface-light dark:bg-surface-dark
        border border-border-light dark:border-border-dark
        rounded-xl shadow-xl
        max-w-sm
        animate-in fade-in slide-in-from-bottom-4
      "
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 p-2 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-lg">
        <Download className="w-6 h-6 text-accent-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
          安装 NeumanOS
        </p>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          添加到桌面或主屏幕，随时快速启动与离线使用
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="
            px-3 py-1.5 rounded-lg
            bg-accent-blue text-white
            hover:bg-accent-blue/90
            transition-colors
            text-sm font-medium
          "
        >
          立即安装
        </button>
        <button
          onClick={dismissInstall}
          className="
            p-1.5 rounded-lg
            text-text-light-secondary dark:text-text-dark-secondary
            hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
            transition-colors
          "
          aria-label="忽略安装提示"
          title="忽略"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * PWAUpdatePrompt - Shows a notification when a new version is available
 */
export const PWAUpdatePrompt: React.FC = () => {
  const { needsUpdate, applyUpdate, dismissUpdate } = usePWA();

  if (!needsUpdate) return null;

  return (
    <div
      className="
        fixed bottom-4 right-4 z-50
        flex items-center gap-3 p-4
        bg-surface-light dark:bg-surface-dark
        border border-accent-blue/30 dark:border-accent-blue/40
        rounded-xl shadow-xl
        max-w-sm
        animate-in fade-in slide-in-from-bottom-4
      "
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 p-2 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-lg">
        <RefreshCw className="w-6 h-6 text-accent-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
          发现新版本
        </p>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          NeumanOS 已发布新更新，随时可应用
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={applyUpdate}
          className="
            px-3 py-1.5 rounded-lg
            bg-accent-blue text-white
            hover:bg-accent-blue/90
            transition-colors
            text-sm font-medium
          "
        >
          立即更新
        </button>
        <button
          onClick={dismissUpdate}
          className="
            p-1.5 rounded-lg
            text-text-light-secondary dark:text-text-dark-secondary
            hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
            transition-colors
          "
          aria-label="忽略更新提示"
          title="忽略"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * PWAPrompts - Combined component that shows both install and update prompts
 * Use this in your root layout to handle all PWA prompts
 */
export const PWAPrompts: React.FC = () => {
  return (
    <>
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </>
  );
};

export default PWAPrompts;
