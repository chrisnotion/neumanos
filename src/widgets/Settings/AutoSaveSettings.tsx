/**
 * Auto-Save Settings Component
 *
 * Configures auto-save to local file system:
 * - Directory selection (File System Access API)
 * - Filename customization
 * - Version count
 * - Manual save trigger
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  isFileSystemAccessSupported,
  requestAutoSaveDirectory,
  autoSave,
  getDirectoryHandle,
  formatFileSize,
} from '../../services/brainBackup';
import {
  loadPreferences,
  savePreferences,
  addHistoryEntry,
  type BackupPreferences,
} from '../../services/backupPreferences';
import { autoSaveManager } from '../../services/autoSave';
import { logger } from '../../services/logger';

const log = logger.module('AutoSaveSettings');

interface AutoSaveSettingsProps {
  onMessage: (message: { type: 'success' | 'error' | 'info' | 'warning'; text: string } | null) => void;
  onRefresh: () => void;
}

export const AutoSaveSettings: React.FC<AutoSaveSettingsProps> = ({
  onMessage,
  onRefresh,
}) => {
  const [preferences, setPreferences] = useState<BackupPreferences | null>(null);
  const [autoSaveDirectory, setAutoSaveDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const [versionCount, setVersionCount] = useState(7);
  const [recentlySaved, setRecentlySaved] = useState<'autoSave' | null>(null);

  const loadData = useCallback(async () => {
    const prefs = await loadPreferences();
    setPreferences(prefs);

    // Initialize customization state
    const filename = prefs.customFilename || 'NeumanOS';
    const nameWithoutExt = filename.replace(/\.brain$/i, '');
    setCustomFilename(nameWithoutExt);
    setVersionCount(prefs.versionCount || 7);

    // Restore saved directory handle
    if (prefs.autoSaveEnabled) {
      try {
        const savedHandle = await getDirectoryHandle();
        if (savedHandle) {
          setAutoSaveDirectory(savedHandle);
        }
      } catch (error) {
        log.warn('Could not restore auto-save directory handle', { error });
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Restore directory handle on mount
  useEffect(() => {
    const restoreDirectoryHandle = async () => {
      try {
        const savedHandle = await getDirectoryHandle();
        if (savedHandle) {
          setAutoSaveDirectory(savedHandle);
        }
      } catch (error) {
        console.error('Failed to restore directory handle:', error);
      }
    };
    restoreDirectoryHandle();
  }, []);

  const handleSetupAutoSave = async () => {
    try {
      const dirHandle = await requestAutoSaveDirectory();
      setAutoSaveDirectory(dirHandle);

      // Enable auto-save with directory handle
      await autoSaveManager.enableLocal(dirHandle);

      await loadData();
      onRefresh();
      onMessage({ type: 'success', text: '自动备份已开启！您的数据将自动同步保存至指定本地目录。' });
    } catch (error) {
      onMessage({ type: 'error', text: `${error}` });
    }
  };

  const handleAutoSaveNow = async () => {
    if (!autoSaveDirectory) {
      onMessage({ type: 'error', text: '请先配置自动备份目标目录' });
      return;
    }

    try {
      onMessage({ type: 'info', text: '正在备份保存...' });
      const result = await autoSave(autoSaveDirectory);

      await addHistoryEntry({
        filename: result.filename,
        size: result.size,
        compressed: result.compressed,
        type: 'auto',
        destination: 'local',
        status: 'success',
      });

      await loadData();
      onRefresh();
      onMessage({ type: 'success', text: `自动备份成功：${result.filename}（${formatFileSize(result.size)}）` });
    } catch (error) {
      onMessage({ type: 'error', text: `自动备份失败：${error}` });
    }
  };

  const toggleAutoSave = async () => {
    if (!preferences) return;

    if (preferences.autoSaveEnabled) {
      // Disable auto-save
      await autoSaveManager.disableLocal();
      setAutoSaveDirectory(null);
      await loadData();
      onRefresh();
      onMessage({ type: 'info', text: '自动备份已停用' });

      setRecentlySaved('autoSave');
      setTimeout(() => setRecentlySaved(null), 2000);
    } else {
      // Enable auto-save - request directory
      await handleSetupAutoSave();
    }
  };

  const handleSaveCustomization = async () => {
    if (!preferences) return;

    if (!customFilename.trim()) {
      onMessage({ type: 'error', text: '备份文件名不能为空' });
      return;
    }

    if (versionCount < 1 || versionCount > 100) {
      onMessage({ type: 'error', text: '保留版本数量必须在 1 到 100 之间' });
      return;
    }

    try {
      const filenameWithExtension = `${customFilename.trim()}.brain`;

      await savePreferences({
        customFilename: filenameWithExtension,
        versionCount: versionCount,
      });

      await loadData();
      onRefresh();
      onMessage({ type: 'success', text: '自动备份参数已更新！' });
    } catch (error) {
      onMessage({ type: 'error', text: `保存配置失败：${error}` });
    }
  };

  if (!preferences) {
    return null;
  }

  return (
    <>
      {/* Simple Auto-Save Card (for File System Access API browsers) */}
      {isFileSystemAccessSupported() && (
        <div className="bento-card p-6">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
            本地自动保存
          </h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            有修改时自动将完整备份文件同步写入您电脑上的指定文件夹
          </p>

          {!autoSaveDirectory ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSetupAutoSave}
              className="w-full p-4 rounded-lg bg-surface-dark dark:bg-surface-dark-elevated text-white hover:bg-border-dark dark:hover:bg-border-dark transition-colors"
            >
              📁 选择自动备份存储目录
            </motion.button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent-green">
                <span>✅</span>
                <span>自动备份目录已就绪</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAutoSaveNow}
                className="w-full p-4 rounded-lg bg-accent-green text-white hover:bg-accent-green-hover transition-colors"
              >
                💾 立即保存备份
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Detailed Auto-Save Configuration */}
      <div className="bento-card p-6">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
          文件自动同步参数
        </h2>

        {!isFileSystemAccessSupported() ? (
          <div className="p-4 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg">
            <p className="text-sm text-accent-yellow">
              <strong>⚠️ 当前浏览器不支持此特性（{navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : '当前浏览器'}）</strong>
              <br />
              直接写入本地文件功能依赖现代 Chromium 内核浏览器（如 Chrome、Edge、Brave、Arc、Opera 等）。
              <br />
              请放心，您的全量数据依然安全持久化存储于 IndexedDB 本地数据库中。您可随时通过手动导出来备份数据。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <label className="flex items-center justify-between p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg cursor-pointer hover:bg-border-light dark:hover:bg-border-dark transition-colors">
              <div>
                <p className="font-medium text-text-light-primary dark:text-text-dark-primary">开启自动同步备份</p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {preferences.autoSaveEnabled
                    ? '已开启：工作台数据变动时将自动静默同步至本地选定目录'
                    : '在数据更新时自动将全量快照保存至您指定的本地文件夹'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {recentlySaved === 'autoSave' && (
                  <span className="text-sm font-medium text-accent-green animate-fade-in">
                    ✓ 已保存
                  </span>
                )}
                <input
                  type="checkbox"
                  checked={preferences.autoSaveEnabled}
                  onChange={toggleAutoSave}
                  className="w-6 h-6 rounded"
                />
              </div>
            </label>

            {/* Auto-Save Status */}
            {preferences.autoSaveEnabled && (
              <div className="p-4 bg-accent-green/10 border border-accent-green/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="font-semibold text-accent-green mb-1">
                      自动同步备份正常运行中
                    </p>
                    <p className="text-sm text-accent-green">
                      无论何时增删改查，数据都会静默自动备份至您选定的本地目录。
                      {preferences.lastAutoSave && (
                        <>
                          <br />
                          <strong>上次备份时间：</strong> {new Date(preferences.lastAutoSave).toLocaleString()}
                        </>
                      )}
                    </p>
                    {preferences.customFilename && (
                      <p className="text-sm text-accent-green mt-2">
                        <strong>文件名模板：</strong> {preferences.customFilename}
                        <br />
                        <strong>历史版本上限：</strong> {preferences.versionCount || 7} 个
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customization Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                自定义备份参数
              </h3>

              {/* Filename Input */}
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  备份文件命名
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="MyBackup"
                    className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                  />
                  <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">.brain</span>
                </div>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  输入文件名主体（如 "NeumanOS"、"工作台备份"）。系统会自动附加 .brain 扩展名。
                </p>
              </div>

              {/* Version Count Input */}
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  保留历史版本数量
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={versionCount}
                  onChange={(e) => setVersionCount(parseInt(e.target.value) || 7)}
                  className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  在隐藏备份目录中轮转保留的历史版本上限（1 - 100）
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveCustomization}
                className="w-full px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
              >
                💾 保存备份偏好
              </button>
            </div>

            {/* Manual Save Now Button */}
            {preferences.autoSaveEnabled && (
              <button
                onClick={handleAutoSaveNow}
                className="w-full px-4 py-3 bg-accent-secondary hover:bg-accent-secondary-hover text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
              >
                💾 立即手动触发备份
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
