import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Widget } from '../components/Widget';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTaskViewsStore, applyFilters } from '../stores/useTaskViewsStore';
import { useKanbanKeyboard } from '../hooks/useKanbanKeyboard';
import { KanbanColumn } from './Kanban/KanbanColumn';
import { KanbanCard } from './Kanban/KanbanCard';
import { ColumnManager } from './Kanban/ColumnManager';
import { CardDetailPanel } from './Kanban/CardDetailPanel';
import { ListView } from './Kanban/ListView';
import { CalendarView } from './Kanban/CalendarView';
import { ArchivedView } from './Kanban/ArchivedView';
import { QuickAddModal } from './Kanban/QuickAddModal';
import { EisenhowerMatrix } from '../components/tasks/EisenhowerMatrix';
import { TriageInbox } from '../components/tasks/TriageInbox';
import { TaskViewSidebar } from '../components/tasks/TaskViewSidebar';
import { TaskTemplatesPicker } from '../components/tasks/TaskTemplatesPicker';
import type { Task, TaskStatus } from '../types';

/**
 * Kanban Board Widget - React Version with Drag & Drop
 *
 * Features:
 * - Three-column board (To Do, In Progress, Done)
 * - Drag and drop tasks between columns
 * - Task CRUD operations
 * - Priority and due date tracking
 * - Syncs with Calendar widget
 * - Keyboard shortcuts for navigation and actions
 */
