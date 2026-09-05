/**
 * Task Management Settings Component
 *
 * Settings for task behavior and dependencies:
 * - Auto-shift dependent tasks
 * - WIP (Work In Progress) limits enforcement
 */

import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const TaskManagementSettings: React.FC = () => {
  // Task Management Settings
  const autoShiftDependentTasks = useSettingsStore((state) => state.autoShiftDependentTasks);
  const setAutoShiftDependentTasks = useSettingsStore((state) => state.setAutoShiftDependentTasks);
  const enforceWipLimits = useSettingsStore((state) => state.enforceWipLimits);
  const setEnforceWipLimits = useSettingsStore((state) => state.setEnforceWipLimits);

  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        任务与依赖行为偏好
      </h2>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        配置看板中任务日期变更联动规则与在制品（WIP）限制约束强度。
      </p>

      <div className="space-y-4">
        {/* Auto-shift dependent tasks */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="auto-shift-tasks"
            checked={autoShiftDependentTasks}
            onChange={(e) => setAutoShiftDependentTasks(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="auto-shift-tasks"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer"
            >
              前置任务日期变更时，自动顺延依赖任务
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              当您调整前置任务的起止日期时，系统将依据依赖关系类型（完成-开始、开始-开始等）智能联动顺延后续依赖任务。在真正应用调整前，会弹出确认对话框供您复核。
            </p>
          </div>
        </div>

        {/* Enforce WIP Limits */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="enforce-wip-limits"
            checked={enforceWipLimits}
            onChange={(e) => setEnforceWipLimits(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="enforce-wip-limits"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer"
            >
              严格执行在制品（WIP）上限（达到上限时禁止拖入新任务）
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              开启后，当某一列任务数量达到该列设定的 WIP 上限时，将严格阻止继续拖入任务；关闭状态下（默认），达到上限仅作醒目视觉提醒，依然允许拖入。可在看板各列菜单中配置 WIP 限制值。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
