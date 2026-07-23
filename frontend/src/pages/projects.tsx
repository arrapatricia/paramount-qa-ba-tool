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
    const saved = localStorage.getItem('qa_ba_projects');
    return saved ? JSON.parse(saved) : [];
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
    const newProj: Project = {
      id: newName.toLowerCase().replace(/\s+/g, '-'),
      name: newName,
      about: newAbout,
      objectives: newObjectives,
      requestor: newRequestor,
      devAssignee: newDev,
      qaAssignee: newQa,
      baAssignee: newBa,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      archivedAt: null
    };
    
    setProjects(prev => [...prev, newProj]);
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

  const handleOpenFolder = (project: Project) => {
    localStorage.setItem('qa_ba_current_project', JSON.stringify(project));
    onOpenProject(project.id);
  };

  const activeProjects = projects.filter(p => !p.archivedAt);
  const archivedProjects = projects.filter(p => !!p.archivedAt);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  return (
    <div className={`p-4 md:p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      
      {/* Directory Header & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10 w-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            {showArchived ? 'Archived Projects' : 'Projects'}
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            {showArchived 
              ? 'Archived project workspace containers will be permanently purged after 15 days.' 
              : 'Select an active workspace folder to manage documents and specs.'}
          </p>
        </div>
        
        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
              showArchived 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                : 'bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300/60'
            }`}
          >
            {showArchived ? 'Active Projects' : `Archived (${archivedProjects.length})`}
          </button>

          {!showArchived && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-[#10065F] hover:bg-[#180A8C] transition-all shadow-md active:scale-[0.98] cursor-pointer text-center whitespace-nowrap"
            >
              + New Project
            </button>
          )}
        </div>
      </div>

      {/* Folders Grid */}
      {displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-7xl mx-auto">
          {displayedProjects.map(project => (
            <div 
              key={project.id} 
              className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h2 className="text-base md:text-lg font-black tracking-tight text-slate-800 dark:text-white leading-snug">
                    {project.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 shrink-0">
                    {project.status}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-slate-400 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[32px] mb-4">
                  {project.about}
                </p>
                
                <hr className="border-slate-100 dark:border-slate-800/40 my-4" />
                
                <div className="text-[11px] font-semibold space-y-2 text-slate-400 dark:text-slate-500 mb-6">
                  <p className="flex items-center space-x-2">
                    <span>Created: <span className="font-bold text-slate-700 dark:text-slate-200">{project.createdDate}</span></span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span>Owner: <span className="font-bold text-slate-700 dark:text-slate-200">{project.baAssignee}</span></span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {!showArchived ? (
                  <>
                    <button 
                      onClick={() => handleOpenFolder(project)}
                      className="w-full py-2.5 rounded-xl text-center font-black text-xs uppercase tracking-widest text-white bg-[#10065F] hover:bg-[#180A8C] transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      Open Folder
                    </button>
                    <button 
                      onClick={() => handleArchiveProject(project.id)}
                      className="w-full text-center font-extrabold text-[10px] uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
                    >
                      Archive Project
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleRestoreProject(project.id)}
                    className="w-full py-2.5 rounded-xl text-center font-black text-xs uppercase tracking-widest text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    Restore Project
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto my-12 md:my-16 text-center bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-8 md:p-10 shadow-md">
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
            {showArchived ? 'No Archived Projects' : 'Project Workspace Empty'}
          </h2>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
            {showArchived ? 'There are currently no archived projects in the trash queue.' : 'There are currently no workspace folders configured. Add your first project to get started.'}
          </p>
          {!showArchived && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-[#10065F] hover:bg-[#180A8C] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              + Add First Project
            </button>
          )}
        </div>
      )}

      {/* MODAL: CREATE NEW PROJECT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-5 md:p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Initialize Project Workspace</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Project Name</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Claims Processing Engine"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">About the Project</label>
                <input 
                  type="text" required value={newAbout} onChange={(e) => setNewAbout(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief description of the project scope..."
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Objectives</label>
                <textarea 
                  required value={newObjectives} onChange={(e) => setNewObjectives(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                  placeholder="Project objectives and goals..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Project Requestor</label>
                  <input 
                    type="text" required value={newRequestor} onChange={(e) => setNewRequestor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Marketing Dept"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Dev Assignee</label>
                  <input 
                    type="text" required value={newDev} onChange={(e) => setNewDev(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Developer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">QA Assignee</label>
                  <input 
                    type="text" required value={newQa} onChange={(e) => setNewQa(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="QA Tester"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">BA Assignee</label>
                  <input 
                    type="text" required value={newBa} onChange={(e) => setNewBa(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="BA Analyst"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white font-black rounded-xl transition-all shadow-md cursor-pointer">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}