import { useState, useEffect } from 'react';
import Login from './pages/login';
import UserPortal from './pages/userportal';
import Projects from './pages/projects';
import Documentation from './pages/documentation';
import TestSuites from './pages/testsuites';
import SystemsDirectory from './pages/systems';

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Navigation State (Includes 'systems' as the primary homepage)
  const [currentView, setCurrentView] = useState<'login' | 'systems' | 'projects' | 'test-suites' | 'users' | 'documentation'>('login');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

    // Default Landing View for All Users upon logging in
    setCurrentView('systems');
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      setIsLoggedIn(false);
      setActiveProjectId(null);
      setCurrentUser(null);
      setCurrentView('login');
    }
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentView('documentation');
  };

  return (
    <main className={`${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-[#f8fafc] text-brand-paramount'} min-h-screen font-sans transition-colors duration-300`}>
      
      {/* Top Header */}
      <div className="bg-white dark:bg-neutral-cardDark border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex justify-between items-center transition-all shadow-sm">
        
        {/* Brand Logo - Clicking Paramount Docs lands on Systems Directory for all users */}
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-all" 
          onClick={() => isLoggedIn && setCurrentView('systems')}
        >
          <span className="text-lg font-bold tracking-tight text-blue-600 dark:text-white">
            Paramount Docs
          </span>
          <span className="text-xs text-slate-400">/ Workspace</span>
        </div>

        {/* Dynamic Navigation Toolbar */}
        <div className="flex items-center space-x-4">
          {isLoggedIn && currentUser && (
            <>
              {/* Systems Directory Tab */}
              <button 
                onClick={() => setCurrentView('systems')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'systems'
                    ? 'bg-brand-paramount text-white shadow-sm' 
                    : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                }`}
              >
                Systems Directory
              </button>

              {currentUser.permissions.projectRead && (
                <button 
                  onClick={() => setCurrentView('projects')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'projects' || currentView === 'documentation'
                      ? 'bg-brand-paramount text-white shadow-sm' 
                      : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                  }`}
                >
                  Projects Gallery
                </button>
              )}

              {/* Test Suites Tab */}
              {currentUser.permissions.qaSuiteRead && (
                <button 
                  onClick={() => setCurrentView('test-suites')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'test-suites'
                      ? 'bg-brand-paramount text-white shadow-sm' 
                      : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                  }`}
                >
                  Test Suites
                </button>
              )}
              
              {/* Manage Users Tab: Exclusively for Admin */}
              {isAdmin && (
                <button 
                  onClick={() => setCurrentView('users')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'users' 
                      ? 'bg-brand-paramount text-white shadow-sm' 
                      : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
                  }`}
                >
                  Manage Users
                </button>
              )}
            </>
          )}

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* User Widget */}
          {isLoggedIn && currentUser && (
            <div className="flex items-center pl-4 border-l border-slate-100 dark:border-slate-800 space-x-3">
              <div className="text-right flex flex-col justify-center">
                <span className="text-sm font-extrabold tracking-tight text-brand-paramount dark:text-white">
                  Hi, {currentUser.firstName}!
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-0.5">
                  {formattedDate} • {formattedTime}
                </span>
              </div>

              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container View Routing */}
      <div className="w-full">
        {!isLoggedIn ? (
          <Login isDarkMode={isDarkMode} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
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

            {/* View Guard for Admin User Portal */}
            {currentView === 'users' && (
              isAdmin ? (
                <UserPortal isDarkMode={isDarkMode} currentUser={currentUser} />
              ) : (
                <Projects isDarkMode={isDarkMode} onOpenProject={handleOpenProject} />
              )
            )}

            {currentView === 'documentation' && (
              <Documentation isDarkMode={isDarkMode} onBackToProjects={() => setCurrentView('projects')} />
            )}
          </>
        )}
      </div>
    </main>
  );
}