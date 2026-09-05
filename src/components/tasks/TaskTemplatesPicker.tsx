import React, { useState } from 'react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { TaskPriority } from '../../types';

interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultPriority: TaskPriority;
  defaultTags: string[];
  subtasks: string[];
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'bug-report',
    name: '缺陷报告',
    icon: '🐛',
    description: '通过结构化子任务排查和修复缺陷',
    defaultPriority: 'high',
    defaultTags: ['bug'],
    subtasks: ['复现问题', '排查根本原因', '实现修复方案', '编写测试用例', '部署修复'],
  },
  {
    id: 'feature-request',
    name: '功能需求',
    icon: '✨',
    description: '全流程规划和实现新功能',
    defaultPriority: 'medium',
    defaultTags: ['feature'],
    subtasks: ['方案设计与规范', '实现核心功能', '编写测试用例', '更新相关文档', '代码评审'],
  },
  {
    id: 'sprint-planning',
    name: '迭代规划',
    icon: '🏃',
    description: '组织冲刺与迭代规划会议',
    defaultPriority: 'high',
    defaultTags: ['planning'],
    subtasks: ['梳理需求待办池', '评估工作量故事点', '分配开发任务', '设定冲刺目标', '创建迭代看板'],
  },
  {
    id: 'code-review',
    name: '代码评审',
    icon: '🔍',
    description: '结构化代码审查流程',
    defaultPriority: 'medium',
    defaultTags: ['review'],
    subtasks: ['阅读 PR 描述', '审查代码变更', '本地运行测试', '提出评审意见', '批准或要求修改'],
  },
  {
    id: 'deployment',
    name: '上线部署',
    icon: '🚀',
    description: '生产环境发布核对清单',
    defaultPriority: 'high',
    defaultTags: ['deploy'],
    subtasks: ['运行完整测试套件', '检查预发布环境', '创建发布版本标签', '部署至生产环境', '生产环境验证', '监控运行指标'],
  },
  {
    id: 'research',
    name: '技术调研',
    icon: '🔬',
    description: '针对技术选型或疑难问题的定时期探索',
    defaultPriority: 'medium',
    defaultTags: ['research'],
    subtasks: ['明确调研目标', '收集技术资料', '评估备选方案', '编写调研总结', '给出落地建议'],
  },
];

interface TaskTemplatesPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskTemplatesPicker: React.FC<TaskTemplatesPickerProps> = ({ isOpen, onClose }) => {
  const { addTask, addSubtask } = useKanbanStore();
  const [taskTitle, setTaskTitle] = useState('');

  if (!isOpen) return null;

  const handleCreateFromTemplate = (template: TaskTemplate) => {
    const title = taskTitle.trim() || template.name;

    // Create the parent task
    addTask({
      title,
      description: template.description,
      status: 'todo',
      priority: template.defaultPriority,
      tags: template.defaultTags,
      startDate: null,
      dueDate: null,
      projectIds: [],
    });

    // Get the created task (latest in store)
    const tasks = useKanbanStore.getState().tasks;
    const newTask = tasks[tasks.length - 1];

    if (newTask) {
      // Add subtasks
      template.subtasks.forEach((subtaskTitle) => {
        addSubtask(newTask.id, {
          title: subtaskTitle,
          completed: false,
        });
      });
    }

    setTaskTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            从模板创建任务
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
            从预设的任务结构快速起步
          </p>
        </div>

        {/* Optional custom title */}
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="自定义任务标题（可选）..."
            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* Templates grid */}
        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
          {TASK_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleCreateFromTemplate(template)}
              className="w-full text-left p-4 rounded-lg border border-border-light dark:border-border-dark hover:border-accent-blue hover:bg-accent-blue/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {template.name}
                  </h3>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      template.defaultPriority === 'high'
                        ? 'bg-status-error/10 text-status-error'
                        : 'bg-status-warning/10 text-status-warning-text dark:text-status-warning-text-dark'
                    }`}>
                      {template.defaultPriority === 'high' ? '高优先级' : template.defaultPriority === 'medium' ? '中优先级' : '低优先级'}
                    </span>
                    {template.defaultTags.map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue">
                        #{tag}
                      </span>
                    ))}
                    <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary ml-auto">
                      {template.subtasks.length} 项子任务
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
