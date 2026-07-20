import { useState, useEffect } from 'react';
import { qaSuiteAPI } from '../services/api';

interface TestCase {
  id: string;
  testCaseId: string;
  description: string;
  preconditions?: string;
  expectedResult: string;
  status: 'Passed' | 'Failed' | 'Pending' | 'On Hold';
  assignedQa: string;
}

interface Project {
  id: string;
  name: string;
  about: string;
  objectives: string;
  requestor: string;
  devAssignee: string;
  qaAssignee: string;
  baAssignee: string;
  status: string;
  createdDate: string;
}

interface QASuite {
  id: number;
  title: string;
  description: string;
  priority: string;
  suite_type?: 'Adhoc' | 'With JIRA Ticket';
  jira_ticket?: string;
  project_id?: string | number | null;
  test_cases?: TestCase[];
  deletedAt?: string | null; // ISO Timestamp for Trash Soft Delete
}

interface TestSuitesProps {
  isDarkMode: boolean;
  currentUser: any;
}

export default function TestSuites({ isDarkMode }: TestSuitesProps) {
  const [suites, setSuites] = useState<QASuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);

  // Load created projects from localStorage for the dropdown selector
  const [projects, setProjects] = useState<Project[]>([]);

  // Active View Details Modal State
  const [selectedSuite, setSelectedSuite] = useState<QASuite | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Create Suite Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [suiteType, setSuiteType] = useState<'Adhoc' | 'With JIRA Ticket'>('Adhoc');
  const [jiraTicket, setJiraTicket] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Test Case Form Row State
  const [tcDescription, setTcDescription] = useState('');
  const [tcPreconditions, setTcPreconditions] = useState('');
  const [tcExpected, setTcExpected] = useState('');
  const [tcStatus, setTcStatus] = useState<'Passed' | 'Failed' | 'Pending' | 'On Hold'>('Pending');
  const [tcAssignedQa, setTcAssignedQa] = useState('');

  // Helper function to build clickable JIRA URL
  const getJiraUrl = (ticketKey: string) => {
    const cleanKey = ticketKey.trim();
    if (!cleanKey) return '#';
    if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) return cleanKey;
    return `https://paramountdirect.atlassian.net/browse/${cleanKey}`;
  };

  // Helper to generate prefix initials from Suite Title
  const getSuiteInitials = (title: string) => {
    if (!title || !title.trim()) return 'TC';
    const words = title.trim().split(/\s+/);
    if (words.length === 1) {
      return title.trim().toUpperCase().slice(0, 4);
    }
    return words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  // Helper to compute next auto-incremented Test Case ID (e.g. RCA-001, RCA-002)
  const getNextTestCaseId = () => {
    if (!selectedSuite) return 'TC-001';
    const prefix = getSuiteInitials(selectedSuite.title);
    const nextNum = testCases.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}-${padded}`;
  };

  // Fetch suites and projects on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('qa_ba_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    loadSuites();
  }, []);

  // Load all test suites & evaluate 15-day hard expiration
  const loadSuites = async () => {
    try {
      setIsLoading(true);
      const data: QASuite[] = await qaSuiteAPI.getAll();
      
      const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
      const now = new Date().getTime();
      const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

      const filteredAndTaggedData = data
        .map(suite => ({
          ...suite,
          deletedAt: trashedStorage[suite.id] || null
        }))
        .filter(suite => {
          if (suite.deletedAt) {
            const deletedTime = new Date(suite.deletedAt).getTime();
            if (now - deletedTime > FIFTEEN_DAYS_MS) {
              return false; // Purged after 15 days
            }
          }
          return true;
        });

      setSuites(filteredAndTaggedData);
    } catch (err) {
      console.error("Failed to fetch test suites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Soft Delete Handler (Move to Trash Bin)
  const handleMoveToTrash = (id: number) => {
    const timestamp = new Date().toISOString();
    const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
    trashedStorage[id] = timestamp;
    localStorage.setItem('qa_suites_trash', JSON.stringify(trashedStorage));

    setSuites(prev => prev.map(s => s.id === id ? { ...s, deletedAt: timestamp } : s));
  };

  // Restore from Trash Handler
  const handleRestoreFromTrash = (id: number) => {
    const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
    delete trashedStorage[id];
    localStorage.setItem('qa_suites_trash', JSON.stringify(trashedStorage));

    setSuites(prev => prev.map(s => s.id === id ? { ...s, deletedAt: null } : s));
  };

  // Handle Standalone QA Test Suite Creation
  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await qaSuiteAPI.create({
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        suite_type: suiteType,
        jira_ticket: suiteType === 'With JIRA Ticket' ? jiraTicket : '',
        project_id: selectedProjectId || null,
      } as any);

      alert("QA Test Suite created successfully!");
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('Medium');
      setSuiteType('Adhoc');
      setJiraTicket('');
      setSelectedProjectId('');

      loadSuites();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create test suite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Details Modal & Initialize Test Cases
  const handleOpenDetails = (suite: QASuite) => {
    setSelectedSuite(suite);
    
    const savedCases = localStorage.getItem(`qa_suite_cases_${suite.id}`);
    if (savedCases) {
      setTestCases(JSON.parse(savedCases));
    } else {
      setTestCases(suite.test_cases || []);
    }
  };

  // Add Test Case row with auto-generated ID
  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite || !tcDescription.trim()) return;

    const autoGeneratedId = getNextTestCaseId();

    const newCase: TestCase = {
      id: `tc-${Date.now()}`,
      testCaseId: autoGeneratedId,
      description: tcDescription,
      preconditions: tcPreconditions,
      expectedResult: tcExpected,
      status: tcStatus,
      assignedQa: tcAssignedQa || 'Unassigned',
    };

    const updated = [...testCases, newCase];
    setTestCases(updated);
    localStorage.setItem(`qa_suite_cases_${selectedSuite.id}`, JSON.stringify(updated));

    // Reset inputs
    setTcDescription('');
    setTcPreconditions('');
    setTcExpected('');
    setTcStatus('Pending');
    setTcAssignedQa('');
  };

  // Toggle Test Case Status directly inside matrix
  const handleStatusChange = (id: string, status: 'Passed' | 'Failed' | 'Pending' | 'On Hold') => {
    if (!selectedSuite) return;
    const updated = testCases.map(tc => tc.id === id ? { ...tc, status } : tc);
    setTestCases(updated);
    localStorage.setItem(`qa_suite_cases_${selectedSuite.id}`, JSON.stringify(updated));
  };

  // Delete Test Case from matrix
  const handleDeleteTestCase = (id: string) => {
    if (!selectedSuite) return;
    const updated = testCases.filter(tc => tc.id !== id);
    setTestCases(updated);
    localStorage.setItem(`qa_suite_cases_${selectedSuite.id}`, JSON.stringify(updated));
  };

  // Helper to resolve project name from project_id
  const getProjectName = (projId?: string | number | null) => {
    if (!projId) return null;
    const found = projects.find(p => p.id.toString() === projId.toString());
    return found ? found.name : null;
  };

  // Filter Active vs Trashed suites
  const activeSuites = suites.filter(s => !s.deletedAt);
  const trashedSuites = suites.filter(s => !!s.deletedAt);
  const displayedSuites = showTrash ? trashedSuites : activeSuites;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Blue Action Buttons & Trash Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              {showTrash ? '🗑️ Trashed Test Suites' : 'QA Test Suites'}
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
              {showTrash 
                ? 'Soft-deleted test suites will be permanently purged after 15 days.' 
                : 'Overview of all ad-hoc and project-assigned QA test execution suites.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                showTrash 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                  : 'bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300/60'
              }`}
            >
              <span>{showTrash ? '📋 Active Suites' : `🗑️ Trash Bin (${trashedSuites.length})`}</span>
            </button>

            {!showTrash && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center space-x-1.5 cursor-pointer"
              >
                <span>🧪 + CREATE TEST SUITE</span>
              </button>
            )}
          </div>
        </div>

        {/* Test Suites Gallery Grid */}
        {displayedSuites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedSuites.map((suite) => {
              const assignedProjectName = getProjectName(suite.project_id);
              return (
                <div 
                  key={suite.id}
                  className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                          {suite.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {suite.jira_ticket && (
                            <a 
                              href={getJiraUrl(suite.jira_ticket)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all cursor-pointer"
                            >
                              <span>🎫 JIRA: {suite.jira_ticket}</span>
                              <span className="text-[9px]">↗</span>
                            </a>
                          )}

                          {assignedProjectName && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              📁 Project: {assignedProjectName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        suite.priority === 'Critical' ? 'bg-red-500/10 text-red-500' :
                        suite.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                        suite.priority === 'Medium' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {suite.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-2">
                      {suite.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Type: {suite.suite_type === 'With JIRA Ticket' ? '🎫 JIRA Ticket' : '🧪 Ad-Hoc Suite'}</span>
                    
                    <div className="flex items-center space-x-3">
                      {!showTrash ? (
                        <>
                          <button 
                            onClick={() => handleMoveToTrash(suite.id)}
                            className="text-red-500 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
                          >
                            🗑️ Move to Trash
                          </button>
                          <button 
                            onClick={() => handleOpenDetails(suite)}
                            className="text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
                          >
                            OPEN TEST CASES →
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleRestoreFromTrash(suite.id)}
                          className="text-emerald-500 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
                        >
                          ♻️ Restore Suite
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-md mx-auto my-16 text-center bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-10 shadow-md">
            <div className="text-4xl mb-4">{showTrash ? '🗑️' : '🧪'}</div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
              {showTrash ? 'Trash Bin is Empty' : 'No Test Suites Found'}
            </h2>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 mb-6 leading-relaxed">
              {showTrash ? 'No soft-deleted test suites pending expiration.' : 'You haven\'t logged any ad-hoc or JIRA test suites yet.'}
            </p>
            {!showTrash && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                ＋ Create First Test Suite
              </button>
            )}
          </div>
        )}

      </div>

      {/* --- CREATE TEST SUITE MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Create QA Test Suite</h3>
                <p className="text-[10px] text-slate-400 font-medium">Standalone test suite decoupled or linked to project containers.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateSuite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Test Suite Type</label>
                <select
                  value={suiteType} onChange={(e: any) => setSuiteType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Adhoc">Adhoc (Other)</option>
                  <option value="With JIRA Ticket">With JIRA Ticket</option>
                </select>
              </div>

              {suiteType === 'With JIRA Ticket' && (
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">JIRA Ticket Key / ID</label>
                  <input
                    type="text" required value={jiraTicket} onChange={(e) => setJiraTicket(e.target.value)}
                    placeholder="e.g., ASPD-211 or PD-1111"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* OPTIONAL PROJECT ASSIGNMENT DROPDOWN */}
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">
                  Assign to Project Workspace <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- No Project Selected (Standalone) --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      📁 {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Suite Title</label>
                <input
                  type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Quick Regression Check - Auth API"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Priority Level</label>
                <select
                  value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Description / Notes</label>
                <textarea
                  rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add scope details or quick notes for this test suite..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <button
                  type="button" onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Suite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TEST CASE CREATION MATRIX MODAL --- */}
      {selectedSuite && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-5xl bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">
                    {selectedSuite.title}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-500">
                    {selectedSuite.suite_type || 'Adhoc'}
                  </span>
                </div>
                {selectedSuite.jira_ticket && (
                  <a 
                    href={getJiraUrl(selectedSuite.jira_ticket)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-mono text-blue-500 hover:underline font-bold mt-1"
                  >
                    <span>🎫 JIRA Ticket: {selectedSuite.jira_ticket}</span>
                    <span>↗</span>
                  </a>
                )}
                <p className="text-xs text-slate-400 mt-1">{selectedSuite.description}</p>
              </div>
              <button 
                onClick={() => setSelectedSuite(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Test Case Creation Form with Auto-Generated ID */}
            <form onSubmit={handleAddTestCase} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 mb-6 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Create Test Case</span>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
                
                {/* Auto-Generated Test Case ID Display Badge */}
                <div className="flex flex-col justify-center px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-black text-xs select-none">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-sans block">Auto ID</span>
                  {getNextTestCaseId()}
                </div>

                {/* Description */}
                <input 
                  type="text" 
                  required 
                  placeholder="Description..." 
                  value={tcDescription} 
                  onChange={(e) => setTcDescription(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none md:col-span-2"
                />

                {/* Preconditions */}
                <input 
                  type="text" 
                  placeholder="Preconditions (Optional)" 
                  value={tcPreconditions} 
                  onChange={(e) => setTcPreconditions(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                />

                {/* Expected Result */}
                <input 
                  type="text" 
                  required 
                  placeholder="Expected Result..." 
                  value={tcExpected} 
                  onChange={(e) => setTcExpected(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                />

                {/* Status Dropdown */}
                <select 
                  value={tcStatus} 
                  onChange={(e: any) => setTcStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none cursor-pointer font-semibold"
                >
                  <option value="Pending">PENDING</option>
                  <option value="Passed">PASSED</option>
                  <option value="Failed">FAILED</option>
                  <option value="On Hold">ON HOLD</option>
                </select>

              </div>

              <div className="flex justify-between items-center pt-2">
                <input 
                  type="text" 
                  placeholder="Assigned QA (e.g. John Doe)" 
                  value={tcAssignedQa} 
                  onChange={(e) => setTcAssignedQa(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none w-64"
                />

                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow cursor-pointer"
                >
                  + ADD TEST CASE
                </button>
              </div>
            </form>

            {/* Test Execution Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                    <th className="p-3">Test Case ID</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Preconditions</th>
                    <th className="p-3">Expected Result</th>
                    <th className="p-3">Assigned QA</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {testCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{tc.testCaseId}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-white">{tc.description}</td>
                      <td className="p-3 text-slate-400 italic">{tc.preconditions || '—'}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{tc.expectedResult}</td>
                      <td className="p-3 font-medium text-slate-500 dark:text-slate-400">{tc.assignedQa}</td>
                      <td className="p-3">
                        <select 
                          value={tc.status}
                          onChange={(e: any) => handleStatusChange(tc.id, e.target.value)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border-0 cursor-pointer outline-none ${
                            tc.status === 'Passed' ? 'bg-green-500/10 text-green-500' :
                            tc.status === 'Failed' ? 'bg-red-500/10 text-red-500' :
                            tc.status === 'On Hold' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">PENDING</option>
                          <option value="Passed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">PASSED</option>
                          <option value="Failed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">FAILED</option>
                          <option value="On Hold" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">ON HOLD</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteTestCase(tc.id)}
                          className="text-red-500 hover:underline font-bold uppercase text-[10px] cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {testCases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 text-xs italic">
                        No test cases cataloged yet. Fill out the form above to log your first test case.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-6">
              <button 
                onClick={() => setSelectedSuite(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close Matrix
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}