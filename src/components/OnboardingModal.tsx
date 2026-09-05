/**
 * OnboardingModal Component
 *
 * First-time user onboarding experience
 * - Step 1: Welcome screen with product intro and privacy statement
 * - Step 2: Features tour (Notes, Tasks, Calendar, Time Tracking)
 * - Step 3: Setup (display name, default folder, backup reminder)
 * - Step 4: Completion with CTA to create first note/task
 */

import { useState, lazy, Suspense } from 'react';
import { Modal } from './Modal';

// Lazy load SupportModal to prevent bundle bloat
const SupportModal = lazy(() => import('./SupportModal').then(m => ({ default: m.SupportModal })));
import { useSettingsStore } from '../stores/useSettingsStore';
import { useThemeStore } from '../stores/useThemeStore';
import { isFileSystemAccessSupported } from '../services/brainBackup';
import { BackupOnboardingModal } from './BackupOnboardingModal';
import {
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Info,
  Wifi,
  Database,
  LayoutDashboard,
  Zap,
  Heart,
  HelpCircle,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { THEME_REGISTRY } from '../config/themes/registry';
import type { ColorMode } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<'in-7-days' | 'monthly' | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);
  const setDisplayNameInStore = useSettingsStore((state) => state.setDisplayName);
  const updateBackupPreferences = useThemeStore((state) => state.updateBackupPreferences);
  const mode = useThemeStore((s) => s.mode);
  const brandTheme = useThemeStore((s) => s.brandTheme);
  const colorMode = useThemeStore((s) => s.colorMode);
  const setBrandTheme = useThemeStore((s) => s.setBrandTheme);
  const setColorMode = useThemeStore((s) => s.setColorMode);
  const logoSrc = mode === 'dark' ? '/images/logos/logo_white.png' : '/images/logos/logo_black.png';

  // Build theme list from registry (exclude default since we're migrating away from it)
  const themes = Object.values(THEME_REGISTRY).filter((t) => t.id !== 'default');

  const isFSASupported = isFileSystemAccessSupported();

  const totalSteps = 4;

  /**
   * Handle skip tour - mark onboarding complete and close
   */
  const handleSkipTour = () => {
    setOnboardingComplete(true);
    onClose();
  };

  /**
   * Handle completion - save preferences and close
   */
  const handleComplete = () => {
    // Save display name if provided
    if (displayName.trim()) {
      setDisplayNameInStore(displayName.trim());
    }
    setOnboardingComplete(true);
    onClose();
  };

  /**
   * Navigate to next step
   */
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Open backup setup modal
   */
  const handleSetupBackup = () => {
    setShowBackupModal(true);
  };

  /**
   * Handle backup modal completion
   */
  const handleBackupComplete = () => {
    setShowBackupModal(false);
    handleComplete();
  };

  /**
   * Handle skip with reminder preference
   */
  const handleSkipWithReminder = () => {
    if (selectedReminder) {
      const nextReminderDate =
        selectedReminder === 'in-7-days'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

      updateBackupPreferences({
        reminderPreference: selectedReminder,
        nextReminderDate,
      });
    }
    handleComplete();
  };

  /**
   * Handle skip forever (never remind)
   */
  const handleSkipForever = () => {
    updateBackupPreferences({
      reminderPreference: 'never',
      nextReminderDate: null,
    });
    handleComplete();
  };

  /**
   * Step 1: Welcome - Privacy and platform intro
   */
  const renderWelcomeStep = () => (
    <div className="space-y-4">
      {/* Tagline */}
      <p className="text-center text-lg text-text-light-secondary dark:text-text-dark-secondary italic">
        您的第二大脑 · 您的专属数据 · 您的端侧设备
      </p>

      {/* Core principles */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-accent-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              100% 纯本地优先
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              所有数据完全保留在您的本地设备上。无云端账户、无外部服务器、绝无隐私追踪。您的任何信息绝不离开发生端。
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Database className="h-6 w-6 text-accent-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              数据所有权归属于您
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              随时一键导出全量数据。无强制订阅、无供应商技术锁定。从第一天起就原生支持完整的数据自由迁移。
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Wifi className="h-6 w-6 text-accent-blue shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              支持全功能离线使用
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              无需依赖网络连接。您的个人生产力工具随时随地即开即用，不受网络波动干扰，静享高效心流。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Step 2: Features Tour - What's included
   */
  const renderFeaturesTourStep = () => (
    <div className="space-y-4">
      {/* Core features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              灵感笔记
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            支持文件夹分级、标签聚合、斜杠快捷指令与全局全文检索的沉浸式富文本编辑器
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              任务协同
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            支持子任务细分、前置依赖关联、优先级梯度与截止时间告警的敏捷看板
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-accent-blue" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              日程日历
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            提供月、周、日全景视图，支持周期循环日程规划与标准 ICS 文件双向导入导出
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              工时记录
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            关联具体项目的实时工时秒表，生成日度/周度效能统计报表与 CSV 数据导出
          </p>
        </div>
      </div>

      {/* Additional features */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
            60+ 运行中枢组件
          </h3>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          天气预报、极客资讯、智能换算、世界时钟、番茄专注时钟等。随心拖拽排版，组装最趁手的个人中枢。
        </p>
      </div>
    </div>
  );

  /**
   * Step 3: Setup - Personalization options
   */
  const renderSetupStep = () => (
    <div className="space-y-4">
      {/* Theme picker */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
            个性化视觉外观
          </h3>
        </div>

        {/* Color mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          {(
            [
              { id: 'light' as ColorMode, icon: Sun, label: '浅色' },
              { id: 'dark' as ColorMode, icon: Moon, label: '深色' },
              { id: 'system' as ColorMode, icon: Monitor, label: '跟随系统' },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setColorMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                colorMode === id
                  ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                  : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-primary/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Theme cards — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setBrandTheme(theme.id)}
              className={`flex-shrink-0 w-20 rounded-lg border p-2 transition-all text-center ${
                brandTheme === theme.id
                  ? 'border-accent-primary ring-1 ring-accent-primary'
                  : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
              }`}
              aria-label={`选择 ${theme.name} 主题`}
            >
              {/* Color swatches */}
              <div className="flex gap-1 justify-center mb-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                  style={{ backgroundColor: theme.preview.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                  style={{ backgroundColor: theme.preview.secondary }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                  style={{ backgroundColor: theme.preview.accent }}
                />
              </div>
              {/* Theme name */}
              <span className="text-[10px] leading-tight text-text-light-primary dark:text-text-dark-primary block truncate">
                {theme.name}
              </span>
              {/* Active indicator */}
              {brandTheme === theme.id && (
                <Check className="h-3 w-3 text-accent-primary mx-auto mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Display name input */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <label
          htmlFor="display-name"
          className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2"
        >
          用户昵称（可选）
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="输入您的称呼"
          className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
        <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          仅保存在您的本地浏览器中，绝不会被上传或共享
        </p>
      </div>

      {/* Backup info */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              守护数据安全
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
              您的数据存储在本地浏览器中。定期备份快照可确保心血万无一失。
            </p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              您可随时前往 设置 → 备份与同步 开启全自动同步备份
            </p>
          </div>
        </div>
      </div>

      {/* Quick tips */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              使用小贴士
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              按 <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">F1</kbd> 可随时呼出帮助中心。按 <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">B</kbd> 可折叠或展开侧边栏。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Step 4: Completion - Ready to start
   */
  const renderCompletionStep = () => (
    <div className="space-y-4">
      {/* Backup Section - Only show if FSA supported */}
      {isFSASupported && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-6 w-6 text-accent-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
                开启自动保存备份
              </h3>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                自动保存至本地目录（如网盘同步盘），实现无感静默全量备份。
              </p>
            </div>
          </div>

          <button
            onClick={handleSetupBackup}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors font-medium"
          >
            <Shield className="h-4 w-4" />
            <span>立即配置自动备份</span>
          </button>

          {/* Skip Options */}
          {!showSkipOptions ? (
            <button
              onClick={() => setShowSkipOptions(true)}
              className="w-full mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            >
              稍后再说...
            </button>
          ) : (
            <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
                何时提醒您配置？
              </p>
              <div className="flex gap-2">
                {[
                  { id: 'in-7-days' as const, label: '7天后' },
                  { id: 'monthly' as const, label: '每月' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedReminder(option.id)}
                    className={`flex-1 p-2 text-center text-sm rounded border transition-all ${
                      selectedReminder === option.id
                        ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                        : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSkipWithReminder}
                  disabled={!selectedReminder}
                  className="flex-1 px-3 py-2 bg-accent-primary text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认
                </button>
                <button
                  onClick={handleSkipForever}
                  className="px-3 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-status-error transition-colors"
                >
                  不再提醒
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Non-FSA Browser Message */}
      {!isFSASupported && (
        <div className="bg-status-info/10 border border-status-info rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-status-info shrink-0 mt-0.5" />
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
              <strong>提示：</strong> 本地目录自动保存支持 Chrome、Edge 或 Brave 浏览器。您也可以随时在“系统设置”中手动导出全量数据。
            </p>
          </div>
        </div>
      )}

      {/* Get Started Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary text-center mb-4">
          一切就绪，开启高效之旅！
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">创建第一篇笔记</span>
          </button>

          <button
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="font-medium">创建第一个任务</span>
          </button>
        </div>

        <p className="text-xs text-center text-text-light-secondary dark:text-text-dark-secondary mt-4">
          所有核心功能均可在左侧导航栏便捷直达
        </p>
      </div>

      {/* Built with care message */}
      <div className="text-center pt-2">
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center justify-center gap-1">
          <Heart className="h-3 w-3 text-accent-primary" />
          倾心打磨 · 捍卫隐私 · 专注生产力 · 坚守开源精神
        </p>
      </div>

      {/* Backup Modal (inline) */}
      <BackupOnboardingModal
        isOpen={showBackupModal}
        onClose={handleBackupComplete}
      />
    </div>
  );

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderWelcomeStep();
      case 2:
        return renderFeaturesTourStep();
      case 3:
        return renderSetupStep();
      case 4:
        return renderCompletionStep();
      default:
        return null;
    }
  };

  /**
   * Get step-specific subtitle text
   */
  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return '纯本地运行、隐私优先的个人生产力操作系统';
      case 2:
        return '助您理清万千事务的高效利器';
      case 3:
        return '定制契合您审美的专属体验';
      case 4:
        return '万事俱备，即刻启程！';
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="欢迎使用 NeumanOS" maxWidth="lg" hideHeader>
      <div className="flex flex-col">
        {/* Persistent Header: Logo + Title + Subtitle + Progress + Close */}
        <div className="flex-shrink-0 pb-4 border-b border-border-light dark:border-border-dark">
          {/* Close button - top right */}
          <div className="flex justify-end mb-2">
            <button
              onClick={handleSkipTour}
              className="p-1 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Logo + Title + Subtitle */}
          <div className="text-center mb-4">
            <img
              src={logoSrc}
              alt="NeumanOS"
              className="w-2/3 h-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              欢迎使用 NeumanOS
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
              {getStepSubtitle()}
            </p>
          </div>

          {/* Progress indicator - with visible border in both modes */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-10 rounded-full transition-colors border border-border-light dark:border-border-dark ${
                  index + 1 === currentStep
                    ? 'bg-accent-primary'
                    : index + 1 < currentStep
                    ? 'bg-accent-primary'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content - fixed height for consistent modal size (sized to fit page 4) */}
        <div className="py-5 min-h-[480px]">
          {renderStepContent()}
        </div>

        {/* Navigation Footer - fixed 3-column layout: Back/FAQ | Skip | Next */}
        <div className="flex-shrink-0 grid grid-cols-3 items-center pt-4 border-t border-border-light dark:border-border-dark">
          {/* Left column: FAQ button on step 1, Back button on other steps */}
          <div className="justify-self-start">
            {currentStep === 1 ? (
              <button
                onClick={() => setShowFaqModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>常见疑问</span>
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>上一步</span>
              </button>
            )}
          </div>

          {/* Skip tour - always centered */}
          <div className="justify-self-center">
            <button
              onClick={handleSkipTour}
              className="text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            >
              跳过导览
            </button>
          </div>

          {/* Next button - always present, changes to "Done" on last step */}
          <div className="justify-self-end">
            <button
              onClick={currentStep < totalSteps ? handleNext : handleComplete}
              className="flex items-center gap-2 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
            >
              <span>{currentStep < totalSteps ? '下一步' : '完成'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Modal - opens to Help tab with FAQs */}
      {showFaqModal && (
        <Suspense fallback={null}>
          <SupportModal
            isOpen={showFaqModal}
            onClose={() => setShowFaqModal(false)}
            initialTab="help"
          />
        </Suspense>
      )}
    </Modal>
  );
}
