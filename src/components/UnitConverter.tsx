import React, { useState, useEffect } from 'react';
import { RefreshCw, Calculator, BookOpen, Layers } from 'lucide-react';
import { translations } from '../data';

interface UnitConverterProps {
  currentLang: 'en' | 'es' | 'ur';
  onConversionLogged: () => void;
}

const UNIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'length-converter': [
    { value: 'meters', label: 'Meters (m)' },
    { value: 'kilometers', label: 'Kilometers (km)' },
    { value: 'centimeters', label: 'Centimeters (cm)' },
    { value: 'millimeters', label: 'Millimeters (mm)' },
    { value: 'miles', label: 'Miles (mi)' },
    { value: 'yards', label: 'Yards (yd)' },
    { value: 'feet', label: 'Feet (ft)' },
    { value: 'inches', label: 'Inches (in)' }
  ],
  'weight-converter': [
    { value: 'kilograms', label: 'Kilograms (kg)' },
    { value: 'grams', label: 'Grams (g)' },
    { value: 'milligrams', label: 'Milligrams (mg)' },
    { value: 'pounds', label: 'Pounds (lbs)' },
    { value: 'ounces', label: 'Ounces (oz)' },
    { value: 'stone', label: 'Stone (st)' },
    { value: 'tons', label: 'Metric Tons (t)' }
  ],
  'temperature-converter': [
    { value: 'celsius', label: 'Celsius (°C)' },
    { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
    { value: 'kelvin', label: 'Kelvin (K)' }
  ],
  'area-converter': [
    { value: 'square_meters', label: 'Square Meters (m²)' },
    { value: 'square_kilometers', label: 'Square Kilometers (km²)' },
    { value: 'square_miles', label: 'Square Miles (mi²)' },
    { value: 'square_yards', label: 'Square Yards (yd²)' },
    { value: 'square_feet', label: 'Square Feet (ft²)' },
    { value: 'acres', label: 'Acres (ac)' },
    { value: 'hectares', label: 'Hectares (ha)' }
  ],
  'volume-converter': [
    { value: 'liters', label: 'Liters (L)' },
    { value: 'milliliters', label: 'Milliliters (mL)' },
    { value: 'gallons', label: 'Gallons (gal)' },
    { value: 'quarts', label: 'Quarts (qt)' },
    { value: 'cups', label: 'Cups (c)' },
    { value: 'cubic_meters', label: 'Cubic Meters (m³)' }
  ]
};

const FORMULA_HELP: Record<string, Record<string, { formula: string; example: string }>> = {
  'length-converter': {
    'meters-feet': { formula: 'Feet = Meters × 3.28084', example: '5 meters × 3.28084 = 16.40 feet' },
    'kilometers-miles': { formula: 'Miles = Kilometers × 0.621371', example: '10 km × 0.621371 = 6.21 miles' },
    'centimeters-inches': { formula: 'Inches = Centimeters × 0.393701', example: '10 cm × 0.393701 = 3.94 inches' }
  },
  'weight-converter': {
    'kilograms-pounds': { formula: 'Pounds = Kilograms × 2.20462', example: '70 kg × 2.20462 = 154.32 lbs' },
    'grams-milligrams': { formula: 'Milligrams = Grams × 1000', example: '2 grams × 1000 = 2000 mg' },
    'pounds-kilograms': { formula: 'Kilograms = Pounds × 0.453592', example: '10 lbs × 0.453592 = 4.54 kg' }
  },
  'temperature-converter': {
    'celsius-fahrenheit': { formula: 'Fahrenheit = (Celsius × 9/5) + 32', example: '37°C × 1.8 + 32 = 98.6°F' },
    'fahrenheit-celsius': { formula: 'Celsius = (Fahrenheit - 32) × 5/9', example: '(98.6°F - 32) × 5/9 = 37°C' },
    'celsius-kelvin': { formula: 'Kelvin = Celsius + 273.15', example: '0°C + 273.15 = 273.15 K' }
  }
};

const computeLocalUnit = (category: string, from: string, to: string, valueStr: string): number | null => {
  const val = parseFloat(valueStr);
  if (isNaN(val)) return null;

  if (category === 'length-converter') {
    const multipliers: Record<string, number> = {
      meters: 1,
      kilometers: 1000,
      centimeters: 0.01,
      millimeters: 0.001,
      miles: 1609.34,
      yards: 0.9144,
      feet: 0.3048,
      inches: 0.0254
    };
    const meters = val * (multipliers[from] || 1);
    return meters / (multipliers[to] || 1);
  } else if (category === 'weight-converter') {
    const multipliers: Record<string, number> = {
      kilograms: 1,
      grams: 0.001,
      milligrams: 0.000001,
      pounds: 0.45359237,
      ounces: 0.02834952,
      stone: 6.35029318,
      tons: 1000
    };
    const kgs = val * (multipliers[from] || 1);
    return kgs / (multipliers[to] || 1);
  } else if (category === 'temperature-converter') {
    if (from === 'celsius' && to === 'fahrenheit') {
      return (val * 9/5) + 32;
    } else if (from === 'fahrenheit' && to === 'celsius') {
      return (val - 32) * 5/9;
    } else if (from === 'celsius' && to === 'kelvin') {
      return val + 273.15;
    } else if (from === 'kelvin' && to === 'celsius') {
      return val - 273.15;
    } else if (from === 'fahrenheit' && to === 'kelvin') {
      return ((val - 32) * 5/9) + 273.15;
    } else if (from === 'kelvin' && to === 'fahrenheit') {
      return ((val - 273.15) * 9/5) + 32;
    } else {
      return val;
    }
  } else if (category === 'area-converter') {
    const multipliers: Record<string, number> = {
      square_meters: 1,
      square_kilometers: 1000000,
      square_miles: 2589988.11,
      square_yards: 0.83612736,
      square_feet: 0.09290304,
      acres: 4046.85642,
      hectares: 10000
    };
    const sq_m = val * (multipliers[from] || 1);
    return sq_m / (multipliers[to] || 1);
  } else if (category === 'volume-converter') {
    const multipliers: Record<string, number> = {
      liters: 1,
      milliliters: 0.001,
      gallons: 3.78541,
      quarts: 0.946353,
      cups: 0.24,
      cubic_meters: 1000
    };
    const liters = val * (multipliers[from] || 1);
    return liters / (multipliers[to] || 1);
  }
  return val;
};

