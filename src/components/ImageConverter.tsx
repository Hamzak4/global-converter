import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Upload, Download, Settings, Sliders, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

interface ImageConverterProps {
  currentLang: 'en' | 'es' | 'ur';
}

type ActiveImageTab = 'convert' | 'compress' | 'resize';

export const ImageConverter: React.FC<ImageConverterProps> = () => {
  const [activeTab, setActiveTab] = useState<ActiveImageTab>('convert');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Format state
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  // Compression state
  const [quality, setQuality] = useState<number>(80); // 10% to 100%
  // Resizing state
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [widthInput, setWidthInput] = useState<number>(0);
  const [heightInput, setHeightInput] = useState<number>(0);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  // Output State
  const [stage, setStage] = useState<'upload' | 'ready' | 'success'>('upload');
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>('');
  const [outputSize, setOutputSize] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processInputImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processInputImage(e.target.files[0]);
    }
  };

  const processInputImage = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Format error: Please drop a safe visual image file (JPG, PNG, WebP, SVG, GIF)');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);

      // Load image into HTML element to inspect native dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidthInput(img.width);
        setHeightInput(img.height);
        originalImageRef.current = img;
        setStage('ready');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (val: number) => {
    setWidthInput(val);
    if (maintainAspect && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalHeight / originalWidth;
      setHeightInput(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeightInput(val);
    if (maintainAspect && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setWidthInput(Math.round(val * ratio));
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const processImageOnCanvas = () => {
    if (!originalImageRef.current) return;
    setProcessing(true);

    setTimeout(async () => {
      try {
        const img = originalImageRef.current!;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D Context failed initialization');
        }

        // 1. Resize Handling
        const targetW = activeTab === 'resize' ? widthInput : img.width;
        const targetH = activeTab === 'resize' ? heightInput : img.height;
        canvas.width = targetW;
        canvas.height = targetH;

        // Clear canvas
        ctx.fillStyle = originalWidth > 0 ? '#FFFFFF' : 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, targetW, targetH);

        // Draw image dynamically with smooth scaling
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // 2. Format & Quality/Compression Handling
        let mime = 'image/png';
        let extension = 'png';
        if (targetFormat === 'jpeg') {
          mime = 'image/jpeg';
          extension = 'jpg';
        } else if (targetFormat === 'webp') {
          mime = 'image/webp';
          extension = 'webp';
        }

        const outQuality = activeTab === 'compress' ? quality / 100 : 0.95;
        const dataUrl = canvas.toDataURL(mime, outQuality);

        // Save state
        const sanitizedBase = fileName.substring(0, fileName.lastIndexOf('.')) || 'converthub_export';
        setOutputName(`${sanitizedBase}_${activeTab}.${extension}`);
        setConvertedUrl(dataUrl);

        // Calculate approximate output size
        const approximateSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        setOutputSize(`${approximateSizeKB} KB`);
        setStage('success');

        // Telemetry tracking
        await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: `image-${activeTab}`,
            fromUnit: fileName.split('.').pop() || 'png',
            toUnit: extension,
            value: 1
          })
        });

      } catch (err) {
        console.error('Image processing fault:', err);
        alert('Image parsing workflow ran into issues.');
      } finally {
        setProcessing(false);
      }
    }, 500);
  };

  const handleReset = () => {
    setImageSrc(null);
    setFileName('');
    setConvertedUrl(null);
    setStage('upload');
  };

  return (
    <div id="image-converter-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Settings Panel Side */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              Target Conversion Feature
            </span>
          </div>

          <div id="image-tabs-picker" className="grid grid-cols-3 gap-2">
            {(['convert', 'compress', 'resize'] as ActiveImageTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (stage === 'success') {
                    setStage('ready');
                  }
                }}
                className={`p-2.5 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {/* Format conversion selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 mb-2">
                <Settings className="h-3.5 w-3.5 text-blue-500" />
                <span>Target Extension Format</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTargetFormat(fmt)}
                    className={`py-2 rounded-xl text-[11px] font-extrabold tracking-wide uppercase border transition-all cursor-pointer ${
                      targetFormat === fmt
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-550 dark:hover:bg-slate-850 text-slate-500'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality control (Only active for compress) */}
            {activeTab === 'compress' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Sliders className="h-3.5 w-3.5 text-blue-500" />
                    <span>Compression Level</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {quality}% Quality
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Lower quality produces highly compressed minor files while visual clarity could reduce slightly.
                </p>
              </motion.div>
            )}

            {/* Resizing dimensions (Only active for Resize) */}
            {activeTab === 'resize' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Sizing Parameters (px)
                  </label>
                  <button
                    onClick={() => setMaintainAspect(!maintainAspect)}
                    className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border transition-all ${
                      maintainAspect
                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {maintainAspect ? 'Maintain Aspect' : 'Free Transform'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={widthInput}
                      onChange={(e) => handleWidthChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={heightInput}
                      onChange={(e) => handleHeightChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {originalWidth > 0 && (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Original size:</span>
                    <span>{originalWidth} x {originalHeight} px</span>
                  </div>
                )}
              </motion.div>
            )}

            {stage !== 'upload' && (
              <button
                onClick={processImageOnCanvas}
                disabled={processing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>Processing Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>Process & Export</span>
                  </>
                )}
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Upload & Viewer panel Side */}
      <div className="lg:col-span-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[460px] flex flex-col justify-between">
          
          <div className="border-b border-slate-150 dark:border-slate-800 pb-4 flex justify-between items-center mb-6">
            <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon className="h-4.5 w-4.5 text-blue-500" />
              <span>SaaS Live Image Engine</span>
            </span>
            {stage !== 'upload' && (
              <button
                onClick={handleReset}
                className="text-xs font-extrabold text-red-500 hover:text-red-600 flex items-center space-x-1"
              >
                <span>Remove Image</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {stage === 'upload' && (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerInput}
                  className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="h-14 w-14 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Submit Image Asset to workspace
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                    JPG, PNG, WebP or SVG format. Perform secure local browser conversions instantenously.
                  </p>
                </motion.div>
              )}

              {stage === 'ready' && imageSrc && (
                <motion.div
                  key="preview-ready"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 max-w-lg mx-auto w-full text-center"
                >
                  <p className="text-xs text-slate-400 truncate">
                    Uploaded: <span className="font-semibold text-slate-700 dark:text-slate-200">{fileName}</span>
                  </p>
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 overflow-hidden max-h-64 flex items-center justify-center p-3">
                    <img
                      src={imageSrc}
                      alt="Source workspace workspace"
                      className="max-h-56 max-w-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Image properties: {originalWidth}x{originalHeight} pixels • Ready to configure target exports.
                  </p>
                </motion.div>
              )}

              {stage === 'success' && convertedUrl && (
                <motion.div
                  key="processed-display"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 max-w-lg mx-auto w-full text-center"
                >
                  <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-1">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                    Image Export Successfully Compiled!
                  </h4>
                  <div className="relative rounded-2xl border border-blue-100 bg-emerald-50/10 dark:bg-emerald-950/20 overflow-hidden max-h-64 flex items-center justify-center p-3">
                    <img
                      src={convertedUrl}
                      alt="Converted results workspace"
                      className="max-h-56 max-w-full object-contain rounded-lg shadow"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl grid grid-cols-2 gap-2 text-left">
                    <div className="border-r border-slate-200 dark:border-slate-800 pr-2">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">File output name</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{outputName}</p>
                    </div>
                    <div className="pl-2">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Approximate size</p>
                      <p className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">{outputSize}</p>
                    </div>
                  </div>

                  <div className="flex space-x-3 justify-center">
                    <a
                      href={convertedUrl}
                      download={outputName}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow shadow-blue-600/15 flex items-center space-x-2 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Clean Image</span>
                    </a>
                    <button
                      onClick={handleReset}
                      className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wide rounded-xl"
                    >
                      Process Another
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );
};
