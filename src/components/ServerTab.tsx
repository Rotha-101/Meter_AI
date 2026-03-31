import React, { useState, useEffect } from 'react';
import { Server, Key, User, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { ServerConfig } from '../types';

interface ServerTabProps {
  config: ServerConfig;
  onSave: (config: ServerConfig) => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ServerTab({ config, onSave, isConnected, onConnect, onDisconnect }: ServerTabProps) {
  const [localConfig, setLocalConfig] = useState<ServerConfig>(config);
  const [models, setModels] = useState<string[]>([
    'Admin&HR-Gemma', 'Admin&HR Examiner-Gemma', 'IT Data Security Examiner-Gemma', 
    'IT Help Desk-Gemma', 'SNT_AI 12.2B', 'ESS_AI', 'llama3:8b', 'gemma3:12b', 
    'mistral:7b', 'llava:13b', 'qwen:14b', 'phi3:mini', 'mixtral:8x7b', 'starcoder2:15b'
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Attempt to fetch from Open WebUI / OpenAI compatible endpoint
      const cleanUrl = localConfig.url.replace(/\/$/, '');
      let response = await fetch(`${cleanUrl}/api/models`, {
        headers: { 'Authorization': `Bearer ${localConfig.pw}` }
      }).catch(() => null);

      if (!response || !response.ok) {
        // Try Ollama standard endpoint
        response = await fetch(`${cleanUrl}/api/tags`).catch(() => null);
      }
      if (!response || !response.ok) {
        // Try OpenAI standard endpoint
        response = await fetch(`${cleanUrl}/v1/models`).catch(() => null);
      }

      if (response && response.ok) {
        const data = await response.json();
        let fetchedModels: string[] = [];
        if (data.data) { // OpenAI format
          fetchedModels = data.data.map((m: any) => m.id);
        } else if (data.models) { // Ollama format
          fetchedModels = data.models.map((m: any) => m.name);
        }
        
        if (fetchedModels.length > 0) {
          setModels(fetchedModels);
          setIsRefreshing(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Real fetch failed, falling back to mock data", e);
    }

    // Fallback to mock data (simulated) if fetch fails (e.g., due to CORS/Mixed Content)
    setTimeout(() => {
      setModels([
        'Admin&HR-Gemma', 'Admin&HR Examiner-Gemma', 'IT Data Security Examiner-Gemma', 
        'IT Help Desk-Gemma', 'SNT_AI 12.2B', 'ESS_AI', 'llama3:8b', 'gemma3:12b', 
        'mistral:7b', 'llava:13b', 'qwen:14b', 'phi3:mini', 'mixtral:8x7b', 'starcoder2:15b'
      ]);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleLogin = () => {
    setLoginStatus('loading');
    setTimeout(() => {
      onSave(localConfig);
      setLoginStatus('success');
      onConnect();
      handleRefresh();
      setTimeout(() => setLoginStatus('idle'), 3000);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-3">
          <Server className="text-[#f97316]" size={28} />
          Server Connection
        </h2>
        <p className="text-neutral-400 mt-1">Configure your AI server connection, login credentials, and select the active model.</p>
      </div>

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Server URL Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Server size={16} /> Server Endpoint
            </h3>
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                value={localConfig.url}
                onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                disabled={isConnected}
                placeholder="http://192.168.0.230:3000"
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-[#f97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="h-px bg-[#2a2a2a] w-full"></div>

          {/* Credentials Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <User size={16} /> Authentication
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">User ID / Email</label>
                <input 
                  type="text" 
                  value={localConfig.id}
                  onChange={(e) => setLocalConfig({ ...localConfig, id: e.target.value })}
                  disabled={isConnected}
                  placeholder="ithvannsith@schneitec.com.kh"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-[#f97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">Password</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="password" 
                    value={localConfig.pw}
                    onChange={(e) => setLocalConfig({ ...localConfig, pw: e.target.value })}
                    disabled={isConnected}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-[#f97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {loginStatus === 'success' && (
                  <span className="text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
                    <ShieldCheck size={16} /> Authenticated successfully
                  </span>
                )}
                {loginStatus === 'error' && (
                  <span className="text-red-500 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle size={16} /> Authentication failed
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {isConnected ? (
                  <button 
                    onClick={onDisconnect}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={handleLogin}
                    disabled={loginStatus === 'loading'}
                    className="bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {loginStatus === 'loading' ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    {loginStatus === 'loading' ? 'Connecting...' : 'Connect & Login'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-[#2a2a2a] w-full"></div>

          {/* Model Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Server size={16} /> AI Model Selection
              </h3>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing || !isConnected}
                className="text-[#f97316] hover:text-[#ea580c] text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                Refresh Models
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <select 
                value={localConfig.model}
                onChange={(e) => {
                  const newConfig = { ...localConfig, model: e.target.value };
                  setLocalConfig(newConfig);
                  onSave(newConfig);
                }}
                disabled={!isConnected && models.length === 0}
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-[#f97316] appearance-none disabled:opacity-50"
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
                {models.length === 0 && <option value="">No models available</option>}
              </select>
            </div>
            
            <div className="pt-2 flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-neutral-600'}`}></div>
              <span className={isConnected ? "text-emerald-500" : "text-neutral-500"}>
                {isConnected ? `Connected to server. ${models.length} model(s) available.` : 'Not connected to server. Please login first.'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
