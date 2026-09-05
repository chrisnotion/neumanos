/**
 * App-Level Preferences Settings Section
 *
 * Date format, week start day configuration.
 * Time format and temperature are in SiteWideSettings.
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { DateFormat, WeekStartDay } from '../../stores/useSettingsStore';

const DATE_FORMATS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '02/22/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '22/02/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-02-22' },
];

const WEEK_START_DAYS: { value: WeekStartDay; label: string }[] = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
];

export const AppPreferencesSection: React.FC = () => {
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const setDateFormat = useSettingsStore((s) => s.setDateFormat);
  const setWeekStartDay = useSettingsStore((s) => s.setWeekStartDay);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="w-5 h-5 text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          日期与地区偏好
        </h2>
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        自定义应用各模块中日期的展示格式及周历起始日。
      </p>

      <div className="space-y-4">
        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            日期显示格式
          </label>
          <select
            value={dateFormat ?? 'MM/DD/YYYY'}
            onChange={(e) => setDateFormat(e.target.value as DateFormat)}
            className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {DATE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}（示例：{f.example}）
              </option>
            ))}
          </select>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
            应用于任务截止期、日程日历及工时记录等模块
          </p>
        </div>

        {/* Week Start Day */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            一周起始日
          </label>
          <div className="flex gap-2">
            {WEEK_START_DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => setWeekStartDay(d.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  (weekStartDay ?? 0) === d.value
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
            影响日历视图排列及周工时统计计算
          </p>
        </div>
      </div>
    </div>
  );
};
