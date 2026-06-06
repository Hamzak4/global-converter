import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Upload, ArrowRight, Download, CheckCircle2, Trash2, Layers, Scissors, FileCode } from 'lucide-react';

interface DocumentConverterProps {
  currentLang: 'en' | 'es' | 'ur';
}

type DocToolId = 'pdf-to-word' | 'word-to-pdf' | 'pdf-compress' | 'merge-pdf' | 'split-pdf';

interface DocTool {
  id: DocToolId;
  name: string;
  description: string;
  inputAccept: string;
  multiple: boolean;
  buttonText: string;
}

const DOC_TOOLS: DocTool[] = [
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Transform scan or original layout PDF files into fully editable DOCX Word records.',
    inputAccept: '.pdf',
    multiple: false,
    buttonText: 'Convert PDF'
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert DOCX or DOC document layouts into universally readable, crisp corporate PDFs.',
    inputAccept: '.docx,.doc',
    multiple: false,
    buttonText: 'Convert Word'
  },
  {
    id: 'pdf-compress',
    name: 'PDF Compressor',
    description: 'Optimize PDF layouts, shrinking resource allocations up to 90% without losing visual clarity.',
    inputAccept: '.pdf',
    multiple: false,
    buttonText: 'Compress PDF'
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple standalone PDFs into a single, cohesive serial publication layout.',
    inputAccept: '.pdf',
    multiple: true,
    buttonText: 'Merge PDFs'
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Decompose a continuous multipage PDF structure into individual standalone single-page PDFs.',
    inputAccept: '.pdf',
    multiple: false,
    buttonText: 'Split PDF'
  }
];

