import React, { useState } from 'react';
import { useAutomationStore } from '../../stores/useAutomationStore';
import type {
  AutomationTriggerType,
  AutomationActionType,
} from '../../types/automation';
import { toast } from '../../stores/useToastStore';

interface RuleBuilderProps {
  onClose: () => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ onClose }) => {
  const { addRule } = useAutomationStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('task.created');
  const [actionType, setActionType] = useState<AutomationActionType>('move_task');
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('请输入规则名称');
      return;
    }

    addRule({
      name: name.trim(),
      description: description.trim() || undefined,
      trigger: { type: triggerType },
      conditions: [], // MVP: No conditions yet
      actions: [
        {
          type: actionType,
          config: actionConfig,
        },
      ],
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          规则名称 *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：自动归档已完成的任务"
          className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          描述说明
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="选填规则说明..."
          rows={2}
          className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          触发条件 (何时执行) *
        </label>
        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
          className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
        >
          <option value="task.created">创建新任务时</option>
          <option value="task.moved">移动任务时</option>
          <option value="task.completed">完成任务时</option>
          <option value="task.updated">更新任务时</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          执行动作 (执行何种操作) *
        </label>
        <select
          value={actionType}
          onChange={(e) => {
            setActionType(e.target.value as AutomationActionType);
            setActionConfig({}); // Reset config when action changes
          }}
          className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
        >
          <option value="move_task">移动任务至指定状态分组</option>
          <option value="set_priority">设置优先级</option>
          <option value="add_tag">添加标签</option>
          <option value="remove_tag">移除标签</option>
          <option value="add_comment">添加评论备注</option>
          <option value="archive">归档任务</option>
        </select>
      </div>

      {/* Action Configuration */}
      {actionType === 'move_task' && (
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            目标状态分组
          </label>
          <select
            value={actionConfig.status || ''}
            onChange={(e) => setActionConfig({ status: e.target.value })}
            className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
          >
            <option value="">选择目标状态...</option>
            <option value="backlog">待办池 (Backlog)</option>
            <option value="todo">待处理 (To Do)</option>
            <option value="inprogress">进行中 (In Progress)</option>
            <option value="review">审核中 (In Review)</option>
            <option value="done">已完成 (Done)</option>
          </select>
        </div>
      )}

      {actionType === 'set_priority' && (
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            设置优先级
          </label>
          <select
            value={actionConfig.priority || ''}
            onChange={(e) => setActionConfig({ priority: e.target.value })}
            className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
          >
            <option value="">选择优先级...</option>
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>
        </div>
      )}

      {(actionType === 'add_tag' || actionType === 'remove_tag') && (
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            标签名称
          </label>
          <input
            type="text"
            value={actionConfig.tag || ''}
            onChange={(e) => setActionConfig({ tag: e.target.value })}
            placeholder="例如：紧急"
            className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
          />
        </div>
      )}

      {actionType === 'add_comment' && (
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            评论内容
          </label>
          <textarea
            value={actionConfig.text || ''}
            onChange={(e) => setActionConfig({ text: e.target.value })}
            placeholder="例如：此任务已被自动化规则处理"
            rows={2}
            className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none resize-none"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
        >
          创建规则
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary text-sm font-medium rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
};
