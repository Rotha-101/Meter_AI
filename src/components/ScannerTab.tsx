import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { extractMeterData, MeterData } from '../services/apiService';
import { MeterRecord } from '../data/mockData';
import { ServerConfig, ScannedItem } from '../types';
import { CheckCircle2, AlertCircle, Loader2, Save, Trash2, Plus, Play, X, ZoomIn } from 'lucide-react';

interface ScannerTabProps {
  onSaveRecord: (record: Omit<MeterRecord, 'id'>) => void;
  serverConfig: ServerConfig;
  isConnected: boolean;
  items: ScannedItem[];
  setItems: React.Dispatch<React.SetStateAction<ScannedItem[]>>;
}

export function ScannerTab({ onSaveRecord, serverConfig, isConnected, items, setItems }: ScannerTabProps) {
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [zoomedItem, setZoomedItem] = useState<ScannedItem | null>(null);

  const handleImagesSelected = (base64s: string[]) => {
    const newItems: ScannedItem[] = base64s.map(b64 => ({
      id: Math.random().toString(36).substring(2, 9),
      base64: b64,
      status: 'pending',
      saved: false
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const processItem = async (id: string, base64: string) => {
    if (!isConnected) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'error', error: 'Not connected to server. Please connect in the Server Connection tab.' } : item));
      return;
    }

    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'processing', error: undefined } : item));

    try {
      const data = await extractMeterData(base64, serverConfig);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'success', results: data } : item));
    } catch (err) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'error', error: err instanceof Error ? err.message : 'Unknown error occurred' } : item));
    }
  };

  const processAllPending = async () => {
    setIsProcessingBatch(true);
    // Get pending items at the start of the batch
    const pendingItems = items.filter(i => i.status === 'pending' || i.status === 'error');
    
    for (const item of pendingItems) {
      if (!isConnected) break;
      await processItem(item.id, item.base64);
    }
    setIsProcessingBatch(false);
  };

  const handleSave = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !item.results || item.saved) return;

    const numericReading = parseInt(item.results.energyReading.replace(/\D/g, ''), 10) || 0;

    const extractedDate = item.results.timestamp 
      ? item.results.timestamp.split(' ')[0].replace(/\//g, '-') 
      : new Date().toISOString().split('T')[0];

    onSaveRecord({
      date: extractedDate,
      feeder: 'Feeder 1',
      serialNumber: item.results.serialNumber,
      registerCode: item.results.registerCode,
      model: item.results.meterModel || '',
      brand: item.results.meterBrand || '',
      mode: item.results.registerCode === '1.8.0' ? 'Discharge' : item.results.registerCode === '2.8.0' ? 'Charge' : 'Discharge',
      yesterdayPower: 0,
      todayPower: numericReading,
      powerMade: 0,
      photoBase64: item.base64,
    });

    setItems(prev => prev.map(i => i.id === id ? { ...i, saved: true } : i));
  };

  const handleSaveAll = () => {
    items.forEach(item => {
      if (item.status === 'success' && !item.saved) {
        handleSave(item.id);
      }
    });
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all images?')) {
      setItems([]);
    }
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateResult = (id: string, field: keyof MeterData, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.results) {
        return { ...item, results: { ...item.results, [field]: value } };
      }
      return item;
    }));
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-[#141414] p-8 rounded-2xl shadow-sm border border-[#2a2a2a]">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-200">Batch Meter Scanner</h2>
            <p className="text-neutral-500 mt-2">Upload multiple meter photos to extract data automatically.</p>
          </div>
          <ImageUploader onImagesSelected={handleImagesSelected} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 relative">
      {/* Zoom Modal */}
      {zoomedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8" onClick={() => setZoomedItem(null)}>
          <div className="relative max-w-7xl w-full h-full flex flex-col lg:flex-row gap-6 items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setZoomedItem(null)}
              className="absolute top-0 right-0 lg:-top-4 lg:-right-4 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors z-10 border border-white/10"
            >
              <X size={24} />
            </button>
            
            {/* Image Side */}
            <div className="flex-1 w-full h-1/2 lg:h-full flex items-center justify-center bg-[#0a0a0a] rounded-2xl border border-[#2a2a2a] overflow-hidden p-2">
              <img src={zoomedItem.base64} alt="Zoomed Meter" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>

            {/* Results Side */}
            <div className="w-full lg:w-[500px] shrink-0 bg-[#141414] rounded-2xl border border-[#2a2a2a] p-6 lg:p-8 overflow-y-auto h-1/2 lg:h-full flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-neutral-100 border-b border-[#2a2a2a] pb-4">Extracted Data</h3>
              
              {zoomedItem.status === 'success' || zoomedItem.results ? (
                <div className="flex flex-col gap-5">
                  <ZoomInputField label="Timestamp" value={zoomedItem.results!.timestamp} />
                  <ZoomInputField label="Register Code" value={zoomedItem.results!.registerCode} />
                  <ZoomInputField label="Reading (kWh)" value={zoomedItem.results!.energyReading} />
                  <ZoomInputField label="Serial Number" value={zoomedItem.results!.serialNumber} />
                  <ZoomInputField label="Brand" value={zoomedItem.results!.meterBrand} />
                  <ZoomInputField label="Model" value={zoomedItem.results!.meterModel} />
                  <ZoomInputField label="CT Ratio" value={zoomedItem.results!.ctRatio} />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-500 text-lg">
                  {zoomedItem.status === 'processing' ? 'Processing...' : zoomedItem.status === 'error' ? 'Error extracting data' : 'No data extracted yet'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141414] p-4 rounded-xl border border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-neutral-200">Batch Scanner</h2>
          <span className="bg-[#2a2a2a] text-neutral-300 text-xs px-2.5 py-1 rounded-md font-medium">{items.length} images</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-neutral-200 px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus size={16} />
            <span>Add Photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                Promise.all(files.map(f => new Promise<string>(res => {
                  const reader = new FileReader();
                  reader.onloadend = () => res(reader.result as string);
                  reader.readAsDataURL(f as unknown as Blob);
                }))).then(handleImagesSelected);
              }
              e.target.value = '';
            }} />
          </label>

          <button 
            onClick={processAllPending}
            disabled={isProcessingBatch || !items.some(i => i.status === 'pending' || i.status === 'error')}
            className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingBatch ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>Process Pending</span>
          </button>

          <button 
            onClick={handleSaveAll}
            disabled={!items.some(i => i.status === 'success' && !i.saved)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>Save Completed</span>
          </button>

          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
        {items.map(item => (
          <div key={item.id} className={`bg-[#141414] border ${item.saved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#2a2a2a]'} rounded-xl p-4 flex flex-col xl:flex-row gap-4 transition-colors`}>
            {/* Image */}
            <div 
              className="w-full xl:w-80 h-80 shrink-0 bg-[#0a0a0a] rounded-lg overflow-hidden relative border border-[#2a2a2a] cursor-pointer group"
              onClick={() => setZoomedItem(item)}
            >
              <img src={item.base64} className="w-full h-full object-contain" alt="Meter" />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <ZoomIn className="text-white" size={24} />
                <span className="text-white text-sm font-medium">Click to zoom</span>
              </div>

              {item.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#f97316]" size={32} />
                </div>
              )}
            </div>

            {/* Data Form */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {item.status === 'success' || item.results ? (
                <>
                  <InputField label="Timestamp" value={item.results!.timestamp} onChange={(v) => handleUpdateResult(item.id, 'timestamp', v)} disabled={item.saved} />
                  <InputField label="Register Code" value={item.results!.registerCode} onChange={(v) => handleUpdateResult(item.id, 'registerCode', v)} disabled={item.saved} />
                  <InputField label="Reading (kWh)" value={item.results!.energyReading} onChange={(v) => handleUpdateResult(item.id, 'energyReading', v)} disabled={item.saved} />
                  <InputField label="Serial Number" value={item.results!.serialNumber} onChange={(v) => handleUpdateResult(item.id, 'serialNumber', v)} disabled={item.saved} />
                  <InputField label="Brand" value={item.results!.meterBrand} onChange={(v) => handleUpdateResult(item.id, 'meterBrand', v)} disabled={item.saved} />
                  <InputField label="Model" value={item.results!.meterModel} onChange={(v) => handleUpdateResult(item.id, 'meterModel', v)} disabled={item.saved} />
                  <InputField label="CT Ratio" value={item.results!.ctRatio} onChange={(v) => handleUpdateResult(item.id, 'ctRatio', v)} disabled={item.saved} />
                </>
              ) : item.status === 'error' ? (
                <div className="col-span-full flex items-center justify-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/20 h-full">
                  <AlertCircle size={20} />
                  <span className="font-medium">{item.error}</span>
                </div>
              ) : item.status === 'processing' ? (
                <div className="col-span-full flex flex-col items-center justify-center text-[#f97316] h-full gap-3">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="font-medium animate-pulse">Extracting data with {serverConfig.model}...</span>
                </div>
              ) : (
                <div className="col-span-full flex items-center justify-center text-neutral-500 h-full border-2 border-dashed border-[#2a2a2a] rounded-lg">
                  <span className="font-medium">Pending processing</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="w-full xl:w-32 shrink-0 flex flex-row xl:flex-col gap-2 justify-center border-t xl:border-t-0 xl:border-l border-[#2a2a2a] pt-4 xl:pt-0 xl:pl-4">
              {item.saved ? (
                <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-500/10 py-2.5 rounded-lg w-full border border-emerald-500/20">
                  <CheckCircle2 size={18} />
                  <span className="font-medium">Saved</span>
                </div>
              ) : (
                <>
                  {(item.status === 'pending' || item.status === 'error') && (
                    <button onClick={() => processItem(item.id, item.base64)} className="flex-1 flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white py-2.5 rounded-lg transition-colors font-medium">
                      <Play size={16} />
                      <span>Process</span>
                    </button>
                  )}
                  {item.status === 'success' && (
                    <button onClick={() => handleSave(item.id)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg transition-colors font-medium">
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                  )}
                </>
              )}
              <button onClick={() => handleRemove(item.id)} className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-red-500/20 hover:text-red-400 text-neutral-300 py-2.5 rounded-lg transition-colors font-medium">
                <Trash2 size={16} />
                <span className="xl:hidden">Remove</span>
              </button>
            </div>
          </div>
        ))}
        
        {/* Bottom Dropzone */}
        <div className="pt-4">
          <ImageUploader onImagesSelected={handleImagesSelected} />
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, disabled }: { label: string, value: string, onChange: (v: string) => void, disabled: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider pl-1">{label}</label>
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-2xl font-mono font-bold text-neutral-100 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      />
    </div>
  );
}

function ZoomInputField({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-5 py-4 text-4xl font-mono font-bold text-[#f97316] break-all">
        {value || '-'}
      </div>
    </div>
  );
}
