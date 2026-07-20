import { useState, useEffect } from 'react';
import { qaSuiteAPI } from '../services/api';

interface QASuite {
  id: number;
  title: string;
  description: string;
  priority: string;
  project_id?: number | null;
}

interface TestSuitesProps {
  isDarkMode: boolean;
  currentUser: any;
}

export default function TestSuites({ isDarkMode }: TestSuitesProps) {
  const [suites, setSuites] = useState<QASuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all test suites from Railway database
  const loadSuites = async () => {
    try {
      setIsLoading(true);
      const data = await qaSuiteAPI.getAll();
      setSuites(data);
    } catch (err) {
      console.error("Failed to fetch test suites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuites();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            QA Test Suites
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Overview of all ad-hoc and project-assigned QA test execution suites.
          </p>
        </div>

        {/* Test Suites List */}
        {suites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suites.map((suite) => (
              <div 
                key={suite.id}
                className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-cardDark p-6 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                    {suite.title}
                  </h3>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    suite.priority === 'Critical' ? 'bg-red-500/10 text-red-500' :
                    suite.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                    suite.priority === 'Medium' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {suite.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {suite.description || "No description provided."}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Type: {suite.project_id ? `Project #${suite.project_id}` : '🧪 Ad-Hoc Suite'}</span>
                  <span className="text-brand-accent hover:underline cursor-pointer uppercase">View Details →</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto my-16 text-center bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-10 shadow-md">
            <div className="text-4xl mb-4">🧪</div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">No Test Suites Found</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
              You haven't logged any ad-hoc test suites yet.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}