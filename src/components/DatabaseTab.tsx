import React from 'react';
import { MeterRecord } from '../data/mockData';
import { Database, Image as ImageIcon, Calendar, Hash, Zap, Activity } from 'lucide-react';

interface DatabaseTabProps {
  records: MeterRecord[];
}

export function DatabaseTab({ records }: DatabaseTabProps) {
  // Filter records that have photos
  const recordsWithPhotos = records.filter(r => r.photoBase64);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <Database className="text-[#f97316]" size={24} />
          Photo Database
        </h2>
        <div className="text-sm text-neutral-400">
          {recordsWithPhotos.length} saved photo{recordsWithPhotos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {recordsWithPhotos.length === 0 ? (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 text-neutral-500">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-medium text-neutral-200 mb-2">No photos in database</h3>
          <p className="text-neutral-500 max-w-sm">
            Upload and save meter photos from the Scanner tab. They will appear here along with their extracted data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {recordsWithPhotos.map((record) => (
            <div key={record.id} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-sm flex flex-col group">
              <div className="relative h-48 bg-[#0a0a0a] border-b border-[#2a2a2a] flex items-center justify-center overflow-hidden">
                <img 
                  src={record.photoBase64} 
                  alt={`Meter ${record.serialNumber}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#f97316]" />
                  {record.date}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-200">{record.feeder}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-[#1a1a1a] text-neutral-400 rounded-md border border-[#2a2a2a]">
                    ID: {record.id.substring(0, 6)}
                  </span>
                </div>
                
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Hash size={14} /> Serial
                    </span>
                    <span className="font-mono text-neutral-200">{record.serialNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Activity size={14} /> Register
                    </span>
                    <span className="font-mono text-neutral-200">{record.registerCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-[#2a2a2a]">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Zap size={14} className="text-[#f97316]" /> Reading
                    </span>
                    <span className="font-mono font-bold text-[#f97316] text-lg">{record.todayPower?.toLocaleString() ?? '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