export const Kanban: React.FC = () => {
  const { tasks, columns, moveTask, deleteTask, updateTask, undo, undoHistory, autoArchiveCompletedTasks, visibleColumns = 5, setVisibleColumns } = useKanbanStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [columnManagerInitialId, setColumnManagerInitialId] = useState<string | undefined>();
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [toast, setToast] = useState<{ message: string; showUndo: boolean } | null>(null);
  const [detailPanelTaskId, setDetailPanelTaskId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'subtasks' | 'checklist' | 'comments' | 'activity'>('subtasks');

  // Get the current task from the store (reactive)
  const selectedTask = detailPanelTaskId ? tasks.find(t => t.id === detailPanelTaskId) || null : null;

  // View mode state with persistence
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar' | 'matrix' | 'triage'>(() => {
    const saved = localStorage.getItem('kanban-view-mode');
    return (saved as 'board' | 'list' | 'calendar' | 'matrix' | 'triage') || 'board';
  });

  // Task templates modal
  const [showTemplates, setShowTemplates] = useState(false);

  // Active view from task views store
  const activeView = useTaskViewsStore((s) => s.getActiveView());
  const [showViewSidebar, setShowViewSidebar] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Phase 3.1: Get members for assignee filter
  const members = useSettingsStore((state) => state.members);

  // Refs for columns to trigger their add forms
  const columnRefs = useRef<Record<string, { triggerAdd: () => void }>>({});
  const cardRefs = useRef<Record<string, { triggerEdit: () => void }>>({});

  // Configure sensors for drag-drop (mouse + touch + keyboard for accessibility)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms long press
        tolerance: 5, // 5px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort columns by order
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => a.order - b.order);
  }, [columns]);

  const columnStatuses = sortedColumns.map((col) => col.id);

  // Get all unique tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((task) => task.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Filter tasks based on search, view filters, and manual filters
  const filteredTasks = useMemo(() => {
    // First apply active view filters
    const result = activeView.filters.length > 0 ? applyFilters(tasks, activeView.filters) : tasks;

    // Then apply manual filters
    return result.filter((task) => {
      // Search filter (title, description, or card number)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        // Phase A: Support searching by card number (e.g., "KAN-1", "1", "kan1")
        const cardNumberStr = task.cardNumber ? `KAN-${task.cardNumber}`.toLowerCase() : '';
        const cardNumberSimple = task.cardNumber?.toString() || '';

        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          cardNumberStr.includes(query) ||
          cardNumberSimple.includes(query);

        if (!matchesSearch) return false;
      }

      // Priority filter
      if (selectedPriorities.size > 0 && !selectedPriorities.has(task.priority)) {
        return false;
      }

      // Tags filter
      if (selectedTags.size > 0) {
        const hasSelectedTag = task.tags.some((tag) => selectedTags.has(tag));
        if (!hasSelectedTag) return false;
      }

      // Assignee filter (Phase 3.1)
      if (selectedAssignees.size > 0 || showUnassigned) {
        const taskAssignees = task.assignees || [];

        // If "Unassigned" is selected
        if (showUnassigned && taskAssignees.length === 0) {
          return true;
        }

        // If specific assignees are selected
        if (selectedAssignees.size > 0) {
          const hasSelectedAssignee = taskAssignees.some((id) => selectedAssignees.has(id));
          if (hasSelectedAssignee) return true;
        }

        // Neither condition met
        if (selectedAssignees.size > 0 || showUnassigned) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, selectedPriorities, selectedTags, selectedAssignees, showUnassigned, activeView]);

  // Toggle filter helpers
  const togglePriority = (priority: string) => {
    setSelectedPriorities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(priority)) {
        newSet.delete(priority);
      } else {
        newSet.add(priority);
      }
      return newSet;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const toggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPriorities(new Set());
    setSelectedTags(new Set());
    setSelectedAssignees(new Set());
    setShowUnassigned(false);
  };

  const hasActiveFilters =
    searchQuery || selectedPriorities.size > 0 || selectedTags.size > 0 || selectedAssignees.size > 0 || showUnassigned;

  // Keyboard shortcuts
  const {
    selectedColumn,
    selectedTaskId,
    showHelp,
    closeHelp,
    pendingDeleteTask,
    confirmDelete,
    cancelDelete,
  } = useKanbanKeyboard({
    columns: columnStatuses,
    tasks: filteredTasks, // Use filtered tasks for keyboard navigation
    onAddTask: (status) => {
      // Trigger the add form in the selected column
      columnRefs.current[status]?.triggerAdd();
    },
    onEditTask: (task) => {
      // Trigger edit mode for the selected task
      cardRefs.current[task.id]?.triggerEdit();
    },
    onDeleteTask: (taskId) => {
      deleteTask(taskId);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // WIP Limit validation (Phase 3.3)
    const targetColumn = columns.find((c) => c.id === newStatus);
    const currentTask = tasks.find((t) => t.id === taskId);
    const tasksInTargetColumn = tasks.filter((t) => t.status === newStatus);

    // Only check WIP limit if moving TO a different column (not reordering within same column)
    if (targetColumn?.wipLimit && currentTask?.status !== newStatus) {
      const enforceStrict = useSettingsStore.getState().enforceWipLimits;

      // Check if target column is at or over WIP limit
      if (tasksInTargetColumn.length >= targetColumn.wipLimit) {
        if (enforceStrict) {
          // Hard limit: prevent move
          setToast({
            message: `Cannot move task: "${targetColumn.title}" has reached WIP limit (${targetColumn.wipLimit})`,
            showUndo: false,
          });
          return; // Abort move
        } else {
          // Soft limit: show warning but allow move
          setToast({
            message: `Warning: "${targetColumn.title}" is at/over WIP limit (${tasksInTargetColumn.length + 1}/${targetColumn.wipLimit})`,
            showUndo: false,
          });
        }
      }
    }

    // Move task to new column
    moveTask(taskId, newStatus);
  };

  const handleEditColumn = (columnId: string) => {
    setColumnManagerInitialId(columnId);
    setShowColumnManager(true);
  };

  // View mode persistence
  useEffect(() => {
    localStorage.setItem('kanban-view-mode', viewMode);
  }, [viewMode]);

  // Phase A: Auto-archive completed tasks on mount
  useEffect(() => {
    autoArchiveCompletedTasks();
  }, []); // Run once on mount

  // Phase A: Global keyboard shortcut for Quick Add (Cmd/Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K to open Quick Add
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Don't trigger if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        e.preventDefault();
        setShowQuickAdd(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Listen for undo history changes and show toast
  useEffect(() => {
    if (undoHistory.length > 0) {
      const lastEntry = undoHistory[undoHistory.length - 1];
      setToast({
        message: lastEntry.description,
        showUndo: true,
      });
    }
  }, [undoHistory]);

  const handleUndo = () => {
    undo();
    setToast(null);
  };

  return (
    <Widget
      id="kanban"
      title="任务看板"
      category="规划管理"
      draggable={false}
      headerAccessory={
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary mr-2">
            分栏数：
          </span>
          {[3, 4, 5, 6, 7].map((count) => (
            <button
              key={count}
              onClick={() => setVisibleColumns(count)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                visibleColumns === count
                  ? 'bg-accent-blue text-white'
                  : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
              title={`同时平铺显示 ${count} 列`}
            >
              {count}
            </button>
          ))}
        </div>
      }
    >
      {/* Filter Bar */}
      <div className="mb-4 space-y-3">
        {/* Search and Filter Toggle */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务（支持标题、描述、KAN-# 编号）..."
            className="flex-1 px-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <button
            onClick={() => setShowColumnManager(true)}
            className="px-4 py-2 text-sm font-medium bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors whitespace-nowrap"
            title="管理自定义分栏"
          >
            ⚙️ 自定义列
          </button>
          <button
            onClick={() => setShowArchivedView(true)}
            className="px-4 py-2 text-sm font-medium bg-surface-light-elevated dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-colors whitespace-nowrap"
            title="查看已归档任务"
          >
            📦 归档箱
          </button>
          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
            {([
              { id: 'board' as const, label: '看板', icon: '📋' },
              { id: 'list' as const, label: '列表', icon: '📊' },
              { id: 'calendar' as const, label: '日历', icon: '📅' },
              { id: 'matrix' as const, label: '四象限', icon: '🎯' },
              { id: 'triage' as const, label: '收件箱', icon: '📥' },
            ] as const).map((v, i) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  i > 0 ? 'border-l border-border-light dark:border-border-dark' : ''
                } ${
                  viewMode === v.id
                    ? 'bg-accent-blue text-white'
                    : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }`}
                title={`${v.label}视图`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          {/* Templates button */}
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 text-sm font-medium bg-surface-light-elevated dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-colors whitespace-nowrap"
            title="从模板快速创建任务"
          >
            📝 模板
          </button>
          {/* Views sidebar toggle */}
          <button
            onClick={() => setShowViewSidebar(!showViewSidebar)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              showViewSidebar
                ? 'bg-accent-blue text-white'
                : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
            }`}
            title="已存自定义视图"
          >
            👁 视图
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              showFilters || hasActiveFilters
                ? 'bg-accent-blue text-white'
                : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
            }`}
          >
            🔍 筛选 {hasActiveFilters && `(${[...selectedPriorities, ...selectedTags, ...selectedAssignees].length + (showUnassigned ? 1 : 0)})`}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium bg-surface-dark text-white rounded-lg hover:opacity-80 transition-opacity"
            >
              清空
            </button>
          )}
        </div>

        {/* Advanced Filters (collapsible) */}
        {showFilters && (
          <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg space-y-3">
            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
                优先级筛选
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['low', 'medium', 'high'] as const).map((priority) => {
                  const priorityMap: Record<string, string> = { low: '低优先级', medium: '中优先级', high: '高优先级' };
                  return (
                    <button
                      key={priority}
                      onClick={() => togglePriority(priority)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedPriorities.has(priority)
                          ? 'bg-accent-blue text-white ring-2 ring-accent-blue ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark'
                          : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-blue'
                      }`}
                    >
                      {priorityMap[priority]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
                  标签筛选
                </label>
                <div className="flex gap-2 flex-wrap">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedTags.has(tag)
                          ? 'bg-accent-purple text-white ring-2 ring-accent-purple ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark'
                          : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-purple'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assignee Filter - Phase 3.1 */}
            {members.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
                  责任人筛选
                </label>
                <div className="flex gap-2 flex-wrap">
                  {/* Unassigned Option */}
                  <button
                    onClick={() => setShowUnassigned(!showUnassigned)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      showUnassigned
                        ? 'bg-text-light-secondary dark:bg-text-dark-secondary text-white ring-2 ring-text-light-secondary dark:ring-text-dark-secondary ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark'
                        : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-text-light-secondary dark:hover:border-text-dark-secondary'
                    }`}
                  >
                    未指派
                  </button>

                  {/* Member Avatars */}
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleAssignee(member.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedAssignees.has(member.id)
                          ? 'bg-accent-blue text-white ring-2 ring-accent-blue ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark'
                          : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-blue'
                      }`}
                      title={member.name}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] ${
                          selectedAssignees.has(member.id) ? 'opacity-90' : ''
                        }`}
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.initials}
                      </div>
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            当前显示 {filteredTasks.length} / 共 {tasks.length} 项任务
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center gap-4">
          <span>
            按 <kbd className="px-2 py-0.5 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark">?</kbd> 查看快捷键
          </span>
          <span className="hidden md:inline">
            按 <kbd className="px-2 py-0.5 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark">⌘K</kbd> 极速添加任务
          </span>
        </div>
      </div>

      <div className={`flex gap-4 ${showViewSidebar ? '' : ''}`}>
        {/* Views Sidebar */}
        {showViewSidebar && (
          <div className="w-48 shrink-0 border-r border-border-light dark:border-border-dark pr-4">
            <TaskViewSidebar />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {viewMode === 'board' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="kanban-board min-h-[500px] flex gap-4 overflow-x-auto pb-4 max-w-full">
                {sortedColumns.map((column, index) => {
                  const columnWidth = `calc((100% - ${(visibleColumns - 1) * 16}px) / ${visibleColumns})`;

                  return (
                    <KanbanColumn
                      key={column.id}
                      id={column.id}
                      title={column.title}
                      color={column.color}
                      wipLimit={column.wipLimit}
                      tasks={filteredTasks.filter((task) => task.status === column.id)}
                      selectedTaskId={selectedColumn === index ? selectedTaskId : undefined}
                      columnWidth={columnWidth}
                      onRegisterRef={(ref) => {
                        columnRefs.current[column.id] = ref;
                      }}
                      onRegisterCardRef={(taskId, ref) => {
                        cardRefs.current[taskId] = ref;
                      }}
                      onCardClick={(task, tab) => {
                        setDetailPanelTaskId(task.id);
                        if (tab) setSelectedTab(tab);
                      }}
                      onEditColumn={handleEditColumn}
                    />
                  );
                })}
              </div>

              {/* Drag overlay - shows ghost of dragged card */}
              <DragOverlay>
                {activeTask ? (
                  <div className="opacity-80 rotate-3 scale-105 transition-transform">
                    <KanbanCard task={activeTask} isDragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : viewMode === 'list' ? (
            <ListView
              tasks={filteredTasks}
              columns={columns}
              onTaskClick={(task) => setDetailPanelTaskId(task.id)}
            />
          ) : viewMode === 'matrix' ? (
            <EisenhowerMatrix
              tasks={filteredTasks}
              onTaskClick={(task) => setDetailPanelTaskId(task.id)}
            />
          ) : viewMode === 'triage' ? (
            <TriageInbox
              onTaskClick={(task) => setDetailPanelTaskId(task.id)}
            />
          ) : (
            <CalendarView
              tasks={filteredTasks}
              columns={columns}
              onTaskClick={(task) => setDetailPanelTaskId(task.id)}
            />
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp isOpen={showHelp} onClose={closeHelp} />

      {/* Delete Confirmation Dialog */}
      {pendingDeleteTask && (
        <ConfirmDialog
          isOpen={true}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="删除任务"
          message={`确定要删除“${pendingDeleteTask.title}”吗？此操作不可撤销。`}
          confirmText="确认删除"
          cancelText="取消"
          variant="danger"
        />
      )}

      {/* Column Manager Modal */}
      <ColumnManager
        isOpen={showColumnManager}
        onClose={() => {
          setShowColumnManager(false);
          setColumnManagerInitialId(undefined);
        }}
        initialEditingColumnId={columnManagerInitialId}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          action={toast.showUndo ? { label: 'Undo', onClick: handleUndo } : undefined}
          onClose={() => setToast(null)}
        />
      )}

      {/* Card Detail Panel */}
      <CardDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => {
          setDetailPanelTaskId(null);
          setSelectedTab('subtasks'); // Reset to default tab
        }}
        onSave={(taskId, updates) => {
          updateTask(taskId, updates);
        }}
        columns={columns}
        initialTab={selectedTab}
        onCardClick={(task) => {
          setDetailPanelTaskId(task.id);
        }}
      />

      {/* Archived View */}
      <ArchivedView
        isOpen={showArchivedView}
        onClose={() => setShowArchivedView(false)}
      />

      {/* Quick Add Modal (Phase A: Quick Add Cmd+K) */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />

      {/* Task Templates Picker (Wave 4E) */}
      <TaskTemplatesPicker
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />
    </Widget>
  );
};
