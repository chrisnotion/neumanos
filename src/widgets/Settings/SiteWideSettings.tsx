/**
 * Site-Wide Settings Component
 *
 * Global application settings including:
 * - Background customization
 * - Display preferences (time format, temperature unit)
 * - Synapse (command palette) settings
 */

import React, { useState } from 'react';
import { BackgroundCustomizer, type BackgroundSettings } from '../../components/BackgroundCustomizer';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const SiteWideSettings: React.FC = () => {
  // Display Preferences (from settings store)
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const setTimeFormat = useSettingsStore((state) => state.setTimeFormat);
  const setTemperatureUnit = useSettingsStore((state) => state.setTemperatureUnit);

  // Synapse Settings (neural search interface)
  const commandPaletteSettings = useSettingsStore((state) => state.commandPalette);
  const setCommandPaletteSettings = useSettingsStore((state) => state.setCommandPaletteSettings);

  // Modal state
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] = useState(false);

  // Background settings (persisted to localStorage)
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(() => {
    const saved = localStorage.getItem('dashboard-background');
    return saved
      ? JSON.parse(saved)
      : { type: 'none' as const, value: '', opacity: 100, blur: 0 };
  });

  const handleBackgroundChange = (newSettings: BackgroundSettings) => {
    setBgSettings(newSettings);
    localStorage.setItem('dashboard-background', JSON.stringify(newSettings));
  };

  return (
    <>
      <div className="bento-card p-6">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
          全局系统设置
        </h2>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
          定制应用于整个工作台的基础视觉与交互偏好。
        </p>

        <div className="space-y-6">
          {/* Background */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              背景样式
            </label>
            <button
              onClick={() => setShowBackgroundCustomizer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg font-medium transition-colors"
            >
              <span>🎨</span>
              <span>定制全局背景</span>
            </button>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
              为整个工作台设定自定义渐变、纯色或图片壁纸
            </p>
          </div>

          {/* Display Preferences */}
          <div>
            <h3 className="text-base font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
              显示习惯
            </h3>

            {/* Time Format */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                时间制式
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeFormat('12h')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeFormat === '12h'
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                  }`}
                >
                  12 小时制
                </button>
                <button
                  onClick={() => setTimeFormat('24h')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeFormat === '24h'
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                  }`}
                >
                  24 小时制
                </button>
              </div>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                应用于顶部时钟与日程日程表的时间显示
              </p>
            </div>

            {/* Temperature Unit */}
            <div>
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                气温单位
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTemperatureUnit('fahrenheit')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    temperatureUnit === 'fahrenheit'
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                  }`}
                >
                  华氏度 (°F)
                </button>
                <button
                  onClick={() => setTemperatureUnit('celsius')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    temperatureUnit === 'celsius'
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                  }`}
                >
                  摄氏度 (°C)
                </button>
              </div>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                应用于仪表盘天气小部件
              </p>
            </div>
          </div>

          {/* Synapse Settings */}
          <div id="synapse" className="pt-4 border-t border-border-light dark:border-border-dark">
            <h3 className="text-base font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
              突触（Synapse 全局搜索）
            </h3>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-3">
              在任何界面轻按 <kbd className="px-1.5 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated text-xs font-mono">Ctrl+K</kbd>（Mac 下按 <kbd className="px-1.5 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated text-xs font-mono">⌘K</kbd>）即可唤醒突触搜索，秒级检索本地记忆库中的一切灵感与事项。
            </p>

            {/* Preferred Search Engine */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                首选网络搜索引擎
              </label>
              <select
                value={commandPaletteSettings?.preferredSearchEngine || 'google'}
                onChange={(e) => setCommandPaletteSettings({ preferredSearchEngine: e.target.value })}
                className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <optgroup label="通用综合搜索">
                  <option value="google">Google</option>
                  <option value="duckduckgo">DuckDuckGo</option>
                  <option value="bing">必应 (Bing)</option>
                  <option value="brave">Brave 搜索</option>
                  <option value="ecosia">Ecosia</option>
                  <option value="startpage">Startpage</option>
                </optgroup>
                <optgroup label="AI 智能搜索">
                  <option value="chatgpt">ChatGPT 联网搜索</option>
                  <option value="perplexity">Perplexity AI</option>
                </optgroup>
                <optgroup label="垂直专业检索">
                  <option value="wikipedia">维基百科 (Wikipedia)</option>
                  <option value="github">GitHub</option>
                  <option value="stackoverflow">Stack Overflow</option>
                  <option value="youtube">YouTube</option>
                </optgroup>
              </select>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                首选引擎将在快捷指令搜索列表的首位展示
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Customizer Modal */}
      <BackgroundCustomizer
        isOpen={showBackgroundCustomizer}
        onClose={() => setShowBackgroundCustomizer(false)}
        settings={bgSettings}
        onSettingsChange={handleBackgroundChange}
      />
    </>
  );
};
