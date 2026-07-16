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
}

interface ProjectsProps {
  isDarkMode: boolean;
  onOpenProject: (projectId: string) => void;
}

export default function Projects({ isDarkMode, onOpenProject }: ProjectsProps) {
  // Load initial projects from localStorage, default to empty array if none exist
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('qa_ba_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newAbout, setNewAbout] = useState('');
  const [newObjectives, setNewObjectives] = useState('');
  const [newRequestor, setNewRequestor] = useState('');
  const [newDev, setNewDev] = useState('');
  const [newQa, setNewQa] = useState('');
  const [newBa, setNewBa] = useState('');

  // Persist projects locally whenever the list updates
  useEffect(() => {
    localStorage.setItem('qa_ba_projects', JSON.stringify(projects));
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
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    setProjects(prev => [...prev, newProj]);
    setIsModalOpen(false);
    
    // Reset Form
    setNewName('');
    setNewAbout('');
    setNewObjectives('');
    setNewRequestor('');
    setNewDev('');
    setNewQa('');
    setNewBa('');
  };

  // Triggers folder navigation and caches the exact metadata object
  const handleOpenFolder = (project: Project) => {
    localStorage.setItem('qa_ba_current_project', JSON.stringify(project));
    onOpenProject(project.id);
  };

  return (
    <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      
      {/* Directory Header */}
      <div className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            Projects Directory
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Select an active workspace folder to manage documents and execution test suites.
          </p>
        </div>
        
        {projects.length > 0 && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md active:scale-[0.98]"
          >
            + New Project
          </button>
        )}
      </div>

      {/* Folders Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
                    {project.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                    {project.status}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-slate-400 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[32px] mb-4">
                  {project.about}
                </p>
                
                <hr className="border-slate-100 dark:border-slate-800/40 my-4" />
                
                <div className="text-[11px] font-semibold space-y-2 text-slate-400 dark:text-slate-500 mb-6">
                  <p className="flex items-center space-x-2">
                    <span>📅</span> 
                    <span>Created: <span className="font-bold text-slate-700 dark:text-slate-200">{project.createdDate}</span></span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span>👤</span> 
                    <span>Owner: <span className="font-bold text-slate-700 dark:text-slate-200">{project.baAssignee}</span></span>
                  </p>
                </div>
              </div>

              {/* CLEANED BUTTON: Only one button, perfectly aligned inside the card */}
              <button 
                onClick={() => handleOpenFolder(project)}
                className="w-full py-2.5 rounded-xl text-center font-black text-xs uppercase tracking-widest text-white bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-sm active:scale-[0.98]"
              >
                📁 Open Folder
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="max-w-md mx-auto my-16 text-center bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-10 shadow-md">
          <div className="text-4xl mb-4">📁</div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Project Workspace Empty</h2>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
            There are currently no workspace folders configured. Initialize your dynamic tracking matrix by adding your first project module.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
          >
            ＋ Add First Project
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-5">
              <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Initialize Project Workspace</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
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
              <div className="grid grid-cols-2 gap-4">
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}