import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Brush
} from 'recharts';
import { MeterRecord } from '../data/mockData';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

interface DashboardTabProps {
  records: MeterRecord[];
}

export function DashboardTab({ records }: DashboardTabProps) {
  const { trendData, consumptionData, registerData, feeders, pieData, summaryStats } = useMemo(() => {
    const tMap = new Map<string, any>(); // For raw cumulative readings
    const cMap = new Map<string, any>(); // For daily consumption
    const rMap = new Map<string, any>(); // For registers (1.8.0 vs 2.8.0)
    const fSet = new Set<string>();
    
    // Sort records by date
    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
    
    const prevReadings = new Map<string, number>();
    let totalConsumption = 0;

    sortedRecords.forEach(r => {
      fSet.add(r.feeder);
      
      // 1. Raw Readings (Trend)
      if (!tMap.has(r.date)) tMap.set(r.date, { date: r.date });
      const tEntry = tMap.get(r.date);
      tEntry[r.feeder] = Math.max(tEntry[r.feeder] || 0, r.reading);

      // 2. Consumption (Difference from previous reading)
      const key = `${r.feeder}-${r.registerCode}`;
      const prev = prevReadings.get(key);
      let consumption = 0;
      if (prev !== undefined && r.reading >= prev) {
        consumption = r.reading - prev;
      }
      prevReadings.set(key, r.reading);

      if (!cMap.has(r.date)) cMap.set(r.date, { date: r.date });
      const cEntry = cMap.get(r.date);
      cEntry[r.feeder] = (cEntry[r.feeder] || 0) + consumption;
      
      // 3. Registers (Import vs Export)
      if (!rMap.has(r.date)) rMap.set(r.date, { date: r.date });
      const rEntry = rMap.get(r.date);
      const regName = r.registerCode === '1.8.0' ? 'Import (1.8.0)' : r.registerCode === '2.8.0' ? 'Export (2.8.0)' : r.registerCode;
      rEntry[regName] = (rEntry[regName] || 0) + consumption;

      totalConsumption += consumption;
    });

    const trendData = Array.from(tMap.values());
    const rawConsumptionData = Array.from(cMap.values());
    const rawRegisterData = Array.from(rMap.values());
    const feeders = Array.from(fSet).sort();
    
    // Filter out the first day for consumption charts since it will be 0 (no previous baseline)
    let consumptionData = rawConsumptionData.filter(d => feeders.some(f => d[f] > 0));
    if (consumptionData.length === 0) consumptionData = rawConsumptionData; // fallback
    
    let registerData = rawRegisterData.filter(d => Object.keys(d).some(k => k !== 'date' && d[k] > 0));
    if (registerData.length === 0) registerData = rawRegisterData; // fallback

    // Pie data: Latest reading per feeder
    const latestReadings = new Map<string, number>();
    sortedRecords.forEach(r => {
      latestReadings.set(r.feeder, Math.max(latestReadings.get(r.feeder) || 0, r.reading));
    });
    const pieData = Array.from(latestReadings.entries()).map(([name, value]) => ({ name, value }));

    const summaryStats = {
      totalRecords: records.length,
      totalFeeders: feeders.length,
      avgConsumption: consumptionData.length > 0 ? Math.round(totalConsumption / consumptionData.length) : 0,
      latestDate: trendData.length ? trendData[trendData.length - 1].date : '-'
    };

    return { trendData, consumptionData, registerData, feeders, pieData, summaryStats };
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#141414] rounded-2xl shadow-sm border border-[#2a2a2a]">
        <p className="text-neutral-400 font-medium">No data available for dashboard.</p>
        <p className="text-sm text-neutral-500 mt-2">Upload and save meter readings to see visualizations.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141414] border border-[#2a2a2a] p-3 rounded-xl shadow-xl">
          <p className="text-neutral-300 font-medium mb-2 border-b border-[#2a2a2a] pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm py-0.5">
              <span style={{ color: entry.color }} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-mono text-neutral-100">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={summaryStats.totalRecords} icon="📄" color="text-[#f97316]" />
        <StatCard title="Active Feeders" value={summaryStats.totalFeeders} icon="⚡" color="text-amber-500" />
        <StatCard title="Avg Daily Consumption" value={summaryStats.avgConsumption} icon="📊" color="text-emerald-500" />
        <StatCard title="Latest Entry" value={summaryStats.latestDate as string} icon="📅" color="text-purple-500" isText />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Daily Energy Consumption (Bar) */}
        <div className="bg-[#141414] p-6 rounded-2xl shadow-sm border border-[#2a2a2a] lg:col-span-2">
          <h3 className="text-lg font-medium text-neutral-100 mb-4">Daily Energy Consumption</h3>
          <p className="text-sm text-neutral-400 mb-4">Calculated difference between consecutive meter readings.</p>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} width={80} tickFormatter={(val) => val.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1a1a1a' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {feeders.map((feeder, i) => (
                  <Bar key={feeder} dataKey={feeder} stackId="a" fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Cumulative Meter Readings (Line) */}
        <div className="bg-[#141414] p-6 rounded-2xl shadow-sm border border-[#2a2a2a]">
          <h3 className="text-lg font-medium text-neutral-100 mb-4">Cumulative Meter Readings</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} width={80} tickFormatter={(val) => (val / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                {feeders.map((feeder, i) => (
                  <Line key={feeder} type="monotone" dataKey={feeder} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: '#141414', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                ))}
                <Brush dataKey="date" height={20} stroke="#f97316" fill="#0a0a0a" travellerWidth={8} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Import vs Export (Area) */}
        <div className="bg-[#141414] p-6 rounded-2xl shadow-sm border border-[#2a2a2a]">
          <h3 className="text-lg font-medium text-neutral-100 mb-4">Import vs Export (1.8.0 vs 2.8.0)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registerData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} width={80} tickFormatter={(val) => val.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Import (1.8.0)" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Export (2.8.0)" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Feeder Share (Donut) */}
        <div className="bg-[#141414] p-6 rounded-2xl shadow-sm border border-[#2a2a2a] lg:col-span-2">
          <h3 className="text-lg font-medium text-neutral-100 mb-4">Latest Reading Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#525252', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#141414" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #2a2a2a', backgroundColor: '#141414', color: '#f5f5f5' }} 
                  itemStyle={{ color: '#e5e5e5' }}
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, isText = false }: { title: string, value: number | string, icon: string, color: string, isText?: boolean }) {
  return (
    <div className="bg-[#141414] p-6 rounded-2xl shadow-sm border border-[#2a2a2a] flex items-center gap-4">
      <div className={`text-3xl ${color} bg-[#0a0a0a] p-3 rounded-xl`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-400 mb-1 truncate">{title}</p>
        <p className={`font-bold text-neutral-100 truncate ${isText ? 'text-xl' : 'text-2xl'}`}>
          {typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value}
        </p>
      </div>
    </div>
  );
}
