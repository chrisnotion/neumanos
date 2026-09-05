import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/Modal';
import { RecurrencePicker } from '../../components/RecurrencePicker';
import { CustomFieldEditor } from '../../components/CustomFieldEditor';
import { DependentShiftConfirmation } from '../../components/DependentShiftConfirmation';
import { AIQuickActions } from '../../components/AIQuickActions';
import AssigneePicker from '../../components/AssigneePicker';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useTimeTrackingStore } from '../../stores/useTimeTrackingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTemplateStore } from '../../stores/useTemplateStore';
import { calculateDependentShifts, shouldAutoShift } from '../../services/taskDependencyShift';
import type { Task, TaskPriority, TaskStatus, EffortEstimate, CustomStatus, TaskDependency, TaskAttachment } from '../../types';
import type { FieldDefinition } from '../../types/customFields';
import { toast } from '../../stores/useToastStore';

// Tab Components
import {
  ActivityTabContent,
  AttachmentsTabContent,
  ChecklistTabContent,
  CommentsTabContent,
  SubtasksTabContent,
  TimeTrackingTabContent,
} from './tabs';

// Section Components
import {
  TaskDatesSection,
  TaskDependenciesSection,
} from './sections';

/**
 * TaskCustomFields - Separate component to properly use hooks
 * Extracted to avoid Rules of Hooks violation (hooks cannot be called inside IIFEs)
 */
