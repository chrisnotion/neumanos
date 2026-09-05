/**
 * Support Modal - Help & Support System
 * Provides issue reporting, help resources, and documentation access
 *
 * Features:
 * - Report Issue tab: Mailto integration with diagnostic report
 * - Get Help tab: Keyboard shortcuts, FAQs, system status
 * - Documentation tab: Version info, external links
 */

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getDiagnosticReport, formatDiagnosticReport, copyDiagnosticReportToClipboard, downloadDiagnosticReport, type DiagnosticReport } from '../utils/diagnostics';
import { logger } from '../services/logger';
import { Mail, HelpCircle, Book, Copy, Download, ChevronDown, ChevronRight, ExternalLink, Keyboard } from 'lucide-react';
import { BUILD_HASH, formatBuildTimestamp } from '../utils/buildInfo';
import { useShortcutsStore } from '../stores/useShortcutsStore';
import { formatShortcut } from '../services/shortcuts';

const log = logger.module('SupportModal');

type TabType = 'report' | 'help' | 'docs';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which tab to show when modal opens. Defaults to 'report'. */
  initialTab?: TabType;
}

interface FAQ {
  question: string;
  answer: string;
}

const SUPPORT_EMAIL = 'os@neuman.dev';

const FAQS: FAQ[] = [
  // Getting Started
  {
    question: '我的个人数据存放在哪里？',
    answer: '您的所有数据都完整保存在当前浏览器的本地 IndexedDB 存储中。除非您主动点击导出，否则没有任何数据会离开您的设备。这意味着您的笔记、任务和偏好设置拥有绝对的隐私保护，且支持完全离线使用。',
  },
  {
    question: '如何备份我的数据？',
    answer: '前往“系统设置 → 备份与恢复”，点击“导出脑图/数据资产 (Export Brain)”即可下载 .brain 备份文件。您可以在任何浏览器中通过“导入脑图/数据资产 (Import Brain)”一键恢复。如需自动备份，可配置本地自动归档到您的坚果云、Dropbox、Google Drive 等同步盘目录。',
  },
  {
    question: '如果我清理了浏览器缓存与数据会怎样？',
    answer: '清理浏览器本地存储数据会导致本地保存的内容丢失。在清理浏览器数据或更换设备前，请务必先导出 .brain 备份文件。有了备份文件，随时可以完整恢复。',
  },
  // Notes
  {
    question: '如何将笔记批量导出为 Markdown？',
    answer: '进入“灵感笔记”页面，点击右上角的操作菜单中的“导出”按钮（或按快捷键 Ctrl+Shift+E），选择您希望导出的范围，即可一键打包下载包含 .md 文件的 ZIP 压缩包。',
  },
  {
    question: '什么是双链 (Wiki Links)，如何使用？',
    answer: '双链是笔记之间的双向网状连接，采用 [[笔记标题]] 语法。在编辑器中输入 [[ 即可唤起所有笔记的快捷联想列表。点击双链可无缝跳转至对应笔记，亦可在“知识图谱”视图中直观浏览笔记间的关联拓扑。',
  },
  {
    question: '是否支持将笔记整理到文件夹中？',
    answer: '完全支持！您可以在笔记侧栏中点击文件夹图标新建目录，自由拖拽归类。同时支持多标签系统，为笔记打上任意标签并进行灵活筛选。',
  },
  // Tasks
  {
    question: '如何创建周期性/循环任务？',
    answer: '创建或编辑任务时，向下滚动至“循环周期”设置区域。选择您的循环模式（每天、每周、每月、每年或自定义间隔），设定步长及可选的截止结束日期。',
  },
  {
    question: '什么是看板视图 (Kanban)？',
    answer: '看板视图以直观的分栏（待处理、进行中、已完成等）展示任务流动。拖拽卡片即可实时推进任务进度。您还可以自定义专属列，或按项目、优先级、标签进行多维过滤。',
  },
  {
    question: '任务依赖关系是如何运作的？',
    answer: '在任务详情中，您可以添加“前置依赖任务”——即必须先完成前置项方可启动当前项。“关键路径 (Critical Path)”功能可醒目高亮展示制约整体交付的核心阻塞任务链路。',
  },
  // Dashboard & Widgets
  {
    question: '如何自定义控制台/仪表盘的组件？',
    answer: '在仪表盘页面右上角点击齿轮图标（⚙）打开“组件中心 (Widget Manager)”。您可以自由开启/关闭组件、拖拽调整顺序，或点击单个组件的配置项进行个性化定制。',
  },
  {
    question: '目前提供了哪些实用组件？',
    answer: '拥有超过 60 款多元组件：包括天气、资讯流、科学计算器、世界时钟、番茄钟、便签速记、日程概览、任务摘要、工时统计、快捷书签等，覆盖工作与生活方方面面。',
  },
  // Time Tracking & Calendar
  {
    question: '工时追踪 (Time Tracking) 如何工作？',
    answer: '在侧栏进入“工时追踪”。开始工作时一键启动计时器，将其归属到特定项目，完成后停止。支持查看每日/每周工时报表，并可导出为 CSV 用于核算与复盘。',
  },
  {
    question: '是否支持导入外部日历日程？',
    answer: '支持！日程页面支持标准 ICS 日历文件导入。点击导入按钮选取您的 .ics 文件即可。同样，您也可以将日程导出为 ICS 格式与主流日历软件无缝协同。',
  },
  // Shortcuts & Tips
  {
    question: '有哪些常用的高效快捷键？',
    answer: '随时按下 F1 或 Ctrl+/ 唤起帮助；在笔记页面按 Ctrl+K 聚焦检索；编辑笔记时 Ctrl+B 粗体、Ctrl+I 斜体、Ctrl+Shift+E 导出、输入 / 唤起斜杠指令菜单；按 Ctrl+B 可展开/收起左侧栏，Ctrl+D 快速创建今日日记。',
  },
  {
    question: '如何在笔记中使用斜杠命令 (Slash Commands)？',
    answer: '在笔记编辑器任意新行输入 "/" 即可浏览所有快捷排版指令：/heading 标题、/bullet 无序列表、/checkbox 待办清单、/code 代码块、/quote 引用、/divider 分割线等，让排版行云流水。',
  },
];

