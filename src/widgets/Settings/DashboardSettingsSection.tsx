import React from 'react';

interface DashboardSettingsSectionProps {
  onOpenPresetManager: () => void;
}

/**
 * Dashboard Settings Section
 * Provides buttons to customize dashboard widgets and manage presets.
 */
export const DashboardSettingsSection: React.FC<DashboardSettingsSectionProps> = ({
  onOpenPresetManager,
}) => {
  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        中枢仪表盘设置
      </h2>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        定制在中枢控制台上显示的小组件，并管理小组件参数与预设。
      </p>

      <button
        onClick={() => {
          window.location.href = '/#customize-widgets';
        }}
        className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
      >
        <span>⚙️</span>
        <span>自定义中枢小组件</span>
      </button>

      <div className="mt-4">
        <button
          onClick={onOpenPresetManager}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg font-medium transition-colors"
        >
          <span>📐</span>
          <span>管理仪表盘方案预设</span>
        </button>
      </div>
    </div>
  );
};
