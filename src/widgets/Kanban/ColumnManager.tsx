import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { KanbanColumn } from '../../types';

interface ColumnManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditingColumnId?: string; // NEW: Pre-select column for editing
}

// Predefined color options for columns
const COLOR_OPTIONS = [
  { label: 'Gray', class: 'bg-text-light-secondary dark:bg-text-dark-secondary', preview: 'bg-text-light-secondary dark:bg-text-dark-secondary' },
  { label: 'Blue', class: 'bg-status-info', preview: 'bg-accent-blue' },
  { label: 'Yellow', class: 'bg-status-warning', preview: 'bg-accent-yellow' },
  { label: 'Cyan', class: 'bg-accent-blue', preview: 'bg-accent-cyan' },
  { label: 'Green', class: 'bg-status-success', preview: 'bg-accent-green' },
  { label: 'Red', class: 'bg-status-error', preview: 'bg-accent-red' },
  { label: 'Magenta', class: 'bg-accent-magenta', preview: 'bg-accent-magenta' },
];

// Column templates
const TEMPLATES = {
  dev: [
    { title: 'Backlog', color: 'bg-text-light-secondary dark:bg-text-dark-secondary' },
    { title: 'To Do', color: 'bg-status-info' },
    { title: 'In Progress', color: 'bg-status-warning' },
    { title: 'In Review', color: 'bg-accent-blue' },
    { title: 'Done', color: 'bg-status-success' },
  ],
  pm: [
    { title: 'Ideas', color: 'bg-text-light-secondary dark:bg-text-dark-secondary' },
    { title: 'Planned', color: 'bg-status-info' },
    { title: 'Active', color: 'bg-status-warning' },
    { title: 'Blocked', color: 'bg-status-error' },
    { title: 'Complete', color: 'bg-status-success' },
  ],
  marketing: [
    { title: 'Ideation', color: 'bg-text-light-secondary dark:bg-text-dark-secondary' },
    { title: 'Draft', color: 'bg-status-info' },
    { title: 'Review', color: 'bg-status-warning' },
    { title: 'Scheduled', color: 'bg-accent-blue' },
    { title: 'Published', color: 'bg-status-success' },
  ],
};

