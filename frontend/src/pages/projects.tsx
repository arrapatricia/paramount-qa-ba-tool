import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  about: string;
  objectives: string;
  requestor: string;
  devAssignee: string;
  qaAssignee: string;
  baAssignee: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  archivedAt?: string | null;
}

interface ProjectsProps {
  isDarkMode: boolean;
  onOpenProject: (projectId: string) => void;
}

export default function Projects({ isDarkMode, onOpenProject }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    // 🧹 Purge ALL legacy mock project cache keys permanently
    localStorage.removeItem('paramount_projects');

    const saved = localStorage.getItem('qa_ba_projects');
    if (saved) {
      try {
        const parsed: Project[] = JSON.parse(saved);
        // Filter out any legacy test project mocks if present
        const cleaned = parsed.filter(p => p.name !== 'CTPL System' && p.id !== 'ctpl-system');
        localStorage.setItem('qa_ba_projects', JSON.stringify(cleaned));
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return []; // Clean slate on fresh launch
  });

  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newAbout, setNewAbout] = useState('');
  const [newObjectives, setNewObjectives] = useState('');
  const [newRequestor, setNewRequestor] = useState('');
  const [newDev, setNewDev] = useState('');
  const [newQa, setNewQa] = useState('');
  const [newBa, setNewBa] = useState('');

  // Persist projects locally and clean up expired archives (> 15 days)
  useEffect(() => {
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    const unexpiredProjects = projects.filter(p => {
      if (p.archivedAt) {
        const archivedTime = new Date(p.archivedAt).getTime();
        if (now - archivedTime > FIFTEEN_DAYS_MS) return false;
      }
      return true;
    });

    if (unexpiredProjects.length !== projects.length) {
      setProjects(unexpiredProjects);
    }

    localStorage.setItem('qa_ba_projects', JSON.stringify(unexpiredProjects));
  }, [projects]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProj: Project = {
      id: newName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: newName.trim(),
      about: newAbout.trim() || 'No description provided.',
      objectives: newObjectives.trim(),
      requestor: newRequestor.trim(),
      devAssignee: newDev.trim(),
      qaAssignee: newQa.trim(),
      baAssignee: newBa.trim() || 'Admin',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      archivedAt: null
    };
    
    setProjects(prev => [newProj, ...prev]);
    setIsModalOpen(false);
    
    setNewName('');
    setNewAbout('');
    setNewObjectives('');
    setNewRequestor('');
    setNewDev('');
    setNewQa('');
    setNewBa('');
  };

  const handleArchiveProject = (id: string) => {
    const timestamp = new Date().toISOString();
    setProjects(prev => prev.map(p => p.id === id ? { ...p, archivedAt: timestamp } : p));
  };

  const handleRestoreProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, archivedAt: null } : p));
  };

  const handleDeletePermanently = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this project workspace?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleClearAllProjects = () => {
    if (confirm("Are you sure you want to clear ALL project records from local storage?")) {
      setProjects([]);
      localStorage.removeItem('qa_ba_projects');
    }
  };

  const handleOpenFolder = (project: Project) => {
    localStorage.setItem('qa_ba_current_project', JSON.stringify(project));
    onOpenProject(project.id);
  };

  const activeProjects = projects.filter(p => !p.archivedAt);
  const archivedProjects = projects.filter(p => !!p.archivedAt);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  return (
    <div className={`p-4 md:p-8 min-h-[calc(100vh-73px)] font-sans relative overflow-hidden transition-colors duration-500 ${
      isDarkMode ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'
    }`}>
      {/* AMBIENT BACKGROUND LIQUID GLOW BLOBS */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 to-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/15 to-sky-400/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Directory Header & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8 w-full max-w-7xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[32px] border border-white/80 dark:border-slate-800/80 shadow-xl shadow-black/5 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#10065F] dark:text-white">
            {showArchived ? 'Archived Projects' : 'Projects'}
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
            {showArchived 
              ? 'Archived project workspace containers will be permanently purged after 15 days.' 
              : 'Select an active workspace folder to manage documents and specs.'}
          </p>
        </div>
        
        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {projects.length > 0 && (
            <button
              onClick={handleClearAllProjects}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center backdrop-blur-md"
            >
              Clear All
            </button>
          )}

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer text-center backdrop-blur-md ${
              showArchived 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20' 
                : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-white/80 dark:border-slate-700/80 hover:bg-white/80 dark:hover:bg-slate-800'
            }`}
          >
            {showArchived ? 'Active Projects' : `Archived (${archivedProjects.length})`}
          </button>

          {!showArchived && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all shadow-md active:scale-[0.98] cursor-pointer text-center whitespace-nowrap"
            >
              + New Project
            </button>
          )}
        </div>
      </div>

      {/* Folders Grid with Glassmorphism */}
      {displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-7xl mx-auto relative z-10">
          {displayedProjects.map(project => (
            <div 
              key={project.id} 
              onClick={() => !showArchived && handleOpenFolder(project)}
              className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 rounded-[28px] p-6 shadow-xl shadow-black/5 hover:shadow-2xl hover:border-blue-400/50 transition-all duration-300 flex flex-col justify-between group ${
                !showArchived ? 'cursor-pointer' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h2 className="text-base md:text-lg font-black tracking-tight text-[#10065F] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug truncate">
                    {project.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-md shrink-0">
                    {project.status}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 min-h-[32px] mb-4">
                  {project.about}
                </p>
                
                <hr className="border-white/60 dark:border-slate-800/80 my-4" />
                
                <div className="text-[11px] font-semibold space-y-1.5 text-slate-500 dark:text-slate-400 mb-6">
                  <p>Created: <span className="font-bold text-slate-800 dark:text-slate-200">{project.createdDate}</span></p>
                  <p>Owner: <span className="font-bold text-slate-800 dark:text-slate-200">{project.baAssignee || 'Admin'}</span></p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {!showArchived ? (
                  <>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFolder(project);
                      }}
                      className="w-full py-3 rounded-2xl text-center font-black text-xs uppercase tracking-widest text-white bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                      OPEN PROJECT
                    </button>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveProject(project.id);
                      }}
                      className="w-full text-center font-black text-[10px] uppercase tracking-wider text-rose-500 hover:text-rose-700 cursor-pointer pt-1 block"
                    >
                      ARCHIVE
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreProject(project.id);
                      }}
                      className="w-full py-2.5 rounded-2xl text-center font-black text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all shadow-xs cursor-pointer"
                    >
                      Restore Project
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePermanently(project.id);
                      }}
                      className="w-full text-center font-black text-[10px] uppercase tracking-wider text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto my-12 md:my-16 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 rounded-[28px] p-8 md:p-10 shadow-xl shadow-black/5 relative z-10">
          <h2 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wide">
            {showArchived ? 'No Archived Projects' : 'Project Workspace Empty'}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
            {showArchived ? 'There are currently no archived projects in the trash queue.' : 'There are currently no workspace folders configured. Add your first project to get started.'}
          </p>
          {!showArchived && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              + Add First Project
            </button>
          )}
        </div>
      )}

      {/* LIQUID GLASS MODAL: CREATE NEW PROJECT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 dark:border-slate-700/80 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wider">Initialize Project Workspace</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">Project Name</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  placeholder="e.g., Claims Processing Engine"
                />
              </div>
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">About the Project</label>
                <input 
                  type="text" required value={newAbout} onChange={(e) => setNewAbout(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  placeholder="Brief description of the project scope..."
                />
              </div>
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">Objectives</label>
                <textarea 
                  required value={newObjectives} onChange={(e) => setNewObjectives(e.target.value)} rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none leading-relaxed shadow-inner"
                  placeholder="Project objectives and goals..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">Project Requestor</label>
                  <input 
                    type="text" required value={newRequestor} onChange={(e) => setNewRequestor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    placeholder="e.g., Marketing Dept"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">Dev Assignee</label>
                  <input 
                    type="text" required value={newDev} onChange={(e) => setNewDev(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    placeholder="Developer"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">QA Assignee</label>
                  <input 
                    type="text" required value={newQa} onChange={(e) => setNewQa(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    placeholder="QA Tester"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">BA Assignee</label>
                  <input 
                    type="text" required value={newBa} onChange={(e) => setNewBa(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    placeholder="BA Analyst"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 border rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black rounded-2xl transition-all shadow-md cursor-pointer uppercase tracking-wider">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}