export const DocumentConverter: React.FC<DocumentConverterProps> = () => {
  const [activeToolId, setActiveToolId] = useState<DocToolId>('pdf-to-word');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'upload' | 'progress' | 'success' | 'error'>('upload');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTool = DOC_TOOLS.find(t => t.id === activeToolId)!;

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (selected: File[]) => {
    const extension = activeTool.inputAccept;
    const acceptedList = extension.split(',');
    
    // Check if extensions match
    const filtered = selected.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return acceptedList.some(acc => acc.trim() === ext);
    });

    if (filtered.length === 0) {
      alert(`Invalid format. Please submit files with extensions matching: ${activeTool.inputAccept}`);
      return;
    }

    if (activeTool.multiple) {
      setFiles(prev => [...prev, ...filtered]);
    } else {
      setFiles([filtered[0]]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const executeConversion = async () => {
    if (files.length === 0) return;
    setStage('progress');
    setProgress(15);

    // Simulated multi-stage enterprise conversion process
    const steps = [30, 52, 78, 100];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(steps[i]);
    }

    // Prepare simulated high-quality download output
    const primaryFile = files[0];
    const baseName = primaryFile.name.substring(0, primaryFile.name.lastIndexOf('.'));
    
    let outName = '';
    let mime = 'application/octet-stream';
    let dummyBlobContent = 'ConvertHub Simulated Production Output: ' + new Date().toISOString();

    if (activeToolId === 'pdf-to-word') {
      outName = `${baseName}_converted.docx`;
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (activeToolId === 'word-to-pdf') {
      outName = `${baseName}_rendered.pdf`;
      mime = 'application/pdf';
    } else if (activeToolId === 'pdf-compress') {
      outName = `${baseName}_optimized.pdf`;
      mime = 'application/pdf';
    } else if (activeToolId === 'merge-pdf') {
      outName = `converthub_merged_package_${Math.floor(1000 + Math.random() * 9000)}.pdf`;
      mime = 'application/pdf';
    } else if (activeToolId === 'split-pdf') {
      outName = `${baseName}_part_1_extracted.pdf`;
      mime = 'application/pdf';
    }

    const blob = new Blob([dummyBlobContent], { type: mime });
    const url = URL.createObjectURL(blob);

    setDownloadUrl(url);
    setDownloadName(outName);
    setStage('success');

    // Save conversion log telemetry in background
    try {
      await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeToolId,
          fromUnit: files.map(f => f.name.split('.').pop()).join('+'),
          toUnit: outName.split('.').pop() || 'pdf',
          value: files.length
        })
      });
    } catch (e) {
      console.warn("Conversion telemetry fail:", e);
    }
  };

  const resetTool = () => {
    setFiles([]);
    setProgress(0);
    setStage('upload');
    setDownloadUrl(null);
    setDownloadName('');
  };

  return (
    <div id="document-converter-root" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Sidebar Tool select cards */}
      <div className="lg:col-span-1 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1.5Packed font-mono">
          Convert Toolkits
        </span>
        {DOC_TOOLS.map((tool) => {
          const isSelected = activeToolId === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveToolId(tool.id);
                resetTool();
              }}
              className={`w-full text-left p-3.5 rounded-2xl border text-xs font-semibold flex items-center space-x-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {tool.id === 'pdf-to-word' && <FileText className="h-4.5 w-4.5" />}
                {tool.id === 'word-to-pdf' && <FileCode className="h-4.5 w-4.5" />}
                {tool.id === 'pdf-compress' && <Scissors className="h-4.5 w-4.5" />}
                {tool.id === 'merge-pdf' && <Layers className="h-4.5 w-4.5" />}
                {tool.id === 'split-pdf' && <Scissors className="h-4.5 w-4.5" />}
              </div>
              <div className="truncate">
                <p className="font-extrabold leading-none">{tool.name}</p>
                <p className={`text-[10px] mt-1 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {tool.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Drag/Upload Area */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-md min-h-[460px] flex flex-col justify-between">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>{activeTool.name} Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">{activeTool.description}</p>
            </div>
            <span className="text-[10px] font-mono py-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
              {activeTool.inputAccept} file
            </span>
          </div>

          <AnimatePresence mode="wait">
            {stage === 'upload' && (
              <motion.div
                key="upload-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col justify-center"
              >
                {files.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerSelect}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                        : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept={activeTool.inputAccept}
                      multiple={activeTool.multiple}
                      className="hidden"
                    />
                    <div className="h-14 w-14 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Drag & Drop your document here
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Or browse local drive directories to trigger explorer
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                      {activeTool.inputAccept.split(',').map(ext => (
                        <span key={ext} className="text-[9px] font-mono tracking-wider font-bold py-0.5 px-2 bg-slate-100 dark:bg-slate-800 rounded uppercase text-slate-500">
                          {ext.replace('.', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Queued Documents ({files.length})
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {files.map((file, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-3 truncate">
                            <FileText className="h-6 w-6 text-blue-500 shrink-0" />
                            <div className="truncate text-left">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {activeTool.multiple && (
                      <button
                        onClick={triggerSelect}
                        className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                      >
                        <span>+ Add more files</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {stage === 'progress' && (
              <motion.div
                key="progress-container"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-12"
              >
                <div className="h-2 w-full max-w-md bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 animate-pulse">
                  Converting: {progress}%
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-normal">
                  ConvertHub SaaS parsing system architecture is compiling documents. Please do not close this browser frame window tags.
                </p>
              </motion.div>
            )}

            {stage === 'success' && (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                  Conversion Complete!
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 truncate max-w-sm">
                  Successfully converted file to <span className="font-semibold text-slate-700 dark:text-slate-200">{downloadName}</span>
                </p>

                <div className="mt-6 flex space-x-3">
                  <a
                    href={downloadUrl || '#'}
                    download={downloadName}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </a>
                  <button
                    onClick={resetTool}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 font-bold text-xs uppercase tracking-wide rounded-xl shrink-0"
                  >
                    Convert Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {stage === 'upload' && files.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end">
              <button
                onClick={executeConversion}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 flex items-center space-x-2 cursor-pointer"
              >
                <span>{activeTool.buttonText}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
