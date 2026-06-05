import React, { useState, useEffect } from 'react';
import { Percent, Calendar, Heart, Layers, Calculator, Landmark, ShieldCheck, Scale, DollarSign, Wallet, Gem, HelpCircle } from 'lucide-react';

interface CalculatorsProps {
  currentLang: 'en' | 'es' | 'ur';
  initialCalc?: string;
}

export const Calculators: React.FC<CalculatorsProps> = ({ currentLang, initialCalc }) => {
  const [activeCalc, setActiveCalc] = useState<string>(initialCalc || 'percentage');

  // Universal Calculators List
  const CALC_LIST = [
    { id: 'percentage', name: 'Percentage Calculator', icon: Percent, desc: 'Calculate discounts, ratios, and percentages.' },
    { id: 'age', name: 'Age Calculator', icon: Calendar, desc: 'Find ages down to the exact days and months.' },
    { id: 'bmi', name: 'BMI Calculator', icon: Scale, desc: 'Examine body mass indexes and healthy ranges.' },
    { id: 'emi', name: 'EMI / Loan Calculator', icon: Landmark, desc: 'Compute monthly bank amortizations.' },
    { id: 'vat-gst', name: 'GST / VAT Calculator', icon: ShieldCheck, desc: 'Identify tax values or tax additions.' },
    { id: 'profit-margin', name: 'Profit Margin Calculator', icon: Wallet, desc: 'Determine gross profit margins and markups.' },
    { id: 'discount', name: 'Discount Calculator', icon: Gem, desc: 'Find net pricing and percentage savings.' },
    { id: 'compound-interest', name: 'Compound Interest', icon: Layers, desc: 'Model future savings capital growth rates.' },
    { id: 'salary', name: 'Salary Calculator', icon: Calculator, desc: 'Map gross wages to net periodic income.' },
    { id: 'mortgage', name: 'Mortgage Calculator', icon: Landmark, desc: 'Analyze long-term housing mortgage plans.' },
    { id: 'fuel-cost', name: 'Fuel Cost Calculator', icon: Wallet, desc: 'Calculate fuel consumption trip travel expenses.' }
  ];

  // Helper to safely strip leading zeroes from numeric input elements during typing
  const handleNumChange = (setter: (val: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (/^-?0\d+/.test(val)) {
      const isNegative = val.startsWith('-');
      const cleaned = (isNegative ? val.slice(1) : val).replace(/^0+/, '');
      val = isNegative ? '-' + cleaned : cleaned;
      e.target.value = val;
    }
    setter(Number(val));
  };

  // ------------------- CALCULATOR STATES -------------------

  // 1. Percentage
  const [pctX, setPctX] = useState<number>(10);
  const [pctY, setPctY] = useState<number>(200);
  const [pctResult, setPctResult] = useState<number>(20);

  // 2. Age
  const [birthdate, setBirthdate] = useState<string>('1998-05-15');
  const [ageResult, setAgeResult] = useState<{ years: number; months: number; days: number } | null>(null);

  // 3. BMI
  const [bmiWeight, setBmiWeight] = useState<number>(70); // in kg
  const [bmiHeight, setBmiHeight] = useState<number>(175); // in cm
  const [bmiVal, setBmiVal] = useState<number>(22.86);
  const [bmiStatus, setBmiStatus] = useState<string>('Normal');

  // 4. EMI
  const [emiPrincipal, setEmiPrincipal] = useState<number>(100000); // 100k principal
  const [emiRate, setEmiRate] = useState<number>(8.5); // interest %
  const [emiTenure, setEmiTenure] = useState<number>(12); // months
  const [emiMonthly, setEmiMonthly] = useState<number>(0);
  const [emiInterestTotal, setEmiInterestTotal] = useState<number>(0);

  // 5. GST/VAT
  const [vatAmount, setVatAmount] = useState<number>(500);
  const [vatRate, setVatRate] = useState<number>(18); // default tax %
  const [vatType, setVatType] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [vatTaxVal, setVatTaxVal] = useState<number>(0);
  const [vatNetTotal, setVatNetTotal] = useState<number>(0);

  // 6. Profit Margin
  const [costPrice, setCostPrice] = useState<number>(150);
  const [salesPrice, setSalesPrice] = useState<number>(250);
  const [marginPct, setMarginPct] = useState<number>(0);
  const [markupPct, setMarkupPct] = useState<number>(0);

  // 7. Discount
  const [originalPrice, setOriginalPrice] = useState<number>(120);
  const [discPct, setDiscPct] = useState<number>(25);
  const [savingsValue, setSavingsValue] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number>(0);

  // 8. Compound Interest
  const [ciPrincipal, setCiPrincipal] = useState<number>(5000);
  const [ciRate, setCiRate] = useState<number>(6);
  const [ciTenure, setCiTenure] = useState<number>(5); // years
  const [ciResult, setCiResult] = useState<number>(0);

  // 9. Salary
  const [annualWage, setAnnualWage] = useState<number>(60000);
  const [taxPercent, setTaxPercent] = useState<number>(22);
  const [salMonthly, setSalMonthly] = useState<number>(0);

  // 10. Mortgage
  const [mortPrice, setMortPrice] = useState<number>(300000);
  const [mortDown, setMortDown] = useState<number>(6000);
  const [mortRate, setMortRate] = useState<number>(4.5);
  const [mortYears, setMortYears] = useState<number>(30);
  const [mortEmi, setMortEmi] = useState<number>(0);

  // 11. Fuel Cost
  const [fuelDistance, setFuelDistance] = useState<number>(150); // KM
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(12); // KM/L
  const [fuelPricePerL, setFuelPricePerL] = useState<number>(1.8);
  const [fuelRequired, setFuelRequired] = useState<number>(0);
  const [fuelTotalCost, setFuelTotalCost] = useState<number>(0);

  // ------------------- MATHEMATICAL CALCS LOGICS -------------------

  useEffect(() => {
    // 1. Percentage
    setPctResult(Number(((pctX / 100) * pctY).toFixed(4)));

    // 2. Age
    if (birthdate) {
      const bDate = new Date(birthdate);
      const today = new Date();
      let dy = today.getFullYear() - bDate.getFullYear();
      let dm = today.getMonth() - bDate.getMonth();
      let dd = today.getDate() - bDate.getDate();

      if (dd < 0) {
        dm -= 1;
        // Find previous month days total
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        dd += prevMonth.getDate();
      }
      if (dm < 0) {
        dy -= 1;
        dm += 12;
      }
      setAgeResult({ years: dy >= 0 ? dy : 0, months: dm >= 0 ? dm : 0, days: dd >= 0 ? dd : 0 });
    }

    // 3. BMI (weight in kg / height in meters squared)
    if (bmiHeight > 0) {
      const hM = bmiHeight / 100;
      const computedBmi = bmiWeight / (hM * hM);
      setBmiVal(Number(computedBmi.toFixed(2)));
      if (computedBmi < 18.5) setBmiStatus('Underweight');
      else if (computedBmi < 25) setBmiStatus('Normal/Healthy weight');
      else if (computedBmi < 30) setBmiStatus('Overweight');
      else setBmiStatus('Obese');
    }

    // 4. EMI = [P * r * (1+r)^n] / [ (1+r)^n - 1]
    if (emiPrincipal > 0 && emiRate > 0 && emiTenure > 0) {
      const r = (emiRate / 12) / 100;
      const emi = (emiPrincipal * r * Math.pow(1 + r, emiTenure)) / (Math.pow(1 + r, emiTenure) - 1);
      setEmiMonthly(Number(emi.toFixed(2)));
      setEmiInterestTotal(Number(((emi * emiTenure) - emiPrincipal).toFixed(2)));
    }

    // 5. GST/VAT
    if (vatAmount > 0) {
      const rateFrac = vatRate / 100;
      if (vatType === 'exclusive') {
        const tax = vatAmount * rateFrac;
        setVatTaxVal(Number(tax.toFixed(2)));
        setVatNetTotal(Number((vatAmount + tax).toFixed(2)));
      } else {
        const tax = vatAmount - (vatAmount / (1 + rateFrac));
        setVatTaxVal(Number(tax.toFixed(2)));
        setVatNetTotal(Number((vatAmount - tax).toFixed(2)));
      }
    }

    // 6. Profit Margin
    if (salesPrice > 0) {
      const absoluteProfit = salesPrice - costPrice;
      const margin = (absoluteProfit / salesPrice) * 100;
      setMarginPct(Number(margin.toFixed(2)));
      if (costPrice > 0) {
        const markup = (absoluteProfit / costPrice) * 105; // standard markup metric
        setMarkupPct(Number(((absoluteProfit / costPrice) * 100).toFixed(2)));
      }
    }

    // 7. Discount
    if (originalPrice > 0) {
      const savings = originalPrice * (discPct / 100);
      setSavingsValue(Number(savings.toFixed(2)));
      setDiscountedPrice(Number((originalPrice - savings).toFixed(2)));
    }

    // 8. Compound Interest: A = P(1 + r/n)^(nt)
    if (ciPrincipal > 0 && ciTenure > 0) {
      const r = ciRate / 100;
      const rComp = 1 + r; // annual compound interval
      const amt = ciPrincipal * Math.pow(rComp, ciTenure);
      setCiResult(Number(amt.toFixed(2)));
    }

    // 9. Salary
    if (annualWage > 0) {
      const taxFrac = taxPercent / 100;
      const netAnnual = annualWage * (1 - taxFrac);
      setSalMonthly(Number((netAnnual / 12).toFixed(2)));
    }

    // 10. Mortgage Home Loan
    if (mortPrice > mortDown && mortYears > 0) {
      const principal = mortPrice - mortDown;
      const r = (mortRate / 12) / 100;
      const n = mortYears * 12;
      const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setMortEmi(Number(emi.toFixed(2)));
    }

    // 11. Fuel trip travel calculator
    if (fuelDistance > 0 && fuelEfficiency > 0) {
      const fuelRequiredL = fuelDistance / fuelEfficiency;
      setFuelRequired(Number(fuelRequiredL.toFixed(2)));
      setFuelTotalCost(Number((fuelRequiredL * fuelPricePerL).toFixed(2)));
    }

  }, [
    pctX, pctY,
    birthdate,
    bmiWeight, bmiHeight,
    emiPrincipal, emiRate, emiTenure,
    vatAmount, vatRate, vatType,
    costPrice, salesPrice,
    originalPrice, discPct,
    ciPrincipal, ciRate, ciTenure,
    annualWage, taxPercent,
    mortPrice, mortDown, mortRate, mortYears,
    fuelDistance, fuelEfficiency, fuelPricePerL
  ]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start" id="calculators-main-grid">
      
      {/* Sidebar Selector list */}
      <div className="md:col-span-1 space-y-2">
        <label className="block text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Navigation Deck</label>
        <div className="flex flex-col space-y-1 bg-slate-100 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800/50 p-1.5 rounded-2xl" id="calculators-selectors-sidebar">
          {CALC_LIST.map((calc) => {
            const Icon = calc.icon;
            const isSelected = activeCalc === calc.id;
            return (
              <button
                key={calc.id}
                onClick={() => setActiveCalc(calc.id)}
                className={`flex items-center space-x-3 w-full p-2.5 rounded-xl transition-all duration-155 text-left group ${isSelected ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700/50 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/20'}`}
              >
                <div className={`p-1.5 rounded-lg active:scale-95 transition-all ${isSelected ? 'bg-blue-50 dark:bg-slate-800 text-blue-500' : 'bg-transparent text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-xs leading-none block font-display">{calc.name}</span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{calc.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculator Playground Display Card */}
      <div className="md:col-span-3 card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-none relative overflow-hidden" id="calculator-workspace-viewport">
        
        {/* AdSense In-Calculator Placement */}
        <div className="absolute top-0 right-0 h-10 w-28 bg-gradient-to-l from-amber-500/10 to-transparent flex items-center justify-end pr-3 select-none">
          <span className="text-[9px] font-mono text-amber-600 uppercase font-semibold">Calibrated v1</span>
        </div>

        {/* 1. PERCENTAGE CALCULATOR */}
        {activeCalc === 'percentage' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Percentage Ratio Calculator</h2>
              <p className="text-xs text-gray-400">Calculate percentage fractions and fractional savings.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Percent (X %)</label>
                <input type="number" value={pctX} onChange={handleNumChange(setPctX)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-gray-50/10 dark:bg-zinc-800 text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Of Total Value (Y)</label>
                <input type="number" value={pctY} onChange={handleNumChange(setPctY)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-gray-50/10 dark:bg-zinc-800 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl leading-relaxed">
              <span className="text-[10px] font-mono font-bold text-blue-500 uppercase block">Direct Equation Solution</span>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{pctResult}</p>
              <div className="text-xs text-gray-400 mt-2 font-sans">
                <strong>Formula:</strong> <code className="font-mono bg-white dark:bg-zinc-900 px-1 rounded">X ÷ 100 × Y</code>
              </div>
            </div>
          </div>
        )}

        {/* 2. AGE CALCULATOR */}
        {activeCalc === 'age' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Precision Age Calculator</h2>
              <p className="text-xs text-gray-400">Calculate precise age in years, months, and calendar days.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Choose Date of Birth</label>
              <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl dark:border-zinc-700 bg-gray-50/10 dark:bg-zinc-800 text-sm focus:outline-none" />
            </div>

            {ageResult && (
              <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold text-blue-500 uppercase block">Results Calculated</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 rounded-lg">
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{ageResult.years}</div>
                    <div className="text-[10px] text-gray-400">Years</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 rounded-lg">
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{ageResult.months}</div>
                    <div className="text-[10px] text-gray-400">Months</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 rounded-lg">
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{ageResult.days}</div>
                    <div className="text-[10px] text-gray-400">Days</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. BMI CALCULATOR */}
        {activeCalc === 'bmi' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Body Mass Index (BMI)</h2>
              <p className="text-xs text-gray-400">Check body metric indices relative to standard global fat indexes.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Weight (kg)</label>
                <input type="number" value={bmiWeight} onChange={handleNumChange(setBmiWeight)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-gray-50/10 dark:bg-zinc-800 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Height (cm)</label>
                <input type="number" value={bmiHeight} onChange={handleNumChange(setBmiHeight)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-gray-50/10 dark:bg-zinc-800 text-sm" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-500 uppercase block">BMI Value</span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{bmiVal}</span>
                <span className="text-xs text-gray-400 block mt-1">Status: <strong>{bmiStatus}</strong></span>
              </div>

              {/* BMI Custom Visual Dial Indicator in SVG */}
              <svg width="120" height="40" className="overflow-visible select-none shrink-0" id="bmi-visual-meter">
                <rect x="0" y="10" width="120" height="8" rx="4" fill="url(#bmiGrad)" />
                <defs>
                  <linearGradient id="bmiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="40%" stopColor="#34d399" />
                    <stop offset="70%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                </defs>
                {/* Pointer placement based on bmi percentage size */}
                <circle cx={Math.min(115, Math.max(5, ((bmiVal - 15) / 20) * 120))} cy="14" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>
        )}

        {/* 4. EMI LOAN CALCULATOR */}
        {activeCalc === 'emi' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">EMI & Loan Calculator</h2>
              <p className="text-xs text-gray-400">Estimate monthly finance loan repayment plans.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Principal (P)</label>
                <input type="number" value={emiPrincipal} onChange={handleNumChange(setEmiPrincipal)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-xs bg-gray-50/10 dark:bg-zinc-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Rate (r % annual)</label>
                <input type="number" step="any" value={emiRate} onChange={handleNumChange(setEmiRate)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-xs bg-gray-50/10 dark:bg-zinc-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Tenure (months)</label>
                <input type="number" value={emiTenure} onChange={handleNumChange(setEmiTenure)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-xs bg-gray-50/10 dark:bg-zinc-800" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl space-y-2 font-sans text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-400 uppercase font-bold">Monthly Rent/EMI</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${emiMonthly.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500">
                <span>Total Interest Payable:</span>
                <span>${emiInterestTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. GST VAT TAX CALCULATOR */}
        {activeCalc === 'vat-gst' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">GST / VAT Calculator</h2>
              <p className="text-xs text-gray-400">Calculate inclusive or exclusive tax fractions.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Tax Ratio (Tax %)</label>
                <input type="number" value={vatRate} onChange={handleNumChange(setVatRate)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Base Amount</label>
                <input type="number" value={vatAmount} onChange={handleNumChange(setVatAmount)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="flex space-x-2">
              <button onClick={() => setVatType('exclusive')} className={`flex-1 py-1 px-3 rounded text-xs font-bold transition-all border ${vatType === 'exclusive' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-250 text-gray-600 dark:text-zinc-400 hover:bg-gray-100'}`}>GST Exclusive</button>
              <button onClick={() => setVatType('inclusive')} className={`flex-1 py-1 px-3 rounded text-xs font-bold transition-all border ${vatType === 'inclusive' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-250 text-gray-600 dark:text-zinc-400 hover:bg-gray-100'}`}>GST Inclusive</button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl text-xs space-y-1.5 leading-relaxed font-mono">
              <div className="flex justify-between"><span>Calculated Tax Charged:</span> <strong className="text-blue-500">${vatTaxVal}</strong></div>
              <div className="flex justify-between"><span>Net Total Sum:</span> <strong className="text-blue-500">${vatNetTotal}</strong></div>
            </div>
          </div>
        )}

        {/* 6. PROFIT MARGIN CALCULATOR */}
        {activeCalc === 'profit-margin' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Profit Margin Calculator</h2>
              <p className="text-xs text-gray-400">Assess wholesale price product margins and markups.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Item Cost Price</label>
                <input type="number" value={costPrice} onChange={handleNumChange(setCostPrice)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Sale Retail Price</label>
                <input type="number" value={salesPrice} onChange={handleNumChange(setSalesPrice)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl text-xs space-y-1.5 leading-relaxed">
              <div className="flex justify-between font-mono"><span>Gross Margin:</span> <strong className="text-blue-600 dark:text-blue-400">{marginPct}%</strong></div>
              <div className="flex justify-between font-mono"><span>Calculated Markup Percentage:</span> <strong className="text-emerald-500">{markupPct}%</strong></div>
            </div>
          </div>
        )}

        {/* 7. DISCOUNT SAVINGS */}
        {activeCalc === 'discount' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Commercial Discount Calculator</h2>
              <p className="text-xs text-gray-400">Calculate retail markdowns, customer nets, and total savings.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Original List Price</label>
                <input type="number" value={originalPrice} onChange={handleNumChange(setOriginalPrice)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Discount Rate ( % Off)</label>
                <input type="number" value={discPct} onChange={handleNumChange(setDiscPct)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 dark:bg-zinc-800/30 rounded-xl text-xs space-y-2 flex justify-between items-center leading-none border border-emerald-50/40">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Discounted Price</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">${discountedPrice}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Savings Value</span>
                <span className="text-lg font-extrabold text-zinc-700 dark:text-zinc-200 mt-1 block">${savingsValue}</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. COMPOUND INTEREST */}
        {activeCalc === 'compound-interest' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Compound Interest Growth</h2>
              <p className="text-xs text-gray-400">Calculate annual capital savings interest growth metrics.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-550 block">Principal</label>
                <input type="number" value={ciPrincipal} onChange={handleNumChange(setCiPrincipal)} className="w-full px-2.5 py-2 border rounded-lg text-xs dark:border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-550 block">Rate (% Year)</label>
                <input type="number" value={ciRate} onChange={handleNumChange(setCiRate)} className="w-full px-2.5 py-2 border rounded-lg text-xs dark:border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-550 block">Tenure (Years)</label>
                <input type="number" value={ciTenure} onChange={handleNumChange(setCiTenure)} className="w-full px-2.5 py-2 border rounded-lg text-xs dark:border-zinc-700" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl font-mono text-sm leading-relaxed text-zinc-700 dark:text-zinc-250 border border-gray-100 dark:border-zinc-700">
              <div className="flex justify-between"><span>Accrued Future Sum:</span> <strong className="text-blue-500">${ciResult.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Interest Accrued:</span> <strong className="text-blue-500">${Math.max(0, (ciResult - ciPrincipal)).toLocaleString()}</strong></div>
            </div>
          </div>
        )}        {/* 9. SALARY INTAX */}
        {activeCalc === 'salary' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Wage & Salary Calculator</h2>
              <p className="text-xs text-gray-400">Determine gross annual salary metrics post taxation brackets.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Annual Gross Wage</label>
                <input type="number" value={annualWage} onChange={handleNumChange(setAnnualWage)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Tax Estimate Bracket ( %)</label>
                <input type="number" value={taxPercent} onChange={handleNumChange(setTaxPercent)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-gray-100 dark:border-zinc-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Net Monthly Salary</span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5 block">${salMonthly.toLocaleString()}</span>
              </div>
              <div className="text-right font-mono text-zinc-400">
                <span>Net Annual:</span> <strong>${(salMonthly * 12).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* 10. MORTGAGE CALCULATOR */}
        {activeCalc === 'mortgage' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Home Mortgage Calculator</h2>
              <p className="text-xs text-gray-400">Compute property mortgages with customizable down deposits.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Property Price</label>
                <input type="number" value={mortPrice} onChange={handleNumChange(setMortPrice)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Down Deposit</label>
                <input type="number" value={mortDown} onChange={handleNumChange(setMortDown)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Mortgage Rate ( %)</label>
                <input type="number" value={mortRate} onChange={handleNumChange(setMortRate)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 block">Length Years</label>
                <input type="number" value={mortYears} onChange={handleNumChange(setMortYears)} className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 text-sm" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl leading-relaxed text-xs">
              <span className="text-[10px] font-bold text-blue-500 uppercase block font-semibold hover:text-blue-600">Estimated Mortgage Rent EMI</span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 block">${mortEmi.toLocaleString()} / monthly</span>
            </div>
          </div>
        )}

        {/* 11. FUEL CALCULATOR */}
        {activeCalc === 'fuel-cost' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Fuel Cost Route Calculator</h2>
              <p className="text-xs text-gray-400">Calculate total travel mileage expenses and consumption.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-550 block">Distance (KM)</label>
                <input type="number" value={fuelDistance} onChange={handleNumChange(setFuelDistance)} className="w-full px-2.5 py-2 border rounded-lg text-xs dark:border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-550 block">Efficiency (KM / L)</label>
                <input type="number" value={fuelEfficiency} onChange={handleNumChange(setFuelEfficiency)} className="w-full px-2.5 py-2 border rounded-lg text-xs dark:border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-550 block">Fuel Price ($ / L)</label>
                <input type="number" value={fuelPricePerL} onChange={handleNumChange(setFuelPricePerL)} className="w-full px-2.5 py-2 border rounded-lg text-xs dark:border-zinc-700" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl flex items-center justify-between text-xs font-mono border border-gray-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Route Cost</span>
                <span className="text-2xl font-extrabold text-blue-500 mt-1 block">${fuelTotalCost}</span>
              </div>
              <div className="text-right">
                <span>Fuel Required:</span> <strong>{fuelRequired} Liters</strong>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default Calculators;
