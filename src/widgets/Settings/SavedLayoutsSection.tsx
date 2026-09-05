/**
 * Saved Dashboard Layouts Section
 *
 * Save, load, and manage dashboard widget layouts.
 */

import React, { useState } from 'react';
import { LayoutGrid, Save, Trash2, Download } from 'lucide-react';
import { useWidgetStore } from '../../stores/useWidgetStore';

export const SavedLayoutsSection: React.FC = () => {
  const savedLayouts = useWidgetStore((s) => s.savedLayouts);
  const saveLayout = useWidgetStore((s) => s.saveLayout);
  const loadLayout = useWidgetStore((s) => s.loadLayout);
  const deleteLayout = useWidgetStore((s) => s.deleteLayout);

  const [layoutName, setLayoutName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSave = () => {
    const name = layoutName.trim();
    if (!name) return;
    saveLayout(name);
    setLayoutName('');
    setShowSaveInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setShowSaveInput(false);
      setLayoutName('');
    }
  };

  return (
    <div className="bento-card p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            已存仪表盘布局
          </h2>
        </div>
        {!showSaveInput && (
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors"
          >
            <Save className="w-3 h-3" />
            保存当前布局
          </button>
        )}
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        保存并快速恢复当前中枢组件的排布组合与位置结构。
      </p>

      {/* Save Input */}
      {showSaveInput && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <input
            type="text"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入布局方案名称..."
            className="flex-1 px-3 py-1.5 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={!layoutName.trim()}
            className="px-3 py-1.5 text-xs rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover disabled:opacity-50 transition-colors"
          >
            保存
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false);
              setLayoutName('');
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {/* Layouts List */}
      {savedLayouts && savedLayouts.length > 0 ? (
        <div className="space-y-2">
          {savedLayouts.map((layout) => (
            <div
              key={layout.id}
              className="flex items-center justify-between p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                  {layout.name}
                </p>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  {layout.enabledWidgets?.length ?? 0} 个组件 &middot; 保存于{' '}
                  {new Date(layout.savedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-3">
                <button
                  onClick={() => loadLayout(layout.id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
                  title="应用此布局方案"
                >
                  <Download className="w-3 h-3" />
                  应用
                </button>
                <button
                  onClick={() => deleteLayout(layout.id)}
                  className="p-1 text-xs text-status-error hover:bg-status-error-bg dark:hover:bg-status-error-bg-dark rounded transition-colors"
                  title="删除此布局"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary italic">
          暂无已保存的布局方案。随时点击上方按钮保存当前个性化仪表盘。
        </p>
      )}
    </div>
  );
};
