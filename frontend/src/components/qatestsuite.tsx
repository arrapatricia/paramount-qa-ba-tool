import { useState, useEffect } from 'react';

// Extended TestCase interface to support automated test case tags (e.g., Robot Framework tags)
interface TestCase {
  id: string;
  testCaseId: string;
  description: string;
  preconditions?: string;
  expectedResult: string;
  status: 'Passed' | 'Failed' | 'Pending' | 'On Hold';
  assignedQa: string;
  robotTags?: string; // e.g. @smoke, @regression, @robot-suite
}

interface QaTestSuiteProps {
  suiteId: string;
  suiteTitle: string;
  projectName: string;
  onLogAudit: (action: string) => void;
}

export default function QaTestSuite({ suiteId, suiteTitle, projectName, onLogAudit }: QaTestSuiteProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Form row state
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [status, setStatus] = useState<'Passed' | 'Failed' | 'Pending' | 'On Hold'>('Pending');
  const [assignedQa, setAssignedQa] = useState('');
  const [robotTags, setRobotTags] = useState('');

  // Load cached test cases for this specific project suite
  useEffect(() => {
    const saved = localStorage.getItem(`qa_suite_cases_${suiteId}`);
    if (saved) {
      setTestCases(JSON.parse(saved));
    }
  }, [suiteId]);

  // Helper to generate prefix initials from Suite Title
  const getSuiteInitials = (title: string) => {
    if (!title || !title.trim()) return 'TC';
    const words = title.trim().split(/\s+/);
    if (words.length === 1) {
      return title.trim().toUpperCase().slice(0, 4);
    }
    return words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  // Helper to re-index IDs cleanly
  const reindexTestCases = (cases: TestCase[]): TestCase[] => {
    const prefix = getSuiteInitials(suiteTitle);
    return cases.map((tc, idx) => ({
      ...tc,
      testCaseId: `${prefix}-${String(idx + 1).padStart(3, '0')}`
    }));
  };

  // Helper to compute next auto-incremented Test Case ID
  const getNextTestCaseId = () => {
    const prefix = getSuiteInitials(suiteTitle);
    const nextNum = testCases.length + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  };

  const handleSaveTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (editingCaseId) {
      // Edit existing test case
      const updated = testCases.map(tc => tc.id === editingCaseId ? {
        ...tc,
        description,
        preconditions,
        expectedResult,
        status,
        assignedQa: assignedQa || 'Unassigned',
        robotTags: robotTags.trim()
      } : tc);

      setTestCases(updated);
      localStorage.setItem(`qa_suite_cases_${suiteId}`, JSON.stringify(updated));
      onLogAudit(`Updated Test Case details inside suite "${suiteTitle}".`);
      setEditingCaseId(null);
    } else {
      // Add new test case
      const autoId = getNextTestCaseId();
      const newCase: TestCase = {
        id: `tc-${Date.now()}`,
        testCaseId: autoId,
        description,
        preconditions,
        expectedResult,
        status,
        assignedQa: assignedQa || 'Unassigned',
        robotTags: robotTags.trim()
      };

      const updated = reindexTestCases([...testCases, newCase]);
      setTestCases(updated);
      localStorage.setItem(`qa_suite_cases_${suiteId}`, JSON.stringify(updated));
      onLogAudit(`Added Test Case ${autoId} to suite "${suiteTitle}" inside ${projectName}.`);
    }

    resetFormInputs();
  };

  const resetFormInputs = () => {
    setDescription('');
    setPreconditions('');
    setExpectedResult('');
    setStatus('Pending');
    setAssignedQa('');
    setRobotTags('');
  };

  const handleStartEdit = (tc: TestCase) => {
    setEditingCaseId(tc.id);
    setDescription(tc.description);
    setPreconditions(tc.preconditions || '');
    setExpectedResult(tc.expectedResult);
    setStatus(tc.status);
    setAssignedQa(tc.assignedQa);
    setRobotTags(tc.robotTags || '');
  };

  const handleCancelEdit = () => {
    setEditingCaseId(null);
    resetFormInputs();
  };

  const handleStatusChange = (id: string, newStatus: 'Passed' | 'Failed' | 'Pending' | 'On Hold') => {
    const updated = testCases.map(tc => tc.id === id ? { ...tc, status: newStatus } : tc);
    setTestCases(updated);
    localStorage.setItem(`qa_suite_cases_${suiteId}`, JSON.stringify(updated));
    onLogAudit(`Updated test case status to ${newStatus}.`);
  };

  const handleDeleteTestCase = (id: string) => {
    const filtered = testCases.filter(tc => tc.id !== id);
    const reindexed = reindexTestCases(filtered);
    setTestCases(reindexed);
    localStorage.setItem(`qa_suite_cases_${suiteId}`, JSON.stringify(reindexed));
    onLogAudit(`Deleted test case and re-indexed sequence in "${suiteTitle}".`);
    if (editingCaseId === id) handleCancelEdit();
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
            🧪 SUITE: {suiteTitle}
          </span>
          <h3 className="text-lg font-black text-slate-800 dark:text-white mt-2">
            Execution Steps Matrix
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {testCases.length} Test Cases
        </span>
      </div>

      {/* Form Row: Add / Edit Test Case */}
      <form onSubmit={handleSaveTestCase} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            {editingCaseId ? 'Edit Test Case' : 'Create Test Case'}
          </span>
          {editingCaseId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-bold text-amber-500 hover:underline uppercase cursor-pointer"
            >
              Cancel Editing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
          <div className="flex flex-col justify-center px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-black text-xs select-none">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-sans block">Case ID</span>
            {editingCaseId ? testCases.find(c => c.id === editingCaseId)?.testCaseId : getNextTestCaseId()}
          </div>

          <input 
            type="text" required placeholder="Description..." value={description} onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none md:col-span-2"
          />

          <input 
            type="text" placeholder="Preconditions (Optional)" value={preconditions} onChange={(e) => setPreconditions(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
          />

          <input 
            type="text" required placeholder="Expected Result..." value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
          />

          <select 
            value={status} onChange={(e: any) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none cursor-pointer font-semibold"
          >
            <option value="Pending">PENDING</option>
            <option value="Passed">PASSED</option>
            <option value="Failed">FAILED</option>
            <option value="On Hold">ON HOLD</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" placeholder="Assigned QA (e.g. John Doe)" value={assignedQa} onChange={(e) => setAssignedQa(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none w-full sm:w-56"
            />
            <input 
              type="text" placeholder="Robot Tags (e.g. @robot, @smoke)" value={robotTags} onChange={(e) => setRobotTags(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-mono w-full sm:w-56"
            />
          </div>

          <button 
            type="submit"
            className={`w-full sm:w-auto px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer ${
              editingCaseId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {editingCaseId ? 'UPDATE TEST CASE' : '+ ADD TEST CASE'}
          </button>
        </div>
      </form>

      {/* Execution Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400 font-black">
              <th className="p-3">Test Case ID</th>
              <th className="p-3">Description</th>
              <th className="p-3">Preconditions</th>
              <th className="p-3">Expected Result</th>
              <th className="p-3">Assigned QA</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {testCases.map((tc) => (
              <tr key={tc.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 ${editingCaseId === tc.id ? 'bg-amber-500/10' : ''}`}>
                <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{tc.testCaseId}</td>
                <td className="p-3 font-semibold text-slate-800 dark:text-white">{tc.description}</td>
                <td className="p-3 text-slate-400 italic">{tc.preconditions || '—'}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{tc.expectedResult}</td>
                <td className="p-3 font-medium text-slate-500 dark:text-slate-400">{tc.assignedQa}</td>
                <td className="p-3 font-mono text-[10px] text-purple-600 dark:text-purple-400">
                  {tc.robotTags || '—'}
                </td>
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
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  <button 
                    onClick={() => handleStartEdit(tc)}
                    className="text-amber-500 hover:underline font-bold uppercase text-[10px] cursor-pointer"
                  >
                    Edit
                  </button>
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
                <td colSpan={8} className="p-6 text-center text-slate-400 text-xs italic">
                  No test cases cataloged yet. Fill out the form above to log your first test case.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}