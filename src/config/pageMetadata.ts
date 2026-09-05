/**
 * Page Metadata Registry
 *
 * Centralized configuration for page headers across the application.
 * This ensures consistency and makes it easy to update headers in one place.
 *
 * Usage:
 * - PageHeader component auto-detects current route and uses this registry
 * - Pages can still override by passing explicit title/subtitle props
 *
 * Future extensions:
 * - Page icons
 * - Breadcrumbs
 * - SEO meta tags
 * - Page-specific actions
 */

export interface PageMetadata {
  title: string;
  subtitle?: string;
  // Future: icon, breadcrumbs, actions, seoTitle, seoDescription
}

/**
 * Registry of page metadata indexed by route path
 *
 * Note: Add new pages here when created. The PageHeader component
 * will automatically pick up the correct title/subtitle.
 */
export const PAGE_METADATA: Record<string, PageMetadata> = {
  '/': {
    title: '运行中枢',
    subtitle: '全景掌控您的个人生产力与各项事务',
  },
  '/today': {
    title: '今日聚焦',
    subtitle: '以专注与从容规划今日时光',
  },
  '/tasks': {
    title: '任务管理',
    subtitle: '通过看板与敏捷视图组织并推进工作',
  },
  '/notes': {
    title: '灵感笔记',
    subtitle: '沉淀思考、汇聚灵感、构筑个人第二大脑',
  },
  '/schedule': {
    title: '日程规划',
    subtitle: '统合时间追踪、事件筹划与日程安排于一体',
  },
  '/settings': {
    title: '系统设置',
    subtitle: '管理数据安全、备份快照、AI模型与个性化偏好',
  },
  '/links': {
    title: '灵感书签',
    subtitle: '构建井然有序的网络智库与知识索引',
  },
  '/habits': {
    title: '习惯养成',
    subtitle: '日拱一卒，以持续打卡铸就长久自律',
  },
  '/graph': {
    title: '知识图谱',
    subtitle: '直观探索笔记间的双向关联与知识星图',
  },
  '/diagrams': {
    title: '图表绘制',
    subtitle: '轻松绘制专业流程图、架构图与思维草图',
  },
  '/forms': {
    title: '表单工坊',
    subtitle: '高效构建、分发与分析各类数据表单',
  },
  '/focus': {
    title: '沉浸专注',
    subtitle: '告别纷扰，在纯粹的工作流中保持心流',
  },
  '/automations': {
    title: '自动化流水线',
    subtitle: '配置自定义规则，让繁杂事务自动运转',
  },
  '/docs': {
    title: '创作中心',
    subtitle: '一站式编写文档、精算表格与演示文稿',
  },
  '/create': {
    title: '创作工坊',
    subtitle: '文档撰写、流程图表与智能表单全能工坊',
  },
  '/pm': {
    title: '项目管理',
    subtitle: '实时掌控项目进度、关键里程碑与协同态势',
  },
  '/portfolio': {
    title: '项目矩阵',
    subtitle: '跨项目全局全景洞察与健康度评估',
  },
  '/energy': {
    title: '精力感知',
    subtitle: '洞察身心能量节律，顺势优化日程负荷',
  },
  '/availability': {
    title: '空闲预约',
    subtitle: '便捷规划与分享您的自由档期与可预约时段',
  },
};

/**
 * Get page metadata for a given pathname
 *
 * @param pathname - The current route path (e.g., '/', '/tasks')
 * @returns PageMetadata or null if not found
 */
export function getPageMetadata(pathname: string): PageMetadata | null {
  return PAGE_METADATA[pathname] || null;
}

/**
 * Get page title for a given pathname (convenience function)
 *
 * @param pathname - The current route path
 * @returns Page title or 'NeumanOS' as fallback
 */
export function getPageTitle(pathname: string): string {
  return PAGE_METADATA[pathname]?.title || 'NeumanOS';
}
