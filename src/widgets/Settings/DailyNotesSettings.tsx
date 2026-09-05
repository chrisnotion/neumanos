/**
 * Daily Notes Settings Component
 *
 * Provides UI for customizing daily notes feature:
 * - Enable/disable daily notes
 * - Date format selection (long/iso/short)
 * - Template editor with variable hints
 * - Folder selection for daily notes
 */

import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { FileText, Calendar, FolderOpen } from 'lucide-react';
import type { DailyNotesSettings } from '../../services/dailyNotes';

export const DailyNotesSettingsComponent: React.FC = () => {
  const { dailyNotes, setDailyNotesSettings } = useSettingsStore();
  const folders = useFoldersStore((state) => state.folders);

  // Local editing state for template
  const [templateDraft, setTemplateDraft] = useState(dailyNotes.template);

  // Get today's date for preview
  const today = useMemo(() => new Date(), []);

  // Format preview based on selected format
  const datePreview = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    switch (dailyNotes.dateFormat) {
      case 'long':
        return `${monthNames[month]} ${day}, ${year}`;
      case 'iso':
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case 'short':
        return `${monthNames[month].substring(0, 3)} ${day}, ${year}`;
      default:
        return `${monthNames[month]} ${day}, ${year}`;
    }
  }, [today, dailyNotes.dateFormat]);

  const handleToggleEnabled = () => {
    setDailyNotesSettings({ enabled: !dailyNotes.enabled });
  };

  const handleDateFormatChange = (format: DailyNotesSettings['dateFormat']) => {
    setDailyNotesSettings({ dateFormat: format });
  };

  const handleFolderChange = (folderId: string) => {
    setDailyNotesSettings({ folderId: folderId === 'null' ? null : folderId });
  };

  const handleTemplateBlur = () => {
    if (templateDraft !== dailyNotes.template) {
      setDailyNotesSettings({ template: templateDraft });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          每日便签 (Daily Notes)
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          源自 Obsidian、Roam Research 与 Logseq 理念的每日日记。一键快速捕获灵感瞬间、日常琐记与工作复盘。
        </p>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            启用每日便签功能
          </label>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            随时使用快捷键 (Ctrl/Cmd + D) 直达今日便签
          </p>
        </div>
        <button
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            dailyNotes.enabled
              ? 'bg-accent-primary'
              : 'bg-border-light dark:bg-border-dark'
          }`}
          role="switch"
          aria-checked={dailyNotes.enabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-surface-light transition-transform ${
              dailyNotes.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {dailyNotes.enabled && (
        <>
          {/* Date Format Selection */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              标题日期格式
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDateFormatChange('long')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  dailyNotes.dateFormat === 'long'
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                长格式 (Long)
              </button>
              <button
                onClick={() => handleDateFormatChange('iso')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  dailyNotes.dateFormat === 'iso'
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                标准 ISO (YYYY-MM-DD)
              </button>
              <button
                onClick={() => handleDateFormatChange('short')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  dailyNotes.dateFormat === 'short'
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                简短格式 (Short)
              </button>
            </div>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
              效果预览：<span className="font-medium text-accent-primary">{datePreview}</span>
            </p>
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              便签归档文件夹
            </label>
            <select
              value={dailyNotes.folderId ?? 'null'}
              onChange={(e) => handleFolderChange(e.target.value)}
              className="w-full px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="null">根目录（不存放于文件夹）</option>
              {Object.values(folders).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
              新生成的每日便签将自动归类到此文件夹中
            </p>
          </div>

          {/* Template Editor */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              便签初始模板
            </label>
            <textarea
              value={templateDraft}
              onChange={(e) => setTemplateDraft(e.target.value)}
              onBlur={handleTemplateBlur}
              rows={12}
              className="w-full px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-sm resize-y"
              placeholder="编写你的每日便签初始模版..."
            />
            <div className="mt-2 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
              <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                可用的动态模板变量：
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                <div>
                  <code className="px-1.5 py-0.5 bg-accent-purple/10 text-accent-purple rounded">
                    {'{date}'}
                  </code>
                  {' '}当前完整日期
                </div>
                <div>
                  <code className="px-1.5 py-0.5 bg-accent-purple/10 text-accent-purple rounded">
                    {'{yesterday}'}
                  </code>
                  {' '}昨日便签双向链接
                </div>
                <div>
                  <code className="px-1.5 py-0.5 bg-accent-purple/10 text-accent-purple rounded">
                    {'{tomorrow}'}
                  </code>
                  {' '}明日便签双向链接
                </div>
                <div>
                  <code className="px-1.5 py-0.5 bg-accent-purple/10 text-accent-purple rounded">
                    {'{weekday}'}
                  </code>
                  {' '}当前星期
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcut Info */}
          <div className="p-4 bg-accent-primary/10 rounded-lg">
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
              <span className="font-semibold">操作捷径：</span> 在系统的任何页面，随时按下{' '}
              <kbd className="px-2 py-1 bg-surface-light dark:bg-surface-dark rounded text-xs font-mono">
                Ctrl+D
              </kbd>{' '}
              (Mac 为{' '}
              <kbd className="px-2 py-1 bg-surface-light dark:bg-surface-dark rounded text-xs font-mono">
                Cmd+D
              </kbd>
              )，即可秒开今日便签。
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// Export with name that doesn't conflict with type
export { DailyNotesSettingsComponent as DailyNotesSettings };
