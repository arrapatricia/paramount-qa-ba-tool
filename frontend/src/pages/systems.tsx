import { useState, useEffect } from 'react';

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
    environments: [
      { label: 'STAGING', url: 'https://ctpl-demo.herokuapp.com/' },
      { label: 'LIVE', url: 'https://ctpl.ph/' },
    ],
  },
  {
    id: 'corp',
    code: 'CORP',
    name: 'Corporate Web Platform',
    description: 'Main corporate website for Paramount Life & General Insurance Inc.',
    environments: [
      { label: 'STAGING', url: 'https://plgic-staging-859886ab9df0.herokuapp.com/' },
      { label: 'LIVE', url: 'https://paramount.com.ph/' },
    ],
  },
];

export default function SystemsDirectory({ isDarkMode }: SystemsProps) {
  const [systems, setSystems] = useState<SystemCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testEnvLabel, setTestEnvLabel] = useState<'DEV' | 'STAGING' | 'DEMO'>('STAGING');
  const [testEnvUrl, setTestEnvUrl] = useState('');
  const [liveEnvUrl, setLiveEnvUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('paramount_systems_directory');
    if (saved) {
      setSystems(JSON.parse(saved));
    } else {
      setSystems(DEFAULT_SYSTEMS);
      localStorage.setItem('paramount_systems_directory', JSON.stringify(DEFAULT_SYSTEMS));
    }
  }, []);

  const handleOpenAddModal = () => {
    setEditingSystemId(null);
    setCode('');
    setName('');
    setDescription('');
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
        environments,
      } : sys);
    } else {
      const newSystem: SystemCategory = {
        id: `sys-${Date.now()}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || 'No description provided.',
        environments,
      };
      updated = [...systems, newSystem];
    }

    setSystems(updated);
    localStorage.setItem('paramount_systems_directory', JSON.stringify(updated));

    setIsAddModalOpen(false);
    alert(editingSystemId ? 'System updated successfully!' : 'New system added to directory successfully!');
  };

  const handleDeleteSystem = (id: string) => {
    if (confirm('Are you sure you want to remove this system from the directory?')) {
      const updated = systems.filter(s => s.id !== id);
      setSystems(updated);
      localStorage.setItem('paramount_systems_directory', JSON.stringify(updated));
    }
  };

  const filteredSystems = systems.filter(sys => 
    sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sys.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sys.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBadgeStyle = (label: string) => {
    switch (label) {
      case 'LIVE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
      case 'STAGING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20';
      case 'DEV':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20';
      case 'DEMO':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-cardDark p-8 rounded-3xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Paramount Digital Ecosystem
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              Systems & Web Applications Directory
            </h1>
            <p className="text-xs font-medium text-slate-400 max-w-xl leading-relaxed">
              Centralized hub for all Paramount Life & General Insurance Inc. production websites, staging deployments, and developer web services.
            </p>
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              + Log New System
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search systems by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-cardDark text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            Showing {filteredSystems.length} Platforms
          </span>
        </div>

        {/* Systems Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSystems.map((system) => (
            <div
              key={system.id}
              className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                    {system.code}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(system)}
                      className="text-[10px] font-bold text-amber-500 hover:underline uppercase cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSystem(system.id)}
                      className="text-[10px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                  {system.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {system.description}
                </p>
              </div>

              {/* Environment Buttons List */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Available Environments:
                </span>

                <div className="flex flex-wrap gap-2">
                  {system.environments.map((env) => (
                    <a
                      key={env.label + env.url}
                      href={env.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${getBadgeStyle(env.label)}`}
                    >
                      <span>{env.label}</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSystems.length === 0 && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800 p-12 text-center text-slate-400 text-xs italic">
            No web platforms or systems match your search filter.
          </div>
        )}

      </div>

      {/* Add / Edit System Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">
                  {editingSystemId ? 'Edit System / Platform' : 'Add New System / Platform'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Manage application endpoints and environment specifications.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 uppercase"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
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
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="STAGING">STAGING</option>
                      <option value="DEV">DEV</option>
                      <option value="DEMO">DEMO</option>
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
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