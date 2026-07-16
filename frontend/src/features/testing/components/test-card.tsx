import { TestCase } from '../../types';

interface TestCardProps {
  tc: TestCase;
  onStatusChange: (id: string, nextStatus: TestCase['status']) => void;
  onEdit: (tc: TestCase) => void;
  onDelete: (id: string) => void;
}

export default function TestCard({ tc, onStatusChange, onEdit, onDelete }: TestCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-cardDark border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 font-sans">
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-brand-accent text-sm tracking-wider">{tc.id}</span>
          <h3 className="font-bold text-brand-paramount dark:text-white text-base leading-tight">{tc.title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 pt-2">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg">
            <span className="font-bold text-brand-paramount dark:text-slate-300 block mb-1">Steps:</span>
            <p className="whitespace-pre-line">{tc.steps}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg">
            <span className="font-bold text-brand-paramount dark:text-slate-300 block mb-1">Expected Result:</span>
            <p>{tc.expected}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Assigned QA</span>
          <span className="text-xs font-extrabold text-brand-paramount dark:text-slate-200">{tc.assignedTo}</span>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            value={tc.status} 
            onChange={(e) => onStatusChange(tc.id, e.target.value as any)}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
              tc.status === 'Passed' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200' :
              tc.status === 'Failed' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200' :
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
            }`}
          >
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Untested">Untested</option>
            <option value="Blocked">Blocked</option>
          </select>

          <button onClick={() => onEdit(tc)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs">✏️</button>
          <button onClick={() => onDelete(tc.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-xs text-red-500">🗑️</button>
        </div>
      </div>
    </div>
  );
}