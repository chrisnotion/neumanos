/**
 * Dashboard Widget Registry
 *
 * Central registry of all available widgets with metadata, API configuration,
 * and lazy-loaded component references.
 *
 * Adding a new widget:
 * 1. Create the widget component in src/widgets/Dashboard/
 * 2. Add an entry to WIDGET_REGISTRY below
 * 3. That's it! The widget will be available in the Widget Manager
 */

import { lazy, type LazyExoticComponent, type FC } from 'react';
import type { CustomWidgetConfig } from '../../stores/useWidgetStore';

export type WidgetCategory = 'core' | 'productivity' | 'news' | 'fun' | 'finance' | 'visual' | 'dev' | 'utility' | 'custom';

// Props interface for widget components
export interface WidgetComponentProps {
  widgetId?: string;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji icon
  category: WidgetCategory;
  apiUrl?: string;
  apiKey?: string; // 'DEMO_KEY' for APIs that need keys but offer demo access
  requiresAuth?: boolean; // If user needs to provide API key/username
  defaultEnabled: boolean;
  // Lazy-loaded component (automatically generated from id)
  component?: LazyExoticComponent<FC<WidgetComponentProps>>;
}

/**
 * Maps widget ID to its file name in the Dashboard folder
 * Uses convention: widget ID -> PascalCase + "Widget"
 * e.g., "hackernews" -> "HackerNewsWidget"
 */
const WIDGET_FILE_NAMES: Record<string, string> = {
  myday: 'MyDayWidget',
  taskssummary: 'TasksSummaryWidget',
  tasksquickadd: 'TasksQuickAddWidget',
  upcomingevents: 'UpcomingEventsWidget',
  recentnotes: 'RecentNotesWidget',
  quote: 'QuoteWidget',
  crypto: 'CryptoWidget',
  hackernews: 'HackerNewsWidget',
  facts: 'FactsWidget',
  github: 'GitHubWidget',
  joke: 'JokeWidget',
  unsplash: 'UnsplashWidget',
  pomodoro: 'PomodoroWidget',
  reddit: 'RedditWidget',
  devto: 'DevToWidget',
  wordofday: 'WordOfDayWidget',
  currency: 'CurrencyWidget',
  worldclock: 'WorldClockWidget',
  ipinfo: 'IPInfoWidget',
  qrcode: 'QRCodeWidget',
  colorpalette: 'ColorPaletteWidget',
  weathermap: 'WeatherMapWidget',
  calculator: 'CalculatorWidget',
  unitconverter: 'UnitConverterWidget',
  countdown: 'CountdownWidget',
  shortcuts: 'ShortcutsWidget',
  stockmarket: 'StockMarketWidget',
  wikipedia: 'WikipediaWidget',
  bored: 'BoredWidget',
  dictionary: 'DictionaryWidget',
  ainews: 'AINewsWidget',
  airquality: 'AirQualityWidget',
  packagestats: 'PackageStatsWidget',
  pixelart: 'PixelArtWidget',
  typingtest: 'TypingTestWidget',
  memorygame: 'MemoryGameWidget',
  motivational: 'MotivationalWidget',
  githubtrending: 'GitHubTrendingWidget',
  awesomelists: 'AwesomeListsWidget',
  repostats: 'RepoStatsWidget',
  sports: 'SportsWidget',
  twitch: 'TwitchWidget',
  youtube: 'YouTubeWidget',
  analytics: 'AnalyticsWidget',
  clipboard: 'ClipboardWidget',
  tabmanager: 'TabManagerWidget',
  uptime: 'UptimeWidget',
  forms: 'FormWidget',
  habitsummary: 'HabitSummaryWidget',
  bookmarks: 'BookmarksWidget',
  activityfeed: 'ActivityFeedWidget',
  aibriefing: 'AIBriefingWidget',
  flashcard: 'FlashcardWidget',
  dailyquests: 'DailyQuestsWidget',
  energytracker: 'EnergyTrackerWidget',
  portfolio: 'PortfolioWidget',
  weeklyinsights: 'WeeklyInsightsWidget',
  weatherforecast: 'WeatherForecastWidget',
  quickadd: 'QuickAddWidget',
  productivitykarma: 'ProductivityKarmaWidget',
};

