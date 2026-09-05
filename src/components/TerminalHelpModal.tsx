/**
 * Terminal Help Modal
 * In-app help for AI Terminal and Phantom Shell
 */

import React, { useState } from 'react';

interface TerminalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpTab = 'quickstart' | 'providers' | 'shell' | 'troubleshooting';

export const TerminalHelpModal: React.FC<TerminalHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('quickstart');

  if (!isOpen) return null;

  const tabs: { id: HelpTab; label: string; icon: string }[] = [
    { id: 'quickstart', label: '快速上手', icon: '🚀' },
    { id: 'providers', label: 'AI 提供商', icon: '🤖' },
    { id: 'shell', label: 'Shell 命令', icon: '⌨️' },
    { id: 'troubleshooting', label: '常见问题与排错', icon: '❓' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-dark border border-border-dark rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-dark">
          <h2 className="text-base font-semibold text-text-dark-primary">终端使用指南</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-dark-elevated rounded transition-colors text-sm"
            aria-label="关闭指南"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-dark">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent-primary border-b-2 border-accent-primary bg-surface-dark-elevated'
                  : 'text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark-elevated'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 text-xs text-text-dark-secondary">
          {activeTab === 'quickstart' && <QuickStartTab />}
          {activeTab === 'providers' && <ProvidersTab />}
          {activeTab === 'shell' && <ShellTab />}
          {activeTab === 'troubleshooting' && <TroubleshootingTab />}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border-dark text-[10px] text-text-dark-tertiary text-center">
          <a
            href="https://github.com/travisjneuman/neumanos/blob/main/docs/user/terminal-complete-guide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            查看完整在线文档 →
          </a>
        </div>
      </div>
    </div>
  );
};

const QuickStartTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">双工作模式</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="text-base mb-0.5">💬 AI 对话</div>
          <p className="text-[10px] text-text-dark-tertiary">
            与主流大模型对话交流。提问、编写和重构代码、头脑风暴构想。
          </p>
        </div>
        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="text-base mb-0.5">⌨️ 虚拟终端 (Phantom Shell)</div>
          <p className="text-[10px] text-text-dark-tertiary">
            在浏览器内直接运行 npm/node 命令。无需本地安装任何环境即可构建项目。
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">开始使用</h3>
      <ol className="list-decimal list-inside space-y-1 text-[11px]">
        <li>点击 ⚙️ 图标打开<strong>「提供商设置」</strong></li>
        <li>填入 API Key（推荐使用 <strong>OpenRouter</strong> 或自定义兼容接口）</li>
        <li>开始畅聊，或切换至「Shell 命令」标签页体验终端</li>
      </ol>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">快捷键速查</h3>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>打开/关闭终端</span>
          <kbd className="px-1 bg-surface-dark rounded">Ctrl+Shift+A</kbd>
        </div>
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>发送消息</span>
          <kbd className="px-1 bg-surface-dark rounded">Enter</kbd>
        </div>
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>换行输入</span>
          <kbd className="px-1 bg-surface-dark rounded">Shift+Enter</kbd>
        </div>
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>翻阅历史命令</span>
          <kbd className="px-1 bg-surface-dark rounded">↑ ↓</kbd>
        </div>
      </div>
    </section>
  </div>
);

const ProvidersTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">提供商特性对比</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left border-b border-border-dark">
              <th className="p-1.5">提供商</th>
              <th className="p-1.5">免费额度</th>
              <th className="p-1.5">浏览器直连</th>
              <th className="p-1.5">最佳使用场景</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            <tr className="bg-accent-green/10">
              <td className="p-1.5 font-medium">OpenRouter</td>
              <td className="p-1.5">✅ 提供</td>
              <td className="p-1.5">✅ 直连</td>
              <td className="p-1.5">综合最佳，汇聚 200+ 大模型</td>
            </tr>
            <tr>
              <td className="p-1.5">Groq</td>
              <td className="p-1.5">✅ 提供</td>
              <td className="p-1.5">⚠️ 部分限制</td>
              <td className="p-1.5">超快推理响应速度</td>
            </tr>
            <tr>
              <td className="p-1.5">HuggingFace</td>
              <td className="p-1.5">✅ 提供</td>
              <td className="p-1.5">✅ 直连</td>
              <td className="p-1.5">开源生态优质模型</td>
            </tr>
            <tr className="bg-accent-blue/10">
              <td className="p-1.5 font-medium">Anthropic</td>
              <td className="p-1.5">❌ 无</td>
              <td className="p-1.5">✅ 直连</td>
              <td className="p-1.5">顶级推理与编码质量 (Claude)</td>
            </tr>
            <tr>
              <td className="p-1.5">OpenAI</td>
              <td className="p-1.5">❌ 无</td>
              <td className="p-1.5">⚠️ 需反代/代理</td>
              <td className="p-1.5">GPT-4, o1 系列</td>
            </tr>
            <tr>
              <td className="p-1.5">DeepSeek</td>
              <td className="p-1.5">❌ 无</td>
              <td className="p-1.5">⚠️ 需反代/代理</td>
              <td className="p-1.5">极高性价比、超强代码能力</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">
        什么是「需反代/代理」？
      </h3>
      <div className="p-2 bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg text-[10px]">
        <p className="mb-1">
          部分提供商（如 OpenAI、xAI、DeepSeek 官方直连）出于安全策略限制（CORS 跨域）阻止浏览器直接发起请求。
        </p>
        <p className="font-medium text-accent-yellow mb-0.5">便捷解决方案：</p>
        <p>
          推荐使用 <strong>OpenRouter</strong> 或在设置中配置<strong>自定义 OpenAI 兼容接口反代地址</strong>——支持在浏览器中直接调用各家顶级模型。
        </p>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">获取 API Key</h3>
      <ul className="space-y-0.5 text-[10px]">
        <li>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
            OpenRouter →
          </a>{' '}
          <span className="text-text-dark-tertiary">包含免费模型额度，支持 200+ 模型</span>
        </li>
        <li>
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
            Groq →
          </a>{' '}
          <span className="text-text-dark-tertiary">包含免费层，极速推理体验</span>
        </li>
        <li>
          <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
            HuggingFace →
          </a>{' '}
          <span className="text-text-dark-tertiary">包含免费层，开源模型社区</span>
        </li>
      </ul>
    </section>
  </div>
);

const ShellTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">内置命令速查</h3>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/help</span> - 查看可用命令
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/version</span> - 启动 WebContainer 容器
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/clear</span> - 清理屏幕
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/new 项目名</span> - 创建新项目
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/ai 提示词</span> - 向 AI 提问
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/projects</span> - 列出所有项目
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">功能支持与限制</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <div className="font-medium text-accent-green mb-0.5 text-[11px]">✅ 原生支持</div>
          <ul className="text-[10px] space-y-0.5">
            <li><code>npm install</code>, <code>npm run dev</code></li>
            <li><code>node script.js</code></li>
            <li><code>npx create-react-app</code></li>
            <li><code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mkdir</code></li>
          </ul>
        </div>
        <div className="p-2 bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <div className="font-medium text-accent-red mb-0.5 text-[11px]">❌ 暂不支持</div>
          <ul className="text-[10px] space-y-0.5">
            <li><code>git</code> - 请使用 GitHub 插件组件</li>
            <li><code>docker</code> - 浏览器沙箱环境不支持</li>
            <li><code>python</code> - 仅支持 Node.js 环境</li>
            <li><code>ping</code>, <code>curl</code> - 不支持原生底层网络系统调用</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">初次体验引导</h3>
      <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
        <li>切换至<strong>「Shell 命令」</strong>标签页</li>
        <li>输入 <code className="bg-surface-dark-elevated px-1 rounded">/version</code> 启动 WebContainer 容器（初次需 2-5 秒）</li>
        <li>输入 <code className="bg-surface-dark-elevated px-1 rounded">node -v</code> 验证 Node.js 运行环境就绪</li>
        <li>输入 <code className="bg-surface-dark-elevated px-1 rounded">/new myapp</code> 快速创建并开始开发</li>
      </ol>
    </section>
  </div>
);

const TroubleshootingTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">常见问题排查</h3>

      <div className="space-y-2">
        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            OpenAI / xAI 提示「需代理或反代」
          </div>
          <p className="text-[10px] text-text-dark-tertiary mb-1">
            由于官方 CORS 跨域限制，浏览器无法直连。建议使用 OpenRouter 或配置自定义兼容反代接口。
          </p>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-primary hover:underline">
            获取 OpenRouter 密钥 →
          </a>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            提示「WebContainer not ready」
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            请先执行 <code className="bg-surface-dark px-1 rounded">/version</code> 命令。WebContainer 容器冷启动通常需要 2-5 秒。
          </p>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            ping / git / docker 命令无法执行
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            WebContainer 专为 Node.js 环境设计。Git 操作请使用 GitHub 工具卡片，网络请求可使用
            <code className="bg-surface-dark px-1 rounded ml-1">node -e "fetch('url')"</code>
          </p>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            提示「Invalid API key (密钥无效)」
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            请核对：当前选中的服务商是否与 Key 对应、复制时是否带有多余前后空格、Key 是否过期或额度耗尽。
          </p>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            提示「Rate limit exceeded (请求频率超限)」
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            请稍候几分钟再试，或在设置中配置多个服务商实现自动故障兜底切换。
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">仍需技术支持？</h3>
      <ul className="space-y-0.5 text-[10px]">
        <li>
          <a
            href="https://github.com/travisjneuman/neumanos/blob/main/docs/user/terminal-complete-guide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            📖 查看完整用户指南
          </a>
        </li>
        <li>
          <a
            href="https://github.com/travisjneuman/neumanos/blob/main/docs/user/backend-proxy-setup.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            🔧 后端反向代理配置指南（进阶）
          </a>
        </li>
        <li>
          <a
            href="https://github.com/travisjneuman/neumanos/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            🐛 提交问题与反馈 (GitHub Issues)
          </a>
        </li>
      </ul>
    </section>
  </div>
);

export default TerminalHelpModal;
