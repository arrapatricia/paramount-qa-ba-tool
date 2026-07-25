import { useState, useEffect, useMemo } from 'react';
import bannerImg from '../assets/homepage_banner.png';

interface EnvironmentLink {
  label: 'DEV' | 'STAGING' | 'DEMO' | 'LIVE';
  url: string;
}

interface SystemCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  environments: EnvironmentLink[];
  iconType?: 'laptop' | 'code' | 'users' | 'plane' | 'car' | 'building';
  status?: 'Active' | 'Maintenance';
}

interface SystemsProps {
  isDarkMode: boolean;
  onNavigateToSuites?: () => void;
  onNavigateToProjects?: () => void;
}

const DEFAULT_SYSTEMS: SystemCategory[] = [
  {
    id: 'pd',
    code: 'PD',
    name: 'Paramount Direct',
    description: 'Primary customer-facing direct insurance portal and policy purchase application.',
    iconType: 'laptop',
    status: 'Active',
    environments: [
      { label: 'DEV', url: 'https://paramountdirectdev.herokuapp.com/' },
      { label: 'LIVE', url: 'https://www.paramountdirect.com/' },
    ],
  },
  {
    id: 'pd-webservice',
    code: 'PD WEBSERVICE',
    name: 'PD WebService & Admin Portal',
    description: 'Administrative backend web service for managing customer applications and integrations.',
    iconType: 'code',
    status: 'Active',
    environments: [
      { label: 'DEV', url: 'https://paramountdirectdev.herokuapp.com/admin' },
      { label: 'DEMO', url: 'https://paramountdirectdemo.herokuapp.com/admin' },
      { label: 'LIVE', url: 'https://www.paramountdirect.com/admin' },
    ],
  },
  {
    id: 'ofw',
    code: 'OFW',
    name: 'OFW Insurance Portal',
    description: 'Dedicated insurance coverage portal for Overseas Filipino Workers.',
    iconType: 'users',
    status: 'Active',
    environments: [
      { label: 'STAGING', url: 'https://plgic-ofw-staging.herokuapp.com/' },
      { label: 'LIVE', url: 'https://ofwinsurance.ph/' },
    ],
  },
  {
    id: 'gtp',
    code: 'GTP',
    name: 'Global Travel Protect',
    description: 'Travel insurance issuance and claim assistance portal for international and local travel.',
    iconType: 'plane',
    status: 'Active',
    environments: [
      { label: 'STAGING', url: 'https://globaltravelprotectstaging.herokuapp.com/' },
      { label: 'LIVE', url: 'http://yourtravelinsurance.ph/' },
    ],
  },
  {
    id: 'ctpl',
    code: 'CTPL',
    name: 'CTPL Vehicle Insurance',
    description: 'Compulsory Third Party Liability motor vehicle insurance portal.',
    iconType: 'car',
    status: 'Active',
    environments: [
      { label: 'STAGING', url: 'https://ctpl-demo.herokuapp.com/' },
      { label: 'LIVE', url: 'https://ctpl.ph/' },
    ],
  },
  {
    id: 'corp',
    code: 'CORP',
    name: 'Corporate Web Platform',
    description: 'Main corporate website for Paramount Life & General Insurance Corp.',
    iconType: 'building',
    status: 'Active',
    environments: [
      { label: 'STAGING', url: 'https://plgic-staging-859886ab9df0.herokuapp.com/' },
      { label: 'LIVE', url: 'https://paramount.com.ph/' },
    ],
  },
];

