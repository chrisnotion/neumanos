/**
 * Password Prompt Component
 * Handles encryption password setup and unlock for AI provider API keys
 *
 * Features:
 * - Setup mode: Create new password with confirmation
 * - Unlock mode: Enter existing password
 * - Password strength validation (min 12 chars, complexity)
 * - Configurable expiry (daily/weekly/monthly)
 * - Show/hide password toggle
 * - Security tips and best practices
 */

import { useState } from 'react';
import { Modal } from './Modal';
import { validatePassword, hashPassword, verifyPassword } from '../services/encryption';

interface PasswordPromptProps {
  isOpen: boolean;
  onSubmit: (password: string, passwordHash: string, duration: 'daily' | 'weekly' | 'monthly') => void;
  onCancel: () => void;
  onResetPassword?: () => void;
  mode: 'setup' | 'unlock';
  existingPasswordHash?: string;
}

export function PasswordPrompt({
  isOpen,
  onSubmit,
  onCancel,
  onResetPassword,
  mode,
  existingPasswordHash,
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [duration, setDuration] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Setup mode: Check password strength and confirmation
    if (mode === 'setup') {
      const validation = validatePassword(password);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致，请重新输入。');
        return;
      }

      // Create password hash and submit (async for WebCrypto)
      const hash = await hashPassword(password);
      onSubmit(password, hash, duration);
    } else {
      if (!password) {
        setError('请输入加密密码。');
        return;
      }

      // Unlock mode: Verify password against existing hash (async for WebCrypto)
      if (existingPasswordHash) {
        const isValid = await verifyPassword(password, existingPasswordHash);
        if (!isValid) {
          setError('密码错误，请重试。');
          return;
        }
      }

      onSubmit(password, existingPasswordHash || '', duration);
    }

    // Reset form
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleCancel = () => {
    setPassword('');
    setConfirmPassword('');
    setError(null);
    onCancel();
  };

  // Real-time password strength indicator
  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; color: string; label: string } => {
    if (pwd.length < 12) return { strength: 'weak', color: 'text-accent-red', label: '弱' };

    let score = 0;
    if (pwd.length >= 16) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score >= 3) return { strength: 'strong', color: 'text-accent-green', label: '强' };
    if (score >= 2) return { strength: 'medium', color: 'text-accent-yellow', label: '中' };
    return { strength: 'weak', color: 'text-accent-red', label: '弱' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'setup' ? '设置本地加密密码' : '解锁 API 密钥'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Description */}
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {mode === 'setup' ? (
            <>
              <p className="mb-2">
                创建高强度密码以加密存储您的 AI 服务商 API 密钥。该密码：
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>绝不会上传或在网络中明文传输</li>
                <li>用于本地解密与访问您的密钥</li>
                <li>若遗忘将无法找回，请妥善保管</li>
              </ul>
            </>
          ) : (
            <p>请输入加密密码以解密并使用已保存的 API 密钥。</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            加密密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
              placeholder={mode === 'setup' ? '输入高强度主密码' : '输入您的加密密码'}
              required
              minLength={mode === 'setup' ? 12 : 1}
              autoFocus
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary text-xs"
            >
              {showPassword ? '隐藏' : '显示'}
            </button>
          </div>

          {/* Password Strength Indicator (Setup Mode Only) */}
          {mode === 'setup' && password && passwordStrength && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.strength === 'strong'
                      ? 'bg-accent-green w-full'
                      : passwordStrength.strength === 'medium'
                      ? 'bg-accent-yellow w-2/3'
                      : 'bg-accent-red w-1/3'
                  }`}
                />
              </div>
              <span className={`text-xs ${passwordStrength.color}`}>
                密码强度: {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password (Setup Mode Only) */}
        {mode === 'setup' && (
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              确认密码
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
              placeholder="再次输入以确认"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </div>
        )}

        {/* Password Expiry Duration (Setup Mode Only) */}
        {mode === 'setup' && (
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              会话记住时长
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-blue text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
            >
              <option value="daily">每天 (次日需重新输入)</option>
              <option value="weekly">每周 (每 7 天重新验证)</option>
              <option value="monthly">每月 (每 30 天重新验证)</option>
            </select>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              会话到期后将提示重新输入密码。验证越频繁越安全。
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-button space-y-1">
            <p className="text-sm text-accent-red">{error}</p>
            {mode === 'unlock' && onResetPassword && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleCancel();
                    onResetPassword();
                  }}
                  className="text-xs text-accent-blue hover:underline cursor-pointer"
                >
                  忘记密码或之前设置失败？点此重置主密码
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security Tips (Setup Mode Only) */}
        {mode === 'setup' && (
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-button">
            <p className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              安全密码建议：
            </p>
            <ul className="text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-0.5">
              <li>• 长度至少 12 位（推荐 16 位以上）</li>
              <li>• 混合大小写字母、数字及特殊符号</li>
              <li>• 建议使用密码管理器生成与托管</li>
              <li>• 请勿与其他网站重复使用同一密码</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark border border-border-light dark:border-border-dark rounded-button text-text-light-primary dark:text-text-dark-primary transition-all duration-standard ease-smooth"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button transition-all duration-standard ease-smooth font-medium"
          >
            {mode === 'setup' ? '创建密码' : '解锁'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
