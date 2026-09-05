/**
 * Accent Color Customization Section
 *
 * Allows custom accent color selection with preset themes
 * and a color picker for fine-grained control.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

const ACCENT_STORAGE_KEY = 'custom-accent-color';

interface AccentPreset {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
}

const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'default-blue',
    name: '经典晴蓝',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#8b5cf6',
    secondaryHover: '#7c3aed',
  },
  {
    id: 'forest-green',
    name: '森林碧翠',
    primary: '#22c55e',
    primaryHover: '#16a34a',
    secondary: '#14b8a6',
    secondaryHover: '#0d9488',
  },
  {
    id: 'sunset-orange',
    name: '落日晚霞',
    primary: '#f97316',
    primaryHover: '#ea580c',
    secondary: '#f59e0b',
    secondaryHover: '#d97706',
  },
  {
    id: 'royal-purple',
    name: '星夜魅紫',
    primary: '#a855f7',
    primaryHover: '#9333ea',
    secondary: '#ec4899',
    secondaryHover: '#db2777',
  },
  {
    id: 'ruby-red',
    name: '瑰丽朱红',
    primary: '#ef4444',
    primaryHover: '#dc2626',
    secondary: '#f97316',
    secondaryHover: '#ea580c',
  },
];

/**
 * Derive a hover color by darkening the base color by ~15%
 */
function deriveHoverColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const darken = (v: number) => Math.max(0, Math.round(v * 0.85));

  const dr = darken(r).toString(16).padStart(2, '0');
  const dg = darken(g).toString(16).padStart(2, '0');
  const db = darken(b).toString(16).padStart(2, '0');

  return `#${dr}${dg}${db}`;
}

/**
 * Inject custom accent CSS variables
 */
function injectAccentVariables(primary: string, primaryHover: string, secondary: string, secondaryHover: string): void {
  const styleId = 'neumanos-custom-accent';
  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `:root {
  --accent-primary: ${primary};
  --accent-primary-hover: ${primaryHover};
  --accent-secondary: ${secondary};
  --accent-secondary-hover: ${secondaryHover};
}`;
}

/**
 * Remove custom accent overrides
 */
function clearAccentVariables(): void {
  const style = document.getElementById('neumanos-custom-accent');
  if (style) style.remove();
}

interface StoredAccent {
  presetId: string | null;
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
}

export const AccentColorSection: React.FC = () => {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [isCustom, setIsCustom] = useState(false);

  // Load saved accent on mount
  useEffect(() => {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: StoredAccent = JSON.parse(saved);
        if (parsed.presetId) {
          setActivePresetId(parsed.presetId);
          setIsCustom(false);
        } else {
          setCustomColor(parsed.primary);
          setIsCustom(true);
        }
        injectAccentVariables(parsed.primary, parsed.primaryHover, parsed.secondary, parsed.secondaryHover);
      } catch {
        // invalid stored data
      }
    }
  }, []);

  const applyPreset = useCallback((preset: AccentPreset) => {
    setActivePresetId(preset.id);
    setIsCustom(false);
    injectAccentVariables(preset.primary, preset.primaryHover, preset.secondary, preset.secondaryHover);
    localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({
      presetId: preset.id,
      primary: preset.primary,
      primaryHover: preset.primaryHover,
      secondary: preset.secondary,
      secondaryHover: preset.secondaryHover,
    }));
  }, []);

  const applyCustomColor = useCallback((color: string) => {
    const hover = deriveHoverColor(color);
    setCustomColor(color);
    setIsCustom(true);
    setActivePresetId(null);
    injectAccentVariables(color, hover, color, hover);
    localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({
      presetId: null,
      primary: color,
      primaryHover: hover,
      secondary: color,
      secondaryHover: hover,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setActivePresetId(null);
    setIsCustom(false);
    setCustomColor('#3b82f6');
    clearAccentVariables();
    localStorage.removeItem(ACCENT_STORAGE_KEY);
  }, []);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          强调主题色
        </h2>
        {(activePresetId || isCustom) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            恢复主题默认
          </button>
        )}
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        覆盖当前主题内置的强调高亮色彩
      </p>

      {/* Preset Colors */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
          精选预设配色
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id && !isCustom;
            return (
              <motion.button
                key={preset.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => applyPreset(preset)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'ring-2 ring-accent-primary bg-accent-primary/5'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                <div className="flex gap-1 flex-shrink-0">
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  isActive
                    ? 'text-accent-primary'
                    : 'text-text-light-primary dark:text-text-dark-primary'
                }`}>
                  {preset.name}
                </span>
                {isActive && (
                  <span className="ml-auto text-accent-primary text-sm">&#10003;</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
          自由拾色
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={(e) => applyCustomColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border-light dark:border-border-dark"
              title="拾取自定义强调色"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                  applyCustomColor(val);
                }
                setCustomColor(val);
              }}
              placeholder="#3b82f6"
              className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
          {/* Live Preview */}
          <div className="flex-shrink-0">
            <div
              className="w-20 h-10 rounded-lg flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: customColor }}
            >
              实时预览
            </div>
          </div>
        </div>
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-2">
          输入十六进制颜色代码或通过拾色器选色，所见即所得，实时生效。
        </p>
      </div>
    </div>
  );
};