export const UnitConverter: React.FC<UnitConverterProps> = ({ currentLang, onConversionLogged }) => {
  const t = translations[currentLang] || translations.en;
  const [activeCategory, setActiveCategory] = useState<string>('length-converter');
  
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('meters');
  const [toUnit, setToUnit] = useState<string>('feet');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Synchronously compute the local conversion as inputs are modified
  useEffect(() => {
    const calculated = computeLocalUnit(activeCategory, fromUnit, toUnit, inputValue);
    setResult(calculated);
  }, [activeCategory, fromUnit, toUnit, inputValue]);

  // Re-adjust dropdown fields when category changes safely
  useEffect(() => {
    const list = UNIT_OPTIONS[activeCategory] || [];
    if (list.length >= 2) {
      setFromUnit(list[0].value);
      setToUnit(list[1].value);
    }
  }, [activeCategory]);

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue || isNaN(parseFloat(inputValue))) return;

    setLoading(true);
    try {
      // Instantly compute so results block remains populated immediately
      const calculated = computeLocalUnit(activeCategory, fromUnit, toUnit, inputValue);
      setResult(calculated);

      const resp = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeCategory,
          fromUnit,
          toUnit,
          value: parseFloat(inputValue)
        })
      });

      if (resp.ok) {
        onConversionLogged();
      }
    } catch (err) {
      console.error('Calculation API request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const swapUnits = () => {
    const backup = fromUnit;
    setFromUnit(toUnit);
    setToUnit(backup);
  };

  const getHelpContent = () => {
    const key = `${fromUnit}-${toUnit}`;
    const reverseKey = `${toUnit}-${fromUnit}`;
    const help = FORMULA_HELP[activeCategory];
    if (help) {
      if (help[key]) return help[key];
      if (help[reverseKey]) return help[reverseKey];
    }
    return {
      formula: `Standard dimensional coefficient of ${fromUnit} mapping directly into ${toUnit}.`,
      example: `Multiply your ${fromUnit} source context factors accurately.`
    };
  };

  const help = getHelpContent();

  return (
    <div id="unit-converter-panel" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xl">
      
      {/* Tab Selectors of converter types */}
      <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'length-converter', label: 'Length' },
          { id: 'weight-converter', label: 'Weight' },
          { id: 'temperature-converter', label: 'Temp' },
          { id: 'area-converter', label: 'Area' },
          { id: 'volume-converter', label: 'Volume' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeCategory === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleConvert} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          
          {/* Input block */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.value}</label>
            <div className="relative">
              <input
                id="unit-value-input"
                type="number"
                step="any"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                }}
                className="w-full h-13 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white font-mono text-lg transition-all"
                placeholder="Enter length or value..."
                required
              />
            </div>
          </div>

          {/* Unit selection FROM */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.from}</label>
            <select
              id="unit-from-select"
              value={fromUnit}
              onChange={(e) => {
                setFromUnit(e.target.value);
              }}
              className="w-full h-13 px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {(UNIT_OPTIONS[activeCategory] || []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-4">
            <button
              id="unit-swap-btn"
              type="button"
              onClick={swapUnits}
              className="h-10 w-10 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-full flex items-center justify-center text-slate-500 transition-all shadow-sm cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
              title="Swap units"
            >
              <RefreshCw className="h-4.5 w-4.5 rotate-90" />
            </button>
          </div>

          {/* Unit selection TO */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.to}</label>
            <select
              id="unit-to-select"
              value={toUnit}
              onChange={(e) => {
                setToUnit(e.target.value);
              }}
              className="w-full h-13 px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {(UNIT_OPTIONS[activeCategory] || []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            id="unit-convert-submit"
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Calculator className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processing...' : t.convertBtn}</span>
          </button>
        </div>
      </form>

      {/* Conversion Output Result block */}
      {result !== null && (
        <div id="unit-result-box" className="mt-8 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-6 animate-fade-in">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t.result}</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono break-all">{result.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 lowercase">{toUnit.replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {/* Guide Formula Explanation Box */}
      <div id="unit-formula-box" className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start space-x-3.5">
          <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.formula}</h4>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1.5 font-mono">{help.formula}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3.5">
          <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.example}</h4>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">{help.example}</p>
          </div>
        </div>
      </div>

    </div>
  );
};