/**
 * Creates a lazy-loaded component for a widget
 * Uses Vite's glob import for reliable dynamic loading in production
 *
 * Note: We use import.meta.glob to pre-discover all widget modules at build time.
 * This avoids the "variable imports cannot import their own directory" warning
 * and ensures proper chunk generation in production.
 */

// Pre-discover all widget modules using Vite's glob import
// This creates a map of module path -> lazy import function
const widgetModules = import.meta.glob<{ [key: string]: FC<WidgetComponentProps> }>(
  './*Widget.tsx'
);

function createLazyWidget(widgetId: string): LazyExoticComponent<FC<WidgetComponentProps>> | undefined {
  const fileName = WIDGET_FILE_NAMES[widgetId];
  if (!fileName) return undefined;

  const modulePath = `./${fileName}.tsx`;
  const moduleLoader = widgetModules[modulePath];

  if (!moduleLoader) {
    return undefined;
  }

  // Dynamic import with named export
  return lazy(() =>
    moduleLoader().then((m) => ({
      default: m[fileName] as FC<WidgetComponentProps>,
    }))
  );
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  // Core App Widgets (always useful, enabled by default)
  myday: {
    id: 'myday',
    name: '今日全景',
    description: '聚合呈现今日待办任务与日程活动',
    icon: '☀️',
    category: 'core',
    defaultEnabled: true,
  },

  taskssummary: {
    id: 'taskssummary',
    name: '任务概览',
    description: '待办任务数量统计与状态进度概览',
    icon: '📊',
    category: 'core',
    defaultEnabled: true,
  },

  tasksquickadd: {
    id: 'tasksquickadd',
    name: '极速新建任务',
    description: '无需切换页面，快速添加任务至看板',
    icon: '➕',
    category: 'core',
    defaultEnabled: true,
  },

  upcomingevents: {
    id: 'upcomingevents',
    name: '近期日程',
    description: '即将到来的日历活动与事件提醒',
    icon: '📅',
    category: 'core',
    defaultEnabled: true,
  },

  recentnotes: {
    id: 'recentnotes',
    name: '近期笔记',
    description: '快速访问最近编辑或更新的灵感笔记',
    icon: '📝',
    category: 'core',
    defaultEnabled: true,
  },

  habitsummary: {
    id: 'habitsummary',
    name: '习惯追踪',
    description: '记录日常习惯打卡状态与连续达标天数',
    icon: '🎯',
    category: 'core',
    defaultEnabled: true,
  },

  quote: {
    id: 'quote',
    name: '每日格言',
    description: '启迪思维、唤醒动力的每日励志金句',
    icon: '💭',
    category: 'productivity',
    apiUrl: 'https://api.quotable.io/random',
    defaultEnabled: true,
  },


  crypto: {
    id: 'crypto',
    name: '加密货币行情',
    description: '实时追踪 BTC、ETH、SOL 等币种行情与 24h 涨跌幅',
    icon: '₿',
    category: 'finance',
    apiUrl: 'https://api.coingecko.com/api/v3/simple/price',
    defaultEnabled: true,
  },

  hackernews: {
    id: 'hackernews',
    name: 'Hacker News 动态',
    description: '精选来自 Hacker News 的热门极客科技资讯',
    icon: '📰',
    category: 'news',
    apiUrl: 'https://hacker-news.firebaseio.com/v0',
    defaultEnabled: true,
  },

  facts: {
    id: 'facts',
    name: '趣味冷知识',
    description: '发现令人耳目一新的趣味科普与生活百科',
    icon: '🧠',
    category: 'fun',
    apiUrl: 'https://uselessfacts.jsph.pl/random.json',
    defaultEnabled: false,
  },

  github: {
    id: 'github',
    name: 'GitHub 动态看板',
    description: '个人代码贡献热力图与关注的趋势仓库动态',
    icon: '🐙',
    category: 'dev',
    apiUrl: 'https://api.github.com',
    requiresAuth: true, // Needs username in settings
    defaultEnabled: false,
  },

  joke: {
    id: 'joke',
    name: '极客幽默',
    description: '程序员专属趣味笑话与代码梗，工作之余会心一笑',
    icon: '😄',
    category: 'fun',
    apiUrl: 'https://v2.jokeapi.dev/joke/Programming',
    defaultEnabled: false,
  },

  unsplash: {
    id: 'unsplash',
    name: '每日精选壁纸',
    description: '来自 Unsplash 社区的高清艺术摄影与自然风光',
    icon: '📸',
    category: 'visual',
    apiUrl: 'https://source.unsplash.com/random',
    defaultEnabled: false,
  },

  pomodoro: {
    id: 'pomodoro',
    name: '番茄时钟',
    description: '基于经典番茄工作法的沉浸式专注与间歇休息计时',
    icon: '⏱️',
    category: 'productivity',
    defaultEnabled: false,
  },

  // News & Info Widgets
  reddit: {
    id: 'reddit',
    name: 'Reddit 热门热帖',
    description: '聚焦编程与开发者社区的即时热门技术讨论',
    icon: '📰',
    category: 'news',
    apiUrl: 'https://www.reddit.com/r/programming/hot.json',
    defaultEnabled: false,
  },

  devto: {
    id: 'devto',
    name: 'Dev.to 精选技术文章',
    description: '来自全球前沿开发者社区的高质量技术博文精选',
    icon: '📝',
    category: 'news',
    apiUrl: 'https://dev.to/api/articles',
    defaultEnabled: false,
  },

  // Productivity Widgets
  wordofday: {
    id: 'wordofday',
    name: '每日一词',
    description: '每日拓展词汇储备与例句解析',
    icon: '📖',
    category: 'productivity',
    apiUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    defaultEnabled: false,
  },

  currency: {
    id: 'currency',
    name: '全球汇率换算',
    description: '主要国家与地区货币的实时汇率换算与走势',
    icon: '💱',
    category: 'productivity',
    apiUrl: 'https://api.exchangerate-api.com/v4/latest/USD',
    defaultEnabled: false,
  },

  worldclock: {
    id: 'worldclock',
    name: '全球时区时钟',
    description: '跨时区团队协作利器，一览全球主要城市即时时间',
    icon: '🌍',
    category: 'productivity',
    defaultEnabled: false,
  },

  // Utility Widgets
  ipinfo: {
    id: 'ipinfo',
    name: 'IP 归属地查询',
    description: '查看当前网络公网 IP 地址与地理定位信息',
    icon: '🌐',
    category: 'utility',
    apiUrl: 'https://ipapi.co/json/',
    defaultEnabled: false,
  },

  qrcode: {
    id: 'qrcode',
    name: '二维码生成器',
    description: '快速将任意文本或网址链接生成可扫描二维码',
    icon: '📱',
    category: 'utility',
    defaultEnabled: false,
  },

  colorpalette: {
    id: 'colorpalette',
    name: '灵感调色盘',
    description: '随机生成和谐美观的设计配色方案与色值',
    icon: '🎨',
    category: 'utility',
    defaultEnabled: false,
  },

  // Visual Widgets
  weathermap: {
    id: 'weathermap',
    name: '气象雷达与天气',
    description: '交互式气象卫星图、即时天气状况与 5 日逐日天气预报',
    icon: '🗺️',
    category: 'visual',
    apiUrl: 'https://api.open-meteo.com/v1/forecast',
    defaultEnabled: true,
  },

  // Utility Widgets (New)
  calculator: {
    id: 'calculator',
    name: '科学计算器',
    description: '支持基础四则运算与数值记忆存储的轻便计算器',
    icon: '🔢',
    category: 'utility',
    defaultEnabled: false,
  },

  unitconverter: {
    id: 'unitconverter',
    name: '单位换算器',
    description: '支持温度、长度、面积与重量等常用物理单位快速换算',
    icon: '📏',
    category: 'utility',
    defaultEnabled: false,
  },

  countdown: {
    id: 'countdown',
    name: '倒计时纪念日',
    description: '追踪距离重要里程碑、考试或发版日期的倒计时',
    icon: '⏳',
    category: 'productivity',
    defaultEnabled: false,
  },

  shortcuts: {
    id: 'shortcuts',
    name: '快捷键速查表',
    description: '随时查阅平台核心功能操作的高效快捷键',
    icon: '⌨️',
    category: 'utility',
    defaultEnabled: false,
  },

  stockmarket: {
    id: 'stockmarket',
    name: '美股行情看板',
    description: '追踪 AAPL、GOOGL、TSLA 等标杆科技股即时走势',
    icon: '📈',
    category: 'finance',
    apiUrl: 'https://finnhub.io/api/v1/quote',
    defaultEnabled: false,
  },

  wikipedia: {
    id: 'wikipedia',
    name: '维基百科精读',
    description: '每日随机推荐精选维基百科知识条目',
    icon: '📚',
    category: 'news',
    apiUrl: 'https://en.wikipedia.org/api/rest_v1/page/random/summary',
    defaultEnabled: false,
  },

  // Phase 2: Simple API Widgets
  bored: {
    id: 'bored',
    name: '灵感探索',
    description: '无聊放空时的奇思妙想与趣味活动建议',
    icon: '🎲',
    category: 'fun',
    apiUrl: 'https://www.boredapi.com/api/activity',
    defaultEnabled: false,
  },

  dictionary: {
    id: 'dictionary',
    name: '双语词典',
    description: '快速检索词汇详尽释义、同义词辨析与发音',
    icon: '📖',
    category: 'utility',
    apiUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    defaultEnabled: false,
  },

  // REMOVED: Product Hunt (CORS issues with RSS feed, GraphQL API requires authentication)
  // Alternative: dev.to and Hacker News widgets provide similar tech/product content

  ainews: {
    id: 'ainews',
    name: 'AI 前沿论文',
    description: '追踪来自 arXiv 的最新人工智能学术论文与研究突破',
    icon: '🤖',
    category: 'news',
    apiUrl: 'https://export.arxiv.org/api/query',
    defaultEnabled: false,
  },

  airquality: {
    id: 'airquality',
    name: '空气质量指数',
    description: '实时查看当前所在城市的空气质量指数 (AQI) 与健康提示',
    icon: '🌫️',
    category: 'productivity',
    apiUrl: 'https://api.waqi.info',
    defaultEnabled: false,
  },

  packagestats: {
    id: 'packagestats',
    name: 'NPM 包热度统计',
    description: '查询开源 NPM 工具包的下载量走势与生态热度',
    icon: '📦',
    category: 'dev',
    apiUrl: 'https://api.npmjs.org/downloads',
    defaultEnabled: false,
  },

  // Phase 3: Creative & Utility Widgets
  pixelart: {
    id: 'pixelart',
    name: '像素画板',
    description: '充满复古趣味的极简网格像素绘画创作工具',
    icon: '🎨',
    category: 'fun',
    defaultEnabled: false,
  },

  typingtest: {
    id: 'typingtest',
    name: '打字测速挑战',
    description: '测试键盘盲打速度 (WPM) 与输入准确率',
    icon: '⌨️',
    category: 'fun',
    defaultEnabled: false,
  },

  memorygame: {
    id: 'memorygame',
    name: '翻牌记忆挑战',
    description: '经典的图形翻牌配对益智小游戏，训练短期记忆',
    icon: '🧠',
    category: 'fun',
    defaultEnabled: false,
  },

  motivational: {
    id: 'motivational',
    name: '心力赋能',
    description: '搭配意境美图的励志箴言，为日常注入专注能量',
    icon: '✨',
    category: 'productivity',
    defaultEnabled: false,
  },

  // Phase 3: Complex API Widgets
  githubtrending: {
    id: 'githubtrending',
    name: 'GitHub 趋势榜',
    description: '查看 GitHub 社区每日与每周飙升热门开源项目',
    icon: '🔥',
    category: 'dev',
    apiUrl: 'https://api.github.com/search/repositories',
    defaultEnabled: false,
  },

  awesomelists: {
    id: 'awesomelists',
    name: '精选资源清单 (Awesome)',
    description: '汇集技术圈最高星标的 Awesome 优质知识清单',
    icon: '📋',
    category: 'dev',
    apiUrl: 'https://api.github.com/search/repositories',
    defaultEnabled: false,
  },

  repostats: {
    id: 'repostats',
    name: '仓库健康度剖析',
    description: '深度分析 GitHub 仓库的 Star、Fork 与 Issue 状态',
    icon: '📊',
    category: 'dev',
    apiUrl: 'https://api.github.com/repos',
    requiresAuth: true,
    defaultEnabled: false,
  },

  sports: {
    id: 'sports',
    name: 'NBA 实时比分',
    description: '关注 NBA 实时赛况、比分直播与焦点对决',
    icon: '🏀',
    category: 'news',
    apiUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    defaultEnabled: false,
  },


  twitch: {
    id: 'twitch',
    name: 'Twitch 关注流',
    description: '追踪喜爱的 Twitch 游戏主播开播状态与直播动态',
    icon: '🎮',
    category: 'fun',
    requiresAuth: true,
    defaultEnabled: false,
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube 频道追踪',
    description: '追踪 YouTube 关注创作者的最新投稿动态',
    icon: '📺',
    category: 'fun',
    requiresAuth: true,
    defaultEnabled: false,
  },

  analytics: {
    id: 'analytics',
    name: '网站流量统计',
    description: '连接站长统计服务，即时监控网站 PV 与活跃访客',
    icon: '📈',
    category: 'utility',
    requiresAuth: true,
    defaultEnabled: false,
  },

  clipboard: {
    id: 'clipboard',
    name: '剪贴板历史',
    description: '管理最近复制的多条历史记录，支持一键重用',
    icon: '📋',
    category: 'utility',
    defaultEnabled: false,
  },

  tabmanager: {
    id: 'tabmanager',
    name: '标签页与书签集',
    description: '管理常用浏览器标签页集合与快速跳转链接',
    icon: '🗂️',
    category: 'utility',
    requiresAuth: true,
    defaultEnabled: false,
  },

  uptime: {
    id: 'uptime',
    name: '服务在线监控',
    description: '持续监控关键站点与 API 服务的可用性与正常运行时间',
    icon: '🔔',
    category: 'utility',
    requiresAuth: true,
    defaultEnabled: false,
  },

  forms: {
    id: 'forms',
    name: '表单协作',
    description: '快速创建问卷收集表单并查看反馈回复数据',
    icon: '📋',
    category: 'core',
    defaultEnabled: true,
  },

  bookmarks: {
    id: 'bookmarks',
    name: '常用书签导航',
    description: '整理与分组收藏最常访问的常用高频工具网站',
    icon: '🔖',
    category: 'productivity',
    defaultEnabled: false,
  },

  activityfeed: {
    id: 'activityfeed',
    name: '全局动态流',
    description: '跨模块聚合展示近期创建、编辑与完成的操作足迹',
    icon: '📊',
    category: 'core',
    defaultEnabled: false,
  },

  aibriefing: {
    id: 'aibriefing',
    name: 'AI 晨间简报',
    description: 'AI 智能提炼今日日程、重点待办与打卡习惯的早报',
    icon: '🌅',
    category: 'productivity',
    defaultEnabled: false,
  },

  flashcard: {
    id: 'flashcard',
    name: '间隔记忆卡片',
    description: '基于经典 SM-2 科学遗忘曲线算法的高效卡片复习',
    icon: '🧠',
    category: 'productivity',
    defaultEnabled: false,
  },

  dailyquests: {
    id: 'dailyquests',
    name: '每日英雄冒险',
    description: '游戏化习惯挑战，完成日常任务收获经验值与成就',
    icon: '📜',
    category: 'productivity',
    defaultEnabled: false,
  },

  energytracker: {
    id: 'energytracker',
    name: '精力状态追踪',
    description: '记录全天身心精力起伏曲线，找到高能心流创作时段',
    icon: '⚡',
    category: 'productivity',
    defaultEnabled: false,
  },

  portfolio: {
    id: 'portfolio',
    name: '项目投资组合',
    description: '跨项目全局健康度看板，直观掌控各项目推进进度',
    icon: '📂',
    category: 'productivity',
    defaultEnabled: false,
  },

  weeklyinsights: {
    id: 'weeklyinsights',
    name: '每周效能复盘',
    description: '提炼每周综合生产力评分、高光战果与持续改进洞见',
    icon: '📊',
    category: 'productivity',
    defaultEnabled: false,
  },


  weatherforecast: {
    id: 'weatherforecast',
    name: '多日天气预报',
    description: '未来多日详细气温起伏、降水概率与天气状况展望',
    icon: '🌤️',
    category: 'utility',
    defaultEnabled: false,
  },

  quickadd: {
    id: 'quickadd',
    name: '全能随手记',
    description: '单一入口极速创建笔记灵感、任务待办或日程事件',
    icon: '⚡',
    category: 'core',
    defaultEnabled: false,
  },


  productivitykarma: {
    id: 'productivitykarma',
    name: '生产力 Karma 综合指数',
    description: '融合任务达成、习惯打卡、专注工时与充沛精力的全维度效能积分',
    icon: '🔮',
    category: 'productivity',
    defaultEnabled: false,
  },
};

