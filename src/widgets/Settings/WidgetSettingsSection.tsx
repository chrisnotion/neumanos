import React from 'react';
import { useWidgetStore } from '../../stores/useWidgetStore';

/**
 * Widget Settings Section
 * Provides centralized configuration for all widget-specific settings.
 * Changes here sync bidirectionally with widget inline settings.
 */

const REDDIT_SUBREDDITS = [
  'programming',
  'webdev',
  'javascript',
  'typescript',
  'react',
  'python',
  'tech',
  'sysadmin',
  'devops',
  'coding',
  'learnprogramming',
  'gamedev',
  'rust',
  'golang',
  'csharp',
];

export const WidgetSettingsSection: React.FC = () => {
  const widgetSettings = useWidgetStore((s) => s.widgetSettings);
  const updateWidgetSettings = useWidgetStore((s) => s.updateWidgetSettings);

  // GitHub settings
  const githubUsername = widgetSettings.github?.username || '';

  // Pomodoro settings
  const pomodoroDuration = widgetSettings.pomodoro?.duration || 25;

  // Crypto settings
  const cryptoRefreshRate = widgetSettings.crypto?.refreshRate || 1;

  // Reddit settings
  const redditSubreddit = widgetSettings.reddit?.subreddit || 'programming';

  // Unsplash settings
  const unsplashCategory = widgetSettings.unsplash?.category || 'nature';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
          小组件专属设置
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
          配置各类小组件的专属运行参数。此处修改会自动与控制台小组件实时双向同步。
        </p>
      </div>

      {/* GitHub Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          GitHub 小组件
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              GitHub 用户名 <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => updateWidgetSettings('github', { username: e.target.value })}
              placeholder="输入你的 GitHub 用户名"
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              用于在 GitHub 小组件中展示个人主页及开源统计
            </p>
          </div>
        </div>
      </div>

      {/* Pomodoro Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          番茄钟小组件
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              单次专注时长（分钟）
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={pomodoroDuration}
                onChange={(e) => updateWidgetSettings('pomodoro', { duration: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary w-12 text-right">
                {pomodoroDuration} 分钟
              </span>
            </div>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              标准番茄钟为 25 分钟，可按个人工作节奏自适应调节。
            </p>
          </div>
        </div>
      </div>

      {/* Crypto Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          加密货币行情小组件
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              数据刷新频率
            </label>
            <select
              value={cryptoRefreshRate}
              onChange={(e) => updateWidgetSettings('crypto', { refreshRate: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value={1}>1 分钟 (近实时)</option>
              <option value={5}>5 分钟</option>
              <option value={15}>15 分钟</option>
              <option value={30}>30 分钟</option>
              <option value={60}>1 小时</option>
            </select>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              刷新频率越高会消耗更多本地网络请求
            </p>
          </div>
        </div>
      </div>

      {/* Reddit Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Reddit 动态小组件
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              默认关注板块
            </label>
            <select
              value={redditSubreddit}
              onChange={(e) => updateWidgetSettings('reddit', { subreddit: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              {REDDIT_SUBREDDITS.map((sub) => (
                <option key={sub} value={sub}>
                  r/{sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Unsplash Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Unsplash 每日灵感美图
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              图片分类题材
            </label>
            <select
              value={unsplashCategory}
              onChange={(e) => updateWidgetSettings('unsplash', { category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="nature">自然风光 (Nature)</option>
              <option value="architecture">现代建筑 (Architecture)</option>
              <option value="technology">未来科技 (Technology)</option>
              <option value="travel">远方旅行 (Travel)</option>
              <option value="minimal">极简纯净 (Minimal)</option>
              <option value="abstract">抽象艺术 (Abstract)</option>
              <option value="space">深邃太空 (Space)</option>
              <option value="ocean">浩瀚海洋 (Ocean)</option>
              <option value="forest">宁静森林 (Forest)</option>
              <option value="city">都市夜景 (City)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info about other widget settings */}
      <div className="bg-status-info/10 border border-status-info/20 rounded-lg p-4">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <strong>提示：</strong> 部分组件（如 YouTube 频道、Twitch 主播、倒计时事件列表、标签管理器等）支持直接在控制台组件卡片右上角的齿轮菜单中配置。
        </p>
      </div>
    </div>
  );
};
