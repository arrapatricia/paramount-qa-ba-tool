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
      
{/* Top Header Navigation (Mobile-Responsive Layout) */}
{isLoggedIn && (
  <div className="bg-white dark:bg-neutral-cardDark border-b border-slate-100 dark:border-slate-800/80 px-4 md:px-6 py-3 md:py-4 flex flex-col lg:flex-row justify-between items-center transition-all shadow-sm gap-3">
    
    <div className="flex items-center justify-between w-full lg:w-auto">
      {/* 🟢 Floating Paramount Dark Blue Brand Logo */}
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

    {/* Navigation Items */}
    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto">
      {currentUser && (
        <>
          {/* Systems Directory Tab */}
          <button 
            onClick={() => setCurrentView('systems')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentView === 'test-suites'
                  ? 'bg-brand-paramount text-white shadow-sm' 
                  : 'text-slate-500 hover:text-brand-paramount dark:hover:text-white'
              }`}
            >
              Test Suites
            </button>
          )}
          
          {/* Manage Users Tab */}
          {isAdmin && (
            <button 
              onClick={() => setCurrentView('users')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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

      {/* Desktop Theme Switcher */}
      <button 
        onClick={toggleTheme}
        className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
      >
        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
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
)}
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