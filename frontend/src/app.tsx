import { useState, useEffect } from 'react';
import Login from './pages/login';
import UserPortal from './pages/userportal';
import Projects from './pages/projects';
import Documentation from './pages/documentation';
import TestSuites from './pages/testsuites';
import SystemsDirectory from './pages/systems';

// Logo Assets
import blueLogo from './assets/PLGIC_Icon Only_blue.png';
import whiteLogo from './assets/PLGIC_Icon Only_white.png';

// Session user object mapping
interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  role_name?: string;
  isActive: boolean;
  permissions: {
    projectCreate: boolean;
    projectRead: boolean;
    projectUpdate: boolean;
    projectDelete: boolean;
    qaSuiteCreate: boolean;
    qaSuiteRead: boolean;
    qaSuiteUpdate: boolean;
    qaSuiteDelete: boolean;
  };
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'login' | 'systems' | 'projects' | 'test-suites' | 'users' | 'documentation'>('login');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Selected Project in Workspace
  const [currentProjectData, setCurrentProjectData] = useState<any>(null);

  // Inner Project Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Real-time Date and Time
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // 🔴 CENTRAL THEME SYNC WITH TAILWIND HTML ROOT
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  const formattedDate = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Strict helper check for Admin Role
  const isAdmin = currentUser?.roleName === 'Admin' || currentUser?.role_name === 'Admin';

  // Handle Login and Default Page Route
  const handleLoginSuccess = (userData: any) => {
    if (!userData) return;

    setIsLoggedIn(true);
    
    const userPayload: SessionUser = {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      roleName: userData.role_name,
      role_name: userData.role_name,
      isActive: true,
      permissions: {
        projectCreate: userData.permissions?.project_create ?? false,
        projectRead: userData.permissions?.project_read ?? true,
        projectUpdate: userData.permissions?.project_update ?? false,
        projectDelete: userData.permissions?.project_delete ?? false,
        qaSuiteCreate: userData.permissions?.qa_suite_create ?? false,
        qaSuiteRead: userData.permissions?.qa_suite_read ?? true,
        qaSuiteUpdate: userData.permissions?.qa_suite_update ?? false,
        qaSuiteDelete: userData.permissions?.qa_suite_delete ?? false,
      }
    };

    setCurrentUser(userPayload);
    setCurrentView('systems');
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      setIsLoggedIn(false);
      setActiveProjectId(null);
      setCurrentProjectData(null);
      setCurrentUser(null);
      setCurrentView('login');
    }
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const storedProj = localStorage.getItem('qa_ba_current_project');
    if (storedProj) {
      setCurrentProjectData(JSON.parse(storedProj));
    }
    setCurrentView('documentation');
  };

  if (!isLoggedIn) {
    return (
      <Login 
        isDarkMode={isDarkMode} 
        onLoginSuccess={handleLoginSuccess}
        onToggleDarkMode={toggleTheme}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <main className={`${isDarkMode ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'} min-h-screen font-sans transition-colors duration-500`}>
      
      {/* 🟢 TOP NAVIGATION HEADER */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/80 dark:border-slate-800/80 px-4 md:px-6 py-3 md:py-4 flex flex-col lg:flex-row justify-between items-center transition-all shadow-sm gap-3 z-30 relative">
        
        <div className="flex items-center justify-between w-full lg:w-auto">
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group" 
            onClick={() => setCurrentView('systems')}
          >
            <img 
              src={isDarkMode ? whiteLogo : blueLogo} 
              alt="PLGIC Logo" 
              className="w-6 h-6 md:w-7 md:h-7 object-contain drop-shadow-md" 
            />
            <span className="text-base md:text-lg font-black tracking-tight text-[#10065F] dark:text-blue-400">
              Paramount Workspace
            </span>
          </div>

          {/* Mobile Sliding Switcher */}
          <div className="lg:hidden flex items-center space-x-2 bg-white/50 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/60 dark:border-slate-700/80">
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={toggleTheme}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${
                isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                  isDarkMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
                  <svg className="w-2.5 h-2.5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto">
          {currentUser && (
            <>
              <button 
                onClick={() => { setCurrentView('systems'); setActiveProjectId(null); }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'systems'
                    ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                Systems Directory
              </button>

              {currentUser.permissions.projectRead && (
                <button 
                  onClick={() => { setCurrentView('projects'); setActiveProjectId(null); }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'projects' || currentView === 'documentation'
                      ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  Projects Gallery
                </button>
              )}

              {currentUser.permissions.qaSuiteRead && (
                <button 
                  onClick={() => { setCurrentView('test-suites'); setActiveProjectId(null); }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'test-suites'
                      ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  Test Suites
                </button>
              )}
              
              {isAdmin && (
                <button 
                  onClick={() => { setCurrentView('users'); setActiveProjectId(null); }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'users' 
                      ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  Manage Users
                </button>
              )}
            </>
          )}

          {/* DESKTOP SLIDING TOGGLE SWITCH */}
          <div className="hidden lg:flex items-center space-x-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/60 dark:border-slate-700/50 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
                  <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-3">
              <div className="text-right flex flex-col justify-center">
                <span className="text-xs sm:text-sm font-extrabold tracking-tight text-[#10065F] dark:text-white">
                  Hi, {currentUser.firstName}!
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-0.5 hidden sm:block">
                  {formattedDate} • {formattedTime}
                </span>
              </div>

              <button 
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-rose-500/20 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-xs"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 MAIN ROUTING CONTAINER */}
      <div className="w-full">
        {currentView === 'systems' && (
          <SystemsDirectory 
            isDarkMode={isDarkMode}
            onNavigateToSuites={() => setCurrentView('test-suites')}
            onNavigateToProjects={() => setCurrentView('projects')}
          />
        )}

        {currentView === 'projects' && (
          <Projects isDarkMode={isDarkMode} onOpenProject={handleOpenProject} />
        )}

        {currentView === 'test-suites' && (
          <TestSuites isDarkMode={isDarkMode} currentUser={currentUser} />
        )}

        {currentView === 'users' && (
          isAdmin ? (
            <UserPortal isDarkMode={isDarkMode} currentUser={currentUser} />
          ) : (
            <Projects isDarkMode={isDarkMode} onOpenProject={handleOpenProject} />
          )
        )}

        {/* 🟢 OPENED PROJECT WORKSPACE WITH LIQUID GLASS SIDEBAR (NO METADATA, NO EMOJIS) */}
        {currentView === 'documentation' && (
          <div className="flex min-h-[calc(100vh-73px)]">
            
            {/* 👈 CLEAN LIQUID GLASS SIDEBAR */}
            <aside 
              className={`hidden lg:flex flex-col justify-between shrink-0 transition-all duration-300 border-r backdrop-blur-2xl ${
                isSidebarCollapsed ? 'w-16 p-2.5' : 'w-64 p-4'
              } ${
                isDarkMode 
                  ? 'bg-slate-900/60 text-slate-300 border-slate-800/80 shadow-xl' 
                  : 'bg-white/60 text-slate-700 border-white/80 shadow-lg shadow-black/5'
              }`}
            >
              <div className="space-y-5">
                
                {/* Collapse Toggle & Active Project Header */}
                <div className="flex items-center justify-between">
                  {!isSidebarCollapsed && (
                    <span className="text-[9px] font-black uppercase tracking-wider block text-slate-400">
                      PROJECT WORKSPACE
                    </span>
                  )}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-white/60 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
                    title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                  >
                    <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7M19 19l-7-7 7-7"} />
                    </svg>
                  </button>
                </div>

                {/* Active Project Glass Card */}
                {!isSidebarCollapsed ? (
                  <div className="p-3.5 rounded-2xl border bg-white/70 dark:bg-slate-800/60 border-white/80 dark:border-slate-700/60 backdrop-blur-md shadow-xs">
                    <div className="font-black text-xs truncate text-[#10065F] dark:text-white">
                      {currentProjectData?.name || 'Project Workspace'}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase mt-1.5">
                      {currentProjectData?.status || 'Active'}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-center p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title={currentProjectData?.name}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                )}

                {/* Inner Project Links (SVG Icons, No Emojis) */}
                <div className="space-y-1">
                  <button 
                    onClick={() => setCurrentView('projects')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60`}
                    title="All Projects Gallery"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {!isSidebarCollapsed && <span>All Projects</span>}
                  </button>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {!isSidebarCollapsed && <span>Requirements & Specs</span>}
                    </div>

                    <button 
                      onClick={() => setCurrentView('test-suites')}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60`}
                      title="Project Test Suites"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.168.14L3 16l1.328 3.985a2 2 0 001.205 1.258l2.916 1.166a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477a2 2 0 001.693-.574l1.861-[1.861a2 2 0 00.32-2.324l-1.32-2.64z" />
                      </svg>
                      {!isSidebarCollapsed && <span>Project Test Suites</span>}
                    </button>
                  </div>
                </div>

                {/* 🔴 PROJECT METADATA REMOVED AS REQUESTED */}

              </div>

              {/* Bottom Widget: Project Execution Progress */}
              {!isSidebarCollapsed ? (
                <div className="p-3.5 rounded-2xl border bg-white/50 dark:bg-slate-800/40 border-white/80 dark:border-slate-700/50 backdrop-blur-md space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 dark:text-slate-300">
                    <span className="uppercase tracking-wider">PROGRESS</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">67%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <div className="bg-[#10065F] dark:bg-blue-500 h-full w-[67%] rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-medium block text-slate-500 dark:text-slate-400">80 of 120 test cases executed</span>
                </div>
              ) : (
                <div className="text-center text-[10px] font-mono font-black text-blue-500" title="67% Executed">
                  67%
                </div>
              )}
            </aside>

            {/* 👉 RIGHT MAIN DOCUMENTATION WORKSPACE */}
            <div className="flex-1 bg-[#EBF1F6] dark:bg-[#080C14] min-w-0">
              <div className="px-4 md:px-6 py-2.5 border-b border-white/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-xs font-semibold text-slate-400 flex items-center space-x-2">
                <span>Projects</span>
                <span>›</span>
                <span className="text-[#10065F] dark:text-blue-400 font-bold">{currentProjectData?.name || 'Workspace'}</span>
                <span>›</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">Documentation & Specs</span>
              </div>

              <Documentation isDarkMode={isDarkMode} onBackToProjects={() => setCurrentView('projects')} />
            </div>

          </div>
        )}
      </div>

    </main>
  );
}