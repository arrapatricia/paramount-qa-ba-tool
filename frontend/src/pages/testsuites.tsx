import { useState, useEffect } from 'react';
import { qaSuiteAPI } from '../services/api';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  url: string;
  size?: string;
}

interface TestStep {
  stepNumber: number;
  action: string;
}

interface TestCase {
  id: string;
  testCaseId: string;
  description: string;
  preconditions?: string;
  expectedResult: string;
  actualResult?: string;
  status: 'Passed' | 'Failed' | 'Pending' | 'On Hold' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  steps?: TestStep[];
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
  created_at?: string;
  updated_at?: string;
}

interface TestRun {
  id: string;
  runId: string;
  suiteTitle: string;
  planId?: string;
  runnerType: 'Manual' | 'Robot Framework';
  passedCount: number;
  failedCount: number;
  totalCount: number;
  status: 'Passed' | 'Failed' | 'In Progress';
  executedAt: string;
  executionLogs?: string;
  archivedAt?: string | null;
}

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
}

interface TestSuitesProps {
  isDarkMode: boolean;
  currentUser?: any;
}

export default function TestSuites({ isDarkMode, currentUser }: TestSuitesProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'suites' | 'runs'>('suites');

  // Data States
  const [suites, setSuites] = useState<QASuite[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Active Selected Suite View States
  const [activeMatrixSuite, setActiveMatrixSuite] = useState<QASuite | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [, setSuiteAuditLogs] = useState<AuditLog[]>([]);
  const [detailTab, setDetailTab] = useState<'details' | 'steps' | 'attachments'>('details');

  // Preview Media Lightbox Modal State
  const [previewMedia, setPreviewMedia] = useState<Attachment | null>(null);

  // Filter Bar & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  // Suite Edit / Create Modal States
  const [isEditSuiteModalOpen, setIsEditSuiteModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editSuiteType, setEditSuiteType] = useState<'Adhoc' | 'With JIRA Ticket'>('Adhoc');
  const [editJiraTicket, setEditJiraTicket] = useState('');
  const [editAssignedQa, setEditAssignedQa] = useState('');
  const [editProjectId, setEditProjectId] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [suiteType, setSuiteType] = useState<'Adhoc' | 'With JIRA Ticket'>('Adhoc');
  const [jiraTicket, setJiraTicket] = useState('');
  const [assignedQaSuite, setAssignedQaSuite] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add / Edit Test Case Modal State
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [caseDesc, setCaseDesc] = useState('');
  const [casePreconditions, setCasePreconditions] = useState('');
  const [caseExpected, setCaseExpected] = useState('');
  const [caseActual, setCaseActual] = useState('');
  const [casePriority, setCasePriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [caseStatus, setCaseStatus] = useState<'Passed' | 'Failed' | 'Pending' | 'On Hold' | 'Blocked'>('Pending');
  const [caseSteps, setCaseSteps] = useState<string[]>([]);
  const [caseAttachments, setCaseAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Test Run Modal State
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [editingRunId, setEditingRunId] = useState<string | null>(null);
  const [runSuiteTitle, setRunSuiteTitle] = useState('');
  const [runnerType, setRunnerType] = useState<'Manual' | 'Robot Framework'>('Robot Framework');
  const [runPassedCount, setRunPassedCount] = useState<number>(0);
  const [runFailedCount, setRunFailedCount] = useState<number>(0);
  const [runLogs, setRunLogs] = useState('');

  const userName = currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'System User';

  useEffect(() => {
    const savedProjects = localStorage.getItem('qa_ba_projects');
    if (savedProjects) {
      try { setProjects(JSON.parse(savedProjects)); } catch (e) { setProjects([]); }
    }

    const savedRuns = localStorage.getItem('qa_test_runs');
    if (savedRuns) {
      try { setTestRuns(JSON.parse(savedRuns)); } catch (e) { setTestRuns([]); }
    } else {
      const initialRobotRun: TestRun = {
        id: 'run-001',
        runId: 'ROBOT-RUN-001',
        suiteTitle: 'Auth API Verification',
        runnerType: 'Robot Framework',
        passedCount: 8,
        failedCount: 0,
        totalCount: 8,
        status: 'Passed',
        executedAt: new Date().toLocaleString(),
        archivedAt: null
      };
      setTestRuns([initialRobotRun]);
      localStorage.setItem('qa_test_runs', JSON.stringify([initialRobotRun]));
    }

    loadSuites();
  }, []);

  const loadSuites = async () => {
    try {
      setIsLoading(true);
      let data: QASuite[] = [];
      try {
        data = await qaSuiteAPI.getAll();
      } catch (apiErr) {
        console.warn("API fallback to local storage:", apiErr);
      }

      const savedLocalSuites = localStorage.getItem('qa_local_suites');
      if ((!data || data.length === 0) && savedLocalSuites) {
        try { data = JSON.parse(savedLocalSuites); } catch (e) { data = []; }
      }

      if (!data || data.length === 0) {
        data = [
          {
            id: 101,
            title: 'Payment Distribution',
            description: 'Test suite to validate all payment distribution scenarios and allocations.',
            priority: 'Medium',
            suite_type: 'Adhoc',
            assigned_qa: 'Arra',
            created_at: 'Jul 20, 2026',
            updated_at: 'Jul 24, 2026 08:58 PM'
          }
        ];
        localStorage.setItem('qa_local_suites', JSON.stringify(data));
      }

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

  const getSuiteInitials = (title: string) => {
    if (!title || !title.trim()) return 'TC';
    const words = title.trim().split(/\s+/);
    if (words.length === 1) return title.trim().toUpperCase().slice(0, 4);
    return words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const reindexTestCases = (cases: TestCase[], suiteTitle: string): TestCase[] => {
    const prefix = getSuiteInitials(suiteTitle);
    return cases.map((tc, idx) => ({
      ...tc,
      testCaseId: tc.testCaseId || `${prefix}-${String(idx + 1).padStart(3, '0')}`
    }));
  };

  const logSuiteAudit = (suiteId: number, action: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newLog: AuditLog = { timestamp, user: userName, action };
    setSuiteAuditLogs(prev => [newLog, ...prev]);
  };

  const updateSuiteLastTouched = (suiteId: number) => {
    const formattedNow = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                         new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    if (activeMatrixSuite && activeMatrixSuite.id === suiteId) {
      const updated = { ...activeMatrixSuite, updated_at: formattedNow };
      setActiveMatrixSuite(updated);
      setSuites(prev => prev.map(s => s.id === suiteId ? updated : s));
    }
  };

  const handleMoveSuiteToTrash = (id: number) => {
    const timestamp = new Date().toISOString();
    const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
    trashedStorage[id] = timestamp;
    localStorage.setItem('qa_suites_trash', JSON.stringify(trashedStorage));
    setSuites(prev => prev.map(s => s.id === id ? { ...s, deletedAt: timestamp } : s));
  };

  const handleRestoreSuiteFromTrash = (id: number) => {
    const trashedStorage = JSON.parse(localStorage.getItem('qa_suites_trash') || '{}');
    delete trashedStorage[id];
    localStorage.setItem('qa_suites_trash', JSON.stringify(trashedStorage));
    setSuites(prev => prev.map(s => s.id === id ? { ...s, deletedAt: null } : s));
  };

  const handleArchiveTestRun = (runId: string) => {
    const timestamp = new Date().toISOString();
    const updatedRuns = testRuns.map(r => r.id === runId ? { ...r, archivedAt: timestamp } : r);
    setTestRuns(updatedRuns);
    localStorage.setItem('qa_test_runs', JSON.stringify(updatedRuns));
  };

  const handleRestoreTestRun = (runId: string) => {
    const updatedRuns = testRuns.map(r => r.id === runId ? { ...r, archivedAt: null } : r);
    setTestRuns(updatedRuns);
    localStorage.setItem('qa_test_runs', JSON.stringify(updatedRuns));
  };

  const handleOpenSuitePage = (suite: QASuite) => {
    const createdDateFormatted = suite.created_at || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const updatedDateFormatted = suite.updated_at || createdDateFormatted;

    const initializedSuite = {
      ...suite,
      created_at: createdDateFormatted,
      updated_at: updatedDateFormatted
    };

    setActiveMatrixSuite(initializedSuite);

    const savedCases = localStorage.getItem(`qa_suite_cases_${suite.id}`);
    const defaultCases: TestCase[] = [
      { id: '1', testCaseId: 'PD-TC-001', description: 'Verify full BBR payment when amount uploaded equals premium due', preconditions: '• Policy exists and is active\n• Premium due amount is available', expectedResult: 'BBR amount equals uploaded amount, outstanding balance is 0, and payment status is Paid.', actualResult: 'Outstanding balance is not 0. Payment status is Partially Paid.', status: 'Failed', priority: 'High', steps: [{ stepNumber: 1, action: 'Navigate to Payment Upload Screen' }, { stepNumber: 2, action: 'Upload full BBR payment payload' }] },
      { id: '2', testCaseId: 'PD-TC-002', description: 'Verify partial BBR payment allocation', preconditions: '• Active policy with balance', expectedResult: 'Partial payment reflected correctly in ledger.', status: 'Passed', priority: 'High' },
      { id: '3', testCaseId: 'PD-TC-003', description: 'Verify cash loan payment allocation', preconditions: '• Existing loan account', expectedResult: 'Loan principal reduced.', status: 'Passed', priority: 'Medium' },
      { id: '4', testCaseId: 'PD-TC-004', description: 'Verify policy loan payment allocation', preconditions: '• Loan active', expectedResult: 'Payment posted cleanly.', status: 'Failed', priority: 'Medium' },
      { id: '5', testCaseId: 'PD-TC-005', description: 'Verify APL distribution', preconditions: '• APL trigger set', expectedResult: 'APL processed.', status: 'Blocked', priority: 'Low' },
      { id: '6', testCaseId: 'PD-TC-006', description: 'Verify overpayment handling', preconditions: '• Excess funds uploaded', expectedResult: 'Excess moved to suspense account.', status: 'Pending', priority: 'Medium' },
      { id: '7', testCaseId: 'PD-TC-007', description: 'Verify underpayment handling', preconditions: '• Deficit payment uploaded', expectedResult: 'Notice generated.', status: 'Pending', priority: 'Medium' },
      { id: '8', testCaseId: 'PD-TC-008', description: 'Verify mixed payment allocation', preconditions: '• Multiple policies linked', expectedResult: 'Distributed proportional to due dates.', status: 'Pending', priority: 'High' },
    ];

    const casesToUse = savedCases ? JSON.parse(savedCases) : (suite.test_cases?.length ? suite.test_cases : defaultCases);
    const cleanCases = reindexTestCases(casesToUse, suite.title);
    setTestCases(cleanCases);
    setSelectedTestCase(cleanCases[0] || null);
    setCurrentPage(1);
  };

  const handleOpenAddCase = () => {
    setEditingCaseId(null);
    setCaseDesc('');
    setCasePreconditions('');
    setCaseExpected('');
    setCaseActual('');
    setCasePriority('Medium');
    setCaseStatus('Pending');
    setCaseSteps([]);
    setCaseAttachments([]);
    setIsCaseModalOpen(true);
  };

  const handleOpenEditCase = (tc: TestCase) => {
    setEditingCaseId(tc.id);
    setCaseDesc(tc.description || '');
    setCasePreconditions(tc.preconditions || '');
    setCaseExpected(tc.expectedResult || '');
    setCaseActual(tc.actualResult || '');
    setCasePriority(tc.priority || 'Medium');
    setCaseStatus(tc.status || 'Pending');
    setCaseSteps(tc.steps ? tc.steps.map(s => s.action) : []);
    setCaseAttachments(tc.attachments || []);
    setIsCaseModalOpen(true);
  };

  const handleAddStepInput = () => setCaseSteps(prev => [...prev, '']);

  const handleStepChange = (index: number, val: string) => {
    setCaseSteps(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveStep = (index: number) => {
    setCaseSteps(prev => prev.filter((_, i) => i !== index));
  };

  const processUploadedFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const fileSizeFormatted = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const newAtt: Attachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: isImage ? 'image' : isVideo ? 'video' : 'file',
            url: result,
            size: fileSizeFormatted
          };
          setCaseAttachments(prev => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setCaseAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSaveTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatrixSuite || !caseDesc.trim()) return;

    const formattedSteps: TestStep[] = caseSteps
      .filter(s => s.trim().length > 0)
      .map((action, idx) => ({ stepNumber: idx + 1, action: action.trim() }));

    if (editingCaseId) {
      const updated = testCases.map(tc => tc.id === editingCaseId ? {
        ...tc,
        description: caseDesc.trim(),
        preconditions: casePreconditions.trim(),
        expectedResult: caseExpected.trim(),
        actualResult: caseActual.trim(),
        priority: casePriority,
        status: caseStatus,
        steps: formattedSteps,
        attachments: caseAttachments
      } : tc);

      setTestCases(updated);
      setSelectedTestCase(updated.find(c => c.id === editingCaseId) || null);
      localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
      logSuiteAudit(activeMatrixSuite.id, `Updated test case details`);
    } else {
      const prefix = getSuiteInitials(activeMatrixSuite.title);
      const autoId = `${prefix}-${String(testCases.length + 1).padStart(3, '0')}`;

      const newCase: TestCase = {
        id: `tc-${Date.now()}`,
        testCaseId: autoId,
        description: caseDesc.trim(),
        preconditions: casePreconditions.trim(),
        expectedResult: caseExpected.trim() || 'Operation executes as expected.',
        actualResult: caseActual.trim(),
        status: caseStatus,
        priority: casePriority,
        steps: formattedSteps,
        attachments: caseAttachments
      };

      const updated = [...testCases, newCase];
      setTestCases(updated);
      setSelectedTestCase(newCase);
      localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
      logSuiteAudit(activeMatrixSuite.id, `Created test case ${autoId}`);
    }

    updateSuiteLastTouched(activeMatrixSuite.id);
    setIsCaseModalOpen(false);
  };

  const handleStatusChange = (id: string, status: 'Passed' | 'Failed' | 'Pending' | 'On Hold' | 'Blocked') => {
    if (!activeMatrixSuite) return;
    const updated = testCases.map(tc => tc.id === id ? { ...tc, status } : tc);
    setTestCases(updated);
    if (selectedTestCase?.id === id) {
      setSelectedTestCase({ ...selectedTestCase, status });
    }
    localStorage.setItem(`qa_suite_cases_${activeMatrixSuite.id}`, JSON.stringify(updated));
    logSuiteAudit(activeMatrixSuite.id, `Updated status to ${status}`);
    updateSuiteLastTouched(activeMatrixSuite.id);
  };

  const handleOpenEditSpecs = () => {
    if (!activeMatrixSuite) return;
    setEditTitle(activeMatrixSuite.title || '');
    setEditDescription(activeMatrixSuite.description || '');
    setEditPriority(activeMatrixSuite.priority || 'Medium');
    setEditSuiteType(activeMatrixSuite.suite_type || 'Adhoc');
    setEditJiraTicket(activeMatrixSuite.jira_ticket || '');
    setEditAssignedQa(activeMatrixSuite.assigned_qa || '');
    setEditProjectId(activeMatrixSuite.project_id ? String(activeMatrixSuite.project_id) : '');
    setIsEditSuiteModalOpen(true);
  };

  const handleSaveEditedSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatrixSuite) return;

    const formattedNow = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                         new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const payload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      suite_type: editSuiteType,
      jira_ticket: editSuiteType === 'With JIRA Ticket' ? editJiraTicket.trim() : '',
      assigned_qa: editAssignedQa.trim() || 'Unassigned',
      project_id: editProjectId ? parseInt(editProjectId, 10) : null,
      updated_at: formattedNow
    };

    try {
      if (qaSuiteAPI && (qaSuiteAPI as any).update) {
        await (qaSuiteAPI as any).update(activeMatrixSuite.id, payload);
      }
    } catch (apiErr) {
      console.warn("Backend update API fallback:", apiErr);
    }

    const updatedSuite: QASuite = { ...activeMatrixSuite, ...payload };
    setActiveMatrixSuite(updatedSuite);
    setSuites(prev => prev.map(s => s.id === updatedSuite.id ? updatedSuite : s));

    logSuiteAudit(updatedSuite.id, `Updated suite specifications and metadata.`);
    setIsEditSuiteModalOpen(false);
    alert("Test Suite specifications updated successfully!");
  };

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const createdDateFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const newSuiteObj: QASuite = {
        id: Date.now(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        suite_type: suiteType,
        jira_ticket: suiteType === 'With JIRA Ticket' ? jiraTicket.trim() : '',
        project_id: selectedProjectId || null,
        assigned_qa: assignedQaSuite.trim() || 'Unassigned',
        created_at: createdDateFormatted,
        updated_at: createdDateFormatted,
        test_cases: []
      };

      try {
        await qaSuiteAPI.create(newSuiteObj as any);
      } catch (err) {
        console.warn("Saving suite locally:", err);
      }

      const existingLocal = JSON.parse(localStorage.getItem('qa_local_suites') || '[]');
      localStorage.setItem('qa_local_suites', JSON.stringify([newSuiteObj, ...existingLocal]));

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

  const handleSaveTestRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!runSuiteTitle.trim()) return;

    const total = runPassedCount + runFailedCount;

    if (editingRunId) {
      const updatedRuns = testRuns.map(r => r.id === editingRunId ? {
        ...r,
        suiteTitle: runSuiteTitle,
        runnerType,
        passedCount: runPassedCount,
        failedCount: runFailedCount,
        totalCount: total,
        status: (runFailedCount > 0 ? 'Failed' : 'Passed') as 'Passed' | 'Failed',
        executionLogs: runLogs || 'No console output recorded for this run.'
      } : r);

      setTestRuns(updatedRuns);
      localStorage.setItem('qa_test_runs', JSON.stringify(updatedRuns));
      alert("Test run updated successfully!");
    } else {
      const newRun: TestRun = {
        id: `run-${Date.now()}`,
        runId: `${runnerType === 'Robot Framework' ? 'ROBOT' : 'RUN'}-${String(testRuns.length + 1).padStart(3, '0')}`,
        suiteTitle: runSuiteTitle,
        runnerType,
        passedCount: runPassedCount,
        failedCount: runFailedCount,
        totalCount: total,
        status: runFailedCount > 0 ? 'Failed' : 'Passed',
        executedAt: new Date().toLocaleString(),
        executionLogs: runLogs || 'No console output recorded for this run.',
        archivedAt: null
      };

      const updatedRuns = [newRun, ...testRuns];
      setTestRuns(updatedRuns);
      localStorage.setItem('qa_test_runs', JSON.stringify(updatedRuns));
      alert("Test run session logged successfully!");
    }

    setIsRunModalOpen(false);
    setEditingRunId(null);
    setRunSuiteTitle('');
    setRunPassedCount(0);
    setRunFailedCount(0);
    setRunLogs('');
  };

  const handleOpenEditRun = (run: TestRun) => {
    setEditingRunId(run.id);
    setRunSuiteTitle(run.suiteTitle);
    setRunnerType(run.runnerType);
    setRunPassedCount(run.passedCount);
    setRunFailedCount(run.failedCount);
    setRunLogs(run.executionLogs || '');
    setIsRunModalOpen(true);
  };

  const handleExportReportPDF = () => {
    if (!activeMatrixSuite) return;
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    const currentDateFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeMatrixSuite.title} - QA Test Report</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; color: #0f172a; padding: 20px; }
            h1 { font-size: 20px; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>QA TEST REPORT: ${activeMatrixSuite.title}</h1>
          <p>Date: ${currentDateFormatted}</p>
          <table>
            <thead>
              <tr><th>TC ID</th><th>Description</th><th>Priority</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${testCases.map(tc => `<tr><td>${tc.testCaseId}</td><td>${tc.description}</td><td>${tc.priority}</td><td>${tc.status}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 250);
  };

  const getProjectName = (projId?: string | number | null) => {
    if (!projId) return null;
    const found = projects.find(p => p.id.toString() === projId.toString());
    return found ? found.name : null;
  };

  // Metrics
  const totalCount = testCases.length;
  const passedCount = testCases.filter(c => c.status === 'Passed').length;
  const failedCount = testCases.filter(c => c.status === 'Failed').length;
  const blockedCount = testCases.filter(c => c.status === 'Blocked').length;
  const pendingCount = testCases.filter(c => c.status === 'Pending').length;
  const executedCount = totalCount - pendingCount;
  const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : '0.0';

  // Filters & Pagination
  const filteredCases = testCases.filter(tc => {
    const matchesSearch = tc.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tc.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || tc.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE) || 1;
  const paginatedCases = filteredCases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeSuites = suites.filter(s => !s.deletedAt);
  const trashedSuites = suites.filter(s => !!s.deletedAt);
  const activeRuns = testRuns.filter(r => !r.archivedAt);
  const trashedRuns = testRuns.filter(r => !!r.archivedAt);
  const totalArchivedCount = trashedSuites.length + trashedRuns.length;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-[#10065F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Priority color badge helper
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'High':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      case 'Critical':
        return 'bg-red-700/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }
  };

  // =====================================================================
  // 1️⃣ DEDICATED FULL SUITE WORKSPACE VIEW
  // =====================================================================
  if (activeMatrixSuite) {
    const assignedProjectName = getProjectName(activeMatrixSuite.project_id);

    return (
      <div className={`p-4 md:p-6 min-h-[calc(100vh-56px)] font-sans ${isDarkMode ? 'dark bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
        
        {/* TOP HEADER & ALIGNED TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
              <button onClick={() => setActiveMatrixSuite(null)} className="hover:underline text-blue-600 dark:text-blue-400 font-bold">Projects</button>
              <span>/</span>
              <span>{assignedProjectName || 'PD-iPeak Integration'}</span>
              <span>/</span>
              <span>Test Suites</span>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-200 font-bold">{activeMatrixSuite.title}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeMatrixSuite.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {activeMatrixSuite.suite_type || 'Test Suite'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {activeMatrixSuite.description || "Test suite to validate scenario allocations and execution rules."}
            </p>
          </div>

          {/* Top Right Action Buttons Bar */}
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={handleOpenEditSpecs}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              Edit Suite
            </button>
            <button 
              onClick={handleExportReportPDF}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              Export
            </button>
            <button 
              onClick={handleOpenAddCase}
              className="px-4 py-2 rounded-xl bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              + Add Test Case
            </button>
          </div>
        </div>

        {/* 2-COLUMN MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT / MAIN METRICS & MATRIX TABLE (8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1️⃣ TOP 6 METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">TOTAL CASES</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{totalCount}</div>
              </div>

              <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">PASSED</span>
                <div>
                  <div className="text-2xl font-black text-emerald-500 mt-2">{passedCount}</div>
                  <span className="text-[9px] font-bold text-slate-400">{totalCount > 0 ? ((passedCount/totalCount)*100).toFixed(1) : 0}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">FAILED</span>
                <div>
                  <div className="text-2xl font-black text-rose-500 mt-2">{failedCount}</div>
                  <span className="text-[9px] font-bold text-slate-400">{totalCount > 0 ? ((failedCount/totalCount)*100).toFixed(1) : 0}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">BLOCKED</span>
                <div>
                  <div className="text-2xl font-black text-amber-500 mt-2">{blockedCount}</div>
                  <span className="text-[9px] font-bold text-slate-400">{totalCount > 0 ? ((blockedCount/totalCount)*100).toFixed(1) : 0}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">PENDING</span>
                <div>
                  <div className="text-2xl font-black text-blue-500 mt-2">{pendingCount}</div>
                  <span className="text-[9px] font-bold text-slate-400">{totalCount > 0 ? ((pendingCount/totalCount)*100).toFixed(1) : 0}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">PASS RATE</span>
                <div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">{passRate}%</div>
                  <span className="text-[9px] font-bold text-emerald-500">+12.5% vs last run</span>
                </div>
              </div>
            </div>

            {/* 2️⃣ EXECUTION PROGRESS BAR */}
            <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: `${totalCount > 0 ? (passedCount/totalCount)*100 : 0}%` }}></div>
                <div className="bg-rose-500 h-full" style={{ width: `${totalCount > 0 ? (failedCount/totalCount)*100 : 0}%` }}></div>
                <div className="bg-amber-500 h-full" style={{ width: `${totalCount > 0 ? (blockedCount/totalCount)*100 : 0}%` }}></div>
                <div className="bg-blue-500 h-full" style={{ width: `${totalCount > 0 ? (pendingCount/totalCount)*100 : 0}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-slate-400 pt-1">
                <span><strong>{executedCount}</strong> of <strong>{totalCount}</strong> test cases executed</span>
                <span>Last updated: {activeMatrixSuite.updated_at || 'Jul 24, 2026 08:58 PM'}</span>
              </div>
            </div>

            {/* 3️⃣ FILTER TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111827] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[180px]">
                  <input
                    type="text"
                    placeholder="Search test cases..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-3 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer">
                  <option value="All">Status: All</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Pending">Pending</option>
                </select>

                <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer">
                  <option value="All">Priority: All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* 4️⃣ STREAMLINED MATRIX DATA TABLE (MAX 7 ITEMS PER PAGE) */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] uppercase font-black text-slate-400">
                    <th className="p-3 w-8 text-center"><input type="checkbox" className="rounded" /></th>
                    <th className="p-3">TC ID</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedCases.map((tc) => (
                    <tr 
                      key={tc.id}
                      onClick={() => setSelectedTestCase(tc)}
                      onDoubleClick={() => handleOpenEditCase(tc)}
                      className={`hover:bg-blue-50/50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors ${
                        selectedTestCase?.id === tc.id ? 'bg-blue-50/80 dark:bg-slate-800/60' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded" /></td>
                      <td className="p-3 font-mono font-black text-[#10065F] dark:text-blue-400 whitespace-nowrap">{tc.testCaseId}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-white">{tc.description}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClass(tc.priority)}`}>
                          {tc.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={tc.status}
                          onChange={(e: any) => handleStatusChange(tc.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border-0 ${
                            tc.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            tc.status === 'Failed' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                            tc.status === 'Blocked' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Pending">Pending</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {paginatedCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">No test cases found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION FOOTER */}
              {filteredCases.length > 0 && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center text-xs text-slate-400 font-semibold">
                  <div>
                    Showing <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredCases.length)}</strong> of <strong>{filteredCases.length}</strong> test cases
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      &lt;
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-[#10065F] text-white border-[#10065F]'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5️⃣ BOTTOM TEST CASE DETAILS INSPECTOR */}
            {selectedTestCase && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex space-x-6 text-xs font-bold text-slate-400">
                    <button onClick={() => setDetailTab('details')} className={`pb-2 transition-all cursor-pointer ${detailTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'hover:text-slate-600'}`}>Test Case Details</button>
                    <button onClick={() => setDetailTab('steps')} className={`pb-2 transition-all cursor-pointer ${detailTab === 'steps' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'hover:text-slate-600'}`}>Test Steps ({selectedTestCase.steps?.length || 0})</button>
                    <button onClick={() => setDetailTab('attachments')} className={`pb-2 transition-all cursor-pointer ${detailTab === 'attachments' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'hover:text-slate-600'}`}>Attachments ({selectedTestCase.attachments?.length || 0})</button>
                  </div>
                  
                  {/* Subtle Edit Button */}
                  <button 
                    onClick={() => handleOpenEditCase(selectedTestCase)} 
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Edit Case Details
                  </button>
                </div>

                {detailTab === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-3">
                      <div><span className="text-[10px] font-bold uppercase text-slate-400 block">TC ID</span><span className="font-mono font-black text-[#10065F] dark:text-blue-400 text-sm">{selectedTestCase.testCaseId}</span></div>
                      <div><span className="text-[10px] font-bold uppercase text-slate-400 block">Description</span><p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedTestCase.description}</p></div>
                      <div><span className="text-[10px] font-bold uppercase text-slate-400 block">Preconditions</span><pre className="font-sans text-slate-500 dark:text-slate-400 whitespace-pre-line mt-0.5">{selectedTestCase.preconditions || 'None.'}</pre></div>
                    </div>

                    <div className="space-y-3">
                      <div><span className="text-[10px] font-bold uppercase text-slate-400 block">Priority</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5 ${getPriorityBadgeClass(selectedTestCase.priority)}`}>{selectedTestCase.priority || 'Medium'}</span></div>
                      <div><span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span><span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white uppercase inline-block mt-0.5">{selectedTestCase.status}</span></div>
                    </div>

                    <div className="space-y-3">
                      <div><span className="text-[10px] font-bold uppercase text-slate-400 block">Expected Result</span><p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{selectedTestCase.expectedResult}</p></div>
                      {selectedTestCase.actualResult && (<div><span className="text-[10px] font-bold uppercase text-slate-400 block">Actual Result</span><p className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{selectedTestCase.actualResult}</p></div>)}
                    </div>
                  </div>
                )}

                {detailTab === 'steps' && (
                  <div className="space-y-2 text-xs">
                    {selectedTestCase.steps && selectedTestCase.steps.length > 0 ? (
                      selectedTestCase.steps.map((st) => (
                        <div key={st.stepNumber} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center space-x-3">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 font-bold font-mono text-[10px] rounded-lg">Step {st.stepNumber}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{st.action}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic py-2">No steps added. Click "Edit Case Details" to add steps.</p>
                    )}
                  </div>
                )}

                {/* ATTACHMENTS WITH PREVIEW CLICK */}
                {detailTab === 'attachments' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {selectedTestCase.attachments && selectedTestCase.attachments.length > 0 ? (
                      selectedTestCase.attachments.map(att => (
                        <div 
                          key={att.id} 
                          onClick={() => setPreviewMedia(att)}
                          className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 hover:border-blue-500 transition-all cursor-pointer space-y-1 group"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate block">{att.name}</span>
                          <span className="text-[10px] text-slate-400 block">{att.size || 'Attachment'} - Click to view</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic py-2 col-span-full">No evidence files attached to this test case.</p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT SUITE INFO PANEL */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">SUITE INFORMATION</span>
                <button onClick={handleOpenEditSpecs} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">•••</button>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{activeMatrixSuite.title}</h2>
                <div className="flex items-center space-x-2 mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase text-white ${failedCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    {failedCount > 0 ? 'FAILED' : 'PASSED'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{passRate}% pass rate</span>
                </div>
              </div>

              <div className="space-y-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Project</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{assignedProjectName || 'PD-iPeak Integration'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Assigned QA</span><span className="font-bold text-slate-700 dark:text-slate-300">{activeMatrixSuite.assigned_qa || 'Unassigned'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Created</span><span className="font-bold text-slate-700 dark:text-slate-300">{activeMatrixSuite.created_at || 'Jul 20, 2026'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Last Updated</span><span className="font-bold text-slate-700 dark:text-slate-300">{activeMatrixSuite.updated_at || 'Jul 24, 2026'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Priority</span><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getPriorityBadgeClass(activeMatrixSuite.priority || 'Medium')}`}>{activeMatrixSuite.priority || 'MEDIUM'}</span></div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-slate-400 font-medium block">Execution Progress</span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (executedCount/totalCount)*100 : 0}%` }}></div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 block">{executedCount} / {totalCount} executed ({totalCount > 0 ? ((executedCount/totalCount)*100).toFixed(1) : 0}%)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button onClick={handleOpenEditSpecs} className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                  Edit Suite Specs
                </button>
                <button onClick={handleExportReportPDF} className="w-full py-2.5 rounded-xl bg-[#10065F] hover:bg-[#180A8C] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md">
                  Download Test Report (PDF)
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 dark:border-slate-800 pb-2">ATTACHMENTS</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div 
                  onClick={() => setPreviewMedia({ id: 'demo-1', name: 'screenshot_01.png', type: 'image', url: 'https://via.placeholder.com/600x400', size: '245 KB' })}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">screenshot_01.png</span>
                  <span className="text-[9px] text-slate-400 block">245 KB</span>
                </div>
                <div 
                  onClick={() => setPreviewMedia({ id: 'demo-2', name: 'recording.mp4', type: 'video', url: '', size: '12.4 MB' })}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">recording.mp4</span>
                  <span className="text-[9px] text-slate-400 block">12.4 MB</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* LIGHTBOX MEDIA PREVIEW MODAL */}
        {previewMedia && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="max-w-3xl w-full bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-white">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{previewMedia.name}</span>
                <button onClick={() => setPreviewMedia(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
              </div>

              <div className="max-h-[70vh] flex items-center justify-center rounded-xl overflow-hidden bg-black p-2">
                {previewMedia.type === 'image' ? (
                  <img src={previewMedia.url} alt={previewMedia.name} className="max-h-[65vh] object-contain" />
                ) : previewMedia.type === 'video' && previewMedia.url ? (
                  <video src={previewMedia.url} controls autoPlay className="max-h-[65vh] w-full" />
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Preview not available for this file type.
                    <a href={previewMedia.url} download={previewMedia.name} className="block mt-2 font-bold text-blue-400 underline">Download File</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD OR EDIT TEST CASE */}
        {isCaseModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">{editingCaseId ? 'Edit Test Case Details' : 'Add New Test Case'}</h3>
                <button onClick={() => setIsCaseModalOpen(false)} className="text-slate-400 font-bold cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveTestCase} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Description</label>
                  <input type="text" required value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} placeholder="e.g. Verify payment method calculation" className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-none" />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Preconditions (Optional)</label>
                  <input type="text" value={casePreconditions} onChange={(e) => setCasePreconditions(e.target.value)} placeholder="e.g. User logged in" className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none" />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Expected Result</label>
                  <textarea rows={2} value={caseExpected} onChange={(e) => setCaseExpected(e.target.value)} placeholder="e.g. Transaction completed successfully." className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium outline-none resize-none" />
                </div>

                {editingCaseId && (
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Actual Result (Optional)</label>
                    <textarea rows={2} value={caseActual} onChange={(e) => setCaseActual(e.target.value)} placeholder="e.g. Output mismatch on ledger." className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium outline-none resize-none" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Priority</label>
                    <select value={casePriority} onChange={(e: any) => setCasePriority(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer outline-none">
                      <option value="Low">Low (Green)</option>
                      <option value="Medium">Medium (Orange)</option>
                      <option value="High">High (Red)</option>
                      <option value="Critical">Critical (Dark Red)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Status</label>
                    <select value={caseStatus} onChange={(e: any) => setCaseStatus(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer outline-none">
                      <option value="Pending">Pending</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                      <option value="Blocked">Blocked</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>

                {/* DYNAMIC STEPS BUILDER */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-400 uppercase tracking-wide text-[10px]">Test Steps (Optional)</label>
                    <button type="button" onClick={handleAddStepInput} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">+ Add Step</button>
                  </div>

                  {caseSteps.map((stepText, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-400 w-14 shrink-0">Step {idx + 1}</span>
                      <input type="text" value={stepText} onChange={(e) => handleStepChange(idx, e.target.value)} placeholder={`Describe Step ${idx + 1}...`} className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none" />
                      <button type="button" onClick={() => handleRemoveStep(idx)} className="text-red-500 font-bold text-xs px-2 cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>

                {/* OPTIONAL FILE ATTACHMENT INPUT */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block font-bold text-slate-400 uppercase tracking-wide text-[10px]">Attach Files / Evidence (Optional)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); processUploadedFiles(e.dataTransfer.files); }}
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
                      isDragging ? 'border-blue-600 bg-blue-500/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <input 
                      type="file" multiple id="modal-file-upload" className="hidden" 
                      onChange={(e) => processUploadedFiles(e.target.files)} 
                    />
                    <label htmlFor="modal-file-upload" className="cursor-pointer block space-y-1">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">Click to upload or drag & drop files here</span>
                      <span className="text-[10px] text-slate-400 block">Images, videos, or documents</span>
                    </label>
                  </div>

                  {caseAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {caseAttachments.map(att => (
                        <div key={att.id} className="flex items-center space-x-2 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
                          <span className="font-semibold truncate max-w-[150px]">{att.name}</span>
                          <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-500 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white font-bold rounded-xl shadow-md uppercase cursor-pointer">
                    {editingCaseId ? 'Update Test Case' : 'Save Test Case'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT SUITE SPECS MODAL */}
        {isEditSuiteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">Edit Test Suite Specifications</h3>
                <button onClick={() => setIsEditSuiteModalOpen(false)} className="text-slate-400 font-bold cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveEditedSpecs} noValidate className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Suite Title</label>
                  <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Assigned QA</label>
                  <input type="text" value={editAssignedQa} onChange={(e) => setEditAssignedQa(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Priority</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-none cursor-pointer">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Description / Notes</label>
                  <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-none resize-none" />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setIsEditSuiteModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#10065F] text-white font-bold rounded-xl cursor-pointer">Save Specs</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =====================================================================
  // 2️⃣ MAIN SUITE GALLERY VIEW (WHEN NO SUITE IS OPENED)
  // =====================================================================
  return (
    <div className={`p-4 md:p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      <div className="w-full px-0 md:px-4 mx-auto space-y-6 md:space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              {showTrash ? 'Archived QA Items' : (activeTab === 'runs' ? 'Test Execution Runs' : 'Test Suites')}
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
              {showTrash 
                ? 'Soft-deleted test suites and test runs.' 
                : (activeTab === 'runs' ? 'Automated Robot Framework execution logs and manual execution history.' : 'Overview of all ad-hoc and project-assigned QA test execution suites.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-300/50 dark:border-slate-800 w-full md:w-auto">
              <button
                onClick={() => { setActiveTab('suites'); setShowTrash(false); }}
                className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'suites' && !showTrash ? 'bg-[#10065F] text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                SUITES ({activeSuites.length})
              </button>
              
              <button
                onClick={() => { setActiveTab('runs'); setShowTrash(false); }}
                className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'runs' && !showTrash ? 'bg-[#10065F] text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                TEST RUNS ({activeRuns.length})
              </button>

              <button
                onClick={() => setShowTrash(true)}
                className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  showTrash ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                ARCHIVED ({totalArchivedCount})
              </button>
            </div>

            {!showTrash && activeTab === 'suites' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-blue-500/30 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                + CREATE SUITE
              </button>
            )}

            {!showTrash && activeTab === 'runs' && (
              <button
                onClick={() => {
                  setEditingRunId(null);
                  setRunSuiteTitle('');
                  setRunPassedCount(0);
                  setRunFailedCount(0);
                  setRunLogs('');
                  setIsRunModalOpen(true);
                }}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-blue-500/30 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                + LOG TEST RUN
              </button>
            )}
          </div>
        </div>

        {/* SUITES GALLERY GRID */}
        {!showTrash && activeTab === 'suites' && (
          <>
            {activeSuites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {activeSuites.map((suite) => {
                  const assignedProjectName = getProjectName(suite.project_id);

                  return (
                    <div 
                      key={suite.id}
                      onClick={() => handleOpenSuitePage(suite)}
                      className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-white group-hover:text-[#10065F] dark:group-hover:text-blue-400 transition-colors">
                              {suite.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1">
                              {assignedProjectName && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  Project: {assignedProjectName}
                                </span>
                              )}

                              {suite.assigned_qa && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  QA: {suite.assigned_qa}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityBadgeClass(suite.priority)}`}>
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
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMoveSuiteToTrash(suite.id); }}
                            className="text-red-500 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
                          >
                            Archive
                          </button>
                          <span className="text-[#10065F] dark:text-blue-400 group-hover:underline uppercase tracking-wider font-extrabold cursor-pointer">
                            OPEN -&gt;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-md mx-auto my-12 text-center bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-8 shadow-md">
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">NO TEST SUITES FOUND</h2>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 mb-6 leading-relaxed">
                  You haven't logged any ad-hoc or JIRA test suites yet.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-2.5 bg-[#10065F] hover:bg-[#180A8C] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md cursor-pointer"
                >
                  + CREATE FIRST TEST SUITE
                </button>
              </div>
            )}
          </>
        )}

        {/* TEST RUNS VIEW */}
        {!showTrash && activeTab === 'runs' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800 p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4">
                Automated Robot Framework & Manual Execution Logs
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                      <th className="p-3">Run ID</th>
                      <th className="p-3">Test Suite Title</th>
                      <th className="p-3">Runner Engine</th>
                      <th className="p-3">Results (P / F / Total)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Execution Time</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {activeRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="p-3 font-mono font-black text-[#10065F] dark:text-blue-400">{run.runId}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-white">{run.suiteTitle}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-600">
                            {run.runnerType}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className="text-emerald-500">{run.passedCount} Passed</span> / <span className="text-red-500">{run.failedCount} Failed</span> / <span>{run.totalCount} Total</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            run.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{run.executedAt}</td>
                        <td className="p-3 text-right space-x-3 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditRun(run)}
                            className="text-amber-500 hover:underline font-extrabold uppercase text-[10px] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchiveTestRun(run.id)}
                            className="text-red-500 hover:underline font-extrabold uppercase text-[10px] cursor-pointer"
                          >
                            Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ARCHIVED VIEW */}
        {showTrash && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase text-amber-500 tracking-wider">
                Archived Test Suites ({trashedSuites.length})
              </h2>

              {trashedSuites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trashedSuites.map((suite) => (
                    <div key={suite.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{suite.title}</h4>
                        <span className="text-[10px] text-slate-400">Type: {suite.suite_type || 'Adhoc'}</span>
                      </div>
                      <button
                        onClick={() => handleRestoreSuiteFromTrash(suite.id)}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold uppercase hover:bg-emerald-500/20 transition-all cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No archived test suites.</p>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-neutral-800 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase text-amber-500 tracking-wider">
                Archived Test Runs ({trashedRuns.length})
              </h2>

              {trashedRuns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase text-slate-400 font-black">
                        <th className="p-3">Run ID</th>
                        <th className="p-3">Suite Title</th>
                        <th className="p-3">Runner Engine</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {trashedRuns.map((run) => (
                        <tr key={run.id}>
                          <td className="p-3 font-mono font-bold text-[#10065F] dark:text-blue-400">{run.runId}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-white">{run.suiteTitle}</td>
                          <td className="p-3">{run.runnerType}</td>
                          <td className="p-3 font-bold">{run.status}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRestoreTestRun(run.id)}
                              className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold uppercase hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No archived test runs.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: CREATE SUITE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-5 md:p-6 shadow-2xl border border-slate-100 dark:border-neutral-800">
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none cursor-pointer"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Assigned QA Engineer</label>
                <input
                  type="text" value={assignedQaSuite} onChange={(e) => setAssignedQaSuite(e.target.value)}
                  placeholder="e.g. Name of QA Assigned"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Suite Title</label>
                <input
                  type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Quick Regression Check - Auth API"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Description / Notes</label>
                <textarea
                  rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add scope details or quick notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none resize-none leading-relaxed"
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
                  className="px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Suite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT TEST RUN */}
      {isRunModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-5 md:p-6 shadow-2xl border border-slate-100 dark:border-neutral-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">
                  {editingRunId ? 'Edit Test Run Details' : 'Log Test Run Session'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Record automated execution metrics and logs.</p>
              </div>
              <button onClick={() => { setIsRunModalOpen(false); setEditingRunId(null); }} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveTestRun} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Target Suite Title</label>
                <input
                  type="text" required value={runSuiteTitle} onChange={(e) => setRunSuiteTitle(e.target.value)}
                  placeholder="e.g. Auth API & Token Suite"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Runner Engine</label>
                <select
                  value={runnerType} onChange={(e: any) => setRunnerType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="Robot Framework">Robot Framework (Automated)</option>
                  <option value="Manual">Manual Execution Run</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Passed Count</label>
                  <input
                    type="number" min={0} value={runPassedCount} onChange={(e) => setRunPassedCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Failed Count</label>
                  <input
                    type="number" min={0} value={runFailedCount} onChange={(e) => setRunFailedCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wide mb-1 text-[10px]">Execution Output Logs</label>
                <textarea
                  rows={3} value={runLogs} onChange={(e) => setRunLogs(e.target.value)}
                  placeholder="Paste Robot Framework log.html or console output..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-[10px] outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <button
                  type="button" onClick={() => { setIsRunModalOpen(false); setEditingRunId(null); }}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingRunId ? 'Update Test Run' : 'Save Test Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}