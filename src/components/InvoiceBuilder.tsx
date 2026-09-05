import { useState, useEffect } from 'react';
import { FileText, Download, Save, X } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useInvoicingStore } from '../stores/useInvoicingStore';
import type { InvoiceFilters, Invoice } from '../types/invoicing';
import { exportInvoicePdf } from '../services/invoicePdfExport';
import { toast } from '../stores/useToastStore';

/**
 * Invoice Builder Component
 *
 * Generate professional invoices from time entries with:
 * - Flexible filtering (date range, projects, billable only)
 * - Line item grouping (by project, date, or individual entries)
 * - Live preview with calculations
 * - Export to PDF, CSV, or JSON
 */

export function InvoiceBuilder() {
  const { entries, projects } = useTimeTrackingStore();
  const {
    generateInvoice,
    createInvoice,
    settings,
    exportToCSV,
    exportToJSON
  } = useInvoicingStore();

  // Filter state
  const [filters, setFilters] = useState<InvoiceFilters>({
    startDate: '',
    endDate: '',
    projectIds: [],
    billableOnly: true,
    groupBy: 'project'
  });

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Generated invoice preview
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setFilters(f => ({
      ...f,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  }, []);

  // Generate preview
  const handleGeneratePreview = async () => {
    if (!clientName.trim()) {
      toast.warning('请输入客户名称');
      return;
    }

    setIsGenerating(true);
    try {
      const invoice = await generateInvoice(
        entries,
        filters,
        clientName,
        clientEmail || undefined,
        notes || undefined
      );
      setPreview(invoice);
    } catch (error) {
      console.error('Failed to generate invoice', error);
      toast.error('生成账单发票失败', '请稍后重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save invoice
  const handleSaveInvoice = async () => {
    if (!preview) return;

    setIsSaving(true);
    try {
      await createInvoice(preview);
      toast.success('账单已保存', '您的发票账单已成功保存。');
      // Reset form
      setPreview(null);
      setClientName('');
      setClientEmail('');
      setNotes('');
    } catch (error) {
      console.error('Failed to save invoice', error);
      toast.error('保存账单发票失败', '请稍后重试。');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to PDF using dedicated service
  const handleExportPDF = () => {
    if (!preview) return;
    exportInvoicePdf(preview, settings);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!preview) return;
    const csv = exportToCSV(preview);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preview.invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (!preview) return;
    const json = exportToJSON(preview);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preview.invoiceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">创建账单发票</h2>
          <p className="text-sm text-text-secondary">从工时记录智能生成专业的客户账单与发票</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Filters & Settings */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="rounded-lg bg-surface-elevated p-4 space-y-4">
            <h3 className="font-semibold text-text-primary">客户信息</h3>

            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                客户名称 *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                placeholder="例如：Acme 公司"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                客户邮箱
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                placeholder="billing@acme.com"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-lg bg-surface-elevated p-4 space-y-4">
            <h3 className="font-semibold text-text-primary">工时记录筛选</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                  起始日期
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                  截止日期
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                所属项目
              </label>
              <select
                multiple
                value={filters.projectIds}
                onChange={(e) => setFilters({
                  ...filters,
                  projectIds: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                size={4}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                按住 Ctrl / Cmd 键可多选项目
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                聚合归类方式
              </label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value as 'project' | 'date' | 'none' })}
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="project">按项目归类</option>
                <option value="date">按日期归类</option>
                <option value="none">保留逐条明细</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billableOnly"
                checked={filters.billableOnly}
                onChange={(e) => setFilters({ ...filters, billableOnly: e.target.checked })}
                className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-2 focus:ring-accent-primary"
              />
              <label htmlFor="billableOnly" className="text-sm text-text-light-primary dark:text-text-dark-primary">
                仅包含计费工时记录
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg bg-surface-elevated p-4 space-y-4">
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">账单附言与备注</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
              rows={4}
              placeholder="支付条款、感谢辞、汇款账号等..."
            />
          </div>

          <button
            onClick={handleGeneratePreview}
            disabled={isGenerating || !clientName.trim()}
            className="w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '正在生成账单预览...' : '生成账单预览'}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="rounded-lg bg-surface-elevated p-6">
          {!preview ? (
            <div className="flex h-full min-h-[400px] items-center justify-center text-text-tertiary">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>生成的发票账单预览将显示在此处</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-light">
                <div>
                  <h3 className="text-xl font-bold text-text-primary">
                    发票号：{preview.invoiceNumber}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    开票日期：{new Date(preview.invoiceDate).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-md p-2 text-text-secondary hover:bg-surface-hover"
                  aria-label="关闭预览"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Client */}
              <div>
                <p className="text-xs font-medium text-text-tertiary mb-1">付款客户 (BILL TO)</p>
                <p className="font-medium text-text-primary">{preview.clientName}</p>
                {preview.clientEmail && (
                  <p className="text-sm text-text-secondary">{preview.clientEmail}</p>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-tertiary">明细清单</p>
                <div className="space-y-1">
                  {preview.lineItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-text-primary">{item.description}</span>
                      <span className="text-text-secondary">
                        {item.quantity} 小时 × ¥{item.rate} = ¥{item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-border-light pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">小计金额</span>
                  <span className="text-text-primary">¥{preview.subtotal.toFixed(2)}</span>
                </div>
                {preview.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">税率 ({preview.taxRate}%)</span>
                    <span className="text-text-primary">¥{preview.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-border-light pt-2">
                  <span className="text-text-primary">总计应付</span>
                  <span className="text-text-primary">¥{preview.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleSaveInvoice}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? '正在保存...' : '保存此账单'}
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-1 rounded-md bg-surface-base px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    <Download className="w-4 h-4" />
                    导出 PDF
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-1 rounded-md bg-surface-base px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    <Download className="w-4 h-4" />
                    导出 CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center justify-center gap-1 rounded-md bg-surface-base px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    <Download className="w-4 h-4" />
                    导出 JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
