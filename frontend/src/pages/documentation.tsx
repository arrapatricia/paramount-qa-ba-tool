import { useState, useEffect } from 'react';
import SubpageList from '../features/wiki/components/subpage-list';
import WikiEditor from '../features/wiki/components/wiki-editor';
import { Page } from '../features/wiki/types';

import TestCard from '../features/testing/components/test-card';
import CoverageStats from '../features/testing/components/coverage-stats';
import { TestCase } from '../features/testing/types';

interface Tag {
  name: string;
  count: number;
}

interface AuditLog {
  version: string;
  date: string;
  author: string;
  action: string;
}

interface ProjectMetadata {
  projectName: string;
  about: string;
  objectives: string;
  requestor: string;
  devAssignee: string;
  qaAssignee: string;
  baAssignee: string;
  status: string;
}

interface QuickNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface DocumentationProps {
  isDarkMode: boolean;
  onBackToProjects: () => void;
}

export default function Documentation({ isDarkMode, onBackToProjects }: DocumentationProps) {
  const [activeTab, setActiveTab] = useState<'docs' | 'testing'>('docs');

  // --- Quick Notes / Boss Comments State (With LocalStorage Persistence) ---
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    const saved = localStorage.getItem('pd_project_notes');
    return saved ? JSON.parse(saved) : [
      {
        id: 'note-1',
        author: 'Boss (Product Owner)',
        text: 'Please ensure the validate login endpoint strictly matches the v2 specs from our API directory.',
        timestamp: 'July 16, 2026 at 03:45 PM'
      }
    ];
  });
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Boss');

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pd_project_notes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      author: noteAuthor.trim() || 'Anonymous User',
      text: newNoteText.trim(),
      timestamp: formattedDate
    };

    setNotes([...notes, newNote]);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    if (confirm("Remove this note permanently?")) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  // --- Sub-Pages State & Management ---
  const [pages, setPages] = useState<Page[]>([
    { id: '1', title: 'Overview', isActive: true },
    { id: '2', title: 'User Journey Flow', isActive: false },
    { id: '3', title: 'API Integration Specifications', isActive: false },
  ]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageTitle, setEditPageTitle] = useState('');

  const handleAddPage = () => {
    const newId = (pages.length + 1).toString();
    const newPage: Page = {
      id: newId,
      title: `New Page ${newId}`,
      isActive: false
    };
    setPages([...pages, newPage]);
  };

  const handleSelectPage = (id: string) => {
    setPages(pages.map(p => ({ ...p, isActive: p.id === id })));
  };

  const handleStartEditPage = (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPageId(page.id);
    setEditPageTitle(page.title);
  };

  const handleSavePageTitle = (id: string) => {
    setPages(pages.map(p => p.id === id ? { ...p, title: editPageTitle } : p));
    setEditingPageId(null);
  };

  const handleDeletePage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pages.filter(p => p.id !== id);
    if (updated.length > 0 && pages.find(p => p.id === id)?.isActive) {
      updated[0].isActive = true;
    }
    setPages(updated);
  };

  // --- Dynamic Tags CRUD Management ---
  const [tags, setTags] = useState<Tag[]>([
    { name: 'payment', count: 0 },
    { name: 'maintenance', count: 0 },
    { name: 'reports', count: 4 },
  ]);
  const [newTagName, setNewTagName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newTagName.trim().toLowerCase();
    if (!cleanName) return;
    
    if (tags.some(t => t.name === cleanName)) {
      alert("Tag already exists!");
      return;
    }

    setTags([...tags, { name: cleanName, count: 0 }]);
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = (name: string) => {
    if (confirm(`Are you sure you want to delete the tag [${name}]?`)) {
      setTags(tags.filter(t => t.name !== name));
    }
  };

  // --- Static/Audit Specs ---
  const [auditLogs] = useState<AuditLog[]>([
    { version: 'v1.0 - initialized', date: 'July 16, 2026 at 09:20 AM', author: 'Admin', action: 'project workspace' },
    { version: 'v1.1 - updated metadata', date: 'July 16, 2026 at 09:55 AM', author: 'Admin', action: 'project metadata specs' },
  ]);

  const [metadata, setMetadata] = useState<ProjectMetadata>({
    projectName: 'PD system',
    about: 'PD system',
    objectives: 'PD system',
    requestor: 'ISD',
    devAssignee: 'All',
    qaAssignee: 'Arra',
    baAssignee: 'Arra',
    status: 'Active',
  });

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [blogContent, setBlogContent] = useState(
    `Welcome to the PD system workspace! Use the document portal on the side panel or click edit to update this wiki description.`
  );

  const [tempMetadata, setTempMetadata] = useState<ProjectMetadata>({ ...metadata });
  const [tempContent, setTempContent] = useState(blogContent);

  // --- Test Case Management State & Functions ---
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 'TC-101', title: 'Validate Admin Login Access Token generation', steps: '1. Input correct credentials\n2. Trigger login button', expected: 'Validate status 200 JSON payload includes access_token key', status: 'Passed', assignedTo: 'Arra' },
    { id: 'TC-102', title: 'Verify creation of new Project record with empty fields', steps: '1. Navigate to Project modal\n2. Attempt save with blank name', expected: 'Form error warning alerts user to complete fields', status: 'Failed', assignedTo: 'Arra' },
    { id: 'TC-103', title: 'Toggling Status on inactive user blocks active session', steps: '1. Locate active user\n2. Toggle status to Inactive\n3. Perform transaction on workspace', expected: 'Session termination forces authentication redirect screen', status: 'Untested', assignedTo: 'Arra' }
  ]);

  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  const [tcTitle, setTcTitle] = useState('');
  const [tcSteps, setTcSteps] = useState('');
  const [tcExpected, setTcExpected] = useState('');
  const [tcStatus, setTcStatus] = useState<TestCase['status']>('Untested');
  const [tcAssignee, setTcAssignee] = useState('Arra');

  const handleOpenCreateTc = () => {
    setEditingTestCase(null);
    setTcTitle('');
    setTcSteps('');
    setTcExpected('');
    setTcStatus('Untested');
    setTcAssignee('Arra');
    setIsTcModalOpen(true);
  };

  const handleOpenEditTc = (tc: TestCase) => {
    setEditingTestCase(tc);
    setTcTitle(tc.title);
    setTcSteps(tc.steps);
    setTcExpected(tc.expected);
    setTcStatus(tc.status);
    setTcAssignee(tc.assignedTo);
    setIsTcModalOpen(true);
  };

  const handleSaveTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestCase) {
      setTestCases(testCases.map(tc => tc.id === editingTestCase.id ? {
        ...tc,
        title: tcTitle,
        steps: tcSteps,
        expected: tcExpected,
        status: tcStatus,
        assignedTo: tcAssignee
      } : tc));
    } else {
      const nextNum = testCases.length > 0 ? Math.max(...testCases.map(t => parseInt(t.id.split('-')[1]))) + 1 : 101;
      const newCase: TestCase = {
        id: `TC-${nextNum}`,
        title: tcTitle,
        steps: tcSteps,
        expected: tcExpected,
        status: 'Untested',
        assignedTo: tcAssignee
      };
      setTestCases([...testCases, newCase]);
    }
    setIsTcModalOpen(false);
  };

  const handleDeleteTestCase = (id: string) => {
    if (confirm("Are you sure you want to delete this test case?")) {
      setTestCases(testCases.filter(tc => tc.id !== id));
    }
  };

  const updateTestStatus = (id: string, nextStatus: TestCase['status']) => {
    setTestCases(testCases.map(tc => tc.id === id ? { ...tc, status: nextStatus } : tc));
  };

  const handleSaveSpecs = () => {
    setMetadata({ ...tempMetadata });
    setIsEditingSpecs(false);
  };

  const handleSaveContent = () => {
    setBlogContent(tempContent);
    setIsEditingContent(false);
  };

  return (
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-brand-lightBg text-brand-paramount'} transition-all duration-300 relative overflow-x-hidden`}>
      
      {/* 1. Left Sidebar Nav */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-8 bg-white dark:bg-neutral-cardDark z-10">
        <button onClick={onBackToProjects} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-brand-accent transition-all text-left">
          ← Back to Projects
        </button>

        <div className="flex flex-col space-y-2 pb-6 border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('docs')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'docs' ? 'bg-brand-paramount text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
          >
            📓 Specifications Wiki
          </button>
          <button 
            onClick={() => setActiveTab('testing')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'testing' ? 'bg-brand-paramount text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
          >
            🧪 Test Management
          </button>
        </div>

        {activeTab === 'docs' ? (
          <>
            <SubpageList 
              pages={pages}
              editingPageId={editingPageId}
              editPageTitle={editPageTitle}
              setEditPageTitle={setEditPageTitle}
              onSelectPage={handleSelectPage}
              onAddPage={handleAddPage}
              onStartEditPage={handleStartEditPage}
              onSavePageTitle={handleSavePageTitle}
              onDeletePage={handleDeletePage}
            />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Tags</h3>
                <button onClick={() => setIsAddingTag(!isAddingTag)} className="text-xs font-bold text-brand-accent hover:underline">
                  {isAddingTag ? 'Cancel' : '+ Add Tag'}
                </button>
              </div>

              {isAddingTag && (
                <form onSubmit={handleAddTag} className="mb-4">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="tagname"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                    autoFocus
                  />
                </form>
              )}

              <div className="space-y-2">
                {tags.map(tag => (
                  <div key={tag.name} className="flex justify-between items-center text-xs group">
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                      [{tag.name}]
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-medium group-hover:hidden">{tag.count} used</span>
                      <button onClick={() => handleDeleteTag(tag.name)} className="hidden group-hover:inline-block text-red-500 hover:underline text-[10px]">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <CoverageStats testCases={testCases} />
        )}

        <div className="flex-1 flex flex-col min-h-0 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Audit Ledger</h3>
          <div className="space-y-4 overflow-y-auto flex-1">
            {auditLogs.map((log, index) => (
              <div key={index} className="text-xs border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                <p className="font-bold text-brand-accent">{log.version}</p>
                <p className="text-slate-400 mt-0.5">{log.date}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 2. Main content display container */}
      <main className="flex-1 p-8 max-w-5xl mx-auto space-y-8 z-0">
        {activeTab === 'docs' && (
          <>
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{metadata.projectName}</h1>
                <p className="text-sm text-slate-400 mt-1">Written requirements specification wiki and narrative board.</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setTempContent(blogContent); setIsEditingContent(true); }} className="px-4 py-2 bg-brand-paramount dark:bg-brand-accent text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow hover:opacity-90 transition-all">✍️ Edit Content</button>
                <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">📥 Export DOCX</button>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-cardDark rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Project Specifications</h2>
                <button onClick={() => { setTempMetadata({ ...metadata }); setIsEditingSpecs(true); }} className="text-xs font-bold text-brand-accent hover:underline">Edit Specs</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">About the Project</p>
                  <p className="font-semibold text-brand-paramount dark:text-white">{metadata.about}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Objectives</p>
                  <p className="font-semibold text-brand-paramount dark:text-white">{metadata.objectives}</p>
                </div>
                <div className="grid grid-cols-4 gap-4 col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div><span className="text-xs text-slate-400 block font-bold uppercase">Requestor</span><span className="font-bold text-brand-paramount dark:text-slate-200">{metadata.requestor}</span></div>
                  <div><span className="text-xs text-slate-400 block font-bold uppercase">Dev</span><span className="font-bold text-brand-paramount dark:text-slate-200">{metadata.devAssignee}</span></div>
                  <div><span className="text-xs text-slate-400 block font-bold uppercase">QA</span><span className="font-bold text-brand-paramount dark:text-slate-200">{metadata.qaAssignee}</span></div>
                  <div><span className="text-xs text-slate-400 block font-bold uppercase">BA</span><span className="font-bold text-brand-paramount dark:text-slate-200">{metadata.baAssignee}</span></div>
                </div>
              </div>
            </div>

            <WikiEditor 
              isEditingContent={isEditingContent}
              blogContent={blogContent}
              tempContent={tempContent}
              setTempContent={setTempContent}
              setIsEditingContent={setIsEditingContent}
              onSaveContent={handleSaveContent}
              projectName={metadata.projectName}
            />
          </>
        )}

        {activeTab === 'testing' && (
          <>
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">TestSuite Management</h1>
                <p className="text-sm text-slate-400 mt-1">Organize test matrices, define expected assertions, and log results.</p>
              </div>
              <button onClick={handleOpenCreateTc} className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-white bg-brand-accent hover:opacity-90 transition-all shadow-md">
                + Create Test Case
              </button>
            </div>

            <div className="space-y-4">
              {testCases.map(tc => (
                <TestCard 
                  key={tc.id}
                  tc={tc}
                  onStatusChange={updateTestStatus}
                  onEdit={handleOpenEditTc}
                  onDelete={handleDeleteTestCase}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* --- FLOATING NOTES SLIDEOUT WIDGET --- */}
      {/* 1. Floating Circle Button */}
      <button 
        onClick={() => setIsNotesOpen(!isNotesOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-accent dark:bg-blue-600 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center transition-all z-40 border border-white/20"
        title="Notes & Comments"
      >
        {isNotesOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
        {notes.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {notes.length}
          </span>
        )}
      </button>

      {/* 2. Sliding Drawer Panel */}
      <aside 
        className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-neutral-cardDark border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-transform duration-300 ease-in-out z-30 flex flex-col justify-between ${
          isNotesOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-brand-paramount dark:text-white">Workspace Notes</h3>
              <p className="text-xs text-slate-400">Collaboration & review items for {metadata.projectName}</p>
            </div>
          </div>

          {/* Scrollable Notes Ledger */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {notes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-4xl mb-2">💡</span>
                <p className="text-sm font-semibold text-slate-400">No notes yet.</p>
                <p className="text-xs text-slate-400 mt-1">Add suggestions, issues, or reviews here.</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 space-y-1.5 group relative">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-brand-accent">{note.author}</span>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                  <span className="text-[10px] text-slate-400 block font-semibold">{note.timestamp}</span>
                </div>
              ))
            )}
          </div>

          {/* Form to submit comment */}
          <form onSubmit={handleAddNote} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex gap-2">
              <input 
                type="text"
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
                placeholder="Author (e.g. Boss)"
                className="w-1/3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
              <span className="text-xs text-slate-400 self-center">is writing...</span>
            </div>
            
            <div className="relative">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type a feedback note..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <button 
                type="submit"
                className="mt-2 w-full py-2 bg-brand-paramount dark:bg-brand-accent text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-all"
              >
                Post Note
              </button>
            </div>
          </form>
        </div>
      </aside>

      {/* Edit Project Specs Modal */}
      {isEditingSpecs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-brand-paramount dark:text-white mb-6">Edit Project Specifications</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={tempMetadata.projectName} 
                  onChange={(e) => setTempMetadata({ ...tempMetadata, projectName: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">About</label>
                <input 
                  type="text" 
                  value={tempMetadata.about} 
                  onChange={(e) => setTempMetadata({ ...tempMetadata, about: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Objectives</label>
                <textarea 
                  value={tempMetadata.objectives} 
                  onChange={(e) => setTempMetadata({ ...tempMetadata, objectives: e.target.value })} 
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Requestor</label>
                  <input 
                    type="text" 
                    value={tempMetadata.requestor} 
                    onChange={(e) => setTempMetadata({ ...tempMetadata, requestor: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dev Assignee</label>
                  <input 
                    type="text" 
                    value={tempMetadata.devAssignee} 
                    onChange={(e) => setTempMetadata({ ...tempMetadata, devAssignee: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">QA Assignee</label>
                  <input 
                    type="text" 
                    value={tempMetadata.qaAssignee} 
                    onChange={(e) => setTempMetadata({ ...tempMetadata, qaAssignee: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">BA Assignee</label>
                  <input 
                    type="text" 
                    value={tempMetadata.baAssignee} 
                    onChange={(e) => setTempMetadata({ ...tempMetadata, baAssignee: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setIsEditingSpecs(false)} 
                className="px-4 py-2.5 border rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSpecs} 
                className="px-4 py-2.5 bg-brand-paramount dark:bg-brand-accent text-white text-xs font-bold rounded-lg shadow"
              >
                Save Specs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Case Drawer Popup */}
      {isTcModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-8 shadow-2xl border border-slate-100 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-brand-paramount dark:text-white mb-6 font-sans">
              {editingTestCase ? `Modify ${editingTestCase.id}` : 'Create New Test Case'}
            </h3>
            <form onSubmit={handleSaveTestCase} className="space-y-4 text-sm font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Test Title</label>
                <input 
                  type="text" required value={tcTitle} onChange={(e) => setTcTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  placeholder="Verify validation triggers correctly"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Test Steps</label>
                <textarea 
                  required value={tcSteps} onChange={(e) => setTcSteps(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  placeholder="1. Step one&#10;2. Step two"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expected Assertions</label>
                <textarea 
                  required value={tcExpected} onChange={(e) => setTcExpected(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  placeholder="Verify state change"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select 
                    value={tcStatus} onChange={(e) => setTcStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Untested">Untested</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assigned QA</label>
                  <input 
                    type="text" required value={tcAssignee} onChange={(e) => setTcAssignee(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 font-sans">
                <button type="button" onClick={() => setIsTcModalOpen(false)} className="px-4 py-2.5 border rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-brand-accent text-white text-xs font-bold rounded-lg shadow hover:opacity-90">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}