// Sortable column item
interface SortableColumnItemProps {
  column: KanbanColumn;
  onEdit: (column: KanbanColumn) => void;
  onDelete: (id: string) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Color indicator */}
      <div className={`w-4 h-4 rounded-full ${column.color}`}></div>

      {/* Column info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
          {column.title}
        </div>
        {column.wipLimit && (
          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            WIP Limit: {column.wipLimit}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(column)}
          className="p-1.5 text-text-light-secondary hover:text-accent-blue dark:text-text-dark-secondary dark:hover:text-accent-blue transition-colors"
          aria-label="Edit column"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(column.id)}
          className="p-1.5 text-text-light-secondary hover:text-status-error dark:text-text-dark-secondary dark:hover:text-status-error transition-colors"
          aria-label="Delete column"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * ColumnManager Component
 * Modal for managing Kanban columns (add, edit, delete, reorder, templates)
 */
export const ColumnManager: React.FC<ColumnManagerProps> = ({ isOpen, onClose, initialEditingColumnId }) => {
  const { columns, addColumn, updateColumn, deleteColumn, reorderColumns, replaceAllColumns } = useKanbanStore();
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Confirmation dialog state
  const [pendingDeleteColumn, setPendingDeleteColumn] = useState<KanbanColumn | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<keyof typeof TEMPLATES | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    color: 'bg-status-info',
    wipLimit: undefined as number | undefined,
  });

  // Auto-select column for editing when initialEditingColumnId is provided
  useEffect(() => {
    if (initialEditingColumnId && isOpen) {
      const column = columns.find((col) => col.id === initialEditingColumnId);
      if (column) {
        handleEdit(column);
      }
    }
  }, [initialEditingColumnId, isOpen, columns]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);

      const newOrder = [...columns];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);

      reorderColumns(newOrder.map((col) => col.id));
    }
  };

  const handleEdit = (column: KanbanColumn) => {
    setEditingColumn(column);
    setFormData({
      title: column.title,
      color: column.color,
      wipLimit: column.wipLimit,
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (columns.length <= 1) {
      setError('Cannot delete the last column. You must have at least one column.');
      return;
    }

    const column = columns.find((col) => col.id === id);
    if (column) {
      setPendingDeleteColumn(column);
    }
  };

  const confirmDelete = () => {
    if (pendingDeleteColumn) {
      deleteColumn(pendingDeleteColumn.id);
      setPendingDeleteColumn(null);
      setError(null);
    }
  };

  const cancelDelete = () => {
    setPendingDeleteColumn(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    if (editingColumn) {
      // Update existing column
      updateColumn(editingColumn.id, {
        title: formData.title.trim(),
        color: formData.color,
        wipLimit: formData.wipLimit || undefined,
      });
    } else {
      // Add new column
      addColumn({
        title: formData.title.trim(),
        color: formData.color,
        wipLimit: formData.wipLimit || undefined,
      });
    }

    // Reset form
    setFormData({ title: '', color: 'bg-status-info', wipLimit: undefined });
    setEditingColumn(null);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setFormData({ title: '', color: 'bg-status-info', wipLimit: undefined });
    setEditingColumn(null);
    setShowAddForm(false);
  };

  const applyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    setPendingTemplate(templateKey);
  };

  const confirmTemplate = () => {
    if (pendingTemplate) {
      // Use atomic replace to avoid race condition
      replaceAllColumns(TEMPLATES[pendingTemplate]);

      setPendingTemplate(null);
      setError(null);
    }
  };

  const cancelTemplate = () => {
    setPendingTemplate(null);
  };

  const activeColumn = columns.find((col) => col.id === activeId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="管理状态列" maxWidth="lg">
      <div className="space-y-6">
        {/* Templates */}
        <div>
          <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            分栏预设模板
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyTemplate('dev')}
              className="px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg hover:border-accent-blue transition-colors text-text-light-primary dark:text-text-dark-primary"
            >
              研发流程 (Development)
            </button>
            <button
              onClick={() => applyTemplate('pm')}
              className="px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg hover:border-accent-blue transition-colors text-text-light-primary dark:text-text-dark-primary"
            >
              项目管理 (Project Management)
            </button>
            <button
              onClick={() => applyTemplate('marketing')}
              className="px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg hover:border-accent-blue transition-colors text-text-light-primary dark:text-text-dark-primary"
            >
              运营宣发 (Marketing)
            </button>
          </div>
        </div>

        {/* Column List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              已有状态列 ({columns.length})
            </h4>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm text-accent-blue hover:text-accent-blue-hover"
              >
                + 添加新状态列
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-4 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border-2 border-accent-blue space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  列名称
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：进行中、已部署"
                  className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  色彩标识
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.class}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: option.class })}
                      className={`w-8 h-8 rounded-full ${option.preview} ${
                        formData.color === option.class
                          ? 'ring-2 ring-accent-blue ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark'
                          : ''
                      }`}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  在制品上限 (WIP Limit，选填)
                </label>
                <input
                  type="number"
                  value={formData.wipLimit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wipLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="例如：5"
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:outline-none"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  该列允许容纳的最大任务卡片数，超出将告警提示
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
                >
                  {editingColumn ? '更新状态列' : '确认添加'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm bg-text-light-secondary dark:bg-text-dark-secondary text-white rounded-lg hover:opacity-80 transition-opacity"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          {/* Sortable Column List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={columns.map((col) => col.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {columns.map((column) => (
                  <SortableColumnItem
                    key={column.id}
                    column={column}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeColumn && (
                <div className="flex items-center gap-3 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark shadow-lg">
                  <div className={`w-4 h-4 rounded-full ${activeColumn.color}`}></div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {activeColumn.title}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error rounded-lg text-status-error text-sm">
            {error}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary bg-surface-light-elevated dark:bg-surface-dark-elevated p-3 rounded-lg">
          <p className="font-medium mb-1">使用提示：</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>可直接上下拖拽调整状态列在看板上的排列次序</li>
            <li>设置 WIP 限制有助于聚焦精力，防止在办任务积压</li>
            <li>删除某状态列时，该列中的所有任务将自动归入 Backlog 待办池</li>
            <li>套用预设模板将整体覆盖当前看板的列配置</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {pendingDeleteColumn && (
        <ConfirmDialog
          isOpen={true}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="删除状态列"
          message={`确定要删除“${pendingDeleteColumn.title}”列吗？该列内的所有任务将自动移至 Backlog。`}
          confirmText="确认删除"
          cancelText="取消"
          variant="danger"
        />
      )}

      {/* Template Confirmation Dialog */}
      {pendingTemplate && (
        <ConfirmDialog
          isOpen={true}
          onClose={cancelTemplate}
          onConfirm={confirmTemplate}
          title="套用分栏模板"
          message={`此操作将把当前看板所有列替换为${pendingTemplate === 'dev' ? '“研发流程”' : pendingTemplate === 'pm' ? '“项目管理”' : '“运营宣发”'}预设模板，且不可撤销。是否继续？`}
          confirmText="确认套用"
          cancelText="取消"
          variant="warning"
        />
      )}
    </Modal>
  );
};