/**
 * Register a custom widget in the registry at runtime.
 * Called when custom widgets are loaded from persisted state.
 */
export function registerCustomWidget(config: CustomWidgetConfig): void {
  WIDGET_REGISTRY[config.id] = {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    category: 'custom',
    defaultEnabled: false,
  };
}

/**
 * Remove a custom widget from the registry at runtime.
 */
export function unregisterCustomWidget(id: string): void {
  delete WIDGET_REGISTRY[id];
}

// Helper to get widgets by category
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter((w) => w.category === category);
}

// Helper to get all available widgets
export function getAllWidgets(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}

// Helper to get widget by ID
export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[id];
}

// Helper to get default enabled widgets
export function getDefaultEnabledWidgets(): string[] {
  return Object.values(WIDGET_REGISTRY)
    .filter((w) => w.defaultEnabled)
    .map((w) => w.id);
}

// Lazy-loaded CustomWidget component for custom widgets
// Uses a separate glob path since CustomWidget is not named *Widget.tsx pattern for registry
const customWidgetModule = import.meta.glob<{ CustomWidget: FC<WidgetComponentProps> }>(
  './CustomWidget.tsx'
);

let _cachedCustomWidgetLazy: LazyExoticComponent<FC<WidgetComponentProps>> | undefined;

