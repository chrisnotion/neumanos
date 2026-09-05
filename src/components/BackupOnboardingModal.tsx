/**
 * BackupOnboardingModal Component
 *
 * First-time onboarding modal for backup setup
 * - Step 1: Why Backup?
 * - Step 2: Choose Cloud Provider
 * - Step 3: Platform-Specific Instructions
 * - Step 4: Folder Picker (FSA API)
 * - Step 5: Reminder Preferences
 */

import { useState } from 'react';
import { Modal } from './Modal';
import { useThemeStore } from '../stores/useThemeStore';
import { autoSaveManager } from '../services/autoSave';
import { requestAutoSaveDirectory } from '../services/brainBackup';

interface BackupOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CloudProvider = 'icloud' | 'google-drive' | 'onedrive' | 'proton-drive' | 'dropbox' | 'none';
type Platform = 'windows' | 'macos';
type ReminderPreference = 'every-session' | 'in-7-days' | 'monthly' | 'never';

export function BackupOnboardingModal({ isOpen, onClose }: BackupOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [platform, setPlatform] = useState<Platform>(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('mac') ? 'macos' : 'windows';
  });
  const [reminderPreference, setReminderPreference] = useState<ReminderPreference>('every-session');
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBackupPreferences = useThemeStore((state) => state.updateBackupPreferences);

  const totalSteps = 5;

  /**
   * Handle folder selection (Step 4)
   */
  const handleSelectFolder = async () => {
    setIsSelecting(true);
    setError(null);

    try {
      const dirHandle = await requestAutoSaveDirectory();

      // Update preferences
      updateBackupPreferences({
        hasBackupFolder: true,
        backupFolderPath: dirHandle.name,
        autoSaveEnabled: true,
      });

      // Enable auto-save
      await autoSaveManager.enableLocal(dirHandle);

      // Move to next step
      setCurrentStep(5);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError('已取消文件夹选择，请选择一个文件夹以继续。');
      } else {
        setError(`错误: ${(err as Error).message}`);
      }
    } finally {
      setIsSelecting(false);
    }
  };

  /**
   * Handle reminder preference save (Step 5)
   */
  const handleSaveReminder = () => {
    let nextReminderDate: string | null = null;

    if (reminderPreference === 'in-7-days') {
      nextReminderDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (reminderPreference === 'monthly') {
      // 1st of next month
      const now = new Date();
      nextReminderDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    }

    updateBackupPreferences({
      reminderPreference,
      nextReminderDate,
    });

    onClose();
  };

  /**
   * Cloud provider instructions
   */
  const getInstructions = (provider: CloudProvider, platform: Platform) => {
    const instructions: Record<CloudProvider, Record<Platform, { title: string; steps: string[] }>> = {
      icloud: {
        windows: {
          title: 'iCloud 云盘 (Windows)',
          steps: [
            '从 Microsoft Store 下载并安装 iCloud for Windows 客户端',
            '使用您的 Apple ID 登录',
            '在 iCloud 设置中勾选开启「iCloud 云盘 (iCloud Drive)」',
            '打开文件资源管理器并进入 iCloud 云盘目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
        macos: {
          title: 'iCloud 云盘 (macOS)',
          steps: [
            '打开「系统设置」→「Apple ID」→「iCloud」',
            '开启「iCloud 云盘」功能',
            '在访达 (Finder) 边栏中进入 iCloud 云盘',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
      },
      'google-drive': {
        windows: {
          title: 'Google Drive (Windows)',
          steps: [
            '从官网下载并安装 Google Drive 桌面客户端',
            '登录您的 Google 账号',
            '在文件资源管理器中找到 Google 云端硬盘同步盘',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
        macos: {
          title: 'Google Drive (macOS)',
          steps: [
            '从官网下载并安装 Google Drive 桌面客户端',
            '登录您的 Google 账号',
            '在访达中进入 Google Drive 同步目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
      },
      onedrive: {
        windows: {
          title: 'OneDrive (Windows)',
          steps: [
            'Windows 10/11 系统已内置 OneDrive',
            '登录您的微软账号（若已登录则忽略）',
            '打开文件资源管理器并进入 OneDrive 同步目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
        macos: {
          title: 'OneDrive (macOS)',
          steps: [
            '从 Mac App Store 下载安装 OneDrive 客户端',
            '登录您的微软账号',
            '在访达中进入 OneDrive 目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
      },
      'proton-drive': {
        windows: {
          title: 'Proton Drive (Windows)',
          steps: [
            '从 proton.me/drive 下载安装桌面客户端',
            '登录您的 Proton 账号',
            '打开文件资源管理器进入 Proton Drive 目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
        macos: {
          title: 'Proton Drive (macOS)',
          steps: [
            '从 proton.me/drive 下载安装桌面客户端',
            '登录您的 Proton 账号',
            '在访达中进入 Proton Drive 目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
      },
      dropbox: {
        windows: {
          title: 'Dropbox (Windows)',
          steps: [
            '从官网下载并安装 Dropbox 桌面客户端',
            '登录您的 Dropbox 账号',
            '在文件资源管理器中进入 Dropbox 目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
        macos: {
          title: 'Dropbox (macOS)',
          steps: [
            '从官网下载并安装 Dropbox 桌面客户端',
            '登录您的 Dropbox 账号',
            '在访达中进入 Dropbox 目录',
            '新建一个名为 "NeumanOS Backups" 的专用文件夹',
            '在下一步中，点击按钮并选中此文件夹',
          ],
        },
      },
      none: {
        windows: { title: '', steps: [] },
        macos: { title: '', steps: [] },
      },
    };

    return instructions[provider][platform];
  };

  /**
   * Render current step
   */
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <span className="text-5xl">💾</span>
            </div>

            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary text-center">
              为什么要备份您的数据？
            </h2>

            <div className="space-y-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              <p>
                <strong className="text-text-light-primary dark:text-text-dark-primary">
                  您的数据完全保存在当前浏览器的本地存储中。
                </strong>{' '}
                这保证了 100% 的隐私安全，但也意味着遇到以下情况时数据可能会丢失：
              </p>

              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>浏览器缓存或网站数据被清理</li>
                <li>电脑故障、崩溃或被盗</li>
                <li>更换了不同的浏览器或新设备</li>
                <li>浏览器本地 IndexedDB 存储异常损坏</li>
              </ul>

              <p className="pt-2">
                <strong className="text-text-light-primary dark:text-text-dark-primary">
                  开启自动保存至云同步文件夹即可高枕无忧。
                </strong>
              </p>

              <div className="bg-status-success/10 border border-status-success rounded-button p-3 mt-3">
                <p className="text-xs text-status-success font-medium">
                  ✅ 每 30 秒全自动静默备份
                  <br />
                  ✅ 配合网盘轻松实现多端数据同步
                  <br />
                  ✅ 依然 100% 私密（文件完全由您掌控）
                  <br />
                  ✅ 发生异常随时一键导入恢复
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button text-sm font-medium transition-all duration-standard ease-smooth border border-border-light dark:border-border-dark"
              >
                暂不配置
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 px-3 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth"
              >
                继续
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              选择您的云盘同步服务
            </h2>

            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              请选择您正在使用（或打算使用）的云存储网盘：
            </p>

            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'icloud', name: 'iCloud 云盘', icon: '☁️', description: 'Apple（5GB 免费）' },
                { id: 'google-drive', name: 'Google Drive', icon: '📁', description: 'Google（15GB 免费）' },
                { id: 'onedrive', name: 'OneDrive', icon: '☁️', description: '微软（5GB 免费）' },
                { id: 'proton-drive', name: 'Proton Drive', icon: '🔒', description: 'Proton（1GB 免费，端到端加密）' },
                { id: 'dropbox', name: 'Dropbox', icon: '📦', description: 'Dropbox（2GB 免费）' },
              ].map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id as CloudProvider)}
                  className={`p-3 rounded-button border-2 transition-all text-left ${
                    selectedProvider === provider.id
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-border-light dark:border-border-dark hover:border-accent-blue/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{provider.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                        {provider.name}
                      </div>
                      <div className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                        {provider.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => setSelectedProvider('none')}
                className={`p-3 rounded-button border-2 transition-all text-left ${
                  selectedProvider === 'none'
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-border-light dark:border-border-dark hover:border-accent-blue/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">❓</span>
                  <div>
                    <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      我目前没有网盘
                    </div>
                    <div className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                      查看推荐的免费选项
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button text-sm font-medium transition-all duration-standard ease-smooth border border-border-light dark:border-border-dark"
              >
                上一步
              </button>
              <button
                onClick={() => setCurrentStep(selectedProvider === 'none' ? 2.5 : 3)}
                disabled={!selectedProvider}
                className="flex-1 px-3 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                继续
              </button>
            </div>
          </div>
        );

      case 2.5: {
        // Free provider recommendations
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              免费且安全的云盘推荐
            </h2>

            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              您可以选用以下主流稳定的免费网盘服务：
            </p>

            <div className="space-y-2">
              {[
                {
                  name: 'Google Drive',
                  storage: '15GB 免费空间',
                  url: 'https://drive.google.com',
                  pros: '容量最大，多端通用，配置简单',
                },
                {
                  name: 'OneDrive',
                  storage: '5GB 免费空间',
                  url: 'https://onedrive.com',
                  pros: 'Windows 系统自带，深度整合',
                },
                {
                  name: 'iCloud Drive',
                  storage: '5GB 免费空间',
                  url: 'https://icloud.com',
                  pros: 'Apple 生态最佳，各苹果设备无缝同步',
                },
                {
                  name: 'Proton Drive',
                  storage: '1GB 免费空间（端到端加密）',
                  url: 'https://proton.me/drive',
                  pros: '端到端瑞士级加密，专注隐私保护',
                },
                {
                  name: 'Dropbox',
                  storage: '2GB 免费空间',
                  url: 'https://dropbox.com',
                  pros: '老牌知名同步盘，生态支持广泛',
                },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button border border-border-light dark:border-border-dark"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {provider.name}
                      </div>
                      <div className="text-xs text-accent-blue">{provider.storage}</div>
                    </div>
                    <a
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-accent-blue hover:bg-accent-blue-hover text-white text-xs rounded-button transition-all duration-standard ease-smooth"
                    >
                      前往注册 →
                    </a>
                  </div>
                  <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                    {provider.pros}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-status-info/10 border border-status-info rounded-button p-3">
              <p className="text-xs text-text-light-primary dark:text-text-dark-primary">
                <strong>💡 提示：</strong> 注册后请下载并安装桌面客户端以启用自动同步。安装完成后返回第 2 步选择对应网盘。
              </p>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => {
                  setSelectedProvider(null);
                  setCurrentStep(2);
                }}
                className="flex-1 px-3 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth"
              >
                ← 返回选择云盘
              </button>
            </div>
          </div>
        );
      }

      case 3: {
        // Platform-specific instructions
        if (!selectedProvider || selectedProvider === 'none') {
          setCurrentStep(2);
          return null;
        }

        const instructions = getInstructions(selectedProvider, platform);

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                配置操作指引
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setPlatform('windows')}
                  className={`px-2 py-1 text-xs rounded-button transition-all duration-standard ease-smooth ${
                    platform === 'windows'
                      ? 'bg-accent-blue text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                  }`}
                >
                  Windows
                </button>
                <button
                  onClick={() => setPlatform('macos')}
                  className={`px-2 py-1 text-xs rounded-button transition-all duration-standard ease-smooth ${
                    platform === 'macos'
                      ? 'bg-accent-blue text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                  }`}
                >
                  macOS
                </button>
              </div>
            </div>

            <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button p-3">
              <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
                {instructions.title}
              </h3>
              <ol className="space-y-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="flex-shrink-0 font-semibold text-accent-blue">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-status-warning/10 border border-status-warning rounded-button p-3">
              <p className="text-xs text-text-light-primary dark:text-text-dark-primary">
                <strong>⚠️ 重要说明：</strong> 请确保已安装网盘桌面客户端并处于同步状态。您稍后选中的文件夹必须位于该网盘同步目录下。
              </p>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button text-sm font-medium transition-all duration-standard ease-smooth border border-border-light dark:border-border-dark"
              >
                上一步
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 px-3 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth"
              >
                我已准备好
              </button>
            </div>
          </div>
        );
      }

      case 4: {
        // Folder picker
        return (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <span className="text-5xl">📁</span>
            </div>

            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary text-center">
              选择本地备份文件夹
            </h2>

            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary text-center">
              点击下方按钮，指定存放自动备份文件的本地文件夹。
            </p>

            <div className="bg-status-info/10 border border-status-info rounded-button p-3">
              <p className="text-xs text-text-light-primary dark:text-text-dark-primary">
                <strong>💡 提示：</strong> 请定位至网盘同步目录（如 iCloud 云盘、Google Drive、OneDrive 等），并选中刚刚创建的 "NeumanOS Backups" 文件夹。
              </p>
            </div>

            {error && (
              <div className="bg-status-error/10 border border-status-error rounded-button p-3">
                <p className="text-xs text-status-error">{error}</p>
              </div>
            )}

            <button
              onClick={handleSelectFolder}
              disabled={isSelecting}
              className="w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button font-semibold text-base transition-all duration-standard ease-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSelecting ? '正在调起文件夹选择器...' : '📁 选择备份文件夹'}
            </button>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button text-sm font-medium transition-all duration-standard ease-smooth border border-border-light dark:border-border-dark"
              >
                上一步
              </button>
            </div>
          </div>
        );
      }

      case 5: {
        // Reminder preferences
        return (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <span className="text-5xl">✅</span>
            </div>

            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary text-center">
              自动备份已成功开启！
            </h2>

            <div className="bg-status-success/10 border border-status-success rounded-button p-3">
              <p className="text-xs text-status-success text-center">
                <strong>您的数据现在每隔 30 秒会自动静默备份一次。</strong>
                <br />
                备份文件保存在选定的网盘同步目录中，并能自动同步至所有已关联设备。
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                备份提醒偏好
              </h3>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                您希望系统多久提醒您确认一次备份情况？
              </p>

              <div className="space-y-1">
                {[
                  { id: 'every-session', label: '每次使用提醒', description: '每次打开系统访问时提示检查备份' },
                  { id: 'in-7-days', label: '7 天后提醒', description: '一周后提醒我核对' },
                  { id: 'monthly', label: '每月一次', description: '每月 1 号提醒我确认' },
                  { id: 'never', label: '不再提醒', description: '静默运行，不要主动弹窗提醒' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setReminderPreference(option.id as ReminderPreference)}
                    className={`w-full p-3 rounded-button border-2 transition-all text-left ${
                      reminderPreference === option.id
                        ? 'border-accent-blue bg-accent-blue/10'
                        : 'border-border-light dark:border-border-dark hover:border-accent-blue/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {option.label}
                    </div>
                    <div className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveReminder}
              className="w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button font-semibold text-base transition-all duration-standard ease-smooth"
            >
              完成配置
            </button>

            <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary text-center">
              您可以随时在「设置 → 备份与同步」中调整这些偏好
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="配置自动备份" maxWidth="2xl">
      {/* Progress Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
            第 {currentStep > 2.5 ? Math.floor(currentStep) : currentStep} 步，共 {totalSteps} 步
          </span>
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            已完成 {Math.round(((currentStep > 2.5 ? Math.floor(currentStep) : currentStep) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-1.5">
          <div
            className="bg-accent-blue h-1.5 rounded-full transition-all duration-standard ease-smooth"
            style={{
              width: `${((currentStep > 2.5 ? Math.floor(currentStep) : currentStep) / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}
    </Modal>
  );
}
