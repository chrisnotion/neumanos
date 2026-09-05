import React, { useState } from 'react';
import { Modal } from './Modal';
import { useThemeStore } from '../stores/useThemeStore';

interface PrivacyModalProps {
  onClose: () => void;
}

const PLATFORM_NAME = 'NeumanOS';
const PLATFORM_URL = 'https://os.neuman.dev';

const LINK_CLASS = 'text-accent-blue hover:text-accent-blue-hover hover:underline transition-all duration-standard ease-smooth';

/**
 * Renders content with platform name as a clickable link
 */
function renderContentWithLinks(text: string): React.ReactNode {
  const regex = new RegExp(`(${PLATFORM_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part === PLATFORM_NAME) {
      return (
        <a
          key={index}
          href={PLATFORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {PLATFORM_NAME}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Privacy & Terms Modal
 * Displays Privacy Policy and Terms & Conditions in a modal format.
 * Matches the layout and styling of the About modal for consistency.
 */
export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'privacy' | 'terms'>('privacy');
  const mode = useThemeStore((s) => s.mode);
  const logoSrc = mode === 'dark' ? '/images/logos/logo_white.png' : '/images/logos/logo_black.png';

  return (
    <Modal
      isOpen={true}
      title="隐私与条款"
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Logo Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-3/5 overflow-hidden">
            <img
              src={logoSrc}
              alt="NeumanOS Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <a
            href={PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${LINK_CLASS} text-sm font-medium`}
          >
            {PLATFORM_NAME}
          </a>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setSelectedTab('privacy')}
            className={`px-2 sm:px-3 py-1.5 rounded-button text-xs sm:text-sm font-medium transition-all duration-standard ease-smooth ${
              selectedTab === 'privacy'
                ? 'bg-accent-blue text-white'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            }`}
          >
            <span className="hidden sm:inline">隐私政策</span>
            <span className="sm:hidden">隐私</span>
          </button>
          <button
            onClick={() => setSelectedTab('terms')}
            className={`px-2 sm:px-3 py-1.5 rounded-button text-xs sm:text-sm font-medium transition-all duration-standard ease-smooth ${
              selectedTab === 'terms'
                ? 'bg-accent-primary text-white'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            }`}
          >
            <span className="hidden sm:inline">服务条款与细则</span>
            <span className="sm:hidden">条款</span>
          </button>
        </div>

        {/* Content Title */}
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {selectedTab === 'privacy' ? '隐私政策' : '服务条款与细则'}
          </h3>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            {selectedTab === 'privacy' ? '最近更新：2025年11月16日' : '即将推出'}
          </p>
        </div>

        {/* Content Area */}
        <div className="prose prose-sm max-w-none dark:prose-invert max-h-[35vh] sm:max-h-[45vh] overflow-y-auto pr-2">
          {selectedTab === 'privacy' ? (
            <PrivacyContent />
          ) : (
            <TermsContent />
          )}
        </div>

        {/* Footer Links */}
        <div className="border-t border-border-light dark:border-border-dark pt-3 mt-4">
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <a
              href={PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              官方网站
            </a>
            <a
              href="mailto:os@neuman.dev"
              className={LINK_CLASS}
            >
              联系我们
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Privacy Policy Content Component
 */
const PrivacyContent: React.FC = () => (
  <div className="space-y-4 text-text-light-primary dark:text-text-dark-primary text-xs sm:text-sm">
    {/* TL;DR Section */}
    <section>
      <h4 className="text-sm font-semibold mb-1">核心概要 (TL;DR)</h4>
      <div className="bg-accent-blue/10 border-l-4 border-accent-blue rounded-r p-2">
        <p className="text-xs">
          <strong>我们高度尊重您的隐私。</strong> 我们仅采用 Cloudflare Web Analytics（注重隐私、无 Cookie、无用户追踪）
          以了解站点的基础访问指标。您的所有个人数据都安全留存在<strong>您本地的设备上</strong>。我们绝不出售、共享或上传任何内容。
        </p>
      </div>
    </section>

    {/* Local-First Philosophy */}
    <section>
      <h4 className="text-sm font-semibold mb-1">🔒 本地优先 (Local-First) 哲学</h4>
      <p className="mb-1 text-xs">
        <strong>数据归您所有，尽在掌握。</strong> 您在 {renderContentWithLinks('NeumanOS')} 中创建的所有内容均完整保存在本地设备中：
      </p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li>笔记、任务、日程事件、看板数据——全部存储于浏览器本地的 IndexedDB 中</li>
        <li>无云端集中存储，无中心服务器，无任何由我们控制的远端数据库</li>
        <li>备份文件直接保存到您的本地计算机（亦可自由设置自动归档到您指定的同步盘）</li>
        <li>随时导出全量数据（标准 .brain 格式）——100% 数据自主所有权</li>
      </ul>
    </section>

    {/* Analytics Section */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📊 访问统计 (Cloudflare Web Analytics)</h4>
      <p className="mb-2 text-xs">
        我们使用 <strong>Cloudflare Web Analytics</strong> 了解网站的整体访问情况，以帮助我们为所有人持续改进使用体验。
      </p>

      <div className="space-y-2">
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-2">
          <h5 className="font-semibold text-accent-green mb-1 text-xs">
            ✅ 我们收集的内容（仅汇总统计指标）：
          </h5>
          <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
            <li>页面浏览量与单次会话时长</li>
            <li>来源渠道 (Referrer) 信息</li>
            <li>浏览器类型与设备分类（桌面/移动）</li>
            <li>国家维度的粗略地域统计（不含城市、不含 IP 地址）</li>
            <li>页面加载与首屏性能指标</li>
          </ul>
        </div>

        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-2">
          <h5 className="font-semibold text-accent-red mb-1 text-xs">
            ❌ 我们绝不收集的内容：
          </h5>
          <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
            <li>无任何 Cookie 或长久跟踪标识符</li>
            <li>无任何个人身份信息（邮箱、姓名等）</li>
            <li>无跨站追踪行为</li>
            <li>无个体用户画像或设备指纹跟踪</li>
            <li>不记录任何 IP 地址（由 Cloudflare 在接入层匿名化）</li>
          </ul>
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-2">
          <h5 className="font-semibold text-accent-blue mb-1 text-xs">
            为什么选用 Cloudflare Analytics？
          </h5>
          <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
            <li>隐私保护优先（无 Cookie，无设备指纹）</li>
            <li>完全符合 GDPR / CCPA 隐私合规标准</li>
            <li>最小化数据采集（仅限聚合度量）</li>
            <li>帮助我们获悉哪些功能对大家真正有价值</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Data Processing */}
    <section>
      <h4 className="text-sm font-semibold mb-1">🔐 您的数据如何被处理</h4>
      <p className="mb-1 text-xs">所有收集的统计数据均遵循：</p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li><strong>即时匿名化</strong>：数据在收集时即完成脱敏（IP 地址从不入库）</li>
        <li><strong>高度汇总</strong>：不建立任何独立的个体行为档案</li>
        <li><strong>仅用于改进站点与软件体验</strong></li>
        <li><strong>绝不出售、不与任何第三方共享</strong></li>
        <li>
          <strong>由 Cloudflare 基础服务处理</strong>（
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            隐私政策详见
          </a>
          ）
        </li>
      </ul>
    </section>

    {/* Your Rights */}
    <section>
      <h4 className="text-sm font-semibold mb-1">⚖️ 您的隐私权利</h4>
      <p className="mb-1 text-xs">您拥有绝对的自主选择权：</p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li><strong>屏蔽统计</strong>：使用 uBlock Origin、Privacy Badger 等扩展即可完全拦截</li>
        <li><strong>增强型跟踪保护</strong>：Firefox 开启 ETP 默认便会自动屏蔽 Cloudflare 统计脚本</li>
        <li><strong>无需繁琐退出设置</strong>：由于不使用 Cookie，无需恼人的弹窗授权</li>
        <li><strong>导出完整数据</strong>：随时下载您的全部个人数据（设置 → 备份与导出）</li>
        <li><strong>彻底清除数据</strong>：一键清除浏览器本地存储（设置 → 清理全量数据）</li>
      </ul>
    </section>

    {/* No Third Parties */}
    <section>
      <h4 className="text-sm font-semibold mb-1">🚫 绝无第三方跟踪器</h4>
      <p className="mb-1 text-xs">我们<strong>严禁</strong>接入以下服务：</p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li>Google Analytics</li>
        <li>Facebook Pixel</li>
        <li>任何商业广告网络（零广告，始终如一）</li>
        <li>会话录屏回放分析工具</li>
        <li>营销自动化探测插件</li>
      </ul>
      <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        仅使用 Cloudflare Web Analytics 获取基础的匿名流量统计。仅此而已。
      </p>
    </section>

    {/* Changes to Policy */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📝 隐私政策变更</h4>
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        若本隐私政策发生重大调整，我们将及时更新上方的“最近更新”日期。
        未经醒目通知与授权，我们绝不会做出任何违背“隐私优先”初心的变更。
      </p>
    </section>

    {/* Contact */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📧 疑问与咨询</h4>
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        如果您对隐私保护有任何疑问，请随时发送邮件至{' '}
        <a href="mailto:os@neuman.dev" className={LINK_CLASS}>
          os@neuman.dev
        </a>{' '}
        或前往“设置”页面管理您的数据导出与本地备份。
      </p>
    </section>

    {/* Philosophy Footer */}
    <section className="border-t border-border-light dark:border-border-dark pt-3 mt-3">
      <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg p-3">
        <h5 className="font-semibold mb-1 text-xs">💡 我们的隐私信条</h5>
        <p className="italic text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
          “数据是属于您的私有资产。我们所构建的一切工具都坚决捍卫这一点。如果我们对隐私有所妥协，便失去了立足之本。”
        </p>
        <p className="mt-1 text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
          — Travis Neuman，{renderContentWithLinks('NeumanOS')} 创始人
        </p>
      </div>
    </section>
  </div>
);

/**
 * Terms & Conditions Content Component (Placeholder)
 */
const TermsContent: React.FC = () => (
  <div className="space-y-4 text-text-light-primary dark:text-text-dark-primary text-xs sm:text-sm">
    {/* Coming Soon Notice */}
    <section>
      <div className="bg-accent-primary/10 border-l-4 border-accent-primary rounded-r p-3">
        <h4 className="text-sm font-semibold mb-1">服务条款与细则</h4>
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
          完整的服务条款与开源许可细则目前正在起草完善中。本版块不久后将发布正式内容，涵盖：
        </p>
      </div>
    </section>

    {/* Upcoming Content */}
    <section>
      <h4 className="text-sm font-semibold mb-2">📋 细则概览</h4>
      <ul className="list-disc ml-4 space-y-1 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li><strong>服务条款：</strong> 使用 {renderContentWithLinks('NeumanOS')} 的基本指导准则</li>
        <li><strong>许可协议：</strong> 软件开源许可协议及第三方开源致谢</li>
        <li><strong>用户权责：</strong> 您作为使用者享有的权利与合理使用承诺</li>
        <li><strong>免责声明：</strong> 担保与责任限制条款</li>
        <li><strong>数据权属确认：</strong> 郑重声明所有数据归用户个人独占所有</li>
      </ul>
    </section>

    {/* Core Principles Preview */}
    <section>
      <h4 className="text-sm font-semibold mb-2">🎯 核心指导原则</h4>
      <p className="mb-2 text-text-light-secondary dark:text-text-dark-secondary text-xs">
        在完整法律文本正式出炉前，以下核心原则是我们的准绳：
      </p>
      <div className="space-y-2">
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-2 border border-border-light dark:border-border-dark">
          <p className="text-xs font-medium">🔒 您的数据，完全掌控</p>
          <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            所有数据完全保留在您的本地设备上。我们无法访问、查看或出售您的任何个人资产。
          </p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-2 border border-border-light dark:border-border-dark">
          <p className="text-xs font-medium">📤 自由迁移，绝无绑定</p>
          <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            随时以标准开放格式导出您的全量数据，绝不设置任何数据孤岛或技术锁死。
          </p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-2 border border-border-light dark:border-border-dark">
          <p className="text-xs font-medium">🚫 纯粹透明，无暗箱操作</p>
          <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            零广告、零商业追踪、绝不出卖您的注意力，回归生产力本质。
          </p>
        </div>
      </div>
    </section>

    {/* Contact for Questions */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📧 条款咨询</h4>
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        如果您对我们的服务条款或许可协议有任何想法或疑问，欢迎发送邮件至{' '}
        <a href="mailto:os@neuman.dev" className={LINK_CLASS}>
          os@neuman.dev
        </a>
      </p>
    </section>
  </div>
);
