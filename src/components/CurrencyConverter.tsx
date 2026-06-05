import React, { useState } from 'react';
import { RefreshCw, Coins, ArrowRightLeft } from 'lucide-react';
import { translations } from '../data';

interface CurrencyConverterProps {
  currentLang: 'en' | 'es' | 'ur';
  ratesData: { base: string; rates: Record<string, number>; updated_at: string } | null;
  onConversionLogged: () => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  currentLang,
  ratesData,
  onConversionLogged
}) => {
  const t = translations[currentLang] || translations.en;
  const [inputValue, setInputValue] = useState<string>('100');
  const [fromCurr, setFromCurr] = useState<string>('USD');
  const [toCurr, setToCurr] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // If ratesData is not yet loaded, we use fallback values matching data.ts
  const currencyList = ratesData ? Object.keys(ratesData.rates) : ['USD', 'EUR', 'GBP', 'JPY', 'PKR', 'CAD', 'INR'];

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue || isNaN(parseFloat(inputValue))) return;

    setLoading(true);
    try {
      const resp = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'currency_converter',
          fromUnit: fromCurr,
          toUnit: toCurr,
          value: parseFloat(inputValue)
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setResult(data.result);
        onConversionLogged();
      }
    } catch (err) {
      console.error('Currency calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    const backup = fromCurr;
    setFromCurr(toCurr);
    setToCurr(backup);
    setResult(null);
  };

  return (
    <div id="currency-converter-panel" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xl mt-6">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="h-10 w-10 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
          <Coins className="h-5.5 w-5.5" />
        </div>
        <div>
          <h2 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Real-time Currency Converter
          </h2>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Synchronized hourly via global exchange indexes.
          </p>
        </div>
      </div>

      <form onSubmit={handleConvert} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          
          {/* Amount Input */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.value}</label>
            <div className="relative">
              <input
                id="currency-amount-input"
                type="number"
                step="any"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setResult(null);
                }}
                className="w-full h-13 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white font-mono text-lg transition-all"
                placeholder="100.00"
                required
              />
            </div>
          </div>

          {/* Source Currency */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.from}</label>
            <select
              id="currency-from-select"
              value={fromCurr}
              onChange={(e) => {
                setFromCurr(e.target.value);
                setResult(null);
              }}
              className="w-full h-13 px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {currencyList.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* Swap Trigger */}
          <div className="flex justify-center md:pt-4">
            <button
              id="currency-swap-btn"
              type="button"
              onClick={swapCurrencies}
              className="h-10 w-10 bg-slate-100 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-950/50 hover:text-green-600 dark:hover:text-green-400 rounded-full flex items-center justify-center text-slate-500 transition-all shadow-sm cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
              title="Swap units"
            >
              <ArrowRightLeft className="h-4.5 w-4.5 rotate-90" />
            </button>
          </div>

          {/* Target Currency */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.to}</label>
            <select
              id="currency-to-select"
              value={toCurr}
              onChange={(e) => {
                setToCurr(e.target.value);
                setResult(null);
              }}
              className="w-full h-13 px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {currencyList.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Form Action Submit */}
        <div className="flex pt-2">
          <button
            id="currency-convert-submit"
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-green-500/10 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Recalculating...' : t.convertBtn}</span>
          </button>
        </div>
      </form>

      {/* Result Indicator box */}
      {result !== null && (
        <div id="currency-result-box" className="mt-8 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-905/60 rounded-2xl p-6 animate-fade-in">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">{t.result}</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono break-all">{result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            <span className="text-sm font-semibold text-slate-500 uppercase">{toCurr}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            Rate reference: 1 {fromCurr} = {(result / parseFloat(inputValue)).toFixed(5)} {toCurr}
          </p>
        </div>
      )}

      {/* Grid of basic rates dashboard reference */}
      {ratesData && (
        <div id="currency-panel-meta" className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Rates Base: {ratesData.base}</span>
          <span>Updated At: {new Date(ratesData.updated_at).toLocaleTimeString()}</span>
        </div>
      )}

    </div>
  );
};
