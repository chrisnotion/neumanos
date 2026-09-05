import React, { useState, useRef } from 'react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { detectImportSource, parseImportFile, generateImportPreview } from '../../services/importService';
import type { ImportSource, ImportPreview } from '../../types/import';

export const ImportData: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<ImportSource | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { bulkImportTasks } = useKanbanStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setPreview(null);

    try {
      const content = await selectedFile.text();
      const detectedSource = detectImportSource(selectedFile.name, content);
      setSource(detectedSource);

      // Generate preview
      const previewData = generateImportPreview(detectedSource, content);
      setPreview(previewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  const handleImport = async () => {
    if (!file || !source) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const content = await file.text();
      const tasks = parseImportFile(source, content);

      const importResult = bulkImportTasks(tasks);

      setResult({
        success: true,
        message: `Successfully imported ${importResult.tasksImported} task(s). ${
          importResult.tagsCreated.length > 0
            ? `Created ${importResult.tagsCreated.length} new tag(s).`
            : ''
        }`,
      });

      // Clear file input
      setFile(null);
      setSource(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          批量导入外部任务
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
          无缝迁入其他效率工具中的任务。支持的数据源格式包括：Trello (JSON)、Asana (JSON)、
          Todoist (CSV)、ClickUp (CSV)、Monday.com (CSV)、Notion (CSV)。
        </p>
      </div>

      {/* File upload */}
      <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="import-file-input"
        />
        <label
          htmlFor="import-file-input"
          className="cursor-pointer inline-flex flex-col items-center"
        >
          <svg
            className="w-12 h-12 text-text-light-secondary dark:text-text-dark-secondary mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            点击选择文件，或直接将文件拖拽至此处
          </span>
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            仅支持 .json 或 .csv 格式文件
          </span>
        </label>
      </div>

      {/* File info */}
      {file && source && (
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {file.name}
              </p>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                已识别格式：<span className="font-medium">{formatSourceName(source)}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setSource(null);
                setPreview(null);
                setError(null);
                setResult(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-status-error-text hover:underline text-sm"
            >
              清空
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated p-4 rounded-lg border border-border-light dark:border-border-dark">
          <h4 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            数据解析预览（共 {preview.taskCount} 项任务）
          </h4>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-status-warning-bg text-status-warning-text rounded text-sm">
              <p className="font-medium mb-1">提示预警：</p>
              <ul className="list-disc list-inside space-y-1">
                {preview.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* New tags */}
          {preview.newTags.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                即将新建的标签类别（共 {preview.newTags.length} 个）：
              </p>
              <div className="flex flex-wrap gap-2">
                {preview.newTags.slice(0, 10).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded bg-accent-purple/10 text-accent-purple"
                  >
                    {tag}
                  </span>
                ))}
                {preview.newTags.length > 10 && (
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    + 其他 {preview.newTags.length - 10} 个
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Task preview */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {preview.sample.map((task, idx) => (
              <div
                key={idx}
                className="p-3 bg-surface-light dark:bg-surface-dark rounded border border-border-light dark:border-border-dark"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {task.dueDate && (
                        <span className="px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue">
                          {task.dueDate}
                        </span>
                      )}
                      {task.priority && (
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            task.priority === 'high'
                              ? 'bg-status-error-bg text-status-error-text'
                              : task.priority === 'medium'
                              ? 'bg-status-warning-bg text-status-warning-text'
                              : 'bg-status-info-bg text-status-info-text'
                          }`}
                        >
                          {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple">
                          {task.tags.length} 个标签
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {preview.taskCount > 10 && (
              <p className="text-xs text-center text-text-light-secondary dark:text-text-dark-secondary py-2">
                + 其余 {preview.taskCount - 10} 项任务未展开预览
              </p>
            )}
          </div>

          {/* Import button */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? '正在批量导入...' : `确认导入 ${preview.taskCount} 项任务`}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-status-error-bg text-status-error-text rounded-lg">
          <p className="font-medium mb-1">导入出错</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {result && result.success && (
        <div className="p-4 bg-status-success-bg text-status-success-text rounded-lg">
          <p className="font-medium mb-1">导入圆满完成！</p>
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      {/* Export documentation links */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated p-4 rounded-lg">
        <h4 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          常见第三方工具导出指引
        </h4>
        <ul className="space-y-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <li>
            <span className="font-medium">Trello:</span> 看板 → 菜单 → 更多 → 打印与导出 → 导出为 JSON
          </li>
          <li>
            <span className="font-medium">Asana:</span> 项目 → 导出 → JSON
          </li>
          <li>
            <span className="font-medium">Todoist:</span> 设置 → 备份 → 导出为 CSV
          </li>
          <li>
            <span className="font-medium">ClickUp:</span> 空间 (Space) → 设置 → 导出空间
          </li>
          <li>
            <span className="font-medium">Monday.com:</span> 看板 → 菜单 → 导出看板数据
          </li>
          <li>
            <span className="font-medium">Notion:</span> 数据库 → ··· → 导出 → CSV
          </li>
        </ul>
      </div>
    </div>
  );
};

function formatSourceName(source: ImportSource): string {
  const map: Record<ImportSource, string> = {
    trello: 'Trello (JSON)',
    asana: 'Asana (JSON)',
    todoist: 'Todoist (CSV)',
    clickup: 'ClickUp (CSV)',
    monday: 'Monday.com (CSV)',
    notion: 'Notion (CSV)',
    'generic-json': 'Generic JSON',
    'generic-csv': 'Generic CSV',
  };
  return map[source];
}
