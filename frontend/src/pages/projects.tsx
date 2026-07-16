import { useState } from 'react';

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
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'pd-system',
      name: 'PD system',
      about: 'Primary Claims and Processing Core Engine',
      objectives: 'Optimize core turnaround processing time and integrate dynamic reporting widgets.',
      requestor: 'ISD',
      devAssignee: 'All',
      qaAssignee: 'Arra',
      baAssignee: 'Arra',
      status: 'Active',
      createdDate: '2026-07-16'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newAbout, setNewAbout] = useState('');
  const [newObjectives, setNewObjectives] = useState('');
  const [newRequestor, setNewRequestor] = useState('');
  const [newDev, setNewDev] = useState('');
  const [newQa, setNewQa] = useState('');
  const [newBa, setNewBa] = useState('');

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
    setProjects([...projects, newProj]);
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

  return (
    <div className={`p-8 min-h-screen ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-brand-lightBg text-brand-paramount'}`}>
      
      {/* Directory Title & Quick Project Creation */}
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Projects Directory</h1>
          <p className="text-sm text-neutral-darkGray mt-1">Select an active workspace folder to manage documents and test suites.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-lg font-semibold tracking-wider text-white bg-brand-accent hover:bg-opacity-90 transition-all shadow-md"
        >
          + New Project
        </button>
      </div>

      {/* Grid List of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {projects.map(project => (
          <div 
            key={project.id} 
            className="rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-cardDark p-6 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold tracking-tight text-brand-paramount dark:text-white">{project.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  project.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-neutral-darkGray line-clamp-2 mb-4">{project.about}</p>
              
              <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6 text-slate-400">
                <p>📅 Created: <span className="font-semibold text-brand-paramount dark:text-slate-200">{project.createdDate}</span></p>
                <p>👤 Owner: <span className="font-semibold text-brand-paramount dark:text-slate-200">{project.baAssignee}</span></p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => onOpenProject(project.id)}
                className="flex-1 py-2.5 rounded-xl text-center font-bold text-xs uppercase tracking-widest text-white bg-brand-paramount hover:bg-opacity-90 dark:bg-brand-accent dark:hover:bg-opacity-90 transition-all shadow-md active:scale-[0.98]"
              >
                📂 Open Folder
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Project Drawer/Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-brand-paramount dark:text-white mb-6">Create New Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project Name</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                  placeholder="e.g., Claims Processing Engine"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">About the Project</label>
                <input 
                  type="text" required value={newAbout} onChange={(e) => setNewAbout(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                  placeholder="Brief description of the project scope..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Objectives</label>
                <textarea 
                  required value={newObjectives} onChange={(e) => setNewObjectives(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                  placeholder="Project objectives and goals..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project Requestor</label>
                  <input 
                    type="text" required value={newRequestor} onChange={(e) => setNewRequestor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="e.g., Marketing Dept"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dev Assignee</label>
                  <input 
                    type="text" required value={newDev} onChange={(e) => setNewDev(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="Developer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">QA Assignee</label>
                  <input 
                    type="text" required value={newQa} onChange={(e) => setNewQa(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="QA Tester"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">BA Assignee</label>
                  <input 
                    type="text" required value={newBa} onChange={(e) => setNewBa(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                    placeholder="BA Analyst"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2.5 bg-brand-paramount dark:bg-brand-accent text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow hover:opacity-90 transition-all"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}