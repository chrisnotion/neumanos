/**
 * Dashboard Template Picker
 *
 * Shows starter layout templates when the dashboard is empty.
 * Allows users to quickly bootstrap their dashboard with a curated layout.
 */

import React from 'react';
import { useWidgetStore } from '../stores/useWidgetStore';
import { getWidget } from '../widgets/Dashboard/WidgetRegistry';
import { LayoutGrid } from 'lucide-react';

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: string[];
  sizes: Record<string, 1 | 2 | 3>;
}

const TEMPLATES: DashboardTemplate[] = [
  {
    id: 'productivity',
    name: '高效专注型',
    description: '聚合任务待办、日程安排、番茄钟与速记笔记，专注即时行动',
    icon: '💼',
    widgets: ['weathermap', 'taskssummary', 'tasksquickadd', 'upcomingevents', 'recentnotes', 'pomodoro'],
    sizes: {
      weathermap: 3,
      taskssummary: 1,
      tasksquickadd: 1,
      upcomingevents: 1,
      recentnotes: 1,
      pomodoro: 1,
    },
  },
  {
    id: 'developer',
    name: '极客开发型',
    description: '集成 GitHub 动态、Hacker News、快捷键与计算器，专为工程师打造',
    icon: '🔧',
    widgets: ['weathermap', 'taskssummary', 'hackernews', 'recentnotes', 'shortcuts', 'calculator'],
    sizes: {
      weathermap: 3,
      taskssummary: 1,
      hackernews: 2,
      recentnotes: 1,
      shortcuts: 1,
      calculator: 1,
    },
  },
  {
    id: 'minimal',
    name: '极简纯粹型',
    description: '仅保留核心天气、快捷记事与每日格言，回归纯净视野',
    icon: '✨',
    widgets: ['weathermap', 'tasksquickadd', 'quote'],
    sizes: {
      weathermap: 3,
      tasksquickadd: 2,
      quote: 1,
    },
  },
  {
    id: 'information',
    name: '前沿资讯中枢',
    description: '聚合技术资讯、加密行情、全球时钟与每日百科，洞悉世界脉搏',
    icon: '📰',
    widgets: ['weathermap', 'hackernews', 'crypto', 'worldclock', 'quote', 'wikipedia'],
    sizes: {
      weathermap: 3,
      hackernews: 2,
      crypto: 1,
      worldclock: 1,
      quote: 1,
      wikipedia: 1,
    },
  },
];

interface DashboardTemplatePickerProps {
  onCustomize: () => void;
}

export const DashboardTemplatePicker: React.FC<DashboardTemplatePickerProps> = ({
  onCustomize,
}) => {
  const enableWidget = useWidgetStore((state) => state.enableWidget);
  const setWidgetSize = useWidgetStore((state) => state.setWidgetSize);
  const reorderWidgets = useWidgetStore((state) => state.reorderWidgets);

  const applyTemplate = (template: DashboardTemplate) => {
    // Enable each widget and set its size
    template.widgets.forEach((widgetId) => {
      enableWidget(widgetId);
    });

    Object.entries(template.sizes).forEach(([widgetId, size]) => {
      setWidgetSize(widgetId, size);
    });

    // Set the order
    reorderWidgets(template.widgets);
  };

  return (
    <div className="text-center py-8 animate-fade-in">
      {/* Hero */}
      <div className="flex justify-center mb-6">
        <div className="p-6 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 dark:from-accent-primary/10 dark:to-accent-primary/10 rounded-2xl">
          <LayoutGrid className="w-16 h-16 text-accent-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
        配置您的专属仪表盘
      </h2>
      <p className="text-text-light-secondary dark:text-text-dark-secondary mb-8 max-w-md mx-auto">
        选择一份新手布局方案，或从零自由搭配组件。您可以随时调整布局与显示次序。
      </p>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            className="p-5 rounded-card border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark-elevated hover:border-accent-primary/50 hover:shadow-lg transition-all duration-standard ease-smooth text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-standard ease-smooth">
                {template.icon}
              </span>
              <div>
                <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {template.name}
                </h3>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  共 {template.widgets.length} 个组件
                </p>
              </div>
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
              {template.description}
            </p>
            {/* Widget preview pills */}
            <div className="flex flex-wrap gap-1">
              {template.widgets.slice(0, 5).map((wId) => {
                const w = getWidget(wId);
                return w ? (
                  <span
                    key={wId}
                    className="text-xs px-2 py-0.5 rounded-full bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary"
                  >
                    {w.icon} {w.name}
                  </span>
                ) : null;
              })}
              {template.widgets.length > 5 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-elevated dark:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary">
                  +{template.widgets.length - 5} 更多
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Custom option */}
      <button
        onClick={onCustomize}
        className="px-6 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button font-medium transition-all duration-standard ease-smooth"
      >
        或者从头自由自选组件...
      </button>
    </div>
  );
};
