import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useWidgetStore } from '../stores/useWidgetStore';
import { toast } from '../stores/useToastStore';

export interface WidgetPreset {
  id: string;
  name: string;
  description?: string;
  enabledWidgets: string[];
  widgetSizes: Record<string, 1 | 2 | 3>;
  createdAt: string;
  isDefault?: boolean;
}

// Default preset layouts
const DEFAULT_PRESETS: WidgetPreset[] = [
  {
    id: 'default',
    name: '经典默认方案',
    description: '核心常用组件：天气预报、任务总览、快速添加、近期日程与笔记',
    enabledWidgets: ['weathermap', 'taskssummary', 'tasksquickadd', 'upcomingevents', 'recentnotes'],
    widgetSizes: {
      weathermap: 3,
      taskssummary: 1,
      tasksquickadd: 1,
      upcomingevents: 1,
      recentnotes: 1,
    },
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'productivity',
    name: '深度专注高效',
    description: '以任务攻坚与番茄钟专注为核心的极效工作流方案',
    enabledWidgets: ['weathermap', 'tasksquickadd', 'upcomingevents', 'recentnotes', 'pomodoro'],
    widgetSizes: {
      weathermap: 3,
      tasksquickadd: 3,
      upcomingevents: 1,
      recentnotes: 1,
      pomodoro: 1,
    },
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'developer',
    name: '极客开发者方案',
    description: '集成 GitHub 动态、Hacker News、快捷键速查与实用计算工具',
    enabledWidgets: ['weathermap', 'github', 'hackernews', 'recentnotes', 'shortcuts', 'calculator'],
    widgetSizes: {
      weathermap: 3,
      github: 2,
      hackernews: 2,
      recentnotes: 1,
      shortcuts: 1,
      calculator: 1,
    },
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'minimal',
    name: '极简无干扰方案',
    description: '仅保留核心气象与最快捷的任务输入，保持清爽视界',
    enabledWidgets: ['weathermap', 'tasksquickadd'],
    widgetSizes: {
      weathermap: 3,
      tasksquickadd: 3,
    },
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
];

interface PresetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Preset Manager Component
 *
 * Allows users to:
 * - Save current layout as named preset
 * - Load saved presets
 * - Delete custom presets
 * - Use default presets
 * - Export/import presets as JSON
 */
export const PresetManager: React.FC<PresetManagerProps> = ({ isOpen, onClose }) => {
  const [presets, setPresets] = useState<WidgetPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const enabledWidgets = useWidgetStore((state) => state.enabledWidgets);
  const widgetSizes = useWidgetStore((state) => state.widgetSizes);
  const reorderWidgets = useWidgetStore((state) => state.reorderWidgets);
  const setWidgetSize = useWidgetStore((state) => state.setWidgetSize);
  const enableWidget = useWidgetStore((state) => state.enableWidget);
  const disableWidget = useWidgetStore((state) => state.disableWidget);

  // Load presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-presets');
    if (saved) {
      try {
        const customPresets = JSON.parse(saved) as WidgetPreset[];
        setPresets([...DEFAULT_PRESETS, ...customPresets]);
      } catch (error) {
        console.error('Failed to load presets:', error);
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: WidgetPreset = {
      id: Date.now().toString(),
      name: presetName,
      description: presetDescription || undefined,
      enabledWidgets: [...enabledWidgets],
      widgetSizes: { ...widgetSizes },
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    const customPresets = presets.filter((p) => !p.isDefault);
    const updatedCustom = [...customPresets, newPreset];
    localStorage.setItem('dashboard-presets', JSON.stringify(updatedCustom));

    setPresets([...DEFAULT_PRESETS, ...updatedCustom]);
    setShowSaveDialog(false);
    setPresetName('');
    setPresetDescription('');
  };

  const loadPreset = (preset: WidgetPreset) => {
    // Disable all current widgets
    enabledWidgets.forEach((widgetId) => {
      disableWidget(widgetId);
    });

    // Enable preset widgets in order
    preset.enabledWidgets.forEach((widgetId) => {
      enableWidget(widgetId);
    });

    // Set widget sizes
    Object.entries(preset.widgetSizes).forEach(([widgetId, size]) => {
      setWidgetSize(widgetId, size);
    });

    // Reorder to match preset
    reorderWidgets(preset.enabledWidgets);

    onClose();
  };

  const deletePreset = (presetId: string) => {
    const customPresets = presets.filter((p) => !p.isDefault && p.id !== presetId);
    localStorage.setItem('dashboard-presets', JSON.stringify(customPresets));
    setPresets([...DEFAULT_PRESETS, ...customPresets]);
  };

  const exportPreset = (preset: WidgetPreset) => {
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}-preset.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPreset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const preset = JSON.parse(text) as WidgetPreset;

      // Validate preset structure
      if (!preset.name || !preset.enabledWidgets || !preset.widgetSizes) {
        toast.error('预设文件格式不正确');
        return;
      }

      // Generate new ID and timestamp
      preset.id = Date.now().toString();
      preset.createdAt = new Date().toISOString();
      preset.isDefault = false;

      const customPresets = presets.filter((p) => !p.isDefault);
      const updatedCustom = [...customPresets, preset];
      localStorage.setItem('dashboard-presets', JSON.stringify(updatedCustom));
      setPresets([...DEFAULT_PRESETS, ...updatedCustom]);
    } catch (error) {
      console.error('Failed to import preset:', error);
      toast.error('导入预设失败', '请检查文件格式是否有效。');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="布局预设方案"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Save Current Layout Button */}
        <div>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="w-full px-4 py-3 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button font-medium transition-all duration-standard ease-smooth"
          >
            💾 保存当前布局方案
          </button>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button border border-border-light dark:border-border-dark">
            <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
              保存当前布局方案
            </h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="预设名称（例如：我的专属工作流）"
              className="w-full px-3 py-2 mb-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button text-text-light-primary dark:text-text-dark-primary"
            />
            <textarea
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              placeholder="方案描述（可选）"
              rows={2}
              className="w-full px-3 py-2 mb-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button text-text-light-primary dark:text-text-dark-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                  setPresetDescription('');
                }}
                className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-button font-medium"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Import Preset Button */}
        <div>
          <label className="block w-full px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-button font-medium transition-all duration-standard ease-smooth cursor-pointer text-center">
            📥 导入预设方案
            <input
              type="file"
              accept=".json"
              onChange={importPreset}
              className="hidden"
            />
          </label>
        </div>

        {/* Preset List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary uppercase">
            可用预设方案
          </h3>
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button border border-border-light dark:border-border-dark"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-text-light-primary dark:text-text-dark-primary">
                    {preset.name}
                    {preset.isDefault && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                        默认
                      </span>
                    )}
                  </h4>
                  {preset.description && (
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                      {preset.description}
                    </p>
                  )}
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                    {preset.enabledWidgets.length} 个小组件
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => loadPreset(preset)}
                  className="px-3 py-1.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button text-sm font-medium"
                >
                  加载应用
                </button>
                <button
                  onClick={() => exportPreset(preset)}
                  className="px-3 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-button text-sm font-medium"
                >
                  导出方案
                </button>
                {!preset.isDefault && (
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="px-3 py-1.5 bg-accent-red hover:bg-accent-red-hover text-white rounded-button text-sm font-medium"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
