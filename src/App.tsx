import React, { useState, useEffect } from 'react';
import { ScanLine, Table2, BarChart3, Search, Bell, Settings, Activity, FileText } from 'lucide-react';
import { ScannerTab } from './components/ScannerTab';
import { TableTab } from './components/TableTab';
import { DashboardTab } from './components/DashboardTab';
import { MeterRecord, initialRecords } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'table' | 'dashboard'>('scanner');
  
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
        <div className="flex-1 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative max-w-2xl w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input 
                type="text" 
                placeholder="Search records, serial numbers..." 
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-full py-2.5 pl-12 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-neutral-400">
            <button className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors">
              <Settings size={20} />
            </button>
            <div className="h-10 w-10 bg-[#f97316] text-white rounded-full flex items-center justify-center font-bold text-sm ml-2 shadow-sm">
              JD
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] shrink-0 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">Menu</p>
            <nav className="flex flex-col gap-1.5">
              <NavItem 
                active={activeTab === 'scanner'} 
                onClick={() => setActiveTab('scanner')} 
                icon={<ScanLine size={20} />}
                label="Meter Scanner"
              />
              <NavItem 
                active={activeTab === 'table'} 
                onClick={() => setActiveTab('table')} 
                icon={<Table2 size={20} />}
                label="Data Grid"
              />
              <NavItem 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<BarChart3 size={20} />}
                label="Analytics"
              />
            </nav>
          </div>
          
          <div className="mt-auto p-5 border-t border-[#2a2a2a] bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#141414] border border-[#2a2a2a] rounded-lg flex items-center justify-center shadow-sm">
                <Activity className="text-[#f97316]" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-100">System Status</p>
                <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  Operational
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] overflow-hidden flex flex-col relative">
          {/* Mobile Nav */}
          <div className="md:hidden flex border-b border-[#2a2a2a] p-2 gap-2 overflow-x-auto shrink-0 bg-[#0a0a0a]">
            <MobileNavItem active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<ScanLine size={16} />} label="Scanner" />
            <MobileNavItem active={activeTab === 'table'} onClick={() => setActiveTab('table')} icon={<Table2 size={16} />} label="Grid" />
            <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={16} />} label="Analytics" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0a0a]">
            {activeTab === 'scanner' && <ScannerTab onSaveRecord={handleSaveRecord} />}
            {activeTab === 'table' && <TableTab records={records} setRecords={setRecords} />}
            {activeTab === 'dashboard' && <DashboardTab records={records} />}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] shrink-0 flex flex-col overflow-hidden hidden xl:flex">
          <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0a0a0a]">
            <h3 className="font-semibold text-sm text-neutral-200 tracking-wide uppercase">Recent Activity</h3>
            <span className="text-xs text-[#f97316] font-medium cursor-pointer hover:underline">View All</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              {records.slice(-8).reverse().map((record, i) => (
                <div key={record.id || i} className="flex gap-3 items-start group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#f97316]/10 group-hover:text-[#f97316] transition-colors text-neutral-500">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-[#2a2a2a] pb-4 group-last:border-0">
                    <p className="text-sm font-semibold text-neutral-100 truncate">Meter {record.serialNumber}</p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">Reading: {record.reading} • {record.feeder}</p>
                    <p className="text-[11px] text-neutral-500 mt-1.5">{record.date}</p>
                  </div>
                </div>
              ))}
              {records.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-neutral-500">
                  <Activity size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="h-12 bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] shrink-0 flex items-center px-6 justify-between text-sm text-neutral-400 font-medium">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-neutral-300">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div> 
            Connected
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

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all w-full text-left
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

