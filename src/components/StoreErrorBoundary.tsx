/**
 * Store Error Boundary
 *
 * Catches errors during render that originate from store data issues.
 * Shows recovery UI instead of blank screen.
 *
 * Usage:
 * <StoreErrorBoundary storeName="calendar">
 *   <TimeTracking />
 * </StoreErrorBoundary>
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '../services/logger';

const log = logger.module('StoreErrorBoundary');

const STORE_LABELS: Record<string, string> = {
  calendar: '日历',
  kanban: '看板',
  notes: '笔记',
  timetracking: '工时追踪',
  diagrams: '流程图',
  forms: '表单',
  automation: '自动化',
  docs: '文档',
};

interface Props {
  children: ReactNode;
  storeName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class StoreErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    log.error(`Store error in ${this.props.storeName}`, {
      error: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });

    this.setState({ errorInfo });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleClearData = async (): Promise<void> => {
    const { storeName } = this.props;

    // Clear the specific store's data from IndexedDB
    try {
      const { indexedDBService } = await import('../services/indexedDB');

      // Map store names to their IndexedDB keys
      const storeKeyMap: Record<string, string[]> = {
        calendar: ['calendar-events'],
        kanban: ['kanban-tasks'],
        notes: ['notes', 'notes-folders'],
        timetracking: ['time-tracking-entries', 'time-tracking-projects'],
      };

      const keys = storeKeyMap[storeName] || [];
      for (const key of keys) {
        await indexedDBService.removeItem(key);
      }

      log.info(`Cleared ${storeName} data from IndexedDB`);

      // Force page reload to reinitialize stores
      window.location.reload();
    } catch (err) {
      log.error('Failed to clear store data', { error: err });
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, storeName, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    const storeLabel = STORE_LABELS[storeName] || storeName;

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-6xl mb-4">
          {storeName === 'calendar' && '📅'}
          {storeName === 'kanban' && '📋'}
          {storeName === 'notes' && '📝'}
          {!['calendar', 'kanban', 'notes'].includes(storeName) && '⚠️'}
        </div>

        <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          加载{storeLabel}时出现问题
        </h2>

        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6 max-w-md text-center">
          这通常是在导入损坏的数据后发生。您的其他模块数据均安全无虞。
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={this.handleRetry}
            className="px-4 py-2.5 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button font-medium transition-all duration-standard ease-smooth"
          >
            重试
          </button>

          <button
            onClick={this.handleClearData}
            className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button font-medium transition-all duration-standard ease-smooth border border-border-light dark:border-border-dark"
          >
            清空{storeLabel}数据
          </button>

          <a
            href="/settings"
            className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-button font-medium transition-all duration-standard ease-smooth border border-border-light dark:border-border-dark inline-flex items-center"
          >
            从备份恢复
          </a>
        </div>

        <details className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary max-w-lg">
          <summary className="cursor-pointer hover:text-text-light-secondary dark:hover:text-text-dark-secondary">
            技术细节
          </summary>
          <pre className="mt-2 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg overflow-auto text-xs max-h-32">
            {error?.message || '未知错误'}
            {'\n\n'}
            {error?.stack?.slice(0, 300)}
          </pre>
        </details>
      </div>
    );
  }
}
