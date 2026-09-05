import { useState } from 'react';
import { Activity, Clock, Info } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';

/**
 * Automatic Tracking Settings Component
 *
 * UI for configuring automatic time tracking behavior.
 */

export function AutoTrackingSettings() {
  const autoTrackingSettings = useSettingsStore((s) => s.autoTrackingSettings);
  const setAutoTrackingSettings = useSettingsStore((s) => s.setAutoTrackingSettings);
  const setAutomaticTracking = useTimeTrackingStore((s) => s.setAutomaticTracking);
  const setAutoStartThreshold = useTimeTrackingStore((s) => s.setAutoStartThreshold);

  const [enabled, setEnabled] = useState(autoTrackingSettings.enabled);
  const [threshold, setThreshold] = useState(autoTrackingSettings.autoStartThreshold);
  const [stopOnIdle, setStopOnIdle] = useState(autoTrackingSettings.autoStopOnIdle);

  const handleEnabledChange = (value: boolean) => {
    setEnabled(value);
    setAutoTrackingSettings({ enabled: value });
    setAutomaticTracking(value);
  };

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    setAutoTrackingSettings({ autoStartThreshold: value });
    setAutoStartThreshold(value);
  };

  const handleStopOnIdleChange = (value: boolean) => {
    setStopOnIdle(value);
    setAutoTrackingSettings({ autoStopOnIdle: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-accent-primary" />
        <div>
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            自动工时追踪
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            根据前台活动与停留时间自动开启工时记录，免去手动打卡之扰
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
        <Info className="w-5 h-5 text-accent-blue dark:text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            工作原理说明
          </p>
          <p>
            开启后，NeumanOS 将在满足下列条件时智能启动工时计时：
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>在某一具体功能页面持续停留超过预设门限秒数</li>
            <li>专注处理某一项具体的任务卡片或长篇笔记</li>
            <li>保持持续键鼠交互，未触发闲置状态</li>
          </ul>
          <p className="mt-2">
            自动记录生成的条目会带有“自动”标签，便于你在工时日志中检索复核。
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <div>
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
              启用自动追踪
            </p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              在日常办公与沉浸专注时自动捕获工时
            </p>
          </div>
          <button
            onClick={() => handleEnabledChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled
                ? 'bg-accent-primary'
                : 'bg-surface-light-tertiary dark:bg-surface-dark-tertiary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto-Start Threshold */}
        <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                自动启动等待门限
              </p>
            </div>
            <span className="text-sm font-mono text-accent-primary">
              {threshold}秒
            </span>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
            在某个任务或上下文停留多久后正式启动计时器
          </p>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={threshold}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            disabled={!enabled}
            className="w-full h-2 bg-surface-light-tertiary dark:bg-surface-dark-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            <span>10秒 (敏捷即时)</span>
            <span>60秒 (平衡适度)</span>
            <span>120秒 (沉着从容)</span>
          </div>
        </div>

        {/* Auto-Stop on Idle */}
        <div className="flex items-center justify-between p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <div>
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
              闲置时自动停止
            </p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              当检测到长时间离开电脑或无操作时自动暂停或终止计时
            </p>
          </div>
          <button
            onClick={() => handleStopOnIdleChange(!stopOnIdle)}
            disabled={!enabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              stopOnIdle
                ? 'bg-accent-primary'
                : 'bg-surface-light-tertiary dark:bg-surface-dark-tertiary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                stopOnIdle ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Preview */}
      {enabled && (
        <div className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <p className="text-sm font-medium text-accent-green dark:text-accent-green mb-2">
            ✓ 自动追踪已就绪运行中
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            在某个页面或任务保持专注停留超过 {threshold} 秒即可自动激活计时。
            {stopOnIdle && ' 离开或闲置时将自动为您保全时长。'}
          </p>
        </div>
      )}
    </div>
  );
}
