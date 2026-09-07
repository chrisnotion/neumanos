/**
 * QR Code Generator Widget
 *
 * Generate QR codes from text/URLs
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { BaseWidget } from './BaseWidget';

export const QRCodeWidget: React.FC = () => {
  const [text, setText] = useState<string>('https://example.com');
  const [size, setSize] = useState<number>(200);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl('');
      setError(null);
      return;
    }

    let isCancelled = false;

    QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!isCancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to generate QR code:', err);
          setError('无法生成二维码，请缩短文本内容');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [text, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <BaseWidget title="二维码生成器" icon="📱">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            文本或网址 (URL)
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入想要转换成二维码的内容..."
            className="w-full px-3 py-2 text-sm border rounded bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            尺寸大小: {size}×{size}
          </label>
          <input
            type="range"
            min="100"
            max="300"
            step="25"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-full cursor-pointer accent-accent-primary"
          />
        </div>

        {error && (
          <div className="p-2 text-xs text-center text-status-error bg-status-error-bg dark:bg-status-error-bg-dark border border-status-error-border rounded">
            {error}
          </div>
        )}

        {dataUrl && (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-white rounded-lg shadow-sm border border-border-light dark:border-border-dark flex justify-center items-center">
              <img
                src={dataUrl}
                alt="QR Code"
                style={{ width: `${size}px`, height: `${size}px` }}
                className="max-w-full h-auto object-contain"
              />
            </div>
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button font-medium transition-all duration-standard ease-smooth flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>下载二维码图片</span>
            </button>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
