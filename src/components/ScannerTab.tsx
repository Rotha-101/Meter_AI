import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Hash, ScanLine, AlertCircle, CheckCircle2, Save, Trash2, Play } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { extractMeterData, MeterData } from '../services/geminiService';
import { MeterRecord } from '../data/mockData';

interface ScannerTabProps {
  onSaveRecord: (record: Omit<MeterRecord, 'id'>) => void;
}

interface UploadItem {
  id: string;
  base64: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  results?: MeterData;
  error?: string;
  pipelineStep: number;
  feederName: string;
  readingDate: string;
  isSaved: boolean;
}

export function ScannerTab({ onSaveRecord }: ScannerTabProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const handleImagesSelected = (base64s: string[]) => {
    const newItems: UploadItem[] = base64s.map(base64 => ({
      id: Math.random().toString(36).substring(2, 9),
      base64,
      status: 'idle',
      pipelineStep: 0,
      feederName: 'Feeder F1',
      readingDate: new Date().toISOString().split('T')[0],
      isSaved: false,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const processItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.status === 'processing') return;

    updateItem(id, { status: 'processing', error: undefined, results: undefined, pipelineStep: 1, isSaved: false });

    try {
      setTimeout(() => updateItem(id, { pipelineStep: 2 }), 800);
      setTimeout(() => updateItem(id, { pipelineStep: 3 }), 1600);

      const data = await extractMeterData(item.base64);
      
      updateItem(id, { status: 'success', results: data, pipelineStep: 4 });
    } catch (err) {
      updateItem(id, { 
        status: 'error', 
        error: err instanceof Error ? err.message : 'An unknown error occurred',
        pipelineStep: 0 
      });
    }
  };

  const processAll = async () => {
    setIsProcessingAll(true);
    // Process sequentially to avoid rate limits
    const idleItems = items.filter(i => i.status === 'idle');
    for (const item of idleItems) {
      await processItem(item.id);
    }
    setIsProcessingAll(false);
  };

  const handleSave = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !item.results || item.isSaved) return;
    
    const numericReading = parseInt(item.results.energyReading.replace(/\D/g, ''), 10) || 0;

    onSaveRecord({
      date: item.readingDate,
      feeder: item.feederName,
      serialNumber: item.results.serialNumber,
      registerCode: item.results.registerCode,
      reading: numericReading,
    });
    
    updateItem(id, { isSaved: true });
  };

  const saveAll = () => {
    items.forEach(item => {
      if (item.status === 'success' && item.results && !item.isSaved) {
        handleSave(item.id);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Uploader Section */}
      <div className="bg-[#141414] p-6 rounded-2xl shadow-sm border border-[#2a2a2a]">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-neutral-200">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a1a1a] text-xs font-bold text-neutral-400">1</span>
          Upload Meter Photos
        </h2>
        <ImageUploader 
          onImagesSelected={handleImagesSelected} 
        />
        
        {items.length > 0 && (
          <div className="mt-6 flex justify-between items-center border-t border-[#2a2a2a] pt-6">
            <p className="text-sm text-neutral-400 font-medium">
              {items.length} image{items.length !== 1 ? 's' : ''} uploaded
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setItems([])}
                className="px-4 py-2 rounded-xl font-medium text-neutral-400 hover:bg-[#1a1a1a] hover:text-neutral-200 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={processAll}
                disabled={isProcessingAll || items.every(i => i.status !== 'idle')}
                className={`
                  px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all
                  ${isProcessingAll || items.every(i => i.status !== 'idle')
                    ? 'bg-[#1a1a1a] text-neutral-500 cursor-not-allowed' 
                    : 'bg-[#f97316] text-white hover:bg-[#ea580c] shadow-md hover:shadow-lg active:scale-[0.98]'}
                `}
              >
                {isProcessingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Process All Idle
                  </>
                )}
              </button>
              <button
                onClick={saveAll}
                disabled={!items.some(i => i.status === 'success' && !i.isSaved)}
                className={`
                  px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all
                  ${!items.some(i => i.status === 'success' && !i.isSaved)
                    ? 'bg-[#1a1a1a] text-neutral-500 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-[0.98]'}
                `}
              >
                <Save size={18} />
                Save All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-6">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] rounded-2xl shadow-sm border border-[#2a2a2a] overflow-hidden flex flex-col lg:flex-row"
            >
              {/* Left: Image & Status */}
              <div className="w-full lg:w-2/5 bg-[#0a0a0a] p-6 border-b lg:border-b-0 lg:border-r border-[#2a2a2a] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-neutral-300">Image {index + 1}</h3>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove image"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="relative rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#141414] flex-1 min-h-[200px] flex items-center justify-center">
                  <img 
                    src={item.base64} 
                    alt={`Meter ${index + 1}`} 
                    className={`max-w-full max-h-[300px] object-contain ${item.status === 'processing' ? 'opacity-50 blur-sm' : ''} transition-all duration-300`}
                  />
                  {item.status === 'processing' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#141414]/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-[#f97316] text-sm border border-[#2a2a2a]">
                        <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    </div>
                  )}
                </div>

                {item.status === 'idle' && (
                  <button
                    onClick={() => processItem(item.id)}
                    className="mt-4 w-full py-2.5 bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <ScanLine size={18} />
                    Analyze This Meter
                  </button>
                )}

                {item.status === 'error' && (
                  <div className="mt-4 flex items-start gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="font-medium">{item.error}</p>
                  </div>
                )}
              </div>

              {/* Right: Results & Save */}
              <div className="w-full lg:w-3/5 p-6 flex flex-col justify-center">
                {item.status === 'idle' && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-60">
                    <ScanLine size={48} className="mb-4 opacity-20" />
                    <p className="text-sm text-center px-8">
                      Click "Analyze" to extract meter values.
                    </p>
                  </div>
                )}

                {item.status === 'processing' && (
                  <div className="space-y-6 max-w-sm mx-auto w-full">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 text-center">Pipeline Status</h3>
                    <PipelineStep number={1} title="Detect Regions of Interest (ROI)" isActive={item.pipelineStep === 1} isDone={item.pipelineStep > 1} />
                    <PipelineStep number={2} title="Extract Text via OCR" isActive={item.pipelineStep === 2} isDone={item.pipelineStep > 2} />
                    <PipelineStep number={3} title="Filter & Format Output" isActive={item.pipelineStep === 3} isDone={item.pipelineStep > 3} />
                  </div>
                )}

                {item.status === 'success' && item.results && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ResultCard icon={<Activity size={18} className="text-[#f97316]" />} label="Register Code" value={item.results.registerCode} />
                      <ResultCard icon={<Hash size={18} className="text-emerald-500" />} label="Serial Number" value={item.results.serialNumber} />
                      <div className="sm:col-span-2">
                        <ResultCard icon={<Zap size={18} className="text-amber-500" />} label="Energy Reading" value={item.results.energyReading} highlight />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#2a2a2a]">
                      <h3 className="text-sm font-semibold text-neutral-300 mb-4">Save to Database</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Feeder Name</label>
                          <input 
                            type="text" 
                            value={item.feederName}
                            onChange={(e) => updateItem(item.id, { feederName: e.target.value })}
                            className="w-full px-3 py-2 bg-transparent border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316] text-sm text-neutral-100 placeholder-neutral-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Date</label>
                          <input 
                            type="date" 
                            value={item.readingDate}
                            onChange={(e) => updateItem(item.id, { readingDate: e.target.value })}
                            className="w-full px-3 py-2 bg-transparent border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316] text-sm text-neutral-100 placeholder-neutral-600"
                            style={{ colorScheme: 'dark' }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={item.isSaved}
                        className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                          item.isSaved 
                            ? 'bg-emerald-500/10 text-emerald-500 cursor-default border border-emerald-500/20' 
                            : 'bg-[#f97316] text-white hover:bg-[#ea580c] shadow-md active:scale-[0.98]'
                        }`}
                      >
                        {item.isSaved ? (
                          <>
                            <CheckCircle2 size={18} />
                            Saved to Table
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save Record
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PipelineStep({ number, title, isActive, isDone }: { number: number, title: string, isActive: boolean, isDone: boolean }) {
  return (
    <div className={`flex items-center gap-3 transition-opacity duration-300 ${isActive || isDone ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${isDone ? 'bg-emerald-500/20 text-emerald-500' : isActive ? 'bg-[#f97316] text-white animate-pulse' : 'bg-[#2a2a2a] text-neutral-500'}
      `}>
        {isDone ? <CheckCircle2 size={14} /> : number}
      </div>
      <span className={`text-sm font-medium ${isActive ? 'text-[#f97316]' : 'text-neutral-400'}`}>
        {title}
      </span>
    </div>
  );
}

function ResultCard({ icon, label, value, highlight = false }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <div className={`
      p-3 rounded-2xl border flex items-start gap-3
      ${highlight ? 'bg-[#f97316]/10 border-[#f97316]/20' : 'bg-[#1a1a1a] border-[#2a2a2a]'}
    `}>
      <div className={`p-2 rounded-xl bg-[#0a0a0a] shadow-sm border border-[#2a2a2a] shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-base font-mono font-medium text-neutral-100 truncate" title={value}>
          {value || "Not found"}
        </p>
      </div>
    </div>
  );
}
