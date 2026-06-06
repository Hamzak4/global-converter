import React, { useState, useEffect } from 'react';
import { FileCode, ShieldAlert, Binary, Link2, CaseSensitive, FileText, Percent, Calculator, Copy, Check } from 'lucide-react';

interface TextToolsConverterProps {
  currentLang: 'en' | 'es' | 'ur';
}

type TextToolId = 'json' | 'base64' | 'case' | 'url' | 'counter' | 'percentage' | 'calculator';

export const TextToolsConverter: React.FC<TextToolsConverterProps> = () => {
  const [activeTool, setActiveTool] = useState<TextToolId>('json');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // JSON States
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Base64 Modes
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');

  // URL Modes
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');

  // Word Counter Stats
  const [stats, setStats] = useState({
    chars: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    minutes: 0
  });

  // Percentage states
  const [pctX, setPctX] = useState<string>('');
  const [pctY, setPctY] = useState<string>('');
  const [pctResult, setPctResult] = useState<string>('');
  const [pctType, setPctType] = useState<'of' | 'percent'>('of'); // 'of' = X% of Y, 'percent' = what % is X of Y

  // Calculator states
  const [calcExpr, setCalcExpr] = useState<string>('');
  const [calcResult, setCalcResult] = useState<string>('');

  const triggerCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. JSON formatting
  const handleFormatJson = (minify: boolean = false) => {
    setJsonError(null);
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }
    try {
      const parsed = JSON.parse(inputText);
      const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      setOutputText(output);
    } catch (err: any) {
      setJsonError(err.message || 'Malformed JSON format structure');
      setOutputText('');
    }
  };

  // 2. Base64
  const handleBase64Process = (mode: 'encode' | 'decode' = b64Mode) => {
    try {
      if (mode === 'encode') {
        setOutputText(btoa(unescape(encodeURIComponent(inputText))));
      } else {
        setOutputText(decodeURIComponent(escape(atob(inputText))));
      }
    } catch (e) {
      setOutputText('Parsing failed: Invalid characters for Base64 standard conversion');
    }
  };

  // 3. Case converter
  const handleCaseChange = (type: 'upper' | 'lower' | 'title' | 'sentence') => {
    if (!inputText) return;
    if (type === 'upper') {
      setOutputText(inputText.toUpperCase());
    } else if (type === 'lower') {
      setOutputText(inputText.toLowerCase());
    } else if (type === 'title') {
      const title = inputText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      setOutputText(title);
    } else if (type === 'sentence') {
      const sentence = inputText.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
      setOutputText(sentence);
    }
  };

  // 4. URL Encoder
  const handleUrlProcess = (mode: 'encode' | 'decode' = urlMode) => {
    try {
      if (mode === 'encode') {
        setOutputText(encodeURIComponent(inputText));
      } else {
        setOutputText(decodeURIComponent(inputText));
      }
    } catch (e) {
      setOutputText('Parsing failed: Invalid URL components mapped');
    }
  };

  // 5. Word counter live effect
  useEffect(() => {
    if (activeTool !== 'counter') return;
    const chars = inputText.length;
    const trimmed = inputText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const sentences = trimmed ? trimmed.split(/[\.\!\?]+/).filter(Boolean).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter(Boolean).length : 0;
    const minutes = Math.ceil(words / 225); // average reading time

    setStats({ chars, words, sentences, paragraphs, minutes });
  }, [inputText, activeTool]);

  // 6. Percentage runner
  const calculatePercentage = () => {
    const x = parseFloat(pctX);
    const y = parseFloat(pctY);
    if (isNaN(x) || isNaN(y)) {
      setPctResult('Please enter valid numerical inputs');
      return;
    }
    if (pctType === 'of') {
      // What is X% of Y?
      const res = (x / 100) * y;
      setPctResult(`${x}% of ${y} equals: ${res.toLocaleString()}`);
    } else {
      // What % is X of Y?
      if (y === 0) {
        setPctResult('Denominator cannot equal zero');
        return;
      }
      const res = (x / y) * 100;
      setPctResult(`${x} is ${res.toFixed(4)}% of ${y}`);
    }
  };

  // 7. Scientific Calculator functions
  const handleCalcPress = (char: string) => {
    if (char === 'C') {
      setCalcExpr('');
      setCalcResult('');
    } else if (char === '=') {
      try {
        // Sanitize mathematical expressions safely
        const sanitizedExpression = calcExpr
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/pi/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/\^/g, '**');

        const result = new Function(`return (${sanitizedExpression})`)();
        setCalcResult(String(result));
      } catch (err) {
        setCalcResult('Syn Error');
      }
    } else {
      setCalcExpr(prev => prev + char);
    }
  };

  return (
    <div id="text-data-converter-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Selector Side Tabs */}
      <div className="lg:col-span-3 space-y-1.5Packed">
        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase block mb-4 px-1">
          Text / Utility Kits
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {([
            { id: 'json', label: 'JSON Formatter', icon: FileCode },
            { id: 'base64', label: 'Base64 Tool', icon: Binary },
            { id: 'case', label: 'Case Converter', icon: CaseSensitive },
            { id: 'url', label: 'URL Parameter', icon: Link2 },
            { id: 'counter', label: 'Word Counter', icon: FileText },
            { id: 'percentage', label: 'Percentage Calc', icon: Percent },
            { id: 'calculator', label: 'Scientific Calc', icon: Calculator }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTool === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTool(tab.id);
                  setInputText('');
                  setOutputText('');
                  setJsonError(null);
                }}
                className={`text-left p-3.5 rounded-2xl border text-xs font-bold flex items-center space-x-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main interactive panel */}
      <div className="lg:col-span-9">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[460px] flex flex-col justify-between">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span>{activeTool.toUpperCase()} Sandbox Workspace</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure inputs and copy formatted output records instantly.</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-4">

            {/* 1. Scientific Calculator Specific Layout */}
            {activeTool === 'calculator' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-2xl mx-auto">
                <div className="md:col-span-12">
                  <div className="bg-slate-100 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-850 text-right">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 block tracking-wider uppercase mb-1">
                      Live Formula Tracked
                    </span>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 min-h-[20px] tracking-wide break-all">
                      {calcExpr || '0'}
                    </p>
                    <p className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-2 min-h-[30px] break-all">
                      {calcResult || '0'}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-12 grid grid-cols-5 gap-2">
                  {/* Scientific math functions */}
                  {['sin(', 'cos(', 'tan(', 'pi', 'C', 'log(', 'ln(', 'sqrt(', '^', '/', '7', '8', '9', '*', '(', '4', '5', '6', '-', ')', '1', '2', '3', '+', 'e', '0', '.', '='].map((btn) => {
                    const isOperator = ['/', '*', '-', '+', '='].includes(btn);
                    const isControl = btn === 'C';
                    const isFunc = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt('].includes(btn);

                    return (
                      <button
                        key={btn}
                        onClick={() => handleCalcPress(btn)}
                        className={`p-3.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          isControl ? 'bg-red-500 hover:bg-red-650 text-white col-span-1' :
                          btn === '=' ? 'bg-blue-600 hover:bg-blue-700 text-white col-span-2' :
                          isOperator ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                          isFunc ? 'bg-slate-100 hover:bg-slate-200 text-slate-650 dark:bg-slate-800 dark:text-slate-300 text-[10px]' :
                          'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {btn.replace('(', '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Percentage Calc */}
            {activeTool === 'percentage' && (
              <div className="space-y-6 w-full max-w-lg mx-auto py-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => { setPctType('of'); setPctResult(''); }}
                      className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        pctType === 'of' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Calculate: X% of Y
                    </button>
                    <button
                      onClick={() => { setPctType('percent'); setPctResult(''); }}
                      className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        pctType === 'percent' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Calculate: % of X is Y
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1 uppercase">
                          {pctType === 'of' ? 'Percentage (X)' : 'Value (X)'}
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 15"
                          value={pctX}
                          onChange={(e) => setPctX(e.target.value)}
                          className="w-full bg-white dark:bg-slate-850 p-2.5 rounded-xl text-xs font-mono text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1 uppercase">
                          {pctType === 'of' ? 'Base Value (Y)' : 'Total Base (Y)'}
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 250"
                          value={pctY}
                          onChange={(e) => setPctY(e.target.value)}
                          className="w-full bg-white dark:bg-slate-850 p-2.5 rounded-xl text-xs font-mono text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={calculatePercentage}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow"
                    >
                      Calculate Formula
                    </button>
                  </div>

                  {pctResult && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs font-bold font-mono text-center">
                      {pctResult}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. standard double text box layout (JSON, base64, Case, URL) */}
            {activeTool !== 'calculator' && activeTool !== 'percentage' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                
                {/* Inputs */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wide uppercase">Raw Input</span>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      activeTool === 'json' ? '{ "status": "active", "convertersCount": 6 }' :
                      activeTool === 'base64' ? 'Enter string to encode/decode...' :
                      activeTool === 'url' ? 'https://converthub.com/search?q=pdf converter' :
                      'Type or copy strings into here...'
                    }
                    className="w-full h-64 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-xs font-mono text-slate-700 dark:text-slate-350 border border-slate-150 dark:border-slate-850 focus:outline-none focus:border-blue-500 placeholder-slate-400"
                  />
                </div>

                {/* Outputs */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center h-4.5">
                    <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wide uppercase">Export Output</span>
                    {outputText && (
                      <button
                        onClick={() => triggerCopy(outputText)}
                        className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center space-x-1"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Output</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={outputText}
                      placeholder="Processed records output..."
                      className="w-full h-64 bg-slate-50 dark:bg-slate-950/70 rounded-2xl p-4 text-xs font-mono text-blue-600 dark:text-blue-400 border border-slate-150 dark:border-slate-850 focus:outline-none"
                    />
                    {jsonError && (
                      <div className="absolute inset-x-0 bottom-0 p-3.5 bg-red-500/10 dark:bg-red-950/30 text-red-500 text-[10px] font-mono font-bold rounded-b-2xl border-t border-red-500/20 flex items-start space-x-1.5 leading-snug">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>JSON Parsing Error: {jsonError}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Controls for current active tool */}
            {activeTool === 'json' && (
              <div className="flex space-x-2 justify-end mt-2">
                <button
                  onClick={() => handleFormatJson(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow cursor-pointer"
                >
                  Beautify Output
                </button>
                <button
                  onClick={() => handleFormatJson(true)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer"
                >
                  Minify String
                </button>
              </div>
            )}

            {activeTool === 'base64' && (
              <div className="flex space-x-3 items-center justify-between mt-2">
                <div className="flex space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setB64Mode('encode')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      b64Mode === 'encode' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Encode to Base64
                  </button>
                  <button
                    onClick={() => setB64Mode('decode')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      b64Mode === 'decode' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Decode Base64
                  </button>
                </div>
                <button
                  onClick={() => handleBase64Process()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow cursor-pointer"
                >
                  Run Conversion
                </button>
              </div>
            )}

            {activeTool === 'case' && (
              <div className="flex flex-wrap gap-2 justify-end mt-2">
                <button
                  onClick={() => handleCaseChange('upper')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200 text-xs font-black uppercase rounded-xl cursor-pointer"
                >
                  UPPERCASE
                </button>
                <button
                  onClick={() => handleCaseChange('lower')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200 text-xs font-black uppercase rounded-xl cursor-pointer"
                >
                  lowercase
                </button>
                <button
                  onClick={() => handleCaseChange('title')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200 text-xs font-black uppercase rounded-xl cursor-pointer"
                >
                  Title Case
                </button>
                <button
                  onClick={() => handleCaseChange('sentence')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200 text-xs font-black uppercase rounded-xl cursor-pointer"
                >
                  Sentence Case
                </button>
              </div>
            )}

            {activeTool === 'url' && (
              <div className="flex space-x-3 items-center justify-between mt-2">
                <div className="flex space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setUrlMode('encode')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      urlMode === 'encode' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Percent Encode URL
                  </button>
                  <button
                    onClick={() => setUrlMode('decode')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      urlMode === 'decode' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Decode URL Standard
                  </button>
                </div>
                <button
                  onClick={() => handleUrlProcess()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow cursor-pointer"
                >
                  Run Conversion
                </button>
              </div>
            )}

            {activeTool === 'counter' && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                {[
                  { value: stats.chars, label: 'Characters' },
                  { value: stats.words, label: 'Words Count' },
                  { value: stats.sentences, label: 'Sentences' },
                  { value: stats.paragraphs, label: 'Paragraphs' },
                  { value: `${stats.minutes}m`, label: 'Est Read Time' }
                ].map((stat, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl">
                    <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
