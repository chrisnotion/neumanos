import type { HabitFrequency, HabitCategory } from '../types';

export interface HabitTemplatePack {
  name: string;
  description: string;
  icon: string;
  templates: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
    frequency: HabitFrequency;
    category: HabitCategory;
    timesPerWeek?: number;
  }>;
}

export const HABIT_TEMPLATE_PACKS: HabitTemplatePack[] = [
  {
    name: '晨间日常',
    description: '开启精力充沛、目标明确的一天',
    icon: '🌅',
    templates: [
      { title: '早起', description: '早上 7:00 前起床', icon: '⏰', color: '#f97316', frequency: 'weekdays', category: 'productivity' },
      { title: '晨练', description: '进行 30 分钟身体活动或锻炼', icon: '💪', color: '#22c55e', frequency: 'daily', category: 'fitness' },
      { title: '晨间冥想', description: '10 分钟静心正念', icon: '🧘', color: '#06b6d4', frequency: 'daily', category: 'mindfulness' },
      { title: '晨间日记', description: '记录晨间思绪与反思', icon: '✍️', color: '#ec4899', frequency: 'daily', category: 'mindfulness' },
    ],
  },
  {
    name: '健康与健身',
    description: '养成更健康的生活方式',
    icon: '🏋️',
    templates: [
      { title: '喝足 8 杯水', description: '全天保持充足水分', icon: '💧', color: '#3b82f6', frequency: 'daily', category: 'health' },
      { title: '每日万步', description: '累计步行至少 10,000 步', icon: '🚶', color: '#22c55e', frequency: 'daily', category: 'fitness' },
      { title: '健康饮食', description: '摄入营养均衡的健康餐食', icon: '🥗', color: '#84cc16', frequency: 'daily', category: 'nutrition' },
      { title: '身体拉伸', description: '15 分钟拉伸或瑜伽放松', icon: '🤸', color: '#8b5cf6', frequency: 'daily', category: 'fitness' },
    ],
  },
  {
    name: '学习成长',
    description: '持续成长与技能精进',
    icon: '📚',
    templates: [
      { title: '阅读 30 分钟', description: '阅读书籍或深度长文', icon: '📖', color: '#8b5cf6', frequency: 'daily', category: 'learning' },
      { title: '技能刻意练习', description: '针对专业技能进行刻意练习', icon: '🎯', color: '#f97316', frequency: 'times-per-week', category: 'learning', timesPerWeek: 5 },
      { title: '复习整理笔记', description: '梳理、回顾并内化笔记', icon: '📝', color: '#06b6d4', frequency: 'times-per-week', category: 'learning', timesPerWeek: 3 },
    ],
  },
  {
    name: '高效生产力',
    description: '最大化专注度与产出效能',
    icon: '⚡',
    templates: [
      { title: '规划明日日程', description: '傍晚复盘今日并规划明日要务', icon: '📋', color: '#3b82f6', frequency: 'weekdays', category: 'productivity' },
      { title: '深度工作 2 小时', description: '2 小时无干扰的高专注深度工作', icon: '🧠', color: '#ef4444', frequency: 'weekdays', category: 'productivity' },
      { title: '每周复盘', description: '检视本周进展并校准目标', icon: '📊', color: '#8b5cf6', frequency: 'times-per-week', category: 'productivity', timesPerWeek: 1 },
      { title: '清空收件箱', description: '将各类邮件与待办消息处理清零', icon: '📧', color: '#22c55e', frequency: 'weekdays', category: 'productivity' },
    ],
  },
  {
    name: '正念与心流',
    description: '培养专注力与身心平静',
    icon: '🧘',
    templates: [
      { title: '坐禅冥想', description: '静坐冥想练习', icon: '🧘', color: '#06b6d4', frequency: 'daily', category: 'mindfulness' },
      { title: '感恩日记', description: '记录 3 件值得感恩的事物', icon: '🙏', color: '#eab308', frequency: 'daily', category: 'mindfulness' },
      { title: '远离屏幕 1 小时', description: '暂别手机和电脑等屏幕 1 小时', icon: '📵', color: '#ef4444', frequency: 'daily', category: 'mindfulness' },
      { title: '户外漫步', description: '走进户外亲近自然与新鲜空气', icon: '🌿', color: '#22c55e', frequency: 'times-per-week', category: 'mindfulness', timesPerWeek: 3 },
    ],
  },
];
