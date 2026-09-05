import { useState, useEffect } from 'react';
import { DollarSign, Info, Briefcase, Settings2 } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';

// Common currencies for billing
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
] as const;

/**
 * Billable Rate Settings Component
 *
 * UI for configuring default and per-project billable rates.
 * Part of Plan 07-03: Billable Time Tracking
 */
export function BillableRateSettings() {
  const defaultHourlyRate = useTimeTrackingStore((s) => s.defaultHourlyRate);
  const billingCurrency = useTimeTrackingStore((s) => s.billingCurrency);
  const updateBillingSettings = useTimeTrackingStore((s) => s.updateBillingSettings);
  const projects = useTimeTrackingStore((s) => s.projects);
  const updateProject = useTimeTrackingStore((s) => s.updateProject);

  const [rate, setRate] = useState(defaultHourlyRate);
  const [currency, setCurrency] = useState(billingCurrency);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectRate, setProjectRate] = useState<string>('');

  // Sync state when store changes
  useEffect(() => {
    setRate(defaultHourlyRate);
    setCurrency(billingCurrency);
  }, [defaultHourlyRate, billingCurrency]);

  const handleRateChange = (value: number) => {
    setRate(value);
    updateBillingSettings({ defaultHourlyRate: value });
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    updateBillingSettings({ billingCurrency: value });
  };

  const handleProjectRateSave = async (projectId: string) => {
    const rateValue = parseFloat(projectRate) || 0;
    await updateProject(projectId, { hourlyRate: rateValue > 0 ? rateValue : undefined });
    setEditingProjectId(null);
    setProjectRate('');
  };

  const startEditingProject = (projectId: string, currentRate?: number) => {
    setEditingProjectId(projectId);
    setProjectRate(currentRate?.toString() || '');
  };

  const currentCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const activeProjects = projects.filter((p) => p.active && !p.archived);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DollarSign className="w-6 h-6 text-accent-primary" />
        <div>
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            计费费率设置
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            配置用于工时计费与账单发票的时薪费率规则
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
        <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            费率生效优先级规则
          </p>
          <p>
            工时记录的计费金额按以下优先级判定计算：
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
            <li><strong>单项记录费率</strong> — 单独为某条工时指定的专属时薪</li>
            <li><strong>项目专属费率</strong> — 关联项目设定的项目默认时薪</li>
            <li><strong>全局默认费率</strong> — 下方设置的全局通用基准时薪</li>
          </ol>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
            计费币种
          </p>
        </div>
        <select
          value={currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} — {curr.name} ({curr.code})
            </option>
          ))}
        </select>
      </div>

      {/* Default Hourly Rate */}
      <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
              默认基准时薪
            </p>
          </div>
          <span className="text-sm font-mono text-accent-primary">
            {currentCurrency.symbol}{rate.toFixed(2)}/小时
          </span>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
          适用于未设置专属费率的项目或单条工时记录
        </p>
        <div className="flex items-center gap-3">
          <span className="text-text-light-secondary dark:text-text-dark-secondary">
            {currentCurrency.symbol}
          </span>
          <input
            type="number"
            min="0"
            step="5"
            value={rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
            className="flex-1 p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="0.00"
          />
          <span className="text-text-light-secondary dark:text-text-dark-secondary">/小时</span>
        </div>
      </div>

      {/* Per-Project Rates */}
      <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
            项目专属费率
          </p>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
          针对特定项目覆盖全局基准费率
        </p>

        {activeProjects.length === 0 ? (
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary italic">
            暂无活跃项目。可在「项目归属」栏目中创建项目。
          </p>
        ) : (
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light/50 dark:border-border-dark/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-text-light-primary dark:text-text-dark-primary">
                    {project.name}
                  </span>
                </div>

                {editingProjectId === project.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                      {currentCurrency.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={projectRate}
                      onChange={(e) => setProjectRate(e.target.value)}
                      className="w-24 p-1.5 text-sm bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark rounded text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      placeholder="0.00"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleProjectRateSave(project.id);
                        if (e.key === 'Escape') setEditingProjectId(null);
                      }}
                    />
                    <button
                      onClick={() => handleProjectRateSave(project.id)}
                      className="px-2 py-1 text-xs bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingProjectId(null)}
                      className="px-2 py-1 text-xs bg-surface-light-tertiary dark:bg-surface-dark-tertiary text-text-light-secondary dark:text-text-dark-secondary rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-text-light-secondary dark:text-text-dark-secondary">
                      {project.hourlyRate
                        ? `${currentCurrency.symbol}${project.hourlyRate.toFixed(2)}/小时`
                        : '沿用全局基准'}
                    </span>
                    <button
                      onClick={() => startEditingProject(project.id, project.hourlyRate)}
                      className="px-2 py-1 text-xs bg-accent-primary/10 text-accent-primary rounded hover:bg-accent-primary/20 transition-colors"
                    >
                      修改
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {rate > 0 && (
        <div className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <p className="text-sm font-medium text-accent-green mb-2">
            计费功能已激活
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            所有标记为「计费工时」的记录，若未指定项目费率，将默认按 {currentCurrency.symbol}
            {rate.toFixed(2)}/小时计算收益。
          </p>
        </div>
      )}
    </div>
  );
}
