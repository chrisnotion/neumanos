/**
 * Clipboard History Widget
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { BaseWidget } from './BaseWidget';

export const ClipboardWidget: React.FC = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (typeof index === 'number') {
        setCopiedIndex(index);
        setTimeout(() => {
          setCopiedIndex(prev => (prev === index ? null : prev));
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && !history.includes(text)) {
        setHistory([text, ...history.slice(0, 9)]);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <BaseWidget title="剪贴板速记" icon="📋">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={pasteFromClipboard} className="flex-1 px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth">
            保存剪贴板内容
          </button>
          <button onClick={clearHistory} className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark hover:bg-surface-light dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-button text-sm font-medium transition-all duration-standard ease-smooth">
            清空
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {history.map((item, idx) => (
            <div
              key={idx}
              onClick={() => copyToClipboard(item, idx)}
              className="group flex items-center justify-between gap-2 p-2 bg-surface-light-elevated dark:bg-surface-dark rounded-button hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth cursor-pointer"
            >
              <p className="flex-1 text-sm text-text-light-primary dark:text-text-dark-primary line-clamp-2">
                {item}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item, idx);
                }}
                className={`px-2 py-1 rounded flex items-center gap-1 text-xs shrink-0 transition-all ${
                  copiedIndex === idx
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue hover:bg-accent-blue/10'
                }`}
                title={copiedIndex === idx ? '已复制' : '一键复制'}
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-500">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">复制</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {history.length === 0 && (
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center py-4">
            点击“保存剪贴板内容”将复制的文字存入历史
          </p>
        )}
      </div>
    </BaseWidget>
  );
};