function getCustomWidgetLazy(): LazyExoticComponent<FC<WidgetComponentProps>> {
  if (!_cachedCustomWidgetLazy) {
    const loader = customWidgetModule['./CustomWidget.tsx'];
    if (loader) {
      _cachedCustomWidgetLazy = lazy(() =>
        loader().then((m) => ({ default: m.CustomWidget }))
      );
    }
  }
  return _cachedCustomWidgetLazy!;
}

/**
 * Get the lazy-loaded component for a widget
 * Returns undefined if widget not found
 */
export function getWidgetComponent(id: string): LazyExoticComponent<FC<WidgetComponentProps>> | undefined {
  if (id.startsWith('custom-')) {
    return getCustomWidgetLazy();
  }
  return createLazyWidget(id);
}

/**
 * Get all widget components as a map (for backwards compatibility)
 * This is used by Dashboard.tsx to render widgets
 */
export function getWidgetComponentMap(): Record<string, LazyExoticComponent<FC<WidgetComponentProps>>> {
  const map: Record<string, LazyExoticComponent<FC<WidgetComponentProps>>> = {};

  for (const id of Object.keys(WIDGET_REGISTRY)) {
    if (id.startsWith('custom-')) {
      // Custom widgets all use the same component
      map[id] = getCustomWidgetLazy();
    } else {
      const component = createLazyWidget(id);
      if (component) {
        map[id] = component;
      }
    }
  }

  return map;
}
