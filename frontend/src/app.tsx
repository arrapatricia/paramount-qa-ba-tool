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

  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  const formattedDate = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
    return <Login isDarkMode={isDarkMode} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <main className={`${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-[#f8fafc] text-brand-paramount'} min-h-screen font-sans transition-colors duration-300`}>
      
      {/* 🟢 TOP NAVIGATION HEADER */}
      <div className="bg-white dark:bg-neutral-cardDark border-b border-slate-100 dark:border-slate-800/80 px-4 md:px-6 py-3 md:py-4 flex flex-col lg:flex-row justify-between items-center transition-all shadow-xs gap-3">
        
        <div className="flex items-center justify-between w-full lg:w-auto">
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group" 
            onClick={() => setCurrentView('systems')}
          >
            <img 
              src={isDarkMode ? whiteLogo : blueLogo} 
              alt="PLGIC Logo" 
              className="w-6 h-6 md:w-7 md:h-7 object-contain drop-shadow-[0_3px_5px_rgba(16,6,95,0.25)] dark:drop-shadow-[0_3px_5px_rgba(0,0,0,0.7)]" 
            />
            <span className="text-base md:text-lg font-black tracking-tight text-[#10065F] dark:text-blue-400 drop-shadow-[0_3px_6px_rgba(16,6,95,0.30)] dark:drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)]">
              Paramount Workspace
            </span>
          </div>

          {/* Mobile Theme Switcher Toggle */}
          <button 
            onClick={toggleTheme}
            className="lg:hidden flex items-center px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto">
          {currentUser && (
            <>
              {/* Systems Directory Tab */}
              <button 
                onClick={() => { setCurrentView('systems'); setActiveProjectId(null); }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'systems'
                    ? 'bg-brand-paramount text-white shadow-xs' 
                    : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                }`}
              >
                Systems Directory
              </button>

              {/* Projects Gallery Tab */}
              {currentUser.permissions.projectRead && (
                <button 
                  onClick={() => { setCurrentView('projects'); setActiveProjectId(null); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'projects' || currentView === 'documentation'
                      ? 'bg-brand-paramount text-white shadow-xs' 
                      : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                  }`}
                >
                  Projects Gallery
                </button>
              )}

              {/* Test Suites Tab */}
              {currentUser.permissions.qaSuiteRead && (
                <button 
                  onClick={() => { setCurrentView('test-suites'); setActiveProjectId(null); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'test-suites'
                      ? 'bg-brand-paramount text-white shadow-xs' 
                      : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                  }`}
                >
                  Test Suites
                </button>
              )}
              
              {/* Manage Users Tab */}
              {isAdmin && (
                <button 
                  onClick={() => { setCurrentView('users'); setActiveProjectId(null); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'users' 
                      ? 'bg-brand-paramount text-white shadow-xs' 
                      : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                  }`}
                >
                  Manage Users
                </button>
              )}
            </>
          )}

          {/* Desktop Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <span>{isDarkMode ? 'Light Mode ☀️' : 'Dark Mode 🌙'}</span>
          </button>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center pl-2 sm:pl-4 border-l border-slate-100 dark:border-slate-800 space-x-2 sm:space-x-3">
              <div className="text-right flex flex-col justify-center">
                <span className="text-xs sm:text-sm font-extrabold tracking-tight text-brand-paramount dark:text-white">
                  Hi, {currentUser.firstName}!
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-0.5 hidden sm:block">
                  {formattedDate} • {formattedTime}
                </span>
              </div>

              <button 
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
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

        {/* 🟢 OPENED PROJECT WORKSPACE WITH LIGHT/DARK COLLAPSIBLE SIDEBAR */}
        {currentView === 'documentation' && (
          <div className="flex min-h-[calc(100vh-73px)]">
            
            {/* 👈 DYNAMIC LIGHT/DARK COLLAPSIBLE SIDEBAR */}
            <aside 
              className={`hidden lg:flex flex-col justify-between shrink-0 transition-all duration-300 border-r ${
                isSidebarCollapsed ? 'w-16 p-2.5' : 'w-64 p-4'
              } ${
                isDarkMode 
                  ? 'bg-[#0F172A] text-slate-300 border-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="space-y-5">
                
                {/* Collapse Toggle & Active Project Header */}
                <div className="flex items-center justify-between">
                  {!isSidebarCollapsed && (
                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      PROJECT WORKSPACE
                    </span>
                  )}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={`p-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    } ${isSidebarCollapsed ? 'w-full text-center' : ''}`}
                    title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                  >
                    {isSidebarCollapsed ? '»' : '«'}
                  </button>
                </div>

                {/* Active Project Card */}
                {!isSidebarCollapsed ? (
                  <div className={`p-3 rounded-xl border ${
                    isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`font-extrabold text-xs truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {currentProjectData?.name || 'Project Workspace'}
                    </div>
                    <span className="inline-block px-2 py-0.2 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 uppercase mt-1">
                      {currentProjectData?.status || 'Active'}
                    </span>
                  </div>
                ) : (
                  <div className="text-center font-black text-xs text-blue-500" title={currentProjectData?.name}>
                    📂
                  </div>
                )}

                {/* Inner Project Links */}
                <div className="space-y-1">
                  <button 
                    onClick={() => setCurrentView('projects')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="All Projects Gallery"
                  >
                    <span>←</span>
                    {!isSidebarCollapsed && <span>All Projects</span>}
                  </button>

                  <div className={`pt-2 border-t space-y-1 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200/60'}`}>
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2 px-3'} py-2 rounded-xl text-xs font-bold bg-[#10065F] text-white shadow-xs`}>
                      <span>📋</span>
                      {!isSidebarCollapsed && <span>Requirements & Specs</span>}
                    </div>

                    <button 
                      onClick={() => setCurrentView('test-suites')}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title="Project Test Suites"
                    >
                      <span>🧪</span>
                      {!isSidebarCollapsed && <span>Project Test Suites</span>}
                    </button>
                  </div>
                </div>

                {/* Project Metadata */}
                {!isSidebarCollapsed && (
                  <div className={`pt-3 border-t space-y-2 text-[11px] ${
                    isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200/80 text-slate-500'
                  }`}>
                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      PROJECT METADATA
                    </span>
                    <div>Owner: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{currentProjectData?.baAssignee || 'Admin'}</strong></div>
                    <div>QA Lead: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{currentProjectData?.qaAssignee || 'Unassigned'}</strong></div>
                    <div>Dev Lead: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{currentProjectData?.devAssignee || 'Unassigned'}</strong></div>
                  </div>
                )}

              </div>

              {/* Bottom Widget: Project Progress */}
              {!isSidebarCollapsed ? (
                <div className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100/70 border-slate-200'
                }`}>
                  <div className={`flex justify-between items-center text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className="uppercase tracking-wider">PROGRESS</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">67%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>
                    <div className="bg-[#10065F] dark:bg-blue-500 h-full w-[67%] rounded-full"></div>
                  </div>
                  <span className={`text-[9px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>80 of 120 test cases executed</span>
                </div>
              ) : (
                <div className="text-center text-[10px] font-mono font-bold text-blue-500" title="67% Executed">
                  67%
                </div>
              )}
            </aside>

            {/* 👉 RIGHT MAIN DOCUMENTATION WORKSPACE */}
            <div className="flex-1 bg-slate-50 dark:bg-[#0B0F19] min-w-0">
              {/* Inner Breadcrumb Bar */}
              <div className="px-4 md:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-400 flex items-center space-x-2">
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