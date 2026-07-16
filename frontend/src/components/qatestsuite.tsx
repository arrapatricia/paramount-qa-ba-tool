import { useState } from 'react';

export interface TestCase {
  id: string;
  description: string;
  preConditions: string;
  expectedResult: string;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED';
}

interface QaTestSuiteProps {
  suiteId: string;
  suiteTitle: string;
  projectName: string; // Dynamic project name to extract initials!
  onLogAudit: (action: string) => void;
}

export default function QaTestSuite({ suiteId, suiteTitle, projectName, onLogAudit }: QaTestSuiteProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Form State for creating a test case
  const [newTc, setNewTc] = useState<Omit<TestCase, 'id'>>({
    description: '',
    preConditions: '',
    expectedResult: '',
    status: 'PENDING'
  });

  // Helper function to extract initials from the dynamic Project Name
  const getProjectInitials = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '');
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 'TC';
    return words.map(w => w[0].toUpperCase()).join('');
  };

  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTc.description.trim()) return;

    const initials = getProjectInitials(projectName);
    const nextIdNumber = testCases.length + 1;
    const customId = `${initials}-${String(nextIdNumber).padStart(3, '0')}`;

    const newlyCreated: TestCase = {
      id: customId,
      ...newTc
    };

    setTestCases(prev => [...prev, newlyCreated]);
    onLogAudit(`Added Test Case ${customId} to Suite "${suiteTitle}"`);
    
    // Reset form fields
    setNewTc({
      description: '',
      preConditions: '',
      expectedResult: '',
      status: 'PENDING'
    });
  };

  const handleUpdateField = (id: string, field: keyof Omit<TestCase, 'id' | 'status'>, val: string) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, [field]: val } : tc));
  };

  const handleFieldBlur = (id: string, fieldName: string, finalVal: string) => {
    onLogAudit(`Updated ${fieldName} on ${id} to: "${finalVal.substring(0, 30)}..."`);
  };

  const handleUpdateStatus = (id: string, newStatus: TestCase['status']) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, status: newStatus } : tc));
    onLogAudit(`Updated status of ${id} to "${newStatus}"`);
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
    onLogAudit(`Deleted Test Case ${id} from Suite "${suiteTitle}"`);
  };

  return (
    <div className="bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-md p-8 transition-all">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-3 mb-6">
        <div>
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">🧪 Suite: {suiteTitle}</span>
          <h2 className="text-sm font-extrabold text-brand-paramount dark:text-white mt-0.5">Execution Steps Matrix</h2>
        </div>
        <span className="text-xs font-semibold text-slate-400">{testCases.length} Test Cases</span>
      </div>

      {/* 📊 Matrix Table View */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs table-fixed">
          <thead>
            <tr className="bg-slate-50 dark:bg-neutral-obsidian/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <th className="p-3 w-20">ID</th>
              <th className="p-3 w-1/3">Description</th>
              <th className="p-3 w-1/4">Pre-conditions (Optional)</th>
              <th className="p-3 w-1/3">Expected Result</th>
              <th className="p-3 w-28 text-center">Status</th>
              <th className="p-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-brand-paramount dark:text-slate-300">
            {testCases.map((tc) => (
              <tr key={tc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-3 font-bold text-blue-600 dark:text-blue-400 align-top pt-4">{tc.id}</td>
                
                {/* Clean, fully input-editable cells that won't lock rendering */}
                <td className="p-2">
                  <input
                    type="text"
                    value={tc.description}
                    onChange={(e) => handleUpdateField(tc.id, 'description', e.target.value)}
                    onBlur={(e) => handleFieldBlur(tc.id, 'Description', e.target.value)}
                    className="w-full bg-transparent px-2 py-1.5 outline-none font-medium border border-transparent focus:border-blue-500 focus:bg-slate-50 dark:focus:bg-neutral-obsidian/50 rounded transition-all"
                  />
                </td>

                <td className="p-2">
                  <input
                    type="text"
                    value={tc.preConditions}
                    placeholder="None"
                    onChange={(e) => handleUpdateField(tc.id, 'preConditions', e.target.value)}
                    onBlur={(e) => handleFieldBlur(tc.id, 'Pre-conditions', e.target.value)}
                    className="w-full bg-transparent px-2 py-1.5 outline-none text-slate-500 dark:text-slate-400 border border-transparent focus:border-blue-500 focus:bg-slate-50 dark:focus:bg-neutral-obsidian/50 rounded transition-all"
                  />
                </td>

                <td className="p-2">
                  <input
                    type="text"
                    value={tc.expectedResult}
                    onChange={(e) => handleUpdateField(tc.id, 'expectedResult', e.target.value)}
                    onBlur={(e) => handleFieldBlur(tc.id, 'Expected Result', e.target.value)}
                    className="w-full bg-transparent px-2 py-1.5 outline-none border border-transparent focus:border-blue-500 focus:bg-slate-50 dark:focus:bg-neutral-obsidian/50 rounded transition-all"
                  />
                </td>

                <td className="p-2 text-center align-top pt-3">
                  <select
                    value={tc.status}
                    onChange={(e) => handleUpdateStatus(tc.id, e.target.value as TestCase['status'])}
                    className={`font-extrabold text-[10px] uppercase rounded border px-2 py-1 outline-none text-center ${
                      tc.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      tc.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      tc.status === 'BLOCKED' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </td>

                <td className="p-2 text-center align-top pt-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteTestCase(tc.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-500 transition-all font-bold"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {testCases.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                  No execution cases cataloged. Enter details below to launch tracking matrix.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ➕ Simple Creation Form (With removed execution inputs) */}
      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-6 mt-6">
        <form onSubmit={handleAddTestCase} className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Create New Test Case</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Test Description (Required)"
              value={newTc.description}
              onChange={(e) => setNewTc(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian text-brand-paramount dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Pre-conditions (Optional)"
              value={newTc.preConditions}
              onChange={(e) => setNewTc(prev => ({ ...prev, preConditions: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian text-brand-paramount dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Expected Result (Required)"
              value={newTc.expectedResult}
              onChange={(e) => setNewTc(prev => ({ ...prev, expectedResult: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian text-brand-paramount dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              ＋ Add Test Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}