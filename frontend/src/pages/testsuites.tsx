import { useState, useEffect } from 'react';
import { qaSuiteAPI } from '../services/api';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
}

interface TestCase {
  id: string;
  testCaseId: string;
  description: string;
  preconditions?: string;
  expectedResult: string;
  status: 'Passed' | 'Failed' | 'Pending' | 'On Hold';
  attachments?: Attachment[];
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
  assigned_qa?: string;
  test_cases?: TestCase[];
  deletedAt?: string | null;
}

interface TestPlan {
  id: string;
  planId: string;
  title: string;
  environment: 'Staging' | 'UAT' | 'Production';
  targetRelease: string;
  linkedSuites: string[];
  status: 'Draft' | 'In Progress' | 'Completed';
  createdAt: string;
}

interface TestSuitesProps {
  isDarkMode: boolean;
  currentUser?: any;
}

export default function TestSuites({ isDarkMode }: TestSuitesProps) {
  const [activeTab, setActiveTab] = useState<'suites' | 'plans'>('suites');

  // Core Data States
  const [suites, setSuites] = useState<QASuite[]>([]);
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);

  // Projects list
  const [projects, setProjects] = useState<Project[]>([]);

  // Dedicated Full Page State for Selected Suite View
  const [activeMatrixSuite, setActiveMatrixSuite] = useState<QASuite | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Dedicated Full Page State for Selected Test Plan View
  const [activePlanView, setActivePlanView] = useState<TestPlan | null>(null);

  // Edit Suite Specs Modal State
  const [isEditSuiteModalOpen, setIsEditSuiteModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editSuiteType, setEditSuiteType] = useState<'Adhoc' | 'With JIRA Ticket'>('Adhoc');
  const [editJiraTicket, setEditJiraTicket] = useState('');
  const [editAssignedQa, setEditAssignedQa] = useState('');
  const [editProjectId, setEditProjectId] = useState<string>('');

  // Edit Test Plan Modal State
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [editPlanTitle, setEditPlanTitle] = useState('');
  const [editEnvironment, setEditEnvironment] = useState<'Staging' | 'UAT' | 'Production'>('Staging');
  const [editTargetRelease, setEditTargetRelease] = useState('');
  const [editPlanSelectedSuites, setEditPlanSelectedSuites] = useState<string[]>([]);

  // Create Suite Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [suiteType, setSuiteType] = useState<'Adhoc' | 'With JIRA Ticket'>('Adhoc');
  const [jiraTicket, setJiraTicket] = useState('');
  const [assignedQaSuite, setAssignedQaSuite] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test Case Form State
  const [tcDescription, setTcDescription] = useState('');
  const [tcPreconditions, setTcPreconditions] = useState('');
  const [tcExpected, setTcExpected] = useState('');
  const [tcStatus, setTcStatus] = useState<'Passed' | 'Failed' | 'Pending' | 'On Hold'>('Pending');
  const [tcAttachments, setTcAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Lightbox Media Preview State
  const [previewMedia, setPreviewMedia] = useState<Attachment | null>(null);

  // Report Document Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Create Test Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [environment, setEnvironment] = useState<'Staging' | 'UAT' | 'Production'>('Staging');
  const [targetRelease, setTargetRelease] = useState('');
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);

  // Helpers
  const getJiraUrl = (ticketKey: string) => {
    const cleanKey = ticketKey.trim();
    if (!cleanKey) return '#';
    if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) return cleanKey;
    return `https://paramountdirect.atlassian.net/browse/${cleanKey}`;
  };

  const getSuiteInitials = (title: string) => {
    if (!title || !title.trim()) return 'TC';
    const words = title.trim().split(/\s+/);
    if (words.length === 1) {
      return title.trim().toUpperCase().slice(0, 4);
    }
    return words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const getNextTestCaseId = () => {
    if (!activeMatrixSuite) return 'TC-001';
    const prefix = getSuiteInitials(activeMatrixSuite.title);
    const nextNum = testCases.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}-${padded}`;
  };

  const getLinkedPlansForSuite = (suiteId: number) => {
    return testPlans.filter(p => p.linkedSuites.includes(String(suiteId)));
  };

  // Dashboard Metrics
  const totalCases = testCases.length;
  const passedCases = testCases.filter(c => c.status === 'Passed').length;
  const failedCases = testCases.filter(c => c.status === 'Failed').length;
  const passingRate = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;

  // Aggregate all gallery attachments across test cases
  const suiteGalleryAttachments = testCases.flatMap(tc => 
    (tc.attachments || []).map(att => ({ ...att, testCaseId: tc.testCaseId, testCaseDesc: tc.description }))
  );

  useEffect(() => {
    const savedProjects = localStorage.getItem('qa_ba_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedPlans = localStorage.getItem('qa_test_plans');
    if (savedPlans) setTestPlans(JSON.parse(savedPlans));

    loadSuites();
  }, []);

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
            if (now - deletedTime > FIFTEEN_DAYS_MS) return false;
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

  const handleMoveToTrash = (id: number) => {
    const timestamp = new Date().toISOString();
    const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
    trashedStorage[id] = timestamp;
    localStorage.setItem('qa_suites_trash', JSON.stringify(trashedStorage));
    setSuites(prev => prev.map(s => s.id === id ? { ...s, deletedAt: timestamp } : s));
  };

  const handleRestoreFromTrash = (id: number) => {
    const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
    delete trashedStorage[id];
    localStorage.setItem('qa_suites_trash', JSON.stringify(trashedStorage));
    setSuites(prev => prev.map(s => s.id === id ? { ...s, deletedAt: null } : s));
  };

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
        assigned_qa: assignedQaSuite || 'Unassigned',
      } as any);

      alert("QA Test Suite created successfully!");
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('Medium');
      setSuiteType('Adhoc');
      setJiraTicket('');
      setAssignedQaSuite('');
      setSelectedProjectId('');
      loadSuites();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create test suite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert("Please upload image screenshots or video recordings only.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const newAttachment: Attachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            type: isImage ? 'image' : 'video',
            url: result,
          };
          setTcAttachments(prev => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleRemoveAttachment = (attId: string) => {
    setTcAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleOpenEditSpecs = () => {
    if (!activeMatrixSuite) return;
    setEditTitle(activeMatrixSuite.title);
    setEditDescription(activeMatrixSuite.description || '');
    setEditPriority(activeMatrixSuite.priority || 'Medium');
    setEditSuiteType(activeMatrixSuite.suite_type || 'Adhoc');
    setEditJiraTicket(activeMatrixSuite.jira_ticket || '');
    setEditAssignedQa(activeMatrixSuite.assigned_qa || '');
    setEditProjectId(activeMatrixSuite.project_id ? String(activeMatrixSuite.project_id) : '');
    setIsEditSuiteModalOpen(true);
  };

  const handleSaveEditedSpecs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatrixSuite) return;

    const updatedSuite: QASuite = {
      ...activeMatrixSuite,
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      suite_type: editSuiteType,
      jira_ticket: editSuiteType === 'With JIRA Ticket' ? editJiraTicket : '',
      assigned_qa: editAssignedQa || 'Unassigned',
      project_id: editProjectId || null,
    };

    setActiveMatrixSuite(updatedSuite);
    setSuites(prev => prev.map(s => s.id === updatedSuite.id ? updatedSuite : s));
    localStorage.setItem(`qa_suite_spec_${updatedSuite.id}`, JSON.stringify(updatedSuite));
    setIsEditSuiteModalOpen(false);
    alert("Test Suite specifications updated successfully!");
  };

  const handleGenerateReport = () => {
    if (!activeMatrixSuite) return;
    setIsReportModalOpen(true);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleOpenEditPlan = (plan: TestPlan) => {
    setEditPlanTitle(plan.title);
    setEditEnvironment(plan.environment);
    setEditTargetRelease(plan.targetRelease);
    setEditPlanSelectedSuites(plan.linkedSuites || []);
    setIsEditPlanModalOpen(true);
  };

  const handleSaveEditedPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanView) return;

    const updatedPlan: TestPlan = {
      ...activePlanView,
      title: editPlanTitle,
      environment: editEnvironment,
      targetRelease: editTargetRelease,
      linkedSuites: editPlanSelectedSuites,
    };

    const updatedPlans = testPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setTestPlans(updatedPlans);
    setActivePlanView(updatedPlan);
    localStorage.setItem('qa_test_plans', JSON.stringify(updatedPlans));
    setIsEditPlanModalOpen(false);
    alert("Test Plan updated successfully!");
  };

  const handleCreateTestPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    const nextId = `TP-${String(testPlans.length + 1).padStart(3, '0')}`;
    const newPlan: TestPlan = {
      id: `plan-${Date.now()}`,
      planId: nextId,
      title: planTitle,
      environment,
      targetRelease: targetRelease || 'v1.0.0',
      linkedSuites: selectedSuites,
      status: 'In Progress',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updatedPlans = [newPlan, ...testPlans];
    setTestPlans(updatedPlans);
    localStorage.setItem('qa_test_plans', JSON.stringify(updatedPlans));
    setPlanTitle('');
    setTargetRelease('');
    setSelectedSuites([]);
    setIsPlanModalOpen(false);
    alert("Test Plan created successfully!");
  };

  const toggleSuiteSelection = (suiteId: string) => {
    if (selectedSuites.includes(suiteId)) {
      setSelectedSuites(selectedSuites.filter(id => id !== suiteId));
    } else {
      setSelectedSuites([...selectedSuites, suiteId]);
    }
  };

  const toggleEditPlanSuiteSelection = (suiteId: string) => {
    if (editPlanSelectedSuites.includes(suiteId)) {
      setEditPlanSelectedSuites(editPlanSelectedSuites.filter(id => id !== suiteId));
    } else {
      setEditPlanSelectedSuites([...editPlanSelectedSuites, suiteId]);
    }
  };

  const handleDeletePlan = (id: string) => {
    if (confirm("Are you sure you want to delete this Test Plan?")) {
      const updated = testPlans.filter(p => p.id !== id);
      setTestPlans(updated);
      localStorage.setItem('qa_test_plans', JSON.stringify(updated));
      if (activePlanView?.id === id) setActivePlanView(null);
    }
  };

  const handleOpenSuitePage = (suite: QASuite) => {
    const savedSpec = localStorage.getItem(`qa_suite_spec_${suite.id}`);
    const finalSuite = savedSpec ? JSON.parse(savedSpec) : suite;

    setActiveMatrixSuite(finalSuite);
    setActivePlanView(null);
    setEditingCaseId(null);
    resetFormInputs();

    const savedCases = localStorage.getItem(`qa_suite_cases_${suite.id}`);
    if (savedCases) {
      setTestCases(JSON.parse(savedCases));
    } else {
      setTestCases(suite.test_cases || []);
    }
  };

  const handleOpenPlanPage = (plan: TestPlan) => {
    setActivePlanView(plan);
    setActiveMatrixSuite(null);
  };

  const resetFormInputs = () => {
    setTcDescription('');
    setTcPreconditions('');
    setTcExpected('');
    setTcStatus('Pending');
    setTcAttachments([]);
  };

  const handleSaveTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatrixSuite || !tcDescription.trim()) return;

    if (editingCaseId) {
      const updated = testCases.map(tc => tc.id === editingCaseId ? {
        ...tc,
        description: tcDescription,
        preconditions: tcPreconditions,
        expectedResult: tcExpected,
        status: tcStatus,
        attachments: tcAttachments,
      } : tc);

      setTestCases(updated);
      localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
      setEditingCaseId(null);
    } else {
      const autoGeneratedId = getNextTestCaseId();
      const newCase: TestCase = {
        id: `tc-${Date.now()}`,
        testCaseId: autoGeneratedId,
        description: tcDescription,
        preconditions: tcPreconditions,
        expectedResult: tcExpected,
        status: tcStatus,
        attachments: tcAttachments,
      };

      const updated = [...testCases, newCase];
      setTestCases(updated);
      localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
    }

    resetFormInputs();
  };

  const handleStartEdit = (tc: TestCase) => {
    setEditingCaseId(tc.id);
    setTcDescription(tc.description);
    setTcPreconditions(tc.preconditions || '');
    setTcExpected(tc.expectedResult);
    setTcStatus(tc.status);
    setTcAttachments(tc.attachments || []);
  };

  const handleCancelEdit = () => {
    setEditingCaseId(null);
    resetFormInputs();
  };

  const handleStatusChange = (id: string, status: 'Passed' | 'Failed' | 'Pending' | 'On Hold') => {
    if (!activeMatrixSuite) return;
    const updated = testCases.map(tc => tc.id === id ? { ...tc, status } : tc);
    setTestCases(updated);
    localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
  };

  const handleDeleteTestCase = (id: string) => {
    if (!activeMatrixSuite) return;
    const updated = testCases.filter(tc => tc.id !== id);
    setTestCases(updated);
    localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
    if (editingCaseId === id) handleCancelEdit();
  };

  const getProjectName = (projId?: string | number | null) => {
    if (!projId) return null;
    const found = projects.find(p => p.id.toString() === projId.toString());
    return found ? found.name : null;
  };

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

  // =====================================================================
  // DEDICATED TEST PLAN VIEW (/name_of_test_plan)
  // =====================================================================
  if (activePlanView) {
    const planSlug = activePlanView.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const linkedSuiteObjs = activeSuites.filter(s => activePlanView.linkedSuites.includes(String(s.id)));

    return (
      <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActivePlanView(null)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-cardDark text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <span>← Back to Test Plans</span>
            </button>
            <span className="font-mono text-xs font-semibold text-slate-400">/{planSlug}</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">{activePlanView.planId}</span>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                  {activePlanView.title}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  activePlanView.environment === 'Production' ? 'bg-red-500/10 text-red-500' :
                  activePlanView.environment === 'UAT' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {activePlanView.environment}
                </span>
              </div>
              <p className="text-xs text-slate-400">Target Release Version: <strong className="text-slate-700 dark:text-slate-200 font-bold">{activePlanView.targetRelease}</strong></p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleOpenEditPlan(activePlanView)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
              >
                EDIT TEST PLAN
              </button>
              <button
                onClick={() => handleDeletePlan(activePlanView.id)}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                DELETE PLAN
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">
              LINKED TEST EXECUTION SUITES ({linkedSuiteObjs.length})
            </h2>

            {linkedSuiteObjs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {linkedSuiteObjs.map((suite) => {
                  const assignedProjectName = getProjectName(suite.project_id);
                  return (
                    <div 
                      key={suite.id}
                      onClick={() => handleOpenSuitePage(suite)}
                      className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                              {suite.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {suite.jira_ticket && (
                                <a 
                                  href={getJiraUrl(suite.jira_ticket)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all cursor-pointer"
                                >
                                  <span>JIRA: {suite.jira_ticket}</span>
                                  <span className="text-[9px]">↗</span>
                                </a>
                              )}

                              {assignedProjectName && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  Project: {assignedProjectName}
                                </span>
                              )}

                              {suite.assigned_qa && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                  QA: {suite.assigned_qa}
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
                        <span>Type: {suite.suite_type === 'With JIRA Ticket' ? 'JIRA Ticket' : 'Ad-Hoc Suite'}</span>
                        <span className="text-blue-600 dark:text-blue-400 group-hover:underline uppercase tracking-wider font-extrabold flex items-center space-x-1">
                          <span>OPEN SUITE</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 p-12 text-center text-slate-400 text-xs italic">
                No test suites linked to this plan yet. Click "EDIT TEST PLAN" above to select suites.
              </div>
            )}
          </div>

        </div>

        {/* EDIT TEST PLAN MODAL */}
        {isEditPlanModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Edit Release Test Plan</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Update title, environment, target release, and linked suites.</p>
                </div>
                <button onClick={() => setIsEditPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveEditedPlan} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Test Plan Title</label>
                  <input
                    type="text" required value={editPlanTitle} onChange={(e) => setEditPlanTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Environment</label>
                    <select
                      value={editEnvironment} onChange={(e: any) => setEditEnvironment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Staging">Staging</option>
                      <option value="UAT">UAT</option>
                      <option value="Production">Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Release</label>
                    <input
                      type="text" value={editTargetRelease} onChange={(e) => setEditTargetRelease(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-2 text-[10px]">Select Linked Test Suites</label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
                    {activeSuites.map((s) => (
                      <label key={s.id} className="flex items-center space-x-3 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={editPlanSelectedSuites.includes(String(s.id))}
                          onChange={() => toggleEditPlanSuiteSelection(String(s.id))}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{s.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                  <button
                    type="button" onClick={() => setIsEditPlanModalOpen(false)}
                    className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Save Test Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // DEDICATED FULL-PAGE MATRIX VIEW FOR /name_of_test_suite (SIDEBAR LAYOUT)
  // =====================================================================
  if (activeMatrixSuite) {
    const slugName = activeMatrixSuite.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const assignedProjectName = getProjectName(activeMatrixSuite.project_id);
    const linkedPlans = getLinkedPlansForSuite(activeMatrixSuite.id);
    const currentDateFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveMatrixSuite(null)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-cardDark text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <span>← Back to Test Suites</span>
            </button>
            <span className="font-mono text-xs font-semibold text-slate-400">/{slugName}</span>
          </div>

          {/* MAIN 2-COLUMN SIDEBAR GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT SIDEBAR: TEST SPECS & ATTACHMENTS GALLERY */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* TEST SPECS CARD WITH REPORT GENERATOR */}
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-500 inline-block mb-1">
                      {activeMatrixSuite.suite_type || 'Adhoc'}
                    </span>
                    <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                      {activeMatrixSuite.title}
                    </h1>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    activeMatrixSuite.priority === 'Critical' ? 'bg-red-500/10 text-red-500' :
                    activeMatrixSuite.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                    activeMatrixSuite.priority === 'Medium' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {activeMatrixSuite.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{activeMatrixSuite.description || "No description provided."}</p>

                <div className="flex flex-wrap gap-2 text-xs font-bold pt-1">
                  {activeMatrixSuite.jira_ticket && (
                    <a 
                      href={getJiraUrl(activeMatrixSuite.jira_ticket)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                    >
                      <span>JIRA: {activeMatrixSuite.jira_ticket}</span>
                      <span>↗</span>
                    </a>
                  )}

                  {assignedProjectName && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px]">
                      Project: {assignedProjectName}
                    </span>
                  )}

                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px]">
                    QA: {activeMatrixSuite.assigned_qa || 'Unassigned'}
                  </span>

                  {linkedPlans.map(lp => (
                    <button 
                      key={lp.id} 
                      onClick={() => { setActiveMatrixSuite(null); handleOpenPlanPage(lp); }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:underline cursor-pointer"
                    >
                      Plan: {lp.planId} ({lp.title}) ↗
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={handleOpenEditSpecs}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Edit Suite Specs
                  </button>

                  <button
                    onClick={handleGenerateReport}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Auto-Generate Test Report
                  </button>
                </div>
              </div>

              {/* ATTACHMENTS GALLERY CARD */}
              <div className="bg-white dark:bg-neutral-cardDark p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">
                    ATTACHMENTS GALLERY ({suiteGalleryAttachments.length})
                  </h2>
                </div>

                {suiteGalleryAttachments.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {suiteGalleryAttachments.map((att) => (
                      <div key={att.id} className="py-2 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1 rounded transition-all">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="font-mono font-bold text-[10px] text-blue-600 dark:text-blue-400 shrink-0">
                            {att.testCaseId}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={att.name}>
                            {att.name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => setPreviewMedia(att)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            Preview
                          </button>
                          <a
                            href={att.url}
                            download={att.name}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all cursor-pointer"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No attachments uploaded for this test suite.</p>
                )}
              </div>

            </div>

            {/* RIGHT WORKSPACE COLUMN */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* SLIM COMPACT METRICS BAR */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-neutral-cardDark p-3 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
                <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Total Cases</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white block mt-0.5">{totalCases}</span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <span className="text-[9px] font-black uppercase text-green-500 tracking-wider block">Passed</span>
                  <span className="text-lg font-black text-green-500 block mt-0.5">{passedCases}</span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <span className="text-[9px] font-black uppercase text-red-500 tracking-wider block">Failed</span>
                  <span className="text-lg font-black text-red-500 block mt-0.5">{failedCases}</span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider block">Pass Rate</span>
                    <span className="text-lg font-black text-blue-500 block mt-0.5">{passingRate}%</span>
                  </div>
                </div>
              </div>

              {/* CREATE / EDIT TEST CASE FORM */}
              <form onSubmit={handleSaveTestCase} className="bg-white dark:bg-neutral-cardDark p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                    {editingCaseId ? 'Edit Test Case' : 'Add New Test Case'}
                  </span>
                  {editingCaseId && (
                    <button 
                      type="button" onClick={handleCancelEdit}
                      className="text-xs font-bold text-amber-500 hover:underline uppercase cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
                  <div className="flex flex-col justify-center px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-black text-xs select-none">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-sans block">Auto ID</span>
                    {editingCaseId ? testCases.find(c => c.id === editingCaseId)?.testCaseId : getNextTestCaseId()}
                  </div>

                  <input 
                    type="text" 
                    required 
                    placeholder="Description..." 
                    value={tcDescription} 
                    onChange={(e) => setTcDescription(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none md:col-span-2 font-medium"
                  />

                  <input 
                    type="text" 
                    placeholder="Preconditions (Optional)" 
                    value={tcPreconditions} 
                    onChange={(e) => setTcPreconditions(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-medium"
                  />

                  <input 
                    type="text" 
                    required 
                    placeholder="Expected Result..." 
                    value={tcExpected} 
                    onChange={(e) => setTcExpected(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-medium"
                  />

                  <select 
                    value={tcStatus} 
                    onChange={(e: any) => setTcStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none cursor-pointer font-bold"
                  >
                    <option value="Pending">PENDING</option>
                    <option value="Passed">PASSED</option>
                    <option value="Failed">FAILED</option>
                    <option value="On Hold">ON HOLD</option>
                  </select>
                </div>

                {/* DRAG & DROP DROPZONE */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Attach Screenshots or Video Recordings
                  </label>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden" 
                      id="tc-file-input"
                    />
                    <label htmlFor="tc-file-input" className="cursor-pointer space-y-1 block">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                        Drag and drop screenshot/video files here, or click to browse
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Supported formats: PNG, JPG, MP4, WebM
                      </span>
                    </label>
                  </div>

                  {tcAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {tcAttachments.map((att) => (
                        <div key={att.id} className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                          <span className="font-bold text-blue-500 uppercase text-[9px]">{att.type}</span>
                          <span className="max-w-[150px] truncate text-[11px] text-slate-700 dark:text-slate-200">{att.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    type="submit"
                    className={`px-5 py-2.5 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all ${
                      editingCaseId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    {editingCaseId ? 'UPDATE TEST CASE' : '+ ADD TEST CASE'}
                  </button>
                </div>
              </form>

              {/* TABLE MATRIX */}
              <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                      <th className="p-4">Test Case ID</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Preconditions</th>
                      <th className="p-4">Expected Result</th>
                      <th className="p-4">Attachments</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {testCases.map((tc) => (
                      <tr key={tc.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 ${editingCaseId === tc.id ? 'bg-amber-500/10' : ''}`}>
                        <td className="p-4 font-mono font-black text-blue-600 dark:text-blue-400">{tc.testCaseId}</td>
                        <td className="p-4 font-semibold text-slate-800 dark:text-white">{tc.description}</td>
                        <td className="p-4 text-slate-400 italic">{tc.preconditions || '—'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{tc.expectedResult}</td>
                        
                        <td className="p-4">
                          {tc.attachments && tc.attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {tc.attachments.map(att => (
                                <div key={att.id} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  <button
                                    onClick={() => setPreviewMedia(att)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate max-w-[80px]"
                                    title={att.name}
                                  >
                                    {att.name}
                                  </button>
                                  <a
                                    href={att.url}
                                    download={att.name}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold ml-1"
                                    title="Download File"
                                  >
                                    ↓
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">None</span>
                          )}
                        </td>

                        <td className="p-4">
                          <select 
                            value={tc.status}
                            onChange={(e: any) => handleStatusChange(tc.id, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-0 cursor-pointer outline-none ${
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
                        <td className="p-4 text-right space-x-3">
                          <button 
                            onClick={() => handleStartEdit(tc)}
                            className="text-amber-500 hover:underline font-extrabold uppercase text-[10px] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteTestCase(tc.id)}
                            className="text-red-500 hover:underline font-extrabold uppercase text-[10px] cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {testCases.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-xs italic">
                          No test cases logged yet. Use the form above to add your first test case.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>

        {/* LIGHTBOX MEDIA PREVIEW MODAL */}
        {previewMedia && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="max-w-4xl w-full bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{previewMedia.name}</span>
                <div className="flex items-center space-x-3">
                  <a
                    href={previewMedia.url}
                    download={previewMedia.name}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    Download
                  </a>
                  <button onClick={() => setPreviewMedia(null)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
                </div>
              </div>
              <div className="max-h-[75vh] overflow-hidden flex items-center justify-center rounded-xl bg-black">
                {previewMedia.type === 'image' ? (
                  <img src={previewMedia.url} alt={previewMedia.name} className="max-h-[70vh] object-contain" />
                ) : (
                  <video src={previewMedia.url} controls autoPlay className="max-h-[70vh] w-full" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* PARAMOUNT HTML/PDF TEST REPORT MODAL */}
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="w-full max-w-4xl bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
              
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Paramount QA Test Report Preview</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Official company report template with embedded image/screenshot evidence.</p>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
              </div>

              {/* PRINTABLE HTML DOCUMENT CONTAINER */}
              <div id="printable-report" className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="bg-white text-slate-900 p-8 shadow-md max-w-3xl mx-auto border border-slate-300 font-sans space-y-6">
                  
                  {/* Top Header Banner */}
                  <div className="border border-slate-900 flex items-stretch">
                    <div className="bg-[#002B66] text-white px-4 py-2 font-bold text-xs flex items-center shrink-0">
                      {currentDateFormatted}
                    </div>
                    <div className="bg-white text-slate-900 px-4 py-2 font-black text-sm uppercase tracking-wider flex items-center flex-1 border-l border-slate-900">
                      QA TEST REPORT
                    </div>
                  </div>

                  {/* Title & JIRA Ticket Header */}
                  <div className="border-b border-slate-900 pb-2 space-y-1">
                    <h1 className="text-xl font-black underline tracking-tight text-slate-900">
                      {activeMatrixSuite.jira_ticket ? activeMatrixSuite.jira_ticket : activeMatrixSuite.title}
                    </h1>
                    <p className="text-xs font-bold text-slate-600 uppercase">Test Report</p>
                  </div>

                  {/* Test Case Summary Table */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-black uppercase text-slate-800">Test Case Summary:</h2>
                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-900 font-bold text-left text-[11px]">
                          <th className="border-r border-slate-900 p-2 w-1/3">Test Case ID</th>
                          <th className="p-2">Test Scenario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testCases.length > 0 ? (
                          testCases.map((tc) => (
                            <tr key={tc.id} className="border-b border-slate-300">
                              <td className="border-r border-slate-900 p-2 font-mono font-bold text-slate-800">{tc.testCaseId}</td>
                              <td className="p-2 font-medium text-slate-800">{tc.description}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="p-4 text-center text-slate-400 italic">No test cases recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Test Executions Detailed Blocks with Embedded Media */}
                  <div className="space-y-4 pt-2">
                    <h2 className="text-xs font-black uppercase text-slate-800">Test Executions:</h2>

                    {testCases.length > 0 ? (
                      testCases.map((tc) => (
                        <div key={tc.id} className="border border-slate-900 rounded-none text-xs overflow-hidden space-y-0">
                          <div className="grid grid-cols-4 border-b border-slate-900 bg-slate-50">
                            <div className="p-2 font-bold border-r border-slate-900 text-slate-700 bg-slate-100">Scenario</div>
                            <div className="p-2 col-span-3 space-y-1 font-medium">
                              <div><strong className="text-slate-900">Given:</strong> {tc.preconditions || 'System is operational'}</div>
                              <div><strong className="text-slate-900">When:</strong> {tc.description}</div>
                              <div><strong className="text-slate-900">Then:</strong> {tc.expectedResult}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 border-b border-slate-900">
                            <div className="p-2 font-bold border-r border-slate-900 text-slate-700 bg-slate-100">Test Case ID</div>
                            <div className="p-2 col-span-3 font-mono font-bold text-blue-800">{tc.testCaseId}</div>
                          </div>

                          <div className="grid grid-cols-4 border-b border-slate-900">
                            <div className="p-2 font-bold border-r border-slate-900 text-slate-700 bg-slate-100">Test Data</div>
                            <div className="p-2 col-span-3 text-slate-800">
                              {tc.attachments && tc.attachments.length > 0
                                ? tc.attachments.map(a => a.name).join(', ')
                                : 'N/A'}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 border-b border-slate-900">
                            <div className="p-2 font-bold border-r border-slate-900 text-slate-700 bg-slate-100">Test Result</div>
                            <div className="p-2 col-span-3 font-black tracking-wider text-slate-900">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                tc.status === 'Passed' ? 'bg-green-100 text-green-800' :
                                tc.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {tc.status}
                              </span>
                            </div>
                          </div>

                          {/* Embedded Screenshots Inside PDF Output */}
                          {tc.attachments && tc.attachments.some(a => a.type === 'image') && (
                            <div className="p-3 bg-slate-50 border-t border-slate-300 space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-500 block">Execution Evidence Screenshots:</span>
                              <div className="grid grid-cols-2 gap-2">
                                {tc.attachments.filter(a => a.type === 'image').map(img => (
                                  <div key={img.id} className="border border-slate-300 rounded overflow-hidden bg-white p-1">
                                    <img src={img.url} alt={img.name} className="max-h-48 w-full object-contain mx-auto" />
                                    <span className="block text-[9px] text-center text-slate-500 font-mono mt-1 truncate">{img.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No execution logs available.</p>
                    )}
                  </div>

                  {/* Document Footer */}
                  <div className="border border-slate-900 flex items-stretch mt-8 pt-0">
                    <div className="bg-[#002B66] text-white px-3 py-1 font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <div className="p-2 text-[10px] font-bold text-slate-700 flex-1 border-l border-slate-900">
                      QA Team | Systems and Development<br />
                      Paramount Life & General Insurance Inc.
                    </div>
                  </div>

                </div>
              </div>

              {/* Printable Media CSS Overrides */}
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #printable-report, #printable-report * { visibility: visible; }
                  #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                }
              `}</style>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer text-xs"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Print / Save as PDF
                </button>
              </div>

            </div>
          </div>
        )}

        {/* EDIT SUITE SPECS MODAL */}
        {isEditSuiteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Edit Test Suite Specifications</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Update title, assigned project, JIRA tickets, or priority.</p>
                </div>
                <button onClick={() => setIsEditSuiteModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveEditedSpecs} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Test Suite Type</label>
                  <select
                    value={editSuiteType} onChange={(e: any) => setEditSuiteType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Adhoc">Adhoc (Other)</option>
                    <option value="With JIRA Ticket">With JIRA Ticket</option>
                  </select>
                </div>

                {editSuiteType === 'With JIRA Ticket' && (
                  <div>
                    <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">JIRA Ticket Key / ID</label>
                    <input
                      type="text" required value={editJiraTicket} onChange={(e) => setEditJiraTicket(e.target.value)}
                      placeholder="e.g., ASPD-211 or PD-1111"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Assigned QA Engineer</label>
                  <input
                    type="text" value={editAssignedQa} onChange={(e) => setEditAssignedQa(e.target.value)}
                    placeholder="e.g., Arra Del Mundo"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Assign to Project Workspace</label>
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- No Project Selected (Standalone) --</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        Project: {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Suite Title</label>
                  <input
                    type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Priority Level</label>
                  <select
                    value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Description / Scope Notes</label>
                  <textarea
                    rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                  <button
                    type="button" onClick={() => setIsEditSuiteModalOpen(false)}
                    className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Save Specs
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // MAIN GALLERY VIEW (TEST SUITES & TEST PLANS)
  // =====================================================================
  return (
    <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              {activeTab === 'plans' 
                ? 'Release Test Plans' 
                : showTrash ? 'Archived Test Suites' : 'QA Test Suites'}
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
              {activeTab === 'plans'
                ? 'Aggregate suites into targeted execution cycles per release environment.'
                : showTrash 
                  ? 'Soft-deleted test suites will be permanently purged after 15 days.' 
                  : 'Overview of all ad-hoc and project-assigned QA test execution suites.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-300/50 dark:border-slate-800">
              <button
                onClick={() => { setActiveTab('suites'); setShowTrash(false); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'suites' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                Test Suites ({activeSuites.length})
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'plans' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                Test Plans ({testPlans.length})
              </button>
            </div>

            {activeTab === 'suites' ? (
              <>
                <button
                  onClick={() => setShowTrash(!showTrash)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    showTrash 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                      : 'bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300/60'
                  }`}
                >
                  <span>{showTrash ? 'Active Suites' : `Archived (${trashedSuites.length})`}</span>
                </button>

                {!showTrash && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>+ CREATE TEST SUITE</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center space-x-1.5 cursor-pointer"
              >
                <span>+ CREATE TEST PLAN</span>
              </button>
            )}
          </div>
        </div>

        {/* SUITES GALLERY */}
        {activeTab === 'suites' && (
          <>
            {displayedSuites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedSuites.map((suite) => {
                  const assignedProjectName = getProjectName(suite.project_id);
                  const linkedPlans = getLinkedPlansForSuite(suite.id);

                  return (
                    <div 
                      key={suite.id}
                      onClick={() => handleOpenSuitePage(suite)}
                      className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                              {suite.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {suite.jira_ticket && (
                                <a 
                                  href={getJiraUrl(suite.jira_ticket)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all cursor-pointer"
                                >
                                  <span>JIRA: {suite.jira_ticket}</span>
                                  <span className="text-[9px]">↗</span>
                                </a>
                              )}

                              {assignedProjectName && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  Project: {assignedProjectName}
                                </span>
                              )}

                              {suite.assigned_qa && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                  QA: {suite.assigned_qa}
                                </span>
                              )}

                              {linkedPlans.map(lp => (
                                <button
                                  key={lp.id}
                                  onClick={(e) => { e.stopPropagation(); handleOpenPlanPage(lp); }}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                  Plan: {lp.planId} ({lp.title})
                                </button>
                              ))}
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
                        <span>Type: {suite.suite_type === 'With JIRA Ticket' ? 'JIRA Ticket' : 'Ad-Hoc Suite'}</span>
                        
                        <div className="flex items-center space-x-3">
                          {!showTrash ? (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMoveToTrash(suite.id); }}
                                className="text-red-500 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
                              >
                                Delete
                              </button>
                              <span className="text-blue-600 dark:text-blue-400 group-hover:underline uppercase tracking-wider font-extrabold cursor-pointer">
                                OPEN →
                              </span>
                            </>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRestoreFromTrash(suite.id); }}
                              className="text-emerald-500 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
                            >
                              Restore Suite
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
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                  {showTrash ? 'Archived Box is Empty' : 'No Test Suites Found'}
                </h2>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 mb-6 leading-relaxed">
                  {showTrash ? 'No archived test suites pending expiration.' : 'You haven\'t logged any ad-hoc or JIRA test suites yet.'}
                </p>
                {!showTrash && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    + Create First Test Suite
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* TEST PLANS GALLERY */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testPlans.map((plan) => {
                const linkedSuiteObjs = activeSuites.filter(s => plan.linkedSuites.includes(String(s.id)));

                return (
                  <div key={plan.id} className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">{plan.planId}</span>
                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{plan.title}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        plan.environment === 'Production' ? 'bg-red-500/10 text-red-500' :
                        plan.environment === 'UAT' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {plan.environment}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 font-semibold border-y border-slate-100 dark:border-slate-800/50 py-3">
                      <span>Target Release: <strong className="text-slate-700 dark:text-slate-200">{plan.targetRelease}</strong></span>
                      <span>Linked Suites: <strong className="text-slate-700 dark:text-slate-200">{plan.linkedSuites.length}</strong></span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Test Suites:</span>
                      {linkedSuiteObjs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {linkedSuiteObjs.map((suite) => (
                            <button
                              key={suite.id}
                              onClick={() => handleOpenSuitePage(suite)}
                              className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all cursor-pointer flex items-center space-x-1"
                            >
                              <span>{suite.title}</span>
                              <span className="text-[9px]">↗</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No suites linked to this plan.</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/50 text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Created {plan.createdAt}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenPlanPage(plan)}
                          className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer uppercase"
                        >
                          Open Plan →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {testPlans.length === 0 && (
                <div className="col-span-full max-w-md mx-auto my-12 text-center bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-10 shadow-md space-y-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">No Test Plans Configured</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Organize your test execution cycles per release environment by creating a new Test Plan.
                  </p>
                  <button
                    onClick={() => setIsPlanModalOpen(true)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md cursor-pointer mt-2"
                  >
                    + Create First Test Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* CREATE TEST SUITE MODAL */}
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

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Assigned QA Engineer</label>
                <input
                  type="text" value={assignedQaSuite} onChange={(e) => setAssignedQaSuite(e.target.value)}
                  placeholder="e.g. Arra Del Mundo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

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
                      Project: {proj.name}
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

      {/* CREATE TEST PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Create Release Test Plan</h3>
                <p className="text-[10px] text-slate-400 font-medium">Link suites together for release deployment testing.</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTestPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Test Plan Title</label>
                <input
                  type="text" required value={planTitle} onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Sprint 24 Regression Cycle"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Environment</label>
                  <select
                    value={environment} onChange={(e: any) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Staging">Staging</option>
                    <option value="UAT">UAT</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Release</label>
                  <input
                    type="text" value={targetRelease} onChange={(e) => setTargetRelease(e.target.value)}
                    placeholder="e.g. v2.4.0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-2 text-[10px]">Select Test Suites to Include</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
                  {activeSuites.map((s) => (
                    <label key={s.id} className="flex items-center space-x-3 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={selectedSuites.includes(String(s.id))}
                        onChange={() => toggleSuiteSelection(String(s.id))}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{s.title}</span>
                    </label>
                  ))}
                  {activeSuites.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No active test suites available to link.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <button
                  type="button" onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Test Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEST PLAN MODAL */}
      {isEditPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Edit Release Test Plan</h3>
                <p className="text-[10px] text-slate-400 font-medium">Update title, environment, target release, and linked suites.</p>
              </div>
              <button onClick={() => setIsEditPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditedPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Test Plan Title</label>
                <input
                  type="text" required value={editPlanTitle} onChange={(e) => setEditPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Environment</label>
                  <select
                    value={editEnvironment} onChange={(e: any) => setEditEnvironment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Staging">Staging</option>
                    <option value="UAT">UAT</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Release</label>
                  <input
                    type="text" value={editTargetRelease} onChange={(e) => setEditTargetRelease(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-2 text-[10px]">Select Linked Test Suites</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
                  {activeSuites.map((s) => (
                    <label key={s.id} className="flex items-center space-x-3 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={editPlanSelectedSuites.includes(String(s.id))}
                        onChange={() => toggleEditPlanSuiteSelection(String(s.id))}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <button
                  type="button" onClick={() => setIsEditPlanModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Test Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}