export default function SystemsDirectory({ isDarkMode }: SystemsProps) {
  const [systems, setSystems] = useState<SystemCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Add / Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconType, setIconType] = useState<SystemCategory['iconType']>('laptop');
  const [testEnvLabel, setTestEnvLabel] = useState<'DEV' | 'STAGING' | 'DEMO'>('STAGING');
  const [testEnvUrl, setTestEnvUrl] = useState('');
  const [liveEnvUrl, setLiveEnvUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('paramount_systems_directory');
    if (saved) {
      try {
        const parsed: SystemCategory[] = JSON.parse(saved);
        
        // Ensure defaults are restored if the array was previously emptied
        if (parsed.length === 0) {
          setSystems(DEFAULT_SYSTEMS);
          localStorage.setItem('paramount_systems_directory', JSON.stringify(DEFAULT_SYSTEMS));
        } else {
          const merged = parsed.map(item => {
            const defaultMatch = DEFAULT_SYSTEMS.find(d => d.id === item.id || d.code === item.code);
            return {
              ...item,
              iconType: item.iconType || defaultMatch?.iconType || 'laptop'
            };
          });
          setSystems(merged);
          localStorage.setItem('paramount_systems_directory', JSON.stringify(merged));
        }
      } catch (e) {
        setSystems(DEFAULT_SYSTEMS);
        localStorage.setItem('paramount_systems_directory', JSON.stringify(DEFAULT_SYSTEMS));
      }
    } else {
      setSystems(DEFAULT_SYSTEMS);
      localStorage.setItem('paramount_systems_directory', JSON.stringify(DEFAULT_SYSTEMS));
    }
  }, []);

  // Compute Statistics
  const totalSystems = systems.length;
  const liveSystems = useMemo(() => {
    return systems.filter(sys => sys.environments.some(e => e.label === 'LIVE')).length;
  }, [systems]);
  const livePercentage = totalSystems > 0 ? Math.round((liveSystems / totalSystems) * 100) : 0;

  const totalEnvironments = useMemo(() => {
    return systems.reduce((acc, sys) => acc + sys.environments.length, 0);
  }, [systems]);

  const handleOpenAddModal = () => {
    setEditingSystemId(null);
    setCode('');
    setName('');
    setDescription('');
    setIconType('laptop');
    setTestEnvLabel('STAGING');
    setTestEnvUrl('');
    setLiveEnvUrl('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (system: SystemCategory) => {
    setEditingSystemId(system.id);
    setCode(system.code);
    setName(system.name);
    setDescription(system.description);
    setIconType(system.iconType || 'laptop');

    const testEnv = system.environments.find(e => e.label !== 'LIVE');
    const liveEnv = system.environments.find(e => e.label === 'LIVE');

    if (testEnv) {
      setTestEnvLabel(testEnv.label as 'DEV' | 'STAGING' | 'DEMO');
      setTestEnvUrl(testEnv.url);
    } else {
      setTestEnvLabel('STAGING');
      setTestEnvUrl('');
    }

    setLiveEnvUrl(liveEnv ? liveEnv.url : '');
    setIsAddModalOpen(true);
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const environments: EnvironmentLink[] = [];
    if (testEnvUrl.trim()) {
      environments.push({ label: testEnvLabel, url: testEnvUrl.trim() });
    }
    if (liveEnvUrl.trim()) {
      environments.push({ label: 'LIVE', url: liveEnvUrl.trim() });
    }

    let updated: SystemCategory[];

    if (editingSystemId) {
      updated = systems.map(sys => sys.id === editingSystemId ? {
        ...sys,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || 'No description provided.',
        iconType,
        environments,
      } : sys);
    } else {
      const newSystem: SystemCategory = {
        id: `sys-${Date.now()}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || 'No description provided.',
        environments,
        iconType: iconType || 'laptop',
        status: 'Active'
      };
      updated = [...systems, newSystem];
    }

    setSystems(updated);
    localStorage.setItem('paramount_systems_directory', JSON.stringify(updated));
    setIsAddModalOpen(false);
  };

  const handleDeleteSystem = (id: string) => {
    if (confirm('Are you sure you want to remove this system from the directory?')) {
      const updated = systems.filter(s => s.id !== id);
      setSystems(updated);
      localStorage.setItem('paramount_systems_directory', JSON.stringify(updated));
    }
  };

  const filteredSystems = useMemo(() => {
    return systems.filter(sys => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = sys.name.toLowerCase().includes(q) ||
                            sys.code.toLowerCase().includes(q) ||
                            sys.description.toLowerCase().includes(q);

      const matchesEnv = envFilter === 'All' || sys.environments.some(e => e.label === envFilter);
      const matchesStatus = statusFilter === 'All' || (sys.status || 'Active') === statusFilter;

      return matchesSearch && matchesEnv && matchesStatus;
    });
  }, [systems, searchQuery, envFilter, statusFilter]);

  const getBadgeStyle = (label: string) => {
    switch (label) {
      case 'LIVE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 backdrop-blur-md';
      case 'STAGING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 backdrop-blur-md';
      case 'DEV':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 backdrop-blur-md';
      case 'DEMO':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 backdrop-blur-md';
      default:
        return 'bg-slate-500/10 text-slate-600 border border-slate-300 backdrop-blur-md';
    }
  };

  const renderSystemIcon = (sys: SystemCategory) => {
    const codeKey = (sys.code || '').toUpperCase();
    let type = sys.iconType;

    if (!type) {
      if (codeKey.includes('WEBSERVICE')) type = 'code';
      else if (codeKey.includes('OFW')) type = 'users';
      else if (codeKey.includes('GTP')) type = 'plane';
      else if (codeKey.includes('CTPL')) type = 'car';
      else if (codeKey.includes('CORP')) type = 'building';
      else type = 'laptop';
    }

    switch (type) {
      case 'code':
        return (
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        );
      case 'users':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'plane':
        return (
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
        );
      case 'car':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-4 0h4" />
            </svg>
          </div>
        );
      case 'building':
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h2m0 0h5m-5 0V11m0 0V5" />
            </svg>
          </div>
        );
      case 'laptop':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`p-4 md:p-8 min-h-[calc(100vh-73px)] font-sans relative overflow-hidden transition-colors duration-500 ${
      isDarkMode ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'
    }`}>
      {/* AMBIENT BACKGROUND LIQUID GLOW BLOBS */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 to-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/15 to-sky-400/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* HERO LIQUID GLASS BANNER SECTION */}
        <div 
          className="relative rounded-[32px] overflow-hidden backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 p-6 md:p-10 shadow-xl shadow-black/5 bg-cover bg-right bg-no-repeat transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, ${isDarkMode ? 'rgba(15,23,42,0.92) 45%, rgba(15,23,42,0.75) 70%, rgba(15,23,42,0.3) 100%' : 'rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,0.2) 100%'}), url(${bannerImg})`,
          }}
        >
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/20 inline-block">
              PARAMOUNT DIGITAL ECOSYSTEM
            </span>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#10065F] dark:text-white leading-tight">
              Systems & Web Applications Directory
            </h1>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Centralized hub for all Paramount Life & General Insurance Corp. production websites, staging, and web services.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98] cursor-pointer shadow-md"
              >
                + LOG NEW SYSTEM
              </button>
            </div>
          </div>

          {/* 3 STATS OVERLAY LIQUID CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/60 dark:border-slate-800/80 relative z-10 max-w-2xl">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/80 dark:border-slate-800/80 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">TOTAL SYSTEMS</span>
                <span className="text-xl font-black text-[#10065F] dark:text-white block leading-tight">{totalSystems}</span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 block">All Platforms</span>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/80 dark:border-slate-800/80 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">LIVE SYSTEMS</span>
                <span className="text-xl font-black text-[#10065F] dark:text-white block leading-tight">{liveSystems}</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">{livePercentage}% of total</span>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/80 dark:border-slate-800/80 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">ENVIRONMENTS</span>
                <span className="text-xl font-black text-[#10065F] dark:text-white block leading-tight">{totalEnvironments}</span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 block">Across all systems</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER LIQUID GLASS TOOLBAR */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/80 dark:border-slate-800/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search systems by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#10065F] dark:focus:ring-blue-500 text-slate-800 dark:text-white transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="px-3 py-2 bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer backdrop-blur-md"
            >
              <option value="All" className="dark:bg-slate-900">All Environments</option>
              <option value="DEV" className="dark:bg-slate-900">DEV</option>
              <option value="STAGING" className="dark:bg-slate-900">STAGING</option>
              <option value="DEMO" className="dark:bg-slate-900">DEMO</option>
              <option value="LIVE" className="dark:bg-slate-900">LIVE</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer backdrop-blur-md"
            >
              <option value="All" className="dark:bg-slate-900">All Statuses</option>
              <option value="Active" className="dark:bg-slate-900">Active</option>
              <option value="Maintenance" className="dark:bg-slate-900">Maintenance</option>
            </select>

            <div className="flex items-center bg-white/40 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400'
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* SYSTEM CARDS GRID WITH LIQUID GLASSMORPHISM */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSystems.map((sys) => (
              <div
                key={sys.id}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 rounded-[28px] p-6 shadow-xl shadow-black/5 flex flex-col justify-between space-y-4 hover:shadow-2xl hover:border-blue-400/50 transition-all duration-300 group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      {sys.code}
                    </span>

                    <div className="flex items-center space-x-2 text-[10px] font-bold">
                      <button onClick={() => handleOpenEditModal(sys)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Edit</button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button onClick={() => handleDeleteSystem(sys.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer">Delete</button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    {renderSystemIcon(sys)}

                    <div>
                      <h3 className="font-extrabold text-base text-[#10065F] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {sys.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-1 line-clamp-2">
                        {sys.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/60 dark:border-slate-800/80 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                    AVAILABLE ENVIRONMENTS:
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {sys.environments.map((env) => (
                      <a
                        key={env.label + env.url}
                        href={env.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all ${getBadgeStyle(env.label)}`}
                      >
                        {env.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filteredSystems.length === 0 && (
              <div className="col-span-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[28px] border border-white/80 dark:border-slate-800/80 p-12 text-center text-slate-400 text-xs italic">
                No web platforms or systems match your search filter.
              </div>
            )}
          </div>
        ) : (
          /* LIST VIEW WITH LIQUID GLASS */
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[28px] border border-white/80 dark:border-slate-800/80 overflow-hidden shadow-xl shadow-black/5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 text-[10px] uppercase font-black text-slate-400">
                  <th className="p-4">System Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Environments</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-slate-800/60">
                {filteredSystems.map(sys => (
                  <tr key={sys.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-[#10065F] dark:text-white">{sys.name}</td>
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{sys.code}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-sm truncate">{sys.description}</td>
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        {sys.environments.map((e, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50">{e.label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleOpenEditModal(sys)} className="text-slate-400 hover:text-blue-600 font-bold">Edit</button>
                      <button onClick={() => handleDeleteSystem(sys.id)} className="text-slate-400 hover:text-rose-600 font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ADD / EDIT LIQUID GLASS SYSTEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] p-6 border border-white/80 dark:border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wider">
                  {editingSystemId ? 'Edit System Record' : 'Add New System Record'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Manage application endpoints and environment specifications.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveSystem} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">
                    System Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OFW"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 uppercase shadow-inner"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">
                    System Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OFW Insurance Portal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">
                    Icon Category
                  </label>
                  <select
                    value={iconType}
                    onChange={(e: any) => setIconType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none cursor-pointer"
                  >
                    <option value="laptop" className="dark:bg-slate-900">Laptop / Direct Portal</option>
                    <option value="code" className="dark:bg-slate-900">Code / Admin WebService</option>
                    <option value="users" className="dark:bg-slate-900">Users / OFW Portal</option>
                    <option value="plane" className="dark:bg-slate-900">Plane / Travel Insurance</option>
                    <option value="car" className="dark:bg-slate-900">Car / CTPL Vehicle</option>
                    <option value="building" className="dark:bg-slate-900">Building / Corporate Site</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the web portal function..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
                />
              </div>

              <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Environment Links
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[9px]">
                      Test Env Type
                    </label>
                    <select
                      value={testEnvLabel}
                      onChange={(e: any) => setTestEnvLabel(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="STAGING" className="dark:bg-slate-900">STAGING</option>
                      <option value="DEV" className="dark:bg-slate-900">DEV</option>
                      <option value="DEMO" className="dark:bg-slate-900">DEMO</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[9px]">
                      Test Environment URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={testEnvUrl}
                      onChange={(e) => setTestEnvUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[9px]">
                    Live Environment URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={liveEnvUrl}
                    onChange={(e) => setLiveEnvUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save System
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}