/**
 * Keyboard Shortcuts Section - displays all registered shortcuts from the shortcuts store
 */
function KeyboardShortcutsSection() {
  const shortcuts = useShortcutsStore((s) => s.getAllShortcuts());

  // Group shortcuts by context
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const context = shortcut.context || 'global';
      if (!acc[context]) acc[context] = [];
      acc[context].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof shortcuts>
  );

  const contextLabels: Record<string, string> = {
    global: '全局快捷键',
    kanban: '任务与看板',
    notes: '灵感笔记',
    calendar: '日程历程',
    diagram: '脑图与图表',
    modal: '弹窗交互',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-accent-blue" />
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          键盘快捷键速查
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedShortcuts).map(([context, contextShortcuts]) => (
          <div key={context}>
            <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
              {contextLabels[context] || context}
            </h4>
            <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
              {contextShortcuts.map((shortcut, index) => (
                <div
                  key={shortcut.id}
                  className={`flex items-center justify-between px-3 py-2 ${
                    index !== contextShortcuts.length - 1
                      ? 'border-b border-border-light dark:border-border-dark'
                      : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                      {shortcut.label}
                    </span>
                    {shortcut.description && (
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {shortcut.description}
                      </span>
                    )}
                  </div>
                  <kbd className="px-2 py-1 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary">
                    {formatShortcut(shortcut.keys)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        {shortcuts.length === 0 && (
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
            暂未注册任何快捷键。随着您使用各项功能，快捷键将在此处呈现。
          </p>
        )}
      </div>

      {/* Editor shortcuts (hardcoded since they're from Lexical) */}
      <div className="mt-4">
        <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
          笔记编辑器专属
        </h4>
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          {[
            { keys: ['mod', 'b'], label: '加粗' },
            { keys: ['mod', 'i'], label: '斜体' },
            { keys: ['mod', 'u'], label: '下划线' },
            { keys: ['mod', 'shift', 'e'], label: '导出笔记' },
            { keys: ['/'], label: '唤起斜杠指令菜单' },
            { keys: ['[['], label: '双链自动补全' },
          ].map((shortcut, index, arr) => (
            <div
              key={shortcut.label}
              className={`flex items-center justify-between px-3 py-2 ${
                index !== arr.length - 1 ? 'border-b border-border-light dark:border-border-dark' : ''
              }`}
            >
              <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                {shortcut.label}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary">
                {formatShortcut(shortcut.keys)}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SupportModal({ isOpen, onClose, initialTab = 'report' }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [issueType, setIssueType] = useState<string>('bug');
  const [description, setDescription] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [showDiagnosticPreview, setShowDiagnosticPreview] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Generate diagnostic report when modal opens or when tab changes to report
  useEffect(() => {
    if (isOpen && activeTab === 'report' && !diagnosticReport) {
      generateDiagnosticReport();
    }
  }, [isOpen, activeTab]);

  const generateDiagnosticReport = async () => {
    try {
      setIsGeneratingReport(true);
      const report = await getDiagnosticReport();
      setDiagnosticReport(report);
      log.info('Diagnostic report generated for support modal');
    } catch (error) {
      log.error('Failed to generate diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to generate diagnostic report' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSendEmail = () => {
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please provide a description of the issue' });
      return;
    }

    try {
      const subject = encodeURIComponent(`[${issueType}] - NeumanOS Support Request`);

      let bodyText = `Issue Type: ${issueType}\n`;
      bodyText += `Build: ${BUILD_HASH} (${formatBuildTimestamp()})\n\n`;
      bodyText += `Description:\n${description}\n\n`;

      if (includeDiagnostics && diagnosticReport) {
        bodyText += '---\nDiagnostic Report:\n\n';
        bodyText += formatDiagnosticReport(diagnosticReport);
      }

      const body = encodeURIComponent(bodyText);

      window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
      setMessage({ type: 'success', text: 'Email client opened. Please send the email to complete your report.' });
      log.info('Mailto link opened for support request', { issueType, includeDiagnostics });
    } catch (error) {
      log.error('Failed to open email client', { error });
      setMessage({ type: 'error', text: 'Failed to open email client. Please copy the diagnostic report manually.' });
    }
  };

  const handleCopyDiagnosticReport = async () => {
    if (!diagnosticReport) {
      setMessage({ type: 'error', text: 'No diagnostic report available' });
      return;
    }

    try {
      await copyDiagnosticReportToClipboard(diagnosticReport);
      setMessage({ type: 'success', text: 'Diagnostic report copied to clipboard' });
    } catch (error) {
      log.error('Failed to copy diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const handleDownloadDiagnosticReport = () => {
    if (!diagnosticReport) {
      setMessage({ type: 'error', text: 'No diagnostic report available' });
      return;
    }

    try {
      downloadDiagnosticReport(diagnosticReport);
      setMessage({ type: 'success', text: 'Diagnostic report downloaded' });
    } catch (error) {
      log.error('Failed to download diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to download report' });
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Reset state when modal closes, set initial tab when it opens
  useEffect(() => {
    if (!isOpen) {
      setMessage(null);
      setDescription('');
      setIssueType('bug');
      setIncludeDiagnostics(true);
      setExpandedFaq(null);
    } else {
      // Set the active tab to initialTab when modal opens
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="帮助与支持" maxWidth="2xl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'report'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>反馈问题</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'help'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>获取帮助</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'docs'
              ? 'text-accent-blue border-b-2 border-accent-blue'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            <span>文档与说明</span>
          </div>
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
              : message.type === 'error'
              ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
              : 'bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark border border-status-info-border dark:border-status-info-border-dark'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            遇到使用困扰或异常状况？您可以将诊断日志发送给我们，以便我们快速排查与解决。
          </p>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              问题类型
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="bug">缺陷报错 (Bug Report)</option>
              <option value="feature">功能建议 (Feature Request)</option>
              <option value="performance">运行卡顿/性能 (Performance)</option>
              <option value="data-loss">数据丢失或损坏 (Data Loss/Corruption)</option>
              <option value="ui-feedback">界面与交互体验反馈 (UI/UX Feedback)</option>
              <option value="other">其他问题 (Other)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              问题描述 <span className="text-status-error">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述您遇到的问题现象、复现步骤或改进建议..."
              rows={6}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {/* Include Diagnostic Report */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="include-diagnostics"
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark"
            />
            <div className="flex-1">
              <label htmlFor="include-diagnostics" className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer">
                附带系统诊断报告（强烈推荐）
              </label>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                包含环境架构、本地存储用量与异常日志，有助于快速定位根因。绝不收集个人隐私数据。
              </p>
            </div>
          </div>

          {/* Diagnostic Preview */}
          {includeDiagnostics && diagnosticReport && (
            <div>
              <button
                onClick={() => setShowDiagnosticPreview(!showDiagnosticPreview)}
                className="flex items-center gap-2 text-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
              >
                {showDiagnosticPreview ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>预览系统诊断报告</span>
              </button>

              {showDiagnosticPreview && (
                <div className="mt-2 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
                  <pre className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap overflow-auto max-h-64">
                    {formatDiagnosticReport(diagnosticReport)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={handleSendEmail}
              disabled={isGeneratingReport}
              className="flex-1 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>唤起邮件客户端发送</span>
              </div>
            </button>

            <button
              onClick={handleCopyDiagnosticReport}
              disabled={!diagnosticReport || isGeneratingReport}
              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="复制诊断报告到剪贴板"
              aria-label="复制诊断报告到剪贴板"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadDiagnosticReport}
              disabled={!diagnosticReport || isGeneratingReport}
              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="下载诊断报告文件"
              aria-label="下载诊断报告文件"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <KeyboardShortcutsSection />

          {/* FAQs */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              常见问题解答 (FAQ)
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-left flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary shrink-0" />
                    )}
                  </button>

                  {expandedFaq === index && (
                    <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Build Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              版本与构建信息
            </h3>
            <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">当前版本构建：</span>
                  <span className="font-mono text-text-light-primary dark:text-text-dark-primary">{BUILD_HASH}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">构建生成时间：</span>
                  <span className="text-text-light-primary dark:text-text-dark-primary">{formatBuildTimestamp()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              参考与外部文档
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/travisjneuman/neumanos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  GitHub 开源代码仓库
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>

              <a
                href="https://github.com/travisjneuman/neumanos/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  用户指南与说明 (README)
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>

              <a
                href="https://github.com/travisjneuman/neumanos/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Issue 反馈追踪器
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Privacy & License */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              隐私宗旨与开源协议
            </h3>
            <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                    隐私政策
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    所有数据完整存储于您的浏览器本地。无任何遥测注入、无隐私收集追踪、无第三方违规服务。
                  </p>
                </div>
                <div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                    软件许可证
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    MIT 许可证 - 自由、开放、透明的开源软件
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