const TaskCustomFields: React.FC<{
  task: Task;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}> = ({ task, onSave }) => {
  const { customFieldDefinitions } = useSettingsStore();
  const taskFields = customFieldDefinitions.tasks;

  if (taskFields.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
        自定义字段
      </label>
      <div className="space-y-3">
        {taskFields.map((field: FieldDefinition) => {
          const currentValue = task?.customFields?.[field.id];

          return (
            <div key={field.id}>
              <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                {field.name}
                {field.required && (
                  <span className="text-status-error-text dark:text-status-error-text-dark ml-1">*</span>
                )}
              </label>
              {field.description && (
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  {field.description}
                </p>
              )}
              <CustomFieldEditor
                field={field}
                value={currentValue}
                onChange={(value) => {
                  if (!task) return;
                  const updatedCustomFields = {
                    ...task.customFields,
                    [field.id]: value,
                  };
                  onSave(task.id, { customFields: updatedCustomFields });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CardDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  columns: Array<{ id: string; title: string; color: string }>;
  initialTab?: 'subtasks' | 'checklist' | 'comments' | 'activity' | 'timetracking' | 'attachments';
  onCardClick?: (task: Task) => void;
}

/**
 * Card Detail Panel
 * Full-screen modal for viewing and editing task details
 *
 * Features:
 * - Left side: Task metadata (title, description, dates, priority, tags, status)
 * - Right side: Tabs (Checklist, Comments, Activity Log)
 * - Inline editing (auto-save on blur)
 * - Keyboard shortcuts (Esc to close, Cmd+Enter to save)
 * - Tab persistence (remembers last active tab)
 * - Responsive design (mobile, tablet, desktop)
 */
export const CardDetailPanel: React.FC<CardDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  columns,
  initialTab,
  onCardClick,
}) => {
  // Kanban store actions
  const {
    tasks,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    addComment,
    addSubtask,
    deleteSubtask,
    toggleSubtask,
    addDependency,
    removeDependency,
    getBlocked,
    updateEffort,
    updateCustomStatus,
    startTimer,
    stopTimer: stopKanbanTimer,
    updateTimeEstimate,
    setTaskRecurrence,
    applyDependentShifts,
    addAttachment,
    deleteAttachment,
  } = useKanbanStore();

  // Time tracking store (Phase A: Time Tracking Integration)
  const {
    getEntriesForCard,
    getTotalTimeForCard,
    startTimerForCard,
    stopTimer,
    activeEntry,
  } = useTimeTrackingStore();

  // Template store (P2: Task Templates)
  const { createTemplate } = useTemplateStore();

  // Tab state with persistence
  const [activeTab, setActiveTab] = useState<'subtasks' | 'checklist' | 'comments' | 'activity' | 'timetracking' | 'attachments'>(() => {
    if (initialTab) return initialTab;
    const saved = localStorage.getItem('kanban-detail-panel-tab');
    return (saved as 'subtasks' | 'checklist' | 'comments' | 'activity' | 'timetracking' | 'attachments') || 'subtasks';
  });

  // Sync activeTab with initialTab when it changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Local state for editing (synced with task prop)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [newTag, setNewTag] = useState('');
  const [effort, setEffort] = useState<EffortEstimate | undefined>(undefined);
  const [customStatus, setCustomStatus] = useState<CustomStatus | undefined>(undefined);
  const [timeEstimate, setTimeEstimate] = useState<number | undefined>(undefined);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0); // Phase 1.5: Progress %

  // P1: Recurring tasks state
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

  // Phase 1.2: Auto-shift dependent tasks
  const { autoShiftDependentTasks, setAutoShiftDependentTasks } = useSettingsStore();
  const [pendingShifts, setPendingShifts] = useState<Array<{taskId: string; newStartDate: string | null; newDueDate: string | null; reason: string}> | null>(null);

  // Note: Checklist, Comment, and Subtask state moved to extracted tab components

  // Phase 3.2: Attachment state
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  // Phase 2 Quick Wins: Inline date editing
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  // No longer need local state for dependency selection - handled by DependencyPicker

  // Sync local state with task prop when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStartDate(task.startDate);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setTags(task.tags);
      setStatus(task.status);
      setEffort(task.effort);
      setCustomStatus(task.customStatus);
      setTimeEstimate(task.timeTracking?.estimated);
      setAssignees(task.assignees || []);
      setProgress(task.progress || 0); // Phase 1.5
    }
  }, [task]);

  // Tab persistence
  useEffect(() => {
    localStorage.setItem('kanban-detail-panel-tab', activeTab);
  }, [activeTab]);

  // Save and close handler
  const handleSaveAndClose = useCallback(() => {
    if (!task) return;
    onSave(task.id, {
      title,
      description,
      startDate,
      dueDate,
      priority,
      tags,
      status,
      assignees,
    });
    onClose();
  }, [task, onSave, onClose, title, description, startDate, dueDate, priority, tags, status, assignees]);

  // Keyboard shortcut: Cmd+Enter to save and close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isOpen) {
        e.preventDefault();
        handleSaveAndClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleSaveAndClose]);

  if (!task) return null;

  const handleFieldBlur = (field: keyof Task, value: unknown) => {
    // Phase 1.2: Check if date change triggers dependent shifts
    if ((field === 'startDate' || field === 'dueDate') && task) {
      const oldStartDate = task.startDate;
      const oldDueDate = task.dueDate;
      const newStartDate = field === 'startDate' ? (value as string | null) : task.startDate;
      const newDueDate = field === 'dueDate' ? (value as string | null) : task.dueDate;

      // Check if auto-shift is enabled and dates actually changed
      if (shouldAutoShift(
        { ...task, startDate: newStartDate, dueDate: newDueDate },
        oldStartDate,
        oldDueDate,
        autoShiftDependentTasks
      )) {
        // Calculate what shifts would be needed
        const shifts = calculateDependentShifts(
          { ...task, startDate: newStartDate, dueDate: newDueDate },
          oldStartDate,
          oldDueDate,
          tasks
        );

        if (shifts.length > 0) {
          // Show confirmation dialog
          setPendingShifts(shifts);
          // Don't save yet - wait for user confirmation
          return;
        }
      }
    }

    // Auto-save on blur (normal case or no shifts needed)
    onSave(task.id, { [field]: value });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      onSave(task.id, { tags: updatedTags });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onSave(task.id, { tags: updatedTags });
  };

  // Dependency handlers
  const handleAddDependency = (dependency: TaskDependency) => {
    if (!task) return;
    addDependency(task.id, dependency);
  };

  const handleRemoveDependency = (dependencyId: string) => {
    if (!task) return;
    removeDependency(task.id, dependencyId);
  };

  // Phase 1.2: Shift confirmation handlers
  const handleConfirmShifts = () => {
    if (!pendingShifts || !task) return;

    // Apply the date change to the current task first
    const dateField = startDate !== task.startDate ? 'startDate' : 'dueDate';
    const dateValue = startDate !== task.startDate ? startDate : dueDate;
    onSave(task.id, { [dateField]: dateValue });

    // Then apply all dependent shifts
    applyDependentShifts(pendingShifts);

    // Close dialog
    setPendingShifts(null);
  };

  const handleCancelShifts = () => {
    if (!task) return;

    // Revert local state to original values
    setStartDate(task.startDate);
    setDueDate(task.dueDate);

    // Close dialog
    setPendingShifts(null);
  };

  const handleDontAskAgain = () => {
    // Disable auto-shift
    setAutoShiftDependentTasks(false);

    // Close dialog without applying shifts
    handleCancelShifts();
  };

  // P2: Save task as template
  const handleSaveAsTemplate = () => {
    if (!task) return;

    // Check if task has content worth templating
    const hasContent = Boolean(
      task.description ||
      (task.checklist && task.checklist.length > 0) ||
      (task.customFields && Object.keys(task.customFields).length > 0)
    );

    if (!hasContent) {
      toast.warning('任务须包含描述、清单或自定义字段方可存为模板');
      return;
    }

    // Create template from current task
    const template = createTemplate(task);

    // Show success feedback
    toast.success(`模板 "${template.name}" 已成功创建`);
  };

  const availableTasks = tasks.filter(t => t.id !== task?.id);

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} maxWidth="2xl">
      <div className="flex flex-col md:flex-row gap-3 pr-1">
        {/* Left Side: Task Metadata (60%) */}
        <div className="w-full md:w-3/5 space-y-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              任务标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleFieldBlur('title', title)}
              className="w-full text-base font-semibold bg-transparent border-none outline-none text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue rounded px-1 py-0.5"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              任务描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleFieldBlur('description', description)}
              placeholder="添加详细描述..."
              className="w-full min-h-[48px] p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-xs text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue outline-none resize-y"
              rows={2}
            />
          </div>

          {/* Dates (Inline NL Editing) */}
          <TaskDatesSection
            task={task}
            startDate={startDate}
            setStartDate={setStartDate}
            dueDate={dueDate}
            setDueDate={setDueDate}
            isEditingStartDate={isEditingStartDate}
            setIsEditingStartDate={setIsEditingStartDate}
            isEditingDueDate={isEditingDueDate}
            setIsEditingDueDate={setIsEditingDueDate}
            onFieldBlur={handleFieldBlur}
          />

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              优先级
            </label>
            <select
              value={priority}
              onChange={(e) => {
                const newPriority = e.target.value as TaskPriority;
                setPriority(newPriority);
                handleFieldBlur('priority', newPriority);
              }}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
            >
              <option value="low">低优先级 (Low)</option>
              <option value="medium">中优先级 (Medium)</option>
              <option value="high">高优先级 (High)</option>
            </select>
          </div>

          {/* When Tag - Wave 4E */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              规划时期
            </label>
            <select
              value={task?.whenTag || ''}
              onChange={(e) => {
                const value = e.target.value || undefined;
                handleFieldBlur('whenTag', value);
              }}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
            >
              <option value="">未指定时期</option>
              <option value="today">☀️ 今日待办 (Today)</option>
              <option value="evening">🌙 今晚处理 (This Evening)</option>
              <option value="upcoming">📅 近期安排 (Upcoming)</option>
              <option value="anytime">📌 随时可做 (Anytime)</option>
              <option value="someday">💭 有朝一日 (Someday)</option>
            </select>
          </div>

          {/* Milestone Checkbox - Phase 1.6 */}
          <div className="flex items-center gap-2 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
            <input
              type="checkbox"
              id="is-milestone"
              checked={task?.isMilestone || false}
              onChange={(e) => {
                const isMilestone = e.target.checked;
                handleFieldBlur('isMilestone', isMilestone);

                // If marking as milestone, clear start date (milestones are single-point events)
                if (isMilestone && task?.startDate) {
                  handleFieldBlur('startDate', null);
                  setStartDate(null);
                }
              }}
              className="w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-blue focus:ring-2 focus:ring-accent-blue cursor-pointer"
            />
            <label
              htmlFor="is-milestone"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer select-none"
            >
              📍 标记为里程碑任务（关键节点 / 最终交付物）
            </label>
          </div>

          {/* Assignees - Phase 3.1 */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              责任人
            </label>
            <AssigneePicker
              selectedIds={assignees}
              onChange={(newAssignees) => {
                setAssignees(newAssignees);
                handleFieldBlur('assignees', newAssignees);
              }}
            />
          </div>

          {/* Effort (Story Points) - Phase B */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              工作量预估（故事点）
            </label>
            <select
              value={effort || ''}
              onChange={(e) => {
                const newEffort = e.target.value ? (parseInt(e.target.value) as EffortEstimate) : undefined;
                setEffort(newEffort);
                if (task) {
                  updateEffort(task.id, newEffort);
                }
              }}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
            >
              <option value="">未指定</option>
              <option value="1">1 点 - 极微小 (Trivial)</option>
              <option value="2">2 点 - 次要 (Minor)</option>
              <option value="3">3 点 - 中等 (Medium)</option>
              <option value="5">5 点 - 重要 (Major)</option>
              <option value="8">8 点 - 大型 (Large)</option>
              <option value="13">13 点 - 史诗级 (Epic)</option>
            </select>
          </div>

          {/* Custom Status - Phase B */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              自定义细分状态
            </label>
            <select
              value={customStatus || ''}
              onChange={(e) => {
                const newStatus = e.target.value ? (e.target.value as CustomStatus) : undefined;
                setCustomStatus(newStatus);
                if (task) {
                  updateCustomStatus(task.id, newStatus);
                }
              }}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
            >
              <option value="">无附加状态</option>
              <option value="in-review">评审中 (In Review)</option>
              <option value="testing">测试中 (Testing)</option>
              <option value="deployed">已发布 (Deployed)</option>
              <option value="blocked">受阻阻塞 (Blocked)</option>
            </select>
          </div>

          {/* Time Estimate - Phase B */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              预估工时（小时）
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={timeEstimate || ''}
              onChange={(e) => {
                const hours = e.target.value ? parseFloat(e.target.value) : undefined;
                setTimeEstimate(hours);
                if (task && hours !== undefined) {
                  updateTimeEstimate(task.id, hours);
                }
              }}
              placeholder="例如：4.5"
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
            />
            {task && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  <span>实际耗时：{((task.timeTracking?.actual || 0) / 3600).toFixed(1)}小时</span>
                  {task.timeTracking?.activeTimerStart && (
                    <span className="animate-pulse text-accent-blue font-semibold">⏱️ 计时运行中</span>
                  )}
                </div>
                {task.timeTracking?.activeTimerStart ? (
                  <button
                    onClick={() => stopKanbanTimer(task.id)}
                    className="w-full px-3 py-1.5 bg-status-error text-white text-xs font-medium rounded hover:bg-status-error/90 transition-colors"
                  >
                    ⏹️ 停止计时
                  </button>
                ) : (
                  <button
                    onClick={() => startTimer(task.id)}
                    className="w-full px-3 py-1.5 bg-accent-blue text-white text-xs font-medium rounded hover:bg-accent-blue-hover transition-colors"
                  >
                    ▶️ 开始计时
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress - Phase 1.5 */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              完成进度 (%)
            </label>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => {
                const newProgress = parseInt(e.target.value);
                setProgress(newProgress);
                handleFieldBlur('progress', newProgress);
              }}
              className="w-full h-2 bg-surface-light-elevated dark:bg-surface-dark rounded-lg appearance-none cursor-pointer accent-accent-blue"
            />

            {/* Numeric input + quick-set buttons */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setProgress(val);
                  handleFieldBlur('progress', val);
                }}
                className="w-20 p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
              />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">%</span>

              {/* Quick-set buttons */}
              <div className="flex gap-1 ml-auto">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setProgress(val);
                      handleFieldBlur('progress', val);
                    }}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      progress === val
                        ? 'bg-accent-blue text-white'
                        : 'bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-accent-blue text-white text-xs font-medium rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-accent-blue-hover"
                    aria-label={`移除标签 ${tag}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="添加标签..."
                className="flex-1 p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue outline-none"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          {/* P1: Recurring Tasks */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              循环规律
            </label>

            {/* Show current recurrence or button to add */}
            {!showRecurrencePicker && (
              <div>
                {task?.recurrence ? (
                  <div className="space-y-2">
                    {/* Recurrence Summary */}
                    <div className="p-3 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-text-light-primary dark:text-text-dark-primary font-medium mb-1">
                            {(() => {
                              const { frequency, interval, daysOfWeek, dayOfMonth } = task.recurrence;
                              const freqMap: Record<string, string> = {
                                daily: '天',
                                weekly: '周',
                                monthly: '月',
                                yearly: '年',
                              };
                              let summary = interval === 1 ? `每${freqMap[frequency] || frequency}重复` : `每 ${interval} ${freqMap[frequency] || frequency}重复`;

                              // Days of week (for weekly)
                              if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
                                const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                                const selectedDays = daysOfWeek.map((d) => dayNames[d]).join('、');
                                summary += `（${selectedDays}）`;
                              }

                              // Day of month (for monthly)
                              if (frequency === 'monthly' && dayOfMonth) {
                                summary += `（每月 ${dayOfMonth} 日）`;
                              }

                              return summary;
                            })()}
                          </p>
                          {task.recurrence.endType !== 'never' && (
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                              {task.recurrence.endType === 'after' && task.recurrence.endCount &&
                                `在发生 ${task.recurrence.endCount} 次后结束`
                              }
                              {task.recurrence.endType === 'until' && task.recurrence.endDate &&
                                `截止至 ${task.recurrence.endDate} 结束`
                              }
                            </p>
                          )}
                          {task.isRecurringParent && task.nextOccurrence && (
                            <p className="text-xs text-accent-blue font-medium mt-1">
                              下次周期：{task.nextOccurrence}
                            </p>
                          )}
                          {task.recurrenceId && (
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                              周期循环任务实例
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setShowRecurrencePicker(true)}
                          className="text-xs text-accent-blue hover:text-accent-blue-hover"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRecurrencePicker(true)}
                    className="w-full p-2 bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary text-sm rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-colors"
                  >
                    + 设置循环周期
                  </button>
                )}
              </div>
            )}

            {/* Recurrence Picker */}
            {showRecurrencePicker && (
              <div className="mt-2">
                <RecurrencePicker
                  value={task?.recurrence}
                  onChange={(recurrence) => {
                    if (task) {
                      setTaskRecurrence(task.id, recurrence);
                      setShowRecurrencePicker(false);
                    }
                  }}
                  onClose={() => setShowRecurrencePicker(false)}
                />
              </div>
            )}
          </div>

          {/* P2: Save as Template */}
          <div>
            <button
              onClick={handleSaveAsTemplate}
              disabled={!task?.description && (!task?.checklist || task.checklist.length === 0) && (!task?.customFields || Object.keys(task.customFields).length === 0)}
              className="w-full p-2 bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary text-sm rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="将此任务存为模板以便快捷复用"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              存为任务模板
            </button>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              将当前任务的描述、检查清单和自定义字段保存为可复用的模板
            </p>
          </div>

          {/* Dependencies (Professional PM) */}
          <TaskDependenciesSection
            task={task}
            tasks={tasks}
            availableTasks={availableTasks}
            blockedTasks={getBlocked(task.id)}
            onAddDependency={handleAddDependency}
            onRemoveDependency={handleRemoveDependency}
            onCardClick={onCardClick}
          />

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              状态列
            </label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as TaskStatus;
                setStatus(newStatus);
                handleFieldBlur('status', newStatus);
              }}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Fields (P2 #3) */}
          <TaskCustomFields task={task} onSave={onSave} />
        </div>

        {/* Right Side: Tabs (40%) */}
        <div className="w-full md:w-2/5">
          {/* Tab Navigation */}
          <div className="border-b border-border-light dark:border-border-dark mb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('subtasks')}
                className={`pb-1 px-1 text-xs font-medium transition-colors ${
                  activeTab === 'subtasks'
                    ? 'text-accent-blue border-b-2 border-accent-blue'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                子任务 {task.subtasks && task.subtasks.length > 0 && `(${task.subtasks.length})`}
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`pb-1 px-1 text-xs font-medium transition-colors ${
                  activeTab === 'checklist'
                    ? 'text-accent-blue border-b-2 border-accent-blue'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                清单
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-1 px-1 text-xs font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'text-accent-blue border-b-2 border-accent-blue'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                评论
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-1 px-1 text-xs font-medium transition-colors ${
                  activeTab === 'activity'
                    ? 'text-accent-blue border-b-2 border-accent-blue'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                动态
              </button>
              <button
                onClick={() => setActiveTab('timetracking')}
                className={`pb-1 px-1 text-xs font-medium transition-colors ${
                  activeTab === 'timetracking'
                    ? 'text-accent-blue border-b-2 border-accent-blue'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                工时
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`pb-1 px-1 text-xs font-medium transition-colors ${
                  activeTab === 'attachments'
                    ? 'text-accent-blue border-b-2 border-accent-blue'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                附件 {task.attachments && task.attachments.length > 0 && `(${task.attachments.length})`}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-2">
            {/* Subtasks Tab */}
            {activeTab === 'subtasks' && (
              <SubtasksTabContent
                subtasks={task.subtasks}
                onToggle={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                onDelete={(subtaskId) => deleteSubtask(task.id, subtaskId)}
                onAdd={(subtask) => addSubtask(task.id, subtask)}
              />
            )}

            {activeTab === 'checklist' && (
              <ChecklistTabContent
                checklist={task.checklist}
                onToggle={(itemId) => toggleChecklistItem(task.id, itemId)}
                onUpdate={(itemId, updates) => updateChecklistItem(task.id, itemId, updates)}
                onDelete={(itemId) => deleteChecklistItem(task.id, itemId)}
                onAdd={(text) => addChecklistItem(task.id, text)}
              />
            )}

            {activeTab === 'comments' && (
              <CommentsTabContent
                comments={task.comments}
                onAddComment={(text) => addComment(task.id, text)}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTabContent activityLog={task.activityLog} />
            )}

            {/* Time Tracking Tab (Phase A: Time Tracking Integration) */}
            {activeTab === 'timetracking' && task && (
              <TimeTrackingTabContent
                entries={getEntriesForCard(task.id)}
                totalSeconds={getTotalTimeForCard(task.id)}
                estimatedHours={task.estimatedHours}
                isTimerActive={activeEntry?.taskId === task.id}
                onStartTimer={() => startTimerForCard(task.id, task.title)}
                onStopTimer={() => stopTimer()}
              />
            )}

            {/* Attachments Tab (Phase 3.2) */}
            {activeTab === 'attachments' && task && (
              <AttachmentsTabContent
                attachments={task.attachments || []}
                coverMode={task.coverMode}
                onUpload={(file) => {
                  addAttachment(task.id, {
                    filename: file.filename,
                    fileType: file.fileType,
                    fileSize: file.fileSize,
                    dataUrl: file.dataUrl,
                  });
                }}
                onDelete={(attachmentId) => deleteAttachment(task.id, attachmentId)}
                onPreview={(attachment) => setPreviewAttachment(attachment)}
                onCoverModeChange={(mode) => onSave(task.id, { coverMode: mode })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer: AI Quick Actions + Keyboard Hints */}
      <div className="mt-2 pt-2 border-t border-border-light dark:border-border-dark flex items-center justify-between">
        <AIQuickActions
          context={{
            type: 'task',
            id: task.id,
            title: task.title,
            content: `${task.description || ''}\nPriority: ${task.priority || 'medium'}\nStatus: ${task.status || 'backlog'}`,
          }}
        />
        <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary text-center">
          按 <kbd className="px-1 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded text-[10px]">Esc</kbd> 关闭
          或 <kbd className="px-1 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded text-[10px]">Cmd+Enter</kbd> 保存
        </p>
      </div>
    </Modal>

    {/* Phase 1.2: Dependent shift confirmation dialog */}
    {pendingShifts && pendingShifts.length > 0 && (
      <DependentShiftConfirmation
        shifts={pendingShifts}
        tasks={tasks}
        onConfirm={handleConfirmShifts}
        onCancel={handleCancelShifts}
        onDontAskAgain={handleDontAskAgain}
      />
    )}

    {/* Phase 3.2: Image preview modal */}
    {previewAttachment && (
      <ImagePreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    )}
    </>
  );
};
