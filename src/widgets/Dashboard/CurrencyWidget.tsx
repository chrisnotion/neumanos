/**
 * Currency Exchange Widget
 *
 * Real-time currency exchange rates and XE-style converter
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseWidget } from './BaseWidget';

interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

export const POPULAR_CURRENCIES: CurrencyInfo[] = [
  { code: 'CNY', name: '人民币', flag: '🇨🇳', symbol: '¥' },
  { code: 'USD', name: '美元', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: '日元', flag: '🇯🇵', symbol: '¥' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷', symbol: '₩' },
  { code: 'HKD', name: '港币', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'TWD', name: '新台币', flag: '🇹🇼', symbol: 'NT$' },
  { code: 'AUD', name: '澳大利亚元', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CAD', name: '加拿大元', flag: '🇨🇦', symbol: 'C$' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬', symbol: 'S$' },
  { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭', symbol: 'CHF' },
  { code: 'THB', name: '泰铢', flag: '🇹🇭', symbol: '฿' },
  { code: 'MYR', name: '马来西亚林吉特', flag: '🇲🇾', symbol: 'RM' },
  { code: 'NZD', name: '新西兰元', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'RUB', name: '俄罗斯卢布', flag: '🇷🇺', symbol: '₽' },
  { code: 'INR', name: '印度卢比', flag: '🇮🇳', symbol: '₹' },
  { code: 'AED', name: '阿联酋迪拉姆', flag: '🇦🇪', symbol: 'AED' },
  { code: 'BRL', name: '巴西雷亚尔', flag: '🇧🇷', symbol: 'R$' },
  { code: 'PHP', name: '菲律宾比索', flag: '🇵🇭', symbol: '₱' },
  { code: 'VND', name: '越南盾', flag: '🇻🇳', symbol: '₫' },
  { code: 'IDR', name: '印尼卢比', flag: '🇮🇩', symbol: 'Rp' },
  { code: 'TRY', name: '土耳其里拉', flag: '🇹🇷', symbol: '₺' },
];

const CURRENCY_MAP = new Map<string, CurrencyInfo>(
  POPULAR_CURRENCIES.map((c) => [c.code, c])
);

interface ExchangeRatesResponse {
  base: string;
  date: string;
  time_last_updated?: number;
  rates: Record<string, number>;
}

export const CurrencyWidget: React.FC = () => {
  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [amount, setAmount] = useState<string>('1');

  // Fetch rates for currently selected base currency
  const fetchRates = useCallback(async (base: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
      if (!response.ok) {
        throw new Error('获取实时汇率失败，请检查网络后重试');
      }

      const data: ExchangeRatesResponse = await response.json();
      setRatesData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取汇率失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates(fromCurrency);
  }, [fromCurrency, fetchRates]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const parsedAmount = useMemo(() => {
    const val = parseFloat(amount);
    return isNaN(val) ? 0 : val;
  }, [amount]);

  // Current exchange rate from fromCurrency to toCurrency
  const currentRate = useMemo(() => {
    if (!ratesData || !ratesData.rates) return null;
    if (fromCurrency === toCurrency) return 1;
    return ratesData.rates[toCurrency] ?? null;
  }, [ratesData, fromCurrency, toCurrency]);

  const convertedResult = useMemo(() => {
    if (currentRate === null) return '...';
    const total = parsedAmount * currentRate;
    if (currentRate < 0.01) {
      return total.toFixed(6);
    }
    return total.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }, [parsedAmount, currentRate]);

  const fromInfo = CURRENCY_MAP.get(fromCurrency) || {
    code: fromCurrency,
    name: fromCurrency,
    flag: '🌐',
    symbol: '',
  };

  const toInfo = CURRENCY_MAP.get(toCurrency) || {
    code: toCurrency,
    name: toCurrency,
    flag: '🌐',
    symbol: '',
  };

  // Compare rates for popular list
  const comparisonCurrencies = useMemo(() => {
    const list = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'CAD', 'AUD'].filter(
      (c) => c !== fromCurrency
    );
    return list.slice(0, 5);
  }, [fromCurrency]);

  return (
    <BaseWidget
      title="全球汇率换算"
      icon="💱"
      loading={loading && !ratesData}
      error={error}
      onRefresh={() => fetchRates(fromCurrency)}
    >
      <div className="space-y-4">
        {/* XE-Style Converter Box */}
        <div className="space-y-2">
          {/* From Box */}
          <div className="border border-border-light dark:border-border-dark rounded-card p-2.5 bg-surface-light dark:bg-surface-dark-elevated focus-within:ring-2 focus-within:ring-accent-blue focus-within:border-transparent transition-all">
            <div className="text-[11px] font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              持有货币 (From)
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-base font-semibold text-text-light-tertiary dark:text-text-dark-tertiary mr-1.5 select-none">
                  {fromInfo.symbol}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  placeholder="0"
                  className="w-full text-base font-bold bg-transparent text-text-light-primary dark:text-text-dark-primary outline-none"
                />
              </div>

              <div className="relative flex-shrink-0">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="appearance-none bg-surface-light-elevated dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary font-medium text-xs rounded-button pl-2 pr-6 py-1.5 border border-border-light dark:border-border-dark focus:outline-none cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Swap Button (XE-style centered button) */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              title="对调货币"
              className="p-1.5 rounded-full bg-surface-light-elevated dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-accent-blue hover:text-accent-blue shadow-sm text-text-light-primary dark:text-text-dark-primary transition-transform active:scale-95 duration-standard flex items-center justify-center"
            >
              <span className="text-xs">⇄</span>
            </button>
          </div>

          {/* To Box */}
          <div className="border border-border-light dark:border-border-dark rounded-card p-2.5 bg-surface-light dark:bg-surface-dark-elevated focus-within:ring-2 focus-within:ring-accent-blue focus-within:border-transparent transition-all">
            <div className="text-[11px] font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              目标兑换 (To)
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-base font-semibold text-text-light-tertiary dark:text-text-dark-tertiary mr-1.5 select-none">
                  {toInfo.symbol}
                </span>
                <span className="w-full text-base font-bold text-accent-primary truncate">
                  {convertedResult}
                </span>
              </div>

              <div className="relative flex-shrink-0">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="appearance-none bg-surface-light-elevated dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary font-medium text-xs rounded-button pl-2 pr-6 py-1.5 border border-border-light dark:border-border-dark focus:outline-none cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                  ▼
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* XE-Style Exchange Rate Summary */}
        {currentRate !== null && (
          <div className="bg-surface-light-elevated/60 dark:bg-surface-dark/60 rounded-card p-2.5 text-center">
            <div className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
              1.00 {fromCurrency} = {currentRate < 0.01 ? currentRate.toFixed(6) : currentRate.toFixed(4)} {toCurrency}
            </div>
            <div className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
              中间市场汇率 {ratesData?.date ? `· 更新于 ${ratesData.date}` : ''}
            </div>
          </div>
        )}

        {/* Popular Target Currencies Comparison */}
        {ratesData && ratesData.rates && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
              常用汇率速查 ({fromCurrency})
            </div>
            <div className="grid grid-cols-1 gap-1">
              {comparisonCurrencies.map((code) => {
                const targetInfo = CURRENCY_MAP.get(code);
                const rate = ratesData.rates[code];
                if (rate === undefined) return null;
                const converted = (parsedAmount * rate).toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: rate < 0.01 ? 6 : 2,
                });

                return (
                  <div
                    key={code}
                    onClick={() => setToCurrency(code)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer text-xs transition-colors"
                    title={`点击切换目标货币为 ${code}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{targetInfo?.flag || '🌐'}</span>
                      <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {code}
                      </span>
                      <span className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary hidden sm:inline">
                        {targetInfo?.name}
                      </span>
                    </div>
                    <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {targetInfo?.symbol} {converted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
