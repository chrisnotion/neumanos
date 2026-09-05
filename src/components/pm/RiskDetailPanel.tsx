/**
 * RiskDetailPanel
 *
 * Slide-over panel for viewing and editing individual risk items.
 * Supports create and edit modes with full form fields.
 */

import { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import type { Risk, RiskCategory, RiskStatus } from '../../types';

const CATEGORIES: { value: RiskCategory; label: string }[] = [
  { value: 'technical', label: '技术风险 (Technical)' },
  { value: 'schedule', label: '进度风险 (Schedule)' },
  { value: 'budget', label: '预算风险 (Budget)' },
  { value: 'resource', label: '资源风险 (Resource)' },
  { value: 'external', label: '外部风险 (External)' },
];

const STATUSES: { value: RiskStatus; label: string }[] = [
  { value: 'identified', label: '已识别 (Identified)' },
  { value: 'mitigating', label: '应对缓解中 (Mitigating)' },
  { value: 'closed', label: '已关闭 (Closed)' },
];

const PROBABILITY_LABELS = ['', '极低 (Rare)', '较低 (Unlikely)', '中等 (Possible)', '较高 (Likely)', '几乎确定 (Certain)'];
const IMPACT_LABELS = ['', '可忽略 (Negligible)', '轻微 (Minor)', '中度 (Moderate)', '严重 (Major)', '灾难性 (Catastrophic)'];

interface RiskDetailPanelProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RiskFormData) => void;
  onDelete?: (id: string) => void;
}

export interface RiskFormData {
  title: string;
  description: string;
  category: RiskCategory;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  status: RiskStatus;
  mitigationPlan: string;
  owner: string;
  relatedTasks: string[];
}

const DEFAULT_FORM: RiskFormData = {
  title: '',
  description: '',
  category: 'technical',
  probability: 3,
  impact: 3,
  status: 'identified',
  mitigationPlan: '',
  owner: '',
  relatedTasks: [],
};

export function RiskDetailPanel({
  risk,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: RiskDetailPanelProps) {
  const [form, setForm] = useState<RiskFormData>(DEFAULT_FORM);

  useEffect(() => {
    if (risk) {
      setForm({
        title: risk.title,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        status: risk.status,
        mitigationPlan: risk.mitigationPlan,
        owner: risk.owner,
        relatedTasks: risk.relatedTasks,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [risk]);

  if (!isOpen) return null;

  const isEdit = !!risk;
  const score = form.probability * form.impact;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  }

  function getScoreColor(s: number): string {
    if (s >= 15) return 'text-status-error';
    if (s >= 8) return 'text-status-warning';
    return 'text-status-success';
  }

  const inputClass =
    'w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary';
  const labelClass =
    'block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-light-elevated dark:bg-surface-dark-elevated border-l border-border-light dark:border-border-dark shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {isEdit ? '编辑风险项' : '新增风险项'}
          </h2>
          <div className="flex items-center gap-2">
            {isEdit && onDelete && (
              <button
                onClick={() => onDelete(risk.id)}
                className="p-2 text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                title="删除此风险"
                aria-label="删除此风险"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors"
              aria-label="关闭面板"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>风险标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="简要概括风险"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>详细描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="详细阐述风险背景与可能诱因..."
            />
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>风险类别</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as RiskCategory })
                }
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>当前状态</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RiskStatus })
                }
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Probability */}
          <div>
            <label className={labelClass}>
              发生概率: {form.probability} 级 - {PROBABILITY_LABELS[form.probability]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.probability}
              onChange={(e) =>
                setForm({
                  ...form,
                  probability: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                })
              }
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>极低</span>
              <span>几乎确定</span>
            </div>
          </div>

          {/* Impact */}
          <div>
            <label className={labelClass}>
              影响程度: {form.impact} 级 - {IMPACT_LABELS[form.impact]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.impact}
              onChange={(e) =>
                setForm({
                  ...form,
                  impact: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                })
              }
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>可忽略</span>
              <span>灾难性</span>
            </div>
          </div>

          {/* Risk Score display */}
          <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg text-center">
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              风险等级评分
            </span>
            <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</p>
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {score >= 15 ? '高风险 (High)' : score >= 8 ? '中风险 (Medium)' : '低风险 (Low)'}
            </span>
          </div>

          {/* Mitigation Plan */}
          <div>
            <label className={labelClass}>缓解应对策略</label>
            <textarea
              value={form.mitigationPlan}
              onChange={(e) =>
                setForm({ ...form, mitigationPlan: e.target.value })
              }
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="如何规避、减轻或应对该风险？"
            />
          </div>

          {/* Owner */}
          <div>
            <label className={labelClass}>责任人</label>
            <input
              type="text"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              className={inputClass}
              placeholder="风险负责人"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={handleSubmit as unknown as () => void}
            disabled={!form.title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-button font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isEdit ? '保存更新' : '添加风险'}
          </button>
        </div>
      </div>
    </>
  );
}

export default RiskDetailPanel;
