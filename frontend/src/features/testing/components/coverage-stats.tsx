import { TestCase } from '../../../components/qatestsuite';
interface CoverageStatsProps {
  testCases: TestCase[];
}

export default function CoverageStats({ testCases }: CoverageStatsProps) {
  const getCount = (status: TestCase['status']) => testCases.filter(t => t.status === status).length;

  return (
    <div className="space-y-4 text-sm font-sans">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Coverage Status</h3>
      
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <span className="text-xs uppercase font-bold text-green-400 block">Passed</span>
        <span className="text-2xl font-black text-green-500">{getCount('PASSED')}</span>
      </div>
      
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <span className="text-xs uppercase font-bold text-red-400 block">Failed</span>
        <span className="text-2xl font-black text-red-500">{getCount('FAILED')}</span>
      </div>
      
      <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
        <span className="text-xs uppercase font-bold text-gray-400 block">Pending</span>
        <span className="text-2xl font-black text-slate-400">{getCount('PENDING')}</span>
      </div>
    </div>
  );
}