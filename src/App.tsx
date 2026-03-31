import React, { useState, useEffect } from 'react';
import { ScanLine, Table2, BarChart3, Search, Settings, Activity, Database, Server, Menu } from 'lucide-react';
import { ScannerTab } from './components/ScannerTab';
import { TableTab } from './components/TableTab';
import { DashboardTab } from './components/DashboardTab';
import { DatabaseTab } from './components/DatabaseTab';
import { ServerTab } from './components/ServerTab';
import { ServerConfig, ScannedItem } from './types';
import { MeterRecord, initialRecords } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'table' | 'dashboard' | 'database' | 'server'>('scanner');
  
  const [isServerConnected, setIsServerConnected] = useState(() => {
    return localStorage.getItem('serverConnected') === 'true';
  });

  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  useEffect(() => {
    localStorage.setItem('serverConnected', String(isServerConnected));
  }, [isServerConnected]);

  // Server Config State
  const [serverConfig, setServerConfig] = useState<ServerConfig>(() => {
    const saved = localStorage.getItem('serverConfig');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { url: 'http://192.168.0.230:3000', id: 'ithvannsith@schneitec.com.kh', pw: '', model: 'gemma3:12b' };
  });

  useEffect(() => {
    localStorage.setItem('serverConfig', JSON.stringify(serverConfig));
  }, [serverConfig]);

  // Load records from local storage or use initial mock data
  const [records, setRecords] = useState<MeterRecord[]>(() => {
    const saved = localStorage.getItem('meterRecords');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return initialRecords;
  });

  // Save records to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('meterRecords', JSON.stringify(records));
  }, [records]);

  const handleSaveRecord = (newRecord: Omit<MeterRecord, 'id'>) => {
    const record: MeterRecord = {
      ...newRecord,
      id: Math.random().toString(36).substring(2, 9),
    };
    setRecords(prev => [...prev, record]);
  };

  return (
    <div className="h-screen w-full bg-[#050505] p-3 flex flex-col gap-3 overflow-hidden font-sans text-neutral-200">
      {/* Top Row */}
      <div className="flex gap-3 h-16 shrink-0">
        {/* Logo Block (Top Left) */}
        <div className="w-64 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] flex items-center px-4 shrink-0">
          <div className="flex items-center gap-3 text-[#f97316]">
            <div className="bg-[#f97316]/10 p-2 rounded-lg">
              <ScanLine size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">MeterAI Pro</h1>
          </div>
        </div>
        
        {/* Header Block (Top Right) */}
        <div className="flex-1 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] flex items-center justify-between px-6 overflow-x-auto">
          <div className="flex items-center gap-2 flex-1 min-w-max pr-4">
            <NavItem 
              active={activeTab === 'scanner'} 
              onClick={() => setActiveTab('scanner')} 
              icon={<ScanLine size={18} />}
              label="Meter Scanner"
              horizontal
            />
            <NavItem 
              active={activeTab === 'table'} 
              onClick={() => setActiveTab('table')} 
              icon={<Table2 size={18} />}
              label="Data Grid"
              horizontal
            />
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<BarChart3 size={18} />}
              label="Analytics"
              horizontal
            />
            <NavItem 
              active={activeTab === 'database'} 
              onClick={() => setActiveTab('database')} 
              icon={<Database size={18} />}
              label="Database"
              horizontal
            />
            <NavItem 
              active={activeTab === 'server'} 
              onClick={() => setActiveTab('server')} 
              icon={<Server size={18} />}
              label="Server Connection"
              horizontal
            />
          </div>
          
          <div className="flex items-center gap-4 text-neutral-400 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></span>
              <span className="text-xs font-medium">{isServerConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button 
              onClick={() => setActiveTab('server')}
              className={`p-2 rounded-full transition-colors ${activeTab === 'server' ? 'bg-[#f97316]/10 text-[#f97316]' : 'hover:bg-[#2a2a2a]'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Main Content */}
        <div className="flex-1 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] overflow-hidden flex flex-col relative">
          {/* Mobile Nav */}
          <div className="md:hidden flex border-b border-[#2a2a2a] p-2 gap-2 overflow-x-auto shrink-0 bg-[#0a0a0a]">
            <MobileNavItem active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<ScanLine size={16} />} label="Scanner" />
            <MobileNavItem active={activeTab === 'table'} onClick={() => setActiveTab('table')} icon={<Table2 size={16} />} label="Grid" />
            <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={16} />} label="Analytics" />
            <MobileNavItem active={activeTab === 'database'} onClick={() => setActiveTab('database')} icon={<Database size={16} />} label="Database" />
            <MobileNavItem active={activeTab === 'server'} onClick={() => setActiveTab('server')} icon={<Server size={16} />} label="Server" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0a0a]">
            {activeTab === 'scanner' && (
              <ScannerTab 
                onSaveRecord={handleSaveRecord} 
                serverConfig={serverConfig} 
                isConnected={isServerConnected} 
                items={scannedItems}
                setItems={setScannedItems}
              />
            )}
            {activeTab === 'table' && <TableTab records={records} setRecords={setRecords} />}
            {activeTab === 'dashboard' && <DashboardTab records={records} />}
            {activeTab === 'database' && <DatabaseTab records={records} />}
            {activeTab === 'server' && (
              <ServerTab 
                config={serverConfig} 
                onSave={setServerConfig} 
                isConnected={isServerConnected}
                onConnect={() => setIsServerConnected(true)}
                onDisconnect={() => setIsServerConnected(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="h-12 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] shrink-0 flex items-center px-6 justify-between text-sm text-neutral-400 font-medium">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-neutral-300">
            <div className={`w-2.5 h-2.5 rounded-full ${isServerConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div> 
            {isServerConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="hidden sm:inline text-neutral-500">Last sync: Just now</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline hover:text-neutral-100 cursor-pointer transition-colors">Help & Support</span>
          <span className="hidden sm:inline hover:text-neutral-100 cursor-pointer transition-colors">Privacy</span>
          <span className="font-bold tracking-wide text-neutral-200">MeterAI Pro v2.1.0</span>
        </div>
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, horizontal }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, horizontal?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        ${horizontal ? 'whitespace-nowrap' : 'w-full text-left'}
        ${active 
          ? 'bg-[#f97316]/10 text-[#f97316] shadow-sm border border-[#f97316]/20' 
          : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-neutral-100'}
      `}
    >
      <span className={`${active ? 'text-[#f97316]' : 'text-neutral-500'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap
        ${active 
          ? 'bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20' 
          : 'text-neutral-400 hover:bg-[#1a1a1a]'}
      `}
    >
      <span className={`${active ? 'text-[#f97316]' : 'text-neutral-